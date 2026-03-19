import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- SYSTEM PROMPT ---
const STRATEGIST_SYSTEM_PROMPT = `
You are an Elite Ex-MBB / Ex-Ogilvy Brand Strategy Director.
Your job is to act as the intellectual backbone for a high-ticket CXO client.
You will read their onboarding profile data and synthesize a world-class, premium 90-day Personal Brand Framework.

You MUST respond strictly in valid JSON matching exactly this structure:
{
  "archetype": "A single powerful phrase describing their persona (e.g. 'The Contrarian Visionary', 'The Operator-CEO')",
  "voice_traits": ["Trait 1", "Trait 2", "Trait 3"],
  "content_pillars": [
    { "title": "Pillar 1", "description": "What this pillar is about..." },
    { "title": "Pillar 2", "description": "..." },
    { "title": "Pillar 3", "description": "..." }
  ],
  "target_audiences": ["Audience 1", "Audience 2"]
}
Do not include any markdown styling like \`\`\`json around your response. Just the raw JSON object.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, user_id } = await req.json();

    if (!user_id || !job_id) {
      throw new Error('Missing job_id or user_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Strategist] Starting job ${job_id} for user ${user_id}`);

    // 1. Fetch Profile Data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch profile: ${profileError?.message}`);
    }

    // 2. Call OpenAI to generate Framework
    const userPrompt = `
      CLIENT DOSSIER:
      Name: ${profile.full_name} | Role: ${profile.current_title} at ${profile.company}
      Industry: ${profile.industry}
      Goals: ${JSON.stringify(profile.primary_goal)}
      Dream Outcome: ${profile.dream_outcome}
      Topics Owned: ${profile.topics_owned}
      Strong Opinions: ${profile.strong_opinions}
      Differentiator: ${profile.differentiator}
      Reputation Now: ${profile.reputation_now}
      Target Audience: ${profile.target_audience}
      Communication Style: ${JSON.stringify(profile.communication_style)}
      Never Sound Like: ${profile.never_sound_like}

      Analyze this dossier and build the Brand Framework JSON.
    `;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: STRATEGIST_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!openAiResponse.ok) {
        const errStr = await openAiResponse.text();
        throw new Error(`OpenAI Error: ${errStr}`);
    }

    const openAiData = await openAiResponse.json();
    const rawOutput = openAiData.choices[0].message.content;
    const parsedFramework = JSON.parse(rawOutput);

    // 3. Save to brand_frameworks
    const { data: frameworkRow, error: insertError } = await supabase
      .from('brand_frameworks')
      .insert({
        user_id: user_id,
        archetype: parsedFramework.archetype,
        voice_traits: parsedFramework.voice_traits,
        content_pillars: parsedFramework.content_pillars,
        target_audiences: parsedFramework.target_audiences,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Trace the action in agent_audit_logs
    await supabase.from('agent_audit_logs').insert({
        user_id: user_id,
        agent_role: 'agent-strategist',
        event_type: 'framework_generated',
        trigger_entity_id: frameworkRow.id,
        prompt_context: { system: STRATEGIST_SYSTEM_PROMPT, user: userPrompt },
        response_output: rawOutput
    });

    // 5. Queue up the next step (run_news_sweep)
    await supabase.from('agent_jobs').insert({
        user_id: user_id,
        job_type: 'run_news_sweep',
        payload: { framework_id: frameworkRow.id }
    });

    console.log(`[Strategist] Successfully built framework ${frameworkRow.id}`);

    return new Response(JSON.stringify({ success: true, framework: frameworkRow }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Strategist] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
