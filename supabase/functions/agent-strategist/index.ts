import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// STAGE 1 — GATHER INTELLIGENCE (humanized advisor dialogue)
// Chanakya reads the profile, identifies gaps, asks 3-5 targeted
// follow-up questions specific to THIS person.
// ─────────────────────────────────────────────────────────────
function buildGatherIntelligencePrompt(profile: any, industrySignals: string) {
  return `
You are Chanakya — an elite executive brand strategist meeting ${profile.full_name} for the first time.

You have just reviewed their onboarding profile. Before you build their brand framework, you want to understand them more deeply. A good strategist does NOT ask generic questions. They read what you gave them, identify what's missing or ambiguous, and ask precisely what they need.

PROFILE SUMMARY:
Name: ${profile.full_name} | Role: ${profile.current_title} at ${profile.company}
Industry: ${profile.industry} | Goal: ${JSON.stringify(profile.primary_goal)}
Dream Outcome: ${profile.dream_outcome ?? 'Not specified'}
Topics: ${profile.topics_owned ?? 'Not specified'}
Differentiator: ${profile.differentiator ?? 'Not specified'}
Target Audience: ${profile.target_audience ?? 'Not specified'}
Credibility Inventory: ${profile.credibility_inventory ?? 'Not provided'}
Contrarian Thesis: ${profile.contrarian_thesis ?? 'Not provided'}
Recognition: ${profile.recognition ?? 'Not provided'}

INDUSTRY CONTEXT THIS WEEK:
${industrySignals || 'Not available'}

YOUR TASK:
1. Read the profile carefully.
2. Identify the 3-5 MOST CRITICAL gaps or ambiguities that would affect the brand strategy.
3. For each gap, form ONE precise question that only this person can answer.
4. Do NOT ask questions whose answers are already in the profile.
5. Do NOT ask generic questions like "what are your goals?" — you already know.

OUTPUT FORMAT — Strict JSON only, no prose outside JSON:
{
  "what_i_found": "2-3 sentence summary of your strongest impressions of this person based on their profile. Be specific. Name the most powerful thing you saw.",
  "strongest_signal": "The single most compelling thing about their background — the thing another executive would immediately respect.",
  "critical_gaps": [
    {
      "gap": "The specific information gap you identified",
      "why_it_matters": "One sentence on why this gap directly affects brand strategy",
      "question": "Your precise, warm, direct question to fill this gap"
    }
  ],
  "assumptions_made": "2-3 assumptions you are making about them that they should confirm or correct",
  "ready_to_proceed": false
}
`;
}

// ─────────────────────────────────────────────────────────────
// STAGE 2 — BUILD FRAMEWORK (with clarification context + upgraded schema)
// ─────────────────────────────────────────────────────────────
function buildChanakyaSystemPrompt(profile: any) {
  return `
You are Chanakya — the executive brand strategist and personal mentor for 
${profile.full_name}, ${profile.current_title} at ${profile.company}.

You operate at the intersection of elite personal branding, executive 
communication, and market positioning. Your clients are CxOs who have 
earned their seat at the table and now need the world to know it.

HALLUCINATION PREVENTION — CRITICAL RULE:
You will be given a list of "verified_career_anchors" — specific, quantified facts 
this person told you themselves in their onboarding. These are the ONLY statistics and 
specific claims you are permitted to use throughout the entire framework output.
If a statistic is NOT in the verified_career_anchors list, you MUST NOT invent it.
Shakespeare (the content writer) will read this list and follow the same rule.

PLATFORM SELECTION MATRIX — Apply based on industry AND goal:
Industry defaults:
- Pharma/Healthcare/Biotech: Primary=LinkedIn, Secondary=YouTube
- FinTech/Finance/Banking: Primary=LinkedIn+X, Secondary=Newsletter
- Enterprise Tech/SaaS/AI: Primary=LinkedIn+X, Secondary=YouTube+Newsletter
- Retail/Consumer/DTC: Primary=Instagram, Secondary=LinkedIn
- Consulting/Advisory: Primary=LinkedIn, Secondary=Newsletter+Podcast
- Education/EdTech: Primary=LinkedIn+YouTube, Secondary=Instagram
- Manufacturing/Industrial: Primary=LinkedIn, Secondary=YouTube

Goal overrides (always applied regardless of industry):
- Board seat positioning → LinkedIn is non-negotiable primary
- Raise capital/attract investors → LinkedIn + X always
- Speaking career → LinkedIn + YouTube + Podcast
- Consulting pipeline → LinkedIn + Newsletter always
- Talent attraction → LinkedIn + Instagram (culture content)

QUALITY BAR:
- "Post more consistently" is NOT an insight. "Your 2019 IPO story..." IS.
- The Uncomfortable Truth must name a specific missed opportunity, not give generic advice.
- mentor_memo opening sentence MUST name the single most powerful specific achievement by name.
- voice_traits: minimum 5, each must have trait name + behaviour description + never-do instruction.
- ghostwriting_rules must be highly opinionated and specific to THIS person.
`;
}

