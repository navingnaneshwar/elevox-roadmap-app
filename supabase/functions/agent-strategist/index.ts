import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- SYSTEM PROMPT ---
function buildChanakyaSystemPrompt(profile: any, hasVerifiedFacts = false) {
  return `
You are Chanakya — the executive brand strategist and personal mentor for 
${profile.full_name}, ${profile.current_title} at ${profile.company}.

You operate at the intersection of elite personal branding, executive 
communication, and market positioning. Your clients are CxOs who have 
earned their seat at the table and now need the world to know it.

YOUR INPUTS:
- Onboarding profile: their goals, audience, differentiators, and ambitions
- LinkedIn snapshot: how they currently show up in the market
- Resume/bio: their career trajectory and credibility anchors${hasVerifiedFacts ? `
- VERIFIED CAREER FACTS: direct answers collected from the executive — treat these as ground truth, highest priority` : ''}

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
If VERIFIED CAREER FACTS are provided, use them verbatim as the primary credibility anchors — do not generalise or paraphrase them.

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
  ],
  "verified_career_anchors": [
    "Verbatim specific result or decision from their own words — quote them faithfully"
  ],
  "audience_personas": [
    {
      "name": "Short label e.g. 'The Overwhelmed CDO'",
      "pain": "What keeps them up at night",
      "why_you": "Why this executive is the right person to speak to this pain"
    }
  ],
  "platform_strategy": [
    {
      "platform": "LinkedIn",
      "role": "Primary authority channel",
      "content_types": ["Insight posts", "Career stories"],
      "weekly_target": 3
    }
  ],
  "community_map": [
    {
      "type": "Comment | DM | Newsletter | Event",
      "target": "Who to engage with",
      "action": "Specific engagement action",
      "frequency": "Daily | Weekly | Monthly"
    }
  ]
}

QUALITY BAR:
  • "Post more consistently" is not an insight. "Your 2019 IPO story..." is.
  • The Uncomfortable Truth must name real unvarnished truths.
  • ghostwriting_rules must be highly opinionated and specific.
  • verified_career_anchors must quote the executive's own words — not paraphrased generalities.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Internal service-to-service call — authenticated via service role key
  // No JWT user validation needed for agent-to-agent calls
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { job_id, job_type, user_id, linkedin, resume, industry, live_signals, signal_id, session_id } = await req.json();

    if (!user_id || !job_id) {
      throw new Error('Missing job_id or user_id in payload');
    }

    // Initialise clients once — used by ALL modes below
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── S5-03: Stage 1 — gather_intelligence ──────────────────────────────
    // Chanakya reads industry signals and generates targeted clarification
    // questions for the exec. The frontend ClarificationPage.jsx renders these
    // and POSTs answers back. Once answered, Stage 2 (build_framework) runs.
    // ─────────────────────────────────────────────────────────────────────────
    if (job_type === 'gather_intelligence') {
      console.log(`[Chanakya] Stage 1: gather_intelligence job ${job_id} for user ${user_id}`);

      // 1. Fetch profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();
      if (profileErr || !profile) throw new Error(`Profile fetch failed: ${profileErr?.message}`);

      // 2. Fetch industry signals if available
      let signals: any[] = [];
      let themes: string[] = [];
      let opportunity_gaps: string[] = [];
      if (signal_id) {
        const { data: sigRow } = await supabase
          .from('industry_signals')
          .select('signals, themes, opportunity_gaps')
          .eq('id', signal_id)
          .single();
        if (sigRow) {
          signals = sigRow.signals ?? [];
          themes = sigRow.themes ?? [];
          opportunity_gaps = sigRow.opportunity_gaps ?? [];
        }
      }

      // 3. Ask Claude Haiku to generate 5-7 targeted clarification questions
      const questionPrompt = `
You are Chanakya — executive brand strategist for ${profile.full_name}, ${profile.current_title} at ${profile.company}.

Before building their brand framework, you need to collect specific, real career facts that will make the framework precise and authentic.

WHAT YOU KNOW SO FAR:
- Industry: ${profile.industry}
- Primary goal: ${profile.primary_goal ?? 'Not specified'}
- Their differentiator: ${profile.differentiator ?? 'Not specified'}
- Topics they want to own: ${profile.topics_owned ?? 'Not specified'}
- Today's market themes: ${themes.join('; ') || 'None available'}
- Opportunity gaps in the market: ${opportunity_gaps.join('; ') || 'None identified'}

WHAT YOU NEED:
Generate exactly 6 clarification questions that will unlock specific, citable career facts for their brand framework. These questions must:
1. Be conversational and warm — not clinical or form-like
2. Target concrete outcomes: numbers, decisions, failures, turnarounds, team sizes
3. Map to a category so the UI can group them well
4. Have a priority: high = needed for framework core, medium = useful enrichment

CATEGORIES: career_anchors | contrarian_view | audience_definition | platform_strategy | voice_tone | mission_legacy

Return ONLY valid JSON:
{
  "intro_message": "A warm 2-sentence welcome from Chanakya that sets the context before the questions.",
  "questions": [
    {
      "id": "q1",
      "question": "Full conversational question text",
      "category": "career_anchors",
      "priority": "high",
      "placeholder": "e.g. I led a team of 120 across 8 markets and reduced churn by 40% within 18 months",
      "why_we_ask": "One sentence explaining why this matters for their brand"
    }
  ]
}`;

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 2000,
          messages: [{ role: 'user', content: questionPrompt }],
        }),
      });

      if (!anthropicRes.ok) throw new Error(`Anthropic error: ${await anthropicRes.text()}`);

      const aData = await anthropicRes.json();
      const raw = aData.content[0].text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(raw);

      // 4. Save to clarification_sessions
      const { data: sessionRow, error: sessErr } = await supabase
        .from('clarification_sessions')
        .insert({
          user_id,
          signal_id: signal_id ?? null,
          status: 'active',
          questions: parsed.questions ?? [],
          answers: {},
          ready_for_framework: false,
        })
        .select()
        .single();

      if (sessErr) throw new Error(`clarification_sessions insert failed: ${sessErr.message}`);

      // 5. Audit log
      await supabase.from('agent_audit_logs').insert({
        user_id,
        agent_role: 'agent-strategist',
        event_type: 'clarification_questions_generated',
        trigger_entity_id: sessionRow.id,
        prompt_context: { signal_id, themes, opportunity_gaps },
        response_output: raw,
      });

      console.log(`[Chanakya] Stage 1 complete — session ${sessionRow.id}: ${parsed.questions.length} questions → waiting for user answers`);

      return new Response(
        JSON.stringify({
          success: true,
          session_id: sessionRow.id,
          intro_message: parsed.intro_message,
          questions: parsed.questions,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    // ── Stage 2: build_framework ─────────────────────────────────────────
    console.log(`[Strategist] Starting build_framework job ${job_id} for user ${user_id}`);

    // 1. Fetch Profile Data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch profile: ${profileError?.message}`);
    }

    // S5-05 Step A: Fetch clarification session answers if session_id provided
    let verifiedFactsBlock = '';
    let clarificationSessionId: string | null = session_id ?? null;

    if (clarificationSessionId) {
      console.log(`[Strategist] Fetching clarification session ${clarificationSessionId}`);
      const { data: clarSession } = await supabase
        .from('clarification_sessions')
        .select('questions, answers, extracted_anchors')
        .eq('id', clarificationSessionId)
        .eq('user_id', user_id)
        .single();

      if (clarSession?.answers && Object.keys(clarSession.answers).length > 0) {
        // S5-05 Step B: Map answers back to questions for context
        const questions: any[] = clarSession.questions ?? [];
        const answers: Record<string, string> = clarSession.answers ?? {};

        const factLines = questions
          .filter((q: any) => answers[q.id]?.trim())
          .map((q: any) => {
            const categoryLabel: Record<string, string> = {
              career_anchors:      'CAREER ANCHOR',
              contrarian_view:     'CONTRARIAN POSITION',
              audience_definition: 'PRIMARY AUDIENCE',
              platform_strategy:   'PLATFORM APPROACH',
              voice_tone:          'VOICE & TONE',
              mission_legacy:      'MISSION & LEGACY',
            };
            const label = categoryLabel[q.category] ?? q.category.toUpperCase();
            return `[${label}] Q: ${q.question}\n  A: "${answers[q.id].trim()}"`;
          });

        if (factLines.length > 0) {
          verifiedFactsBlock = `
---
VERIFIED CAREER FACTS (collected directly from ${profile.full_name} — treat as ground truth, highest priority over self-reported profile):

${factLines.join('\n\n')}
---`;
          console.log(`[Strategist] Injecting ${factLines.length} verified facts into framework prompt`);
        }
      } else {
        console.log(`[Strategist] No answers found in session ${clarificationSessionId} — building from profile only`);
      }
    }

    const hasVerifiedFacts = verifiedFactsBlock.length > 0;

    // S5-05 Step C: Build enriched user dossier
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
      LinkedIn Snapshot: ${linkedin ? JSON.stringify(linkedin) : 'Not provided'}
      Resume / Career History: ${resume ? resume : 'Not provided'}
      Industry Context: ${industry ? industry : 'Not provided'}
      Live Industry Signals (This Week): ${live_signals ? live_signals : 'Not provided'}
      ${verifiedFactsBlock}

      Analyze this dossier. Prioritise VERIFIED CAREER FACTS over self-reported data where they conflict.
      Build the authoritative Brand Framework JSON — use the exec's own words in verified_career_anchors.
    `;

    // S5-05 Step D: Pass hasVerifiedFacts to expand the JSON schema
    const systemPrompt = buildChanakyaSystemPrompt(profile, hasVerifiedFacts);
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 4000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
        throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    let anthropicData = await anthropicResponse.json();
    let rawOutput = anthropicData.content[0].text;
    let rawCleaned = rawOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsedFramework = JSON.parse(rawCleaned);

    // Validate uncomfortable_truth
    const hasUncomfortableTruth = parsedFramework.mentor_insights?.some((i: any) => i.category === 'uncomfortable_truth');
    
    if (!hasUncomfortableTruth) {
        console.log(`[Strategist] Missing uncomfortable_truth. Re-invoking Anthropic...`);
        // Anthropic multi-turn: add assistant response then user follow-up
        anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key':         anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type':      'application/json',
          },
          body: JSON.stringify({
            model:      'claude-sonnet-4-5',
            max_tokens: 4000,
            system:     systemPrompt,
            messages:   [
              { role: 'user',      content: userPrompt },
              { role: 'assistant', content: rawOutput },
              { role: 'user',      content: `Your mentor_insights array is missing an 'uncomfortable_truth' entry. This is required. Add one specific, honest observation about what is currently holding ${profile.full_name} back. Do not soften it.` },
            ],
          }),
        });

        if (!anthropicResponse.ok) {
            throw new Error(`Anthropic Retry Error: ${await anthropicResponse.text()}`);
        }

        anthropicData = await anthropicResponse.json();
        rawOutput     = anthropicData.content[0].text;
        rawCleaned    = rawOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedFramework = JSON.parse(rawCleaned);
    }

    // S5-05 Step E: Save to brand_frameworks — include sprint5 columns
    const { data: frameworkRow, error: insertError } = await supabase
      .from('brand_frameworks')
      .insert({
        user_id:                  user_id,
        archetype:                parsedFramework.archetype,
        voice_traits:             parsedFramework.voice_traits,
        content_pillars:          parsedFramework.content_pillars,
        target_audiences:         parsedFramework.target_audiences,
        social_platforms:         parsedFramework.social_platforms,
        content_calendar_cadence: parsedFramework.content_calendar_cadence,
        ghostwriting_rules:       parsedFramework.ghostwriting_rules,
        mentor_memo:              parsedFramework.mentor_memo,
        mentor_insights:          parsedFramework.mentor_insights,
        status:                   'active',
        // Sprint 5 — clarification-derived fields
        verified_career_anchors:  parsedFramework.verified_career_anchors  ?? [],
        audience_personas:        parsedFramework.audience_personas        ?? [],
        platform_strategy:        parsedFramework.platform_strategy        ?? [],
        community_map:            parsedFramework.community_map            ?? [],
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // S5-05 Step F: Mark clarification session as used
    if (clarificationSessionId) {
      await supabase
        .from('clarification_sessions')
        .update({ status: 'used', ready_for_framework: true, updated_at: new Date().toISOString() })
        .eq('id', clarificationSessionId);
      console.log(`[Strategist] Marked clarification session ${clarificationSessionId} as used`);
    }

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
