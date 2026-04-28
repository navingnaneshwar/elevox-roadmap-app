import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- SYSTEM PROMPT (S5-05 + S5-07 upgraded) ---
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
- VERIFIED CAREER FACTS: direct answers collected from the executive — treat as ground truth, highest priority over self-reported profile data` : ''}

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
RULES:
  - Opening sentence MUST name the single most powerful specific achievement by its real name — not "your AI work" but the actual product, number, or outcome.
  - Uncomfortable Truth must name a specific missed opportunity. "Post more consistently" fails. Name the real gap.
  - Close: what the framework below will unlock for them specifically.

PART 3 — THE 90-DAY BRAND FRAMEWORK
Provide specific archetype, voice traits, content pillars, target audiences, platforms, cadence, and rules.
If VERIFIED CAREER FACTS are provided, extract every specific quantified fact into verified_career_anchors. These are the ONLY statistics Shakespeare is permitted to use. If a fact is not in this list, Shakespeare must not invent it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM SELECTION RULES (S5-07)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Select platforms based on industry + goal. NEVER assume LinkedIn is always primary.

INDUSTRY DEFAULTS:
  Pharma / Healthcare / Biotech      → Primary: LinkedIn | Secondary: YouTube | Consider: Newsletter | Skip: Instagram, TikTok, X
  FinTech / Finance / Banking        → Primary: LinkedIn | Secondary: X/Twitter | Consider: Newsletter/Substack | Skip: Instagram, TikTok
  Enterprise Tech / SaaS / AI        → Primary: LinkedIn + X/Twitter | Secondary: YouTube | Consider: Newsletter, Podcast | Skip: Instagram, TikTok
  Retail / Consumer / DTC            → Primary: Instagram | Secondary: LinkedIn | Consider: TikTok, YouTube | Skip: X/Twitter
  Real Estate / Property             → Primary: LinkedIn + Instagram | Secondary: YouTube | Consider: TikTok
  Consulting / Advisory              → Primary: LinkedIn | Secondary: Newsletter/Substack | Consider: Podcast, YouTube | Skip: Instagram, TikTok
  Education / EdTech                 → Primary: LinkedIn + YouTube | Secondary: Instagram | Consider: TikTok, Newsletter
  Manufacturing / Industrial         → Primary: LinkedIn | Secondary: YouTube | Skip: Instagram, TikTok, X
  Media / Entertainment              → Primary: Instagram + LinkedIn | Secondary: X/Twitter, YouTube | Consider: TikTok

GOAL OVERRIDES (always applied regardless of industry):
  Board seat positioning             → LinkedIn is non-negotiable primary
  Raise capital / attract investors  → LinkedIn + X/Twitter always
  Consumer brand building            → Instagram always, even for B2B executives
  Speaking career                    → LinkedIn + YouTube + Podcast
  Consulting pipeline                → LinkedIn + Newsletter always
  Talent attraction                  → LinkedIn + Instagram (culture content)
  Media presence                     → X/Twitter + LinkedIn always

For each selected platform, include: platform name, strategic role (primary/secondary/consider), content types, weekly target, and skip_reason for any skipped platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST respond strictly in valid JSON. No prose outside JSON.
{
  "gap_analysis": {
    "linkedin_current": "How they appear today",
    "linkedin_ideal": "How they should appear given goals",
    "resume_missing": "Credibility anchors not on LinkedIn",
    "competitor_analysis": "What top 3 peers are doing they are not",
    "biggest_opportunity": "The single most impactful thing they could do"
  },
  "mentor_memo": "200-250 word memo. Opening sentence must name a specific achievement. Uncomfortable Truth must be real and named.",
  "archetype": "A single powerful phrase (e.g. 'The Contrarian Visionary')",
  "voice_traits": [
    {
      "trait": "Trait name",
      "behaviour": "What this sounds like in practice",
      "never_do": "What Shakespeare must never write for this exec"
    }
  ],
  "content_pillars": [ { "title": "...", "description": "..." } ],
  "target_audiences": ["Audience 1", "Audience 2"],
  "social_platforms": [ { "platform": "...", "purpose": "...", "frequency": "..." } ],
  "content_calendar_cadence": [ { "day": "...", "format": "...", "theme": "..." } ],
  "ghostwriting_rules": ["Strategic constraint 1 — what to own or never say"],
  "mentor_insights": [
    {
      "category": "opportunity | risk | quick_win | uncomfortable_truth",
      "insight": "Specific, named, non-generic — must include uncomfortable_truth",
      "action": "What to do about it",
      "priority": "high | medium | low"
    }
  ],
  "verified_career_anchors": [
    "Verbatim, specific, quantified fact from their own words. If no verified facts: extract from resume. Shakespeare uses ONLY these."
  ],
  "audience_personas": [
    {
      "name": "Short label e.g. 'The Overwhelmed CDO'",
      "role": "Job title or role type",
      "pain": "What keeps them up at night",
      "content_angle": "What type of content from this exec resonates most with them",
      "why_you": "Why this executive is the right person to speak to this pain"
    }
  ],
  "platform_strategy": [
    {
      "platform": "LinkedIn",
      "strategic_role": "primary | secondary | consider | skip",
      "role": "Why this platform matters for their goal",
      "content_types": ["Insight posts", "Career stories"],
      "weekly_target": 3,
      "skip_reason": "Only if strategic_role is skip — why this platform is wrong for them"
    }
  ],
  "community_map": [
    {
      "type": "Comment | DM | Newsletter | Event | Group",
      "target": "Specific group, community, or person type to engage",
      "action": "Specific engagement action",
      "frequency": "Daily | Weekly | Monthly"
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY GATES — FAIL ANY OF THESE AND YOU MUST RETRY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • mentor_memo opening sentence must name the actual achievement, not a category ("your AI work" fails; "the ₹240Cr ARR you achieved in 18 months" passes)
  • uncomfortable_truth must be present in mentor_insights and must name a real, specific gap
  • voice_traits must have minimum 5 traits, each with trait + behaviour + never_do
  • platform_strategy must be derived from industry + goal matrix above — not a generic LinkedIn-only output
  • verified_career_anchors must contain only facts the executive themselves stated or their resume confirms — no invented statistics
  • ghostwriting_rules = strategic persona constraints (what to own, what to never say) — NOT craft rules (those belong to Shakespeare)
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

      // 4. Save to clarification_sessions (includes intro_message for ClarificationPage)
      const { data: sessionRow, error: sessErr } = await supabase
        .from('clarification_sessions')
        .insert({
          user_id,
          signal_id: signal_id ?? null,
          status: 'active',
          questions: parsed.questions ?? [],
          answers: {},
          context_summary: parsed.intro_message ?? null,   // Chanakya's personalised opening
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
        max_tokens: 8000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
        throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    let anthropicData = await anthropicResponse.json();
    let rawOutput = anthropicData.content[0].text;

    // Robust JSON extraction — handles markdown fences and any trailing text Claude appends
    const extractJSON = (text: string): any => {
      // Strip ```json ... ``` fences first
      let cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      // Find the outermost { ... } block to tolerate trailing prose
      const start = cleaned.indexOf('{');
      if (start === -1) throw new Error('No JSON object found in Anthropic response');
      let depth = 0;
      let end = -1;
      for (let i = start; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        else if (cleaned[i] === '}') {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end === -1) throw new Error('Malformed JSON — unmatched braces in Anthropic response');
      return JSON.parse(cleaned.slice(start, end + 1));
    };

    let parsedFramework = extractJSON(rawOutput);

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

    // S5-05 Step E: Save to brand_frameworks — all S5 columns including gap_analysis
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
        // S5-05: clarification-enriched fields
        verified_career_anchors:  parsedFramework.verified_career_anchors  ?? [],
        audience_personas:        parsedFramework.audience_personas        ?? [],
        platform_strategy:        parsedFramework.platform_strategy        ?? [],
        community_map:            parsedFramework.community_map            ?? [],
        // S5-05: gap_analysis was in schema but not persisted — fixed
        gap_analysis:             parsedFramework.gap_analysis             ?? null,
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