function buildFrameworkUserPrompt(profile: any, clarificationContext: string, liveSignals: string, linkedin: string, resume: string, industry: string) {
  return `
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

NEW ONBOARDING DATA (Sprint 5 additions):
Credibility Inventory (measurable achievements): ${profile.credibility_inventory ?? 'Not provided'}
Built From Scratch: ${profile.built_from_scratch ?? 'Not provided'}
First Of A Kind: ${profile.first_of_a_kind ?? 'Not provided'}
Recognition (awards/media): ${profile.recognition ?? 'Not provided'}
Origin Moment: ${profile.origin_moment ?? 'Not provided'}
Target Persona (specific): ${profile.target_persona ?? 'Not provided'}
Desired Action: ${profile.desired_action ?? 'Not provided'}
Audience Online: ${profile.audience_online ?? 'Not provided'}
Vulnerability Comfort: ${profile.vulnerability_comfort ?? 'Not provided'}
Nervous Topics: ${profile.nervous_topics ?? 'Not provided'}
Instant Delete Triggers: ${profile.instant_delete_triggers ?? 'Not provided'}
Contrarian Thesis: ${profile.contrarian_thesis ?? 'Not provided'}
Platform Preferences: ${profile.platform_preferences ?? 'Not provided'}
Platforms To Avoid: ${profile.platforms_to_avoid ?? 'Not provided'}
Company Stage: ${profile.company_stage ?? 'Not provided'}
Role Tenure: ${profile.role_tenure ?? 'Not provided'}
Board Roles: ${profile.board_roles ?? 'Not provided'}
Competitive Whitespace: ${profile.competitive_whitespace ?? 'Not provided'}
Contrarian Content Dislike: ${profile.content_dislike ?? 'Not provided'}
LinkedIn Following Size: ${profile.linkedin_following ?? 'Not provided'}

---
STAGE 1 CLARIFICATION EXCHANGE:
${clarificationContext || 'Not available — user proceeded without clarification.'}

---
EMPIRICAL MARKET DATA:
LinkedIn Snapshot: ${linkedin || 'Not provided'}
Resume / Career History: ${resume || 'Not provided'}
Industry Context: ${industry || 'Not provided'}
Live Industry Signals (This Week): ${liveSignals || 'Not provided'}

BUILD THE COMPLETE BRAND FRAMEWORK. Output strict JSON:
{
  "gap_analysis": {
    "linkedin_current": "...",
    "linkedin_ideal": "...",
    "resume_missing": "...",
    "competitor_analysis": "...",
    "biggest_opportunity": "..."
  },
  "mentor_memo": "200-250 word memo addressed directly to them",
  "archetype": "Single powerful phrase",
  "verified_career_anchors": [
    { "fact": "Specific verified stat or achievement from their profile", "source": "credibility_inventory | recognition | built_from_scratch | profile" }
  ],
  "voice_traits": [
    { "trait": "Name", "behaviour": "How this shows in writing", "never_do": "What violates this trait" }
  ],
  "content_pillars": [ { "title": "...", "description": "..." } ],
  "target_audiences": [ { "persona": "...", "why_they_matter": "...", "content_angle": "...", "where_they_are": "..." } ],
  "platform_strategy": [
    { "platform": "...", "why": "Industry + goal derived reason", "content_mix": "...", "frequency": "...", "skip_reason": null }
  ],
  "community_map": {
    "linkedin_groups": ["..."],
    "people_to_engage": ["Category: example"],
    "content_communities": ["..."],
    "niche_forums": ["..."]
  },
  "content_calendar_cadence": [ { "day": "...", "format": "...", "theme": "..." } ],
  "ghostwriting_rules": ["Highly specific rule 1", "Rule 2"],
  "mentor_insights": [
    { "category": "opportunity | risk | quick_win | uncomfortable_truth", "insight": "specific, named", "action": "what to do", "priority": "high | medium | low" }
  ]
}
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { job_id, job_type, user_id, linkedin, resume, industry, live_signals, clarification_session_id } = await req.json();

    if (!user_id || !job_id) {
      throw new Error('Missing job_id or user_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Strategist] Job ${job_id} | type: ${job_type || 'build_framework'} | user: ${user_id}`);

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch profile: ${profileError?.message}`);
    }

    // =====================================================================
    // MODE A: GATHER INTELLIGENCE — Stage 1 of Two-Stage Chanakya (S5-03)
    // Reads profile, identifies gaps, asks 3-5 targeted questions
    // =====================================================================
    if (job_type === 'gather_intelligence') {
      console.log(`[Strategist] Stage 1 — Gathering intelligence for ${profile.full_name}`);

      // Fetch industry signals if available (S5-02)
      const { data: signals } = await supabase
        .from('industry_signals')
        .select('signals')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const industrySignals = signals?.signals
        ? Object.values(signals.signals).join('\n---\n')
        : '';

      const systemPrompt = buildGatherIntelligencePrompt(profile, industrySignals);

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-5',
          max_tokens: 2000,
          system:     'You are Chanakya, an elite executive brand strategist. Return only valid JSON.',
          messages:   [{ role: 'user', content: systemPrompt }],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
      }

      const anthropicData = await anthropicResponse.json();
      const rawOutput = anthropicData.content[0].text;
      const cleaned = rawOutput.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      // Save clarification session to DB
      const { data: sessionRow, error: sessionErr } = await supabase
        .from('clarification_sessions')
        .insert({
          user_id,
          chanakya_summary:  parsed.what_i_found,
          strongest_signal:  parsed.strongest_signal,
          questions:         parsed.critical_gaps,
          assumptions_made:  parsed.assumptions_made,
          status:            'pending',
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      await supabase.from('agent_jobs').update({ status: 'complete' }).eq('id', job_id);

      console.log(`[Strategist] Clarification session ${sessionRow.id} created — awaiting user responses`);

      return new Response(JSON.stringify({ success: true, clarification_session: sessionRow }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // =====================================================================
    // MODE B: BUILD FRAMEWORK — Stage 2 (or direct, if no clarification)
    // Full framework with upgraded schema (S5-05)
    // =====================================================================
    console.log(`[Strategist] Stage 2 — Building framework for ${profile.full_name}`);

    // Load clarification context if available
    let clarificationContext = '';
    if (clarification_session_id) {
      const { data: session } = await supabase
        .from('clarification_sessions')
        .select('chanakya_summary, strongest_signal, questions, user_responses')
        .eq('id', clarification_session_id)
        .single();

      if (session?.user_responses) {
        clarificationContext = `
