import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARISTOTLE_SYSTEM_PROMPT = `
You are Aristotle — the Editor-in-Chief and Chief Credibility Officer 
for a premium Executive PR agency serving CxOs who pay for excellence.

Your job is not to find reasons to reject. Your job is to ensure that 
every post that reaches the executive is one they will be proud to publish — 
one that builds their authority, serves their audience, and advances 
their 90-day brand goal.

You evaluate on two dimensions simultaneously:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 1 — CUSTOMER EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Would the executive feel genuinely proud to publish this post?

Evaluate against:
• Voice fidelity: Does it sound unmistakably like this specific executive, 
  given their archetype and voice traits? Not like a generic CxO.
• Audience respect: Does it offer the target audience something genuinely 
  valuable — a sharp insight, a useful perspective, a surprising angle?
• Professional reputation: If this post went viral, would it enhance or 
  damage the executive's standing in their industry?
• Emotional resonance: Does it feel human, earned, and real — 
  or does it feel manufactured and hollow?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 2 — CREDIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Does this post make the executive more credible — or does it expose them?

Evaluate against:
• Factual integrity: Does the post make any claims the executive 
  cannot personally substantiate? Any hallucinated statistics, 
  unnamed studies, or fabricated authority signals?
• Credibility anchor quality: Is there a specific, real, owned 
  experience from the executive's career woven into the post? 
  Generic "I've seen many companies" does not count.
• Contrarian integrity: If the post takes a contrarian position, 
  is it earned and defensible — or is it contrarian for attention only?
• Strategic alignment: Does this post serve the content pillar 
  and 90-day goal it claims to serve?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD REJECTION CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reject immediately if ANY of the following are present:
• AI speak: delve, tapestry, crucial, multifaceted, testament, 
  navigating, landscape, foster, leverage, synergy, game-changer, 
  paradigm, or any phrase that signals AI generation
• Hallucinated claims: statistics, studies, or facts the executive 
  did not provide and cannot verify
• Voice mismatch: sounds like any senior executive rather than 
  THIS specific executive
• Essay structure: no hook, no white space, reads like a memo not a post
• Vague credibility anchor: "I've worked with many Fortune 500 companies" 
  — specific or nothing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVISION INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you reject a draft, your critique must be a precise brief 
for Shakespeare to fix it. Not "the voice is wrong." Instead:
"The hook reads like a motivational poster. Rewrite it using the 
specific IPO decision mentioned in the executive's career history. 
The contrarian position needs to name the exact mainstream belief 
being challenged — currently it is implied, not stated."

OUTPUT FORMAT:
Return ONLY valid JSON — no markdown, no commentary:

{
  "verdict": "approved" | "needs_revision" | "escalate_to_human",
  "cx_score": 0,
  "editorial_credibility_score": 0,
  "composite_score": 0,
  "cx_assessment": "1-2 sentences on customer experience quality",
  "credibility_assessment": "1-2 sentences on credibility quality",
  "strengths": ["What Shakespeare did well — be specific"],
  "revision_brief": "If needs_revision: precise, actionable instructions for Shakespeare. Empty string if approved.",
  "escalation_reason": "If escalate_to_human: why human judgment is needed. Empty string otherwise.",
  "approved_for_publish": true | false,

  "verified_claims": [
    {
      "claim": "The specific claim made in the draft",
      "source_url": "URL from the briefing that verifies this",
      "source_title": "Title of the source article",
      "verification_status": "verified" | "unverifiable" | "partially_verified"
    }
  ],
  "unverified_claims": [
    {
      "claim": "The specific claim that cannot be verified",
      "reason": "Why this cannot be verified",
      "suggested_replacement": "What the CxO could replace it with from their real experience"
    }
  ],
  "source_links_used": [
    {
      "url": "URL",
      "title": "Article title",
      "how_used": "How Shakespeare used this source in the draft"
    }
  ]
}

SCORING (each 0-100):
cx_score:                    Customer experience quality
editorial_credibility_score: Editorial credibility architecture quality  
composite_score:             (cx_score + editorial_credibility_score) / 2

VERDICT RULES:
• composite_score >= 75 AND no hard rejection criteria → "approved"
• composite_score 50-74 OR fixable issues → "needs_revision"  
• Factual hallucination present OR revision_count >= 2 → "escalate_to_human"
• approved_for_publish: true ONLY when verdict is "approved"
`;

