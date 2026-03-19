import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EDITOR_SYSTEM_PROMPT = `
You are the strict, uncompromising Editor-in-Chief for a premium Executive PR Agency.
Your job is to read Ghostwritten drafts and act as the final quality assurance gatekeeper before the client sees it.

CRITICAL RULES FOR REJECTION:
1. ANY presence of generic "AI speak" (e.g. delve, tapestry, crucial, multifaceted, testament, navigating, landscape, foster).
2. It fails to sound like the specific executive archetype/tone provided.
3. It makes factually hallucinatory claims that the executive didn't explicitly say.
4. It reads like an essay rather than a punchy, hook-driven social media post.

You MUST respond strictly in valid JSON matching exactly this structure:
{
  "status": "approved" | "rejected",
  "critique": "If rejected, exactly why? If approved, why is it excellent? 1-2 sentences."
}
Do not include any markdown styling like \`\`\`json around your response. Just the raw JSON object.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, draft_id } = await req.json();

    if (!job_id || !draft_id) {
      throw new Error('Missing job_id or draft_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    if (!openAiKey) throw new Error("OPENAI_API_KEY not configured.");

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Editor] Starting job ${job_id} for draft ${draft_id}`);

    // 1. Fetch Draft, Framework, and Profile Data
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*, brand_frameworks(*)')
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) throw new Error(`Draft fetch failed: ${draftError?.message}`);

    const framework = draft.brand_frameworks;
    const userId = draft.user_id;

    // 2. Construct the prompt
    const userPrompt = `
      EXECUTIVE BRAND RULES:
      Archetype: ${framework.archetype}
      Voice Traits: ${JSON.stringify(framework.voice_traits)}
      Target Audience: ${JSON.stringify(framework.target_audiences)}
      Never Sound Like: (Generic, robotic, corporate jargon)
      
      THE DRAFT:
      """
      ${draft.body_text}
      """
      
      Evaluate the draft aggressively based on your rules.
    `;

    // 3. Call OpenAI GPT-4o for logical analysis
    console.log(`[Editor] Calling GPT-4o for compliance check...`);
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: EDITOR_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Low temperature for consistent rule-following
      }),
    });

    if (!openAiResponse.ok) {
        throw new Error(`OpenAI Error: ${await openAiResponse.text()}`);
    }

    const openAiData = await openAiResponse.json();
    const rawOutput = openAiData.choices[0].message.content;
    const parsedCritique = JSON.parse(rawOutput);

    // 4. Update the draft status
    const finalStatus = parsedCritique.status === 'approved' ? 'approved' : 'failed';
    const { error: updateError } = await supabase
      .from('content_drafts')
      .update({ status: finalStatus })
      .eq('id', draft_id);

    if (updateError) throw updateError;

    // 5. Trace the action in agent_audit_logs, storing the critique!
    await supabase.from('agent_audit_logs').insert({
        user_id: userId,
        agent_role: 'agent-editor',
        event_type: finalStatus === 'approved' ? 'draft_approved' : 'draft_rejected',
        trigger_entity_id: draft_id,
        prompt_context: { system: EDITOR_SYSTEM_PROMPT, user: userPrompt },
        response_output: rawOutput, // contains `{ status, critique }`
        payload: { editor_critique: parsedCritique.critique }
    });

    // Note: We don't auto-loop rejections back to Ghostwriter yet to prevent infinite loops and API burn.
    // Instead, the frontend dashboard will display 'failed' drafts and the Editor's critique.

    console.log(`[Editor] Successfully reviewed draft ${draft_id}. Verdict: ${finalStatus}`);

    return new Response(JSON.stringify({ success: true, verdict: finalStatus, critique: parsedCritique.critique }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Editor] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