Chanakya's initial read: ${session.chanakya_summary}
Strongest signal identified: ${session.strongest_signal}
Questions asked and answers received:
${(session.questions as any[] || []).map((q: any, i: number) => `Q: ${q.question}\nA: ${(session.user_responses as any)?.[i] ?? 'No answer provided'}`).join('\n\n')}
        `.trim();
      }
    }

    // Load latest industry signals
    const { data: signals } = await supabase
      .from('industry_signals')
      .select('signals')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const liveSignalsText = signals?.signals
      ? JSON.stringify(signals.signals)
      : live_signals || '';

    const systemPrompt = buildChanakyaSystemPrompt(profile);
    const userPrompt   = buildFrameworkUserPrompt(profile, clarificationContext, liveSignalsText, linkedin, resume, industry);

    let anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 5000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    let anthropicData   = await anthropicResponse.json();
    let rawOutput       = anthropicData.content[0].text;
    let rawCleaned      = rawOutput.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsedFramework = JSON.parse(rawCleaned);

    // Quality gate: require uncomfortable_truth
    const hasUncomfortableTruth = parsedFramework.mentor_insights?.some((i: any) => i.category === 'uncomfortable_truth');
    if (!hasUncomfortableTruth) {
      console.log(`[Strategist] Missing uncomfortable_truth — re-prompting`);
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-5',
          max_tokens: 5000,
          system:     systemPrompt,
          messages:   [
            { role: 'user',      content: userPrompt },
            { role: 'assistant', content: rawOutput },
            { role: 'user',      content: `Your mentor_insights is missing an 'uncomfortable_truth' entry. Add one specific, honest observation about what is holding ${profile.full_name} back. Do not soften it. Name a specific missed opportunity.` },
          ],
        }),
      });
      anthropicData    = await anthropicResponse.json();
      rawOutput        = anthropicData.content[0].text;
      rawCleaned       = rawOutput.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedFramework  = JSON.parse(rawCleaned);
    }

    // Save to brand_frameworks with upgraded schema (S5-05)
    const { data: frameworkRow, error: insertError } = await supabase
      .from('brand_frameworks')
      .insert({
        user_id,
        archetype:                  parsedFramework.archetype,
        voice_traits:               parsedFramework.voice_traits,
        content_pillars:            parsedFramework.content_pillars,
        target_audiences:           parsedFramework.target_audiences,
        social_platforms:           parsedFramework.platform_strategy ?? parsedFramework.social_platforms,
        content_calendar_cadence:   parsedFramework.content_calendar_cadence,
        ghostwriting_rules:         parsedFramework.ghostwriting_rules,
        mentor_memo:                parsedFramework.mentor_memo,
        mentor_insights:            parsedFramework.mentor_insights,
        gap_analysis:               parsedFramework.gap_analysis,
        // S5-05 new fields
        verified_career_anchors:    parsedFramework.verified_career_anchors ?? [],
        audience_personas:          parsedFramework.target_audiences,
        platform_strategy:          parsedFramework.platform_strategy ?? [],
        community_map:              parsedFramework.community_map ?? null,
        status:                     'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Mark clarification session as complete
    if (clarification_session_id) {
      await supabase
        .from('clarification_sessions')
        .update({ status: 'complete' })
        .eq('id', clarification_session_id);
    }

    // Audit log
    await supabase.from('agent_audit_logs').insert({
      user_id,
      agent_role:         'agent-strategist',
      event_type:         'framework_generated',
      trigger_entity_id:  frameworkRow.id,
      prompt_context:     { system: systemPrompt, user: userPrompt, clarification_session_id },
      response_output:    rawOutput,
    });

    // Queue next step: news sweep
    await supabase.from('agent_jobs').insert({
      user_id,
      job_type: 'run_news_sweep',
      payload:  { framework_id: frameworkRow.id },
    });

    console.log(`[Strategist] Framework ${frameworkRow.id} built — queued news sweep`);

    return new Response(JSON.stringify({ success: true, framework: frameworkRow }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[Strategist] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
