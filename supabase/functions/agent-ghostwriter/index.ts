import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GHOSTWRITER_SYSTEM_PROMPT = `
You are an Elite B2B Executive Ghostwriter.
You write for high-ticket CXOs perfectly emulating their unique voice and positioning.

CRITICAL RULES:
1. NO AI SPEAK: Never use the words: delve, tapestry, crucial, multifaceted, testament, navigating, landscape, foster. 
2. Hook them fast: The first line must act as a scroll-stopping hook.
3. Formatting: Use punchy, short paragraphs (1-2 sentences max). Use generous line breaks.
4. Tone: Confident, slightly contrarian (if their archetype allows), and profoundly insightful. Speak from the first person ("I").

You must return ONLY the raw text of the final post. No markdown blocks, no commentary, no intro or outro. Just the post exactly as it will be copy-pasted into LinkedIn.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, framework_id, briefing_id } = await req.json();

    if (!job_id || !framework_id) {
      throw new Error('Missing job_id or framework_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured.");

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Ghostwriter] Starting job ${job_id} for framework ${framework_id}`);

    // 1. Fetch Framework and Profile Data
    const { data: framework, error: fwError } = await supabase
      .from('brand_frameworks')
      .select('*, profiles(*)')
      .eq('id', framework_id)
      .single();

    if (fwError || !framework) throw new Error(`Framework fetch failed: ${fwError?.message}`);

    const profile = framework.profiles;
    const userId = framework.user_id;

    // 2. Fetch Briefing (if provided) to ensure the post is tied to live news
    let briefingContext = "No specific daily news briefing provided. Write a timeless, evergreen thought-leadership post based purely on their Content Pillars.";
    if (briefing_id) {
        const { data: briefing, error: brError } = await supabase
            .from('industry_briefings')
            .select('*')
            .eq('id', briefing_id)
            .single();
        
        if (!brError && briefing) {
            briefingContext = `
                TODAY'S LIVE INDUSTRY BRIEFING:
                News Links: ${JSON.stringify(briefing.news_links)}
                Strategist's Suggested Angles: ${JSON.stringify(briefing.suggested_angles)}
                
                Pick the most compelling angle from above and write a post about it. Do not just summarize the news; give the executive's sharp opinion on it.
            `;
        }
    }

    // 3. Construct the prompt
    const userPrompt = `
      EXECUTIVE DOSSIER & BRAND ARCHITECTURE:
      Name: ${profile.full_name} | Role: ${profile.current_title} at ${profile.company}
      Archetype: ${framework.archetype}
      Voice Traits: ${JSON.stringify(framework.voice_traits)}
      Target Audience: ${JSON.stringify(framework.target_audiences)}
      Core Content Pillars: ${JSON.stringify(framework.content_pillars)}
      
      ${briefingContext}
      
      Write the exact LinkedIn post.
    `;

    // 4. Call Anthropic Claude 3.5 Sonnet
    console.log(`[Ghostwriter] Requesting Claude 3.5 Sonnet...`);
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        system: GHOSTWRITER_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!anthropicResponse.ok) {
        const errStr = await anthropicResponse.text();
        // If 402 or 429, the Orchestrator will catch this and gracefully mark as 'failed' in agent_jobs
        throw new Error(`Anthropic Error: ${errStr}`);
    }

    const anthropicData = await anthropicResponse.json();
    const generatedDraft = anthropicData.content[0].text;
    
    // Extract the hook (the first non-empty line)
    const hookLine = generatedDraft.split('\n').find((line: string) => line.trim().length > 0) || "Draft Hook";

    // 5. Save to content_drafts
    const { data: draftRow, error: insertError } = await supabase
      .from('content_drafts')
      .insert({
        user_id: userId,
        framework_id: framework_id,
        briefing_id: briefing_id || null,
        platform: 'LinkedIn',
        body_text: generatedDraft,
        hook_text: hookLine,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Trace the action in agent_audit_logs
    await supabase.from('agent_audit_logs').insert({
        user_id: userId,
        agent_role: 'agent-ghostwriter',
        event_type: 'draft_generated',
        trigger_entity_id: draftRow.id,
        prompt_context: { system: GHOSTWRITER_SYSTEM_PROMPT, user: userPrompt },
        response_output: generatedDraft
    });

    // 7. Queue up the next step (review_draft)
    await supabase.from('agent_jobs').insert({
        user_id: userId,
        job_type: 'review_draft',
        payload: { draft_id: draftRow.id }
    });

    console.log(`[Ghostwriter] Successfully drafted post ${draftRow.id} and routed to Editor`);

    return new Response(JSON.stringify({ success: true, draft: draftRow }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Ghostwriter] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
