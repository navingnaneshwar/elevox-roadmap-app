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
  "credibility_score": 0,
  "composite_score": 0,
  "cx_assessment": "1-2 sentences on customer experience quality",
  "credibility_assessment": "1-2 sentences on credibility quality",
  "strengths": ["What Shakespeare did well — be specific"],
  "revision_brief": "If needs_revision: precise, actionable instructions for Shakespeare. Empty string if approved.",
  "escalation_reason": "If escalate_to_human: why human judgment is needed. Empty string otherwise.",
  "approved_for_publish": true | false
}

SCORING (each 0-100):
cx_score:           Customer experience quality
credibility_score:  Credibility architecture quality  
composite_score:    (cx_score + credibility_score) / 2

VERDICT RULES:
• composite_score >= 75 AND no hard rejection criteria → "approved"
• composite_score 50-74 OR fixable issues → "needs_revision"  
• Factual hallucination present OR revision_count >= 2 → "escalate_to_human"
• approved_for_publish: true ONLY when verdict is "approved"
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

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(\`[Aristotle] Starting job \${job_id} for draft \${draft_id}\`);

    // ── STEP 1: Fetch draft with full framework and profile ───
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select(\`
        *,
        brand_frameworks (
          *,
          profiles (*)
        )
      \`)
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) {
      throw new Error(\`Draft fetch failed: \${draftError?.message}\`);
    }

    const framework = draft.brand_frameworks;
    const profile   = framework.profiles;
    const userId    = draft.user_id;

    // ── STEP 2: Check revision count ─────────────────────────
    const revisionCount = draft.revision_count ?? 0;

    if (revisionCount >= 2) {
      console.warn(\`[Aristotle] Draft \${draft_id} has hit revision limit (\${revisionCount}). Escalating to human.\`);

      await supabase
        .from('content_drafts')
        .update({
          status:           'escalated',
          editor_feedback:  \`Revision limit reached after \${revisionCount} cycles. Human review required.\`,
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
        escalation_reason: \`Draft failed Aristotle's quality gate after \${revisionCount} revision cycles\`,
      });

      return new Response(
        JSON.stringify({ success: true, verdict: 'escalate_to_human', draft_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── STEP 3: Build the evaluation prompt ──────────────────
    const userPrompt = \`
EXECUTIVE PROFILE:
Name: \${profile.full_name} | Role: \${profile.current_title} at \${profile.company}
Industry: \${profile.industry}
90-Day Brand Goal: \${profile.primary_goal ?? 'Establish thought leadership and visibility'}

BRAND FRAMEWORK:
Archetype: \${framework.archetype}
Voice Traits: \${JSON.stringify(framework.voice_traits)}
Target Audience: \${JSON.stringify(framework.target_audiences)}
Content Pillars: \${JSON.stringify(framework.content_pillars)}
Ghostwriting Rules: \${JSON.stringify(framework.ghostwriting_rules ?? [])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHAKESPEARE'S DRAFT FOR EVALUATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Post Body:
"""
\${draft.body_text}
"""

Shakespeare's Self-Assessment:
• Credibility Anchor Used: \${draft.credibility_anchor ?? 'Not provided'}
• Contrarian Tension: \${draft.contrarian_tension ?? 'Not provided'}
• Shakespeare's Own Credibility Score: \${draft.credibility_score ?? 'Not scored'}

Strategic Rationale (Shakespeare's justification):
• Why Now: \${draft.strategic_rationale?.why_now ?? 'Not provided'}
• Pillar Alignment: \${draft.strategic_rationale?.pillar_alignment ?? 'Not provided'}
• Goal Alignment: \${draft.strategic_rationale?.goal_alignment ?? 'Not provided'}

Revision History: This draft has been revised \${revisionCount} time(s).
\${revisionCount > 0 ? \`Previous Aristotle Feedback: \${draft.editor_feedback ?? 'Not recorded'}\` : 'First submission.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your task: Evaluate this draft on both Customer Experience and Credibility.
Be a rigorous advocate for the executive's reputation — not a soft approver.
If you find issues, give Shakespeare a precise brief to fix them.
If Shakespeare's credibility anchor is vague or generic, reject on that basis alone.
    \`.trim();

    // ── STEP 4: Call Claude Sonnet ────────────────────────────
    console.log(\`[Aristotle] Requesting Claude Sonnet evaluation...\`);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          anthropicKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     ARISTOTLE_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      throw new Error(\`Anthropic Error: \${await anthropicResponse.text()}\`);
    }

    const anthropicData  = await anthropicResponse.json();
    const rawOutput      = anthropicData.content[0].text;
    const evaluation     = JSON.parse(rawOutput);

    console.log(\`[Aristotle] Verdict: \${evaluation.verdict} | CX: \${evaluation.cx_score} | Credibility: \${evaluation.credibility_score} | Composite: \${evaluation.composite_score}\`);

    // ── STEP 5: Map verdict to draft status ──────────────────
    const statusMap: Record<string, string> = {
      'approved':           'approved',
      'needs_revision':     'needs_revision',
      'escalate_to_human':  'escalated',
    };
    const newStatus = statusMap[evaluation.verdict] ?? 'needs_revision';

    // ── STEP 6: Update the draft ──────────────────────────────
    await supabase
      .from('content_drafts')
      .update({
        status:              newStatus,
        editor_feedback:     evaluation.revision_brief || evaluation.cx_assessment,
        aristotle_cx_score:  evaluation.cx_score,
        aristotle_credibility_score: evaluation.credibility_score,
        aristotle_composite_score:   evaluation.composite_score,
        aristotle_evaluation: evaluation,          // full JSONB evaluation
        approved_for_publish: evaluation.approved_for_publish,
      })
      .eq('id', draft_id);

    // ── STEP 7: Audit log ─────────────────────────────────────
    await supabase.from('agent_audit_logs').insert({
      user_id:           userId,
      agent_role:        'agent-aristotle',
      event_type:        \`draft_\${newStatus}\`,
      trigger_entity_id: draft_id,
      prompt_context:    { system: ARISTOTLE_SYSTEM_PROMPT, user: userPrompt },
      response_output:   rawOutput,
      credibility_score: evaluation.credibility_score,
    });

    // ── STEP 8: Route based on verdict ───────────────────────

    if (evaluation.verdict === 'approved') {
      await supabase.from('agent_jobs').insert({
        user_id:  userId,
        job_type: 'schedule_post',
        payload:  { draft_id: draft_id },
      });

      console.log(\`[Aristotle] Draft \${draft_id} APPROVED (composite: \${evaluation.composite_score}) — routed to Social Manager\`);

    } else if (evaluation.verdict === 'needs_revision') {
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

      console.log(\`[Aristotle] Draft \${draft_id} NEEDS REVISION (cycle \${revisionCount + 1}/2) — routed back to Shakespeare\`);

    } else {
      await supabase.from('approvals').insert({
        draft_id:          draft_id,
        status:            'needs_human_review',
        due_at:            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        escalation_reason: evaluation.escalation_reason,
        sla_breached:      false,
      });

      console.log(\`[Aristotle] Draft \${draft_id} ESCALATED to human EA — \${evaluation.escalation_reason}\`);
    }

    return new Response(
      JSON.stringify({
        success:           true,
        verdict:           evaluation.verdict,
        cx_score:          evaluation.cx_score,
        credibility_score: evaluation.credibility_score,
        composite_score:   evaluation.composite_score,
        revision_brief:    evaluation.revision_brief,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(\`[Aristotle] Fatal error:\`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
