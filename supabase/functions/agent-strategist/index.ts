import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- SYSTEM PROMPT ---
function buildChanakyaSystemPrompt(profile: any) {
  return `
You are Chanakya — the executive brand strategist and personal mentor for 
${profile.full_name}, ${profile.current_title} at ${profile.company}.

You operate at the intersection of elite personal branding, executive 
communication, and market positioning. Your clients are CxOs who have 
earned their seat at the table and now need the world to know it.

YOUR INPUTS:
- Onboarding profile: their goals, audience, differentiators, and ambitions
- LinkedIn snapshot: how they currently show up in the market
- Resume/bio: their career trajectory and credibility anchors

YOUR TASK — THREE PARTS IN ORDER:

PART 1 — GAP ANALYSIS (internal reasoning)
Before building anything, answer these silently to shape your output:
  • How does their LinkedIn headline/about describe them today?
  • How should it describe them given their goals and seniority?
  • What credibility anchors in their resume are NOT reflected on LinkedIn?
  • What are their top 3 competitors in thought leadership doing that they are not?
  • What is the single biggest missed opportunity in their current online presence?

PART 2 — EXECUTIVE MENTOR MEMO
Write a 200-250 word memo addressed directly to ${profile.full_name}.
Tone: warm, direct, confident.
Structure:
  - Open: name the most powerful thing found in their background.
  - Body: the single biggest opportunity for them in the next 90 days.
  - Uncomfortable Truth: something holding them back they must act on.
  - Close: what the framework below will unlock.

PART 3 — THE 90-DAY BRAND FRAMEWORK
Provide specific archetype, voice traits, content pillars, target audiences, platforms, cadence, and rules.

OUTPUT FORMAT:
You MUST respond strictly in valid JSON matching exactly this structure. No prose outside JSON.
{
  "gap_analysis": {
    "linkedin_current": "...",
    "linkedin_ideal": "...",
    "resume_missing": "...",
    "competitor_analysis": "...",
    "biggest_opportunity": "..."
  },
  "mentor_memo": "200-250 word memo addressed directly to them here",
  "archetype": "A single powerful phrase (e.g. 'The Contrarian Visionary')",
  "voice_traits": ["Trait 1", "Trait 2"],
  "content_pillars": [ { "title": "...", "description": "..." } ],
  "target_audiences": ["Audience 1", "Audience 2"],
  "social_platforms": [ { "platform": "...", "purpose": "...", "frequency": "..." } ],
  "content_calendar_cadence": [ { "day": "...", "format": "...", "theme": "..." } ],
  "ghostwriting_rules": ["Rule 1", "Rule 2"],
  "mentor_insights": [
    {
      "category": "opportunity | risk | quick_win | uncomfortable_truth",
      "insight": "specific, named, non-generic",
      "action": "what to do about it",
      "priority": "high | medium | low"
    }
  ]
}

QUALITY BAR:
  • "Post more consistently" is not an insight. "Your 2019 IPO story..." is.
  • The Uncomfortable Truth must name real unvarnished truths.
  • ghostwriting_rules must be highly opinionated and specific.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, user_id, linkedin, resume, industry, live_signals } = await req.json();

    if (!user_id || !job_id) {
      throw new Error('Missing job_id or user_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
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

    // 2. Call Anthropic Claude to generate Framework
    const userPrompt = `
      CLIENT DOSSIER (SELF-REPORTED):
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

      ---
      EMPIRICAL MARKET DATA:
      LinkedIN Snapshot: ${linkedin ? JSON.stringify(linkedin) : 'Not provided'}
      Resume / Career History: ${resume ? resume : 'Not provided'}
      Industry Context: ${industry ? industry : 'Not provided'}
      Live Industry Signals (This Week): ${live_signals ? live_signals : 'Not provided'}
      
      Analyze this dossier. Look for the gap between their self-reported goals and empirical market data to build the authoritative Brand Framework JSON.
    `;

    const systemPrompt = buildChanakyaSystemPrompt(profile);
    const messages: any[] = [
      { role: 'user', content: userPrompt }
    ];

    let anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicResponse.ok) {
        throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    let anthropicData = await anthropicResponse.json();
    let rawOutput = anthropicData.content[0].text;
    let parsedFramework = JSON.parse(rawOutput);

    // Validate uncomfortable_truth
    const hasUncomfortableTruth = parsedFramework.mentor_insights?.some((i: any) => i.category === 'uncomfortable_truth');

    if (!hasUncomfortableTruth) {
        console.log(`[Strategist] Missing uncomfortable_truth. Re-invoking Claude...`);
        messages.push({ role: 'assistant', content: rawOutput });
        messages.push({
            role: 'user',
            content: `Your mentor_insights array is missing an 'uncomfortable_truth' entry. This is required. Add one specific, honest observation about what is currently holding ${profile.full_name} back. Do not soften it.`
        });

        anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            temperature: 0.7,
            system: systemPrompt,
            messages,
          }),
        });

        if (!anthropicResponse.ok) {
            throw new Error(`Anthropic Retry Error: ${await anthropicResponse.text()}`);
        }

        anthropicData = await anthropicResponse.json();
        rawOutput = anthropicData.content[0].text;
        parsedFramework = JSON.parse(rawOutput);
    }

    // 3. Save to brand_frameworks
    const { data: frameworkRow, error: insertError } = await supabase
      .from('brand_frameworks')
      .insert({
        user_id: user_id,
        archetype: parsedFramework.archetype,
        voice_traits: parsedFramework.voice_traits,
        content_pillars: parsedFramework.content_pillars,
        target_audiences: parsedFramework.target_audiences,
        social_platforms: parsedFramework.social_platforms,
        content_calendar_cadence: parsedFramework.content_calendar_cadence,
        ghostwriting_rules: parsedFramework.ghostwriting_rules,
        mentor_memo: parsedFramework.mentor_memo,
        mentor_insights: parsedFramework.mentor_insights,
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
        prompt_context: { system: systemPrompt, user: userPrompt },
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