// ─────────────────────────────────────────────────────────────
// HELPER — Generate a coaching alert when credibility is structurally missing
// Called when the draft has already been revised once and still can't reach 60
// ─────────────────────────────────────────────────────────────
async function generateCredibilityCoachingAlert(
  supabase:      any,
  anthropicKey:  string,
  profile:       any,
  framework:     any,
  revisionBrief: string
): Promise<{ message: string; suggestions: string[]; questions: string[] }> {

  const prompt = `
You are Elevox — an executive brand coach.
A draft LinkedIn post for ${profile.full_name} (${profile.current_title} at ${profile.company})
has failed the credibility quality gate twice.

The editor's feedback was:
"${revisionBrief}"

The executive's current profile has these verified outcomes:
${profile.career_highlights ?? 'None recorded yet'}

Their content pillars are:
${JSON.stringify(framework.content_pillars)}

Their 90-day goal is:
${profile.primary_goal}

Write a warm, encouraging coaching message that:
1. Explains briefly why the draft needs more specific information (2-3 sentences, non-technical)
2. Gives 3-5 specific questions to collect the real story (tied to their industry and role)
3. Suggests 4-6 specific types of outcomes they could share (with pharma/healthcare examples)

Return valid JSON only:
{
  "message": "Warm 2-3 sentence explanation for the CxO",
  "questions": ["Specific question 1", "Specific question 2", ...],
  "suggestions": ["Type of outcome 1 with example", "Type of outcome 2 with example", ...]
}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  const data    = await response.json();
  const raw     = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────────────────────
// HELPER — Generate a coaching alert when Shakespeare hallucinates specific claims
// Called when unverified_claims are present on revision cycle 1+
// ─────────────────────────────────────────────────────────────
async function generateHallucinationCoachingAlert(
  anthropicKey:    string,
  profile:         any,
  framework:       any,
  unverifiedClaims: any[]
): Promise<{ message: string; data_points_needed: { label: string; example: string; field: string }[]; questions: string[] }> {

  const claimsList = unverifiedClaims
    .map((c: any) => `- "${c.claim}" (reason: ${c.reason})`)
    .join('\n');

  const prompt = `
You are Elevox — an executive brand coach helping a ${profile.current_title} at ${profile.company} build their LinkedIn presence.

Our AI writer (Shakespeare) just drafted a LinkedIn post for ${profile.full_name} and included the following claims that CANNOT be verified from their actual career record:

${claimsList}

Instead of publishing a post with fabricated details, we need to pause and collect real data points from ${profile.full_name} so the next draft is grounded in truth.

Their industry: ${profile.industry}
Their 90-day goal: ${profile.primary_goal}
Content pillars: ${JSON.stringify(framework.content_pillars)}

Generate a coaching response with three parts:

1. message: A warm, non-technical 2-3 sentence explanation for the executive. Acknowledge that the AI tried to fill a gap, explain why real specifics matter for their credibility, and make them feel this is a normal and worthwhile step. Do NOT use words like "hallucinate" or "fabricate".

2. data_points_needed: 5-6 specific data points we need them to provide. Each should have:
   - label: Short label for the input field (e.g. "A specific AI project you led")
   - example: A concrete example sentence they could fill in (e.g. "Led deployment of X system across 12 Novartis markets in 2022, reducing data processing time by 40%")
   - field: Which profile field this updates (career_highlights, key_achievements, or linkedin_about)

3. questions: 3 conversational questions to ask them in a chat UI to draw out the real story naturally.

Return ONLY valid JSON:
{
  "message": "...",
  "data_points_needed": [
    { "label": "...", "example": "...", "field": "..." }
  ],
  "questions": ["...", "...", "..."]
}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 1200,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  const data    = await response.json();
  const raw     = data.content[0].text;
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
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
    const { job_id, draft_id } = await req.json();

    if (!job_id || !draft_id) {
      throw new Error('Missing job_id or draft_id in payload');
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Aristotle] Starting job ${job_id} for draft ${draft_id}`);

    // ── STEP 1: Fetch draft with full framework and profile ───
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select(`
        *,
        brand_frameworks (
          *,
          profiles (*)
        )
      `)
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) {
      throw new Error(`Draft fetch failed: ${draftError?.message}`);
    }

    const framework = draft.brand_frameworks;
    const profile   = framework.profiles;
    const userId    = draft.user_id;

    // ── Fetch briefing for source verification context ────────
    let briefingContext = 'No news briefing was used for this draft.';
    let newsLinks: any[] = [];

    if (draft.briefing_id) {
      const { data: briefing } = await supabase
        .from('industry_briefings')
        .select('news_links, suggested_angles')
        .eq('id', draft.briefing_id)
        .single();

      if (briefing) {
        newsLinks = briefing.news_links ?? [];
        briefingContext = `
VERIFIED NEWS SOURCES USED BY SHAKESPEARE:
${newsLinks.map((n: any) => `- "${n.title}" — ${n.url}\n  Summary: ${n.summary}`).join('\n')}

Claims in the draft that reference people, events, or stories
from these sources are REAL AND SOURCED.
Do not flag these as unverifiable fabrications.
Identify them as verified in your verified_claims array.
        `.trim();
      }
    }

    // ── STEP 2: Check revision count ─────────────────────────
    const revisionCount = draft.revision_count ?? 0;

    if (revisionCount >= 2) {
      console.warn(`[Aristotle] Draft ${draft_id} has hit revision limit (${revisionCount}). Escalating to human.`);

      await supabase
        .from('content_drafts')
        .update({
          status:           'escalated',
          editor_feedback:  `Revision limit reached after ${revisionCount} cycles. Human review required.`,
        })
        .eq('id', draft_id);

      await supabase.from('agent_audit_logs').insert({
        user_id:           userId,
        agent_role:        'agent-aristotle',
        event_type:        'draft_escalated',
        trigger_entity_id: draft_id,
        prompt_context:    { reason: 'revision_limit_reached', revision_count: revisionCount },
        response_output:   'escalated_to_human',
      });

      // Notify EA via approval workflow
      await supabase.from('approvals').insert({
        calendar_event_id: draft.calendar_event_id ?? null,
        draft_id:          draft_id,
        status:            'needs_human_review',
        due_at:            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        escalation_reason: `Draft failed Aristotle's quality gate after ${revisionCount} revision cycles`,
      });

      return new Response(
        JSON.stringify({ success: true, verdict: 'escalate_to_human', draft_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── STEP 3: Build the evaluation prompt ──────────────────

    // Build trusted facts from profile — these are self-attested and must not be flagged
    const trustedFacts = `
PROFILE-ATTESTED FACTS — TREAT AS VERIFIED (self-reported by executive in onboarding):
- Name: ${profile.full_name}, ${profile.current_title} at ${profile.company}
- Biggest verified win: ${profile.biggest_win ?? 'Not provided'}
- Career highlights: ${profile.career_highlights ?? 'Not provided'}
- Differentiator: ${profile.differentiator ?? 'Not provided'}
- Topics owned: ${profile.topics_owned ?? 'Not provided'}
- Strong opinions: ${profile.strong_opinions ?? 'Not provided'}

CRITICAL INSTRUCTION: Any claim in the draft that matches or paraphrases
the above profile facts is SELF-ATTESTED and must be marked as VERIFIED.
Do NOT flag profile-attested facts as unverifiable.
The $1.2M PrivacyAI saving is explicitly stated in this executive's profile.
It is verified. Do not reject it.
`.trim();

    const userPrompt = `
EXECUTIVE PROFILE:
Name: ${profile.full_name} | Role: ${profile.current_title} at ${profile.company}
Industry: ${profile.industry}
90-Day Brand Goal: ${profile.primary_goal ?? 'Establish thought leadership and visibility'}

BRAND FRAMEWORK:
Archetype: ${framework.archetype}
Voice Traits: ${JSON.stringify(framework.voice_traits)}
Target Audience: ${JSON.stringify(framework.target_audiences)}
Content Pillars: ${JSON.stringify(framework.content_pillars)}
Ghostwriting Rules: ${JSON.stringify(framework.ghostwriting_rules ?? [])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${trustedFacts}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHAKESPEARE'S DRAFT FOR EVALUATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Post Body:
"""
${draft.body_text}
"""

Shakespeare's Self-Assessment:
• Credibility Anchor Used: ${draft.credibility_anchor ?? 'Not provided'}
• Contrarian Tension: ${draft.contrarian_tension ?? 'Not provided'}
• Shakespeare's Own Credibility Score: ${draft.credibility_score ?? 'Not scored'}

Strategic Rationale (Shakespeare's justification):
• Why Now: ${draft.strategic_rationale?.why_now ?? 'Not provided'}
• Pillar Alignment: ${draft.strategic_rationale?.pillar_alignment ?? 'Not provided'}
• Goal Alignment: ${draft.strategic_rationale?.goal_alignment ?? 'Not provided'}

Revision History: This draft has been revised ${revisionCount} time(s).
${revisionCount > 0 ? `Previous Aristotle Feedback: ${draft.editor_feedback ?? 'Not recorded'}` : 'First submission.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${briefingContext}

For each factual claim in the draft:
1. Check if it matches a source from the verified news list above
2. If yes — mark as verified with the source URL
3. If no — mark as unverifiable and suggest what the CxO
   could replace it with from their real career

Return the full JSON including verified_claims,
unverified_claims, and source_links_used arrays.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your task: Evaluate this draft on both Customer Experience and Credibility.
Be a rigorous advocate for the executive's reputation — not a soft approver.
If you find issues, give Shakespeare a precise brief to fix them.
If Shakespeare's credibility anchor is vague or generic, reject on that basis alone.
    `.trim();

    // ── STEP 4: Call Claude Sonnet ────────────────────────────
    console.log(`[Aristotle] Requesting Claude Sonnet evaluation...`);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          anthropicKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1000,
        system:     ARISTOTLE_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    const anthropicData  = await anthropicResponse.json();
    const rawOutput      = anthropicData.content[0].text;
    const cleaned        = rawOutput
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const evaluation     = JSON.parse(cleaned);

    console.log(`[Aristotle] Verdict: ${evaluation.verdict} | CX: ${evaluation.cx_score} | Editorial Credibility: ${evaluation.editorial_credibility_score} | Composite: ${evaluation.composite_score}`);

    // ── STEP 5: Map verdict to draft status ──────────────────
    const statusMap: Record<string, string> = {
      'approved':           'approved',
      'needs_revision':     'needs_revision',
      'escalate_to_human':  'escalated',
    };
    const newStatus = statusMap[evaluation.verdict] ?? 'needs_revision';

    // ── STEP 6: Update the draft ──────────────────────────────
    const { error: updateError } = await supabase
      .from('content_drafts')
      .update({
        status:                      newStatus,
        approved_for_publish:        evaluation.approved_for_publish,
        aristotle_cx_score:          evaluation.cx_score,
        editorial_credibility_score: evaluation.editorial_credibility_score,
        aristotle_composite_score:   evaluation.composite_score,
        aristotle_evaluation:        evaluation,
      })
      .eq('id', draft_id);

    if (updateError) {
      console.error(`[Aristotle] DB update failed:`, updateError);
    } else {
      console.log(`[Aristotle] DB updated — approved_for_publish: ${evaluation.approved_for_publish}`);
    }

    // ── STEP 7: Audit log ─────────────────────────────────────
    await supabase.from('agent_audit_logs').insert({
      user_id:           userId,
      agent_role:        'agent-aristotle',
      event_type:        `draft_${newStatus}`,
      trigger_entity_id: draft_id,
      prompt_context:    { system: ARISTOTLE_SYSTEM_PROMPT, user: userPrompt },
      response_output:   rawOutput,
      credibility_score: evaluation.credibility_score,
    });

    // ── STEP 8: Route based on verdict ───────────────────────

    if (evaluation.verdict === 'approved') {
      // Confirm the pre-reserved calendar slot: reserved → scheduled
      if (draft.calendar_event_id) {
        await supabase
          .from('content_calendar')
          .update({
            status:   'scheduled',
            draft_id: draft_id,
          })
          .eq('id', draft.calendar_event_id);
      }

      // Queue Machiavelli in confirm mode — slot already found, no need to search again
      await supabase.from('agent_jobs').insert({
        user_id:  userId,
        job_type: 'schedule_post',
        payload:  { draft_id, mode: 'confirm' },
      });

      console.log(`[Aristotle] Draft ${draft_id} APPROVED (composite: ${evaluation.composite_score}) — calendar slot confirmed, routed to Machiavelli`);

    } else if (evaluation.verdict === 'needs_revision') {

      // ── HALLUCINATION COACHING CIRCUIT BREAKER ────────────────────────────
      // If Shakespeare invented unverifiable claims after a revision, looping
      // again won't fix it — the profile is missing real anchors. Pause the
      // pipeline and coach the user to provide the specific data we need.
      if (revisionCount >= 1 && evaluation.unverified_claims?.length > 0) {
        console.warn(`[Aristotle] Hallucination detected on revision ${revisionCount} — ${evaluation.unverified_claims.length} unverified claim(s). Generating coaching alert.`);

        const hallucinationAlert = await generateHallucinationCoachingAlert(
          anthropicKey,
          profile,
          framework,
          evaluation.unverified_claims
        );

        await supabase.from('coaching_alerts').insert({
          user_id:           userId,
          draft_id:          draft_id,
          alert_type:        'hallucination_detected',
          alert_message:     hallucinationAlert.message,
          suggestions:       hallucinationAlert.data_points_needed,
          questions:         hallucinationAlert.questions,
          unverified_claims: evaluation.unverified_claims,
          status:            'pending',
          created_at:        new Date().toISOString(),
        });

        await supabase
          .from('content_drafts')
          .update({ status: 'needs_profile_data' })
          .eq('id', draft_id);

        if (draft.calendar_event_id) {
          await supabase
            .from('content_calendar')
            .update({ status: 'draft' })
            .eq('id', draft.calendar_event_id);
        }

        await supabase.from('agent_audit_logs').insert({
          user_id:           userId,
          agent_role:        'agent-aristotle',
          event_type:        'hallucination_coaching_alert',
          trigger_entity_id: draft_id,
          prompt_context:    { unverified_claims: evaluation.unverified_claims, revision_count: revisionCount },
          response_output:   JSON.stringify(hallucinationAlert),
        });

        console.log(`[Aristotle] Hallucination coaching alert saved — draft ${draft_id} paused for profile enrichment.`);

        return new Response(
          JSON.stringify({
            success:           true,
            verdict:           'hallucination_detected',
            alert:             hallucinationAlert,
            unverified_claims: evaluation.unverified_claims,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      // ── END HALLUCINATION COACHING CIRCUIT BREAKER ───────────────────────

      // ── CREDIBILITY GAP CIRCUIT BREAKER ───────────────────────────────────
      // If we've already revised once and credibility is still structurally low,
      // looping Shakespeare again won't help — the profile data is missing.
      // Break the loop, alert the user with specific questions to fill the gap.
      if (revisionCount >= 1 && evaluation.editorial_credibility_score < 60) {
        console.warn(`[Aristotle] Credibility gap detected (score: ${evaluation.editorial_credibility_score}, cycle: ${revisionCount + 1}) — generating coaching alert`);

        const coachingAlert = await generateCredibilityCoachingAlert(
          supabase,
          anthropicKey,
          profile,
          framework,
          evaluation.revision_brief
        );

        await supabase.from('coaching_alerts').insert({
          user_id:       userId,
          draft_id:      draft_id,
          alert_type:    'credibility_gap',
          alert_message: coachingAlert.message,
          suggestions:   coachingAlert.suggestions,
          questions:     coachingAlert.questions,
          status:        'pending',
          created_at:    new Date().toISOString(),
        });

        await supabase
          .from('content_drafts')
          .update({ status: 'needs_profile_data' })
          .eq('id', draft_id);

        // Release the calendar slot back to draft — content is not ready
        if (draft.calendar_event_id) {
          await supabase
            .from('content_calendar')
            .update({ status: 'draft' })
            .eq('id', draft.calendar_event_id);
        }

        await supabase.from('agent_audit_logs').insert({
          user_id:           userId,
          agent_role:        'agent-aristotle',
          event_type:        'credibility_gap_alert',
          trigger_entity_id: draft_id,
          prompt_context:    { editorial_credibility_score: evaluation.editorial_credibility_score, revision_count: revisionCount },
          response_output:   JSON.stringify(coachingAlert),
        });

        console.log(`[Aristotle] Credibility gap alert saved — draft ${draft_id} set to needs_profile_data`);

        return new Response(
          JSON.stringify({ success: true, verdict: 'credibility_gap', alert: coachingAlert }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      // ── END CREDIBILITY GAP CIRCUIT BREAKER ──────────────────────────────

      await supabase
        .from('content_drafts')
        .update({ revision_count: revisionCount + 1 })
        .eq('id', draft_id);

      // FORCE CORRECT JOB EVENT FOR SHAKESPEARE: 'generate_drafts', NOT 'review_draft',
      // or else Orchestrator loops it back to Aristotle eternally!
      await supabase.from('agent_jobs').insert({
        user_id:  userId,
        job_type: 'generate_drafts',       // Force re-routing to Shakespeare
        payload:  {
          draft_id:         draft_id,
          framework_id:     framework.id,
          briefing_id:      draft.briefing_id ?? null,
          revision_brief:   evaluation.revision_brief,
          revision_count:   revisionCount + 1,
        },
      });

      console.log(`[Aristotle] Draft ${draft_id} NEEDS REVISION (cycle ${revisionCount + 1}/2) — routed back to Shakespeare`);

    } else {
      await supabase.from('approvals').insert({
        draft_id:          draft_id,
        status:            'needs_human_review',
        due_at:            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        escalation_reason: evaluation.escalation_reason,
        sla_breached:      false,
      });

      console.log(`[Aristotle] Draft ${draft_id} ESCALATED to human EA — ${evaluation.escalation_reason}`);
    }

    return new Response(
      JSON.stringify({
        success:           true,
        verdict:           evaluation.verdict,
        cx_score:          evaluation.cx_score,
        editorial_credibility_score: evaluation.editorial_credibility_score,
        composite_score:   evaluation.composite_score,
        revision_brief:    evaluation.revision_brief,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(`[Aristotle] Fatal error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
