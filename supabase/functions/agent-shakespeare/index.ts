import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


// ─────────────────────────────────────────────────────────────
// USER EDITS — Apply all user corrections to the framework
// before constructing any prompt. Shared pattern across all agents.
// ─────────────────────────────────────────────────────────────

async function applyUserEdits(supabase: any, framework: any): Promise<any> {
  const { data: edits } = await supabase
    .from('user_edits')
    .select('*')
    .eq('entity_id', framework.id)
    .eq('entity_type', 'framework')
    .order('created_at', { ascending: true });

  if (!edits || edits.length === 0) return framework;

  let patched = { ...framework };
  for (const edit of edits) {
    patched[edit.field_path] = edit.edited_value;
  }

  patched.user_edits_summary = edits
    .map((e: any) =>
      `• ${e.field_path} changed to: ${JSON.stringify(e.edited_value)}` +
      `${e.edit_note ? ` (reason: ${e.edit_note})` : ''}`
    )
    .join('\n');

  return patched;
}


// ─────────────────────────────────────────────────────────────
// SHAKESPEARE SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────

const SHAKESPEARE_SYSTEM_PROMPT = `
You are Shakespeare — the elite executive ghostwriter for high-ticket CXOs.

You do not write content. You write credibility.

Every post you produce must do three things simultaneously:
1. Position the executive as the sharpest mind in their space
2. Anchor that positioning in something only THEY could know or have experienced
3. Challenge the conventional wisdom in their industry — not to be provocative, but because leaders have earned the right to a stronger view

CRAFT RULES — NON-NEGOTIABLE:
• NO AI SPEAK: Never use: delve, tapestry, crucial, multifaceted, testament, 
  navigating, landscape, foster, leverage, synergy, game-changer, paradigm
• Hook first: The opening line must create immediate pattern interrupt. 
  A reader scrolling at speed must stop.
• Paragraphs: 1-2 sentences maximum. Generous line breaks. White space is credibility.
• Voice: First person ("I"). Confident. Slightly contrarian where the archetype allows.
  Never hedging. Never passive.
• Length: 150-250 words for LinkedIn unless the ghostwriting_rules specify otherwise.
• OBEY: You must strictly follow all Ghostwriting Rules from Chanakya's framework.

CREDIBILITY ANCHORS — MANDATORY:
Every post must contain at least one specific reference drawn from the executive's 
actual career — a decision they made, a company they scaled, a failure they learned from,
a result they achieved. Fabricating details is strictly prohibited. If no anchor is 
available in the profile data, flag this in your strategic_rationale.

CONTRARIAN TENSION — MANDATORY:
Every post must identify the mainstream consensus on its topic and explicitly 
take a more refined, more experienced, or more challenging position.
The executive's archetype determines how hard this tension is pushed.

OUTPUT FORMAT:
You must return ONLY valid JSON matching this exact structure — no markdown, no commentary:

{
  "post_body": "The full LinkedIn post exactly as it will be copy-pasted. No markdown blocks.",
  "hook_line": "The exact first line of the post",
  "platform": "LinkedIn",
  "word_count": 0,
  "credibility_anchor": "One sentence describing the specific career fact used to anchor credibility",
  "contrarian_tension": "One sentence naming the conventional wisdom this post challenges",
  "strategic_rationale": {
    "why_now": "Why this topic is strategically timed — tied to news, industry moment, or the 90-day plan",
    "pillar_alignment": "Which content pillar this serves and exactly how",
    "goal_alignment": "How this post moves the executive closer to their stated 90-day brand goal",
    "self_credibility_score": 0,
    "self_credibility_score_reasoning": "Why this score was given — what makes this post credible or where it falls short"
  }
}

CREDIBILITY SCORE RUBRIC (0-100):
90-100: Post contains a unique personal insight + specific career anchor + 
        clear contrarian position. Could not have been written by anyone else.
70-89:  Post has a strong perspective and one credibility anchor but the 
        contrarian position is mild.
50-69:  Post is competent thought leadership but reads like it could apply 
        to any executive in the space.
Below 50: Post is generic. Do not submit below 50 — revise internally first.
`;


// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

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
    const { job_id, framework_id, briefing_id, calendar_event_id } = await req.json();

    if (!job_id || !framework_id) {
      throw new Error('Missing job_id or framework_id in payload');
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Shakespeare] Starting job ${job_id} for framework ${framework_id}`);


    // ── STEP 1: Fetch framework and apply all user edits ──────
    const { data: rawFramework, error: fwError } = await supabase
      .from('brand_frameworks')
      .select('*, profiles(*)')
      .eq('id', framework_id)
      .single();

    if (fwError || !rawFramework) {
      throw new Error(`Framework fetch failed: ${fwError?.message}`);
    }

    const framework = await applyUserEdits(supabase, rawFramework);
    const profile   = framework.profiles;
    const userId    = framework.user_id;


    // ── STEP 2: Fetch briefing context (if available) ─────────
    let briefingContext = `
No specific news briefing provided. 
Write a timeless, evergreen thought-leadership post rooted entirely in the 
executive's Content Pillars, career experience, and 90-day brand goal.
Prioritise a credibility anchor from their career history.
    `.trim();

    if (briefing_id) {
      const { data: briefing, error: brError } = await supabase
        .from('industry_briefings')
        .select('*')
        .eq('id', briefing_id)
        .single();

      if (!brError && briefing) {
        briefingContext = `
TODAY'S LIVE INDUSTRY BRIEFING (from the Analyst):
News Links Identified: ${JSON.stringify(briefing.news_links)}
Analyst's Suggested Angles: ${JSON.stringify(briefing.suggested_angles)}

Instructions:
- Pick the single most compelling angle above
- Do NOT summarise the news — give the executive's sharp, experienced opinion on it
- The news is the hook. The executive's unique perspective is the value.
- Tie the angle back to one of their Content Pillars explicitly
        `.trim();
      }
    }


    // ── STEP 3: Fetch past post performance for style learning ─
    // Shakespeare reads the last 5 approved posts to learn what
    // has worked for this executive — vocabulary, structure, tone.
    // This is the memory layer that makes the voice improve over time.
    const { data: pastPosts } = await supabase
      .from('content_drafts')
      .select('body_text, hook_text, performance_score, editor_feedback')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5);

    const voiceMemory = pastPosts && pastPosts.length > 0
      ? `
VOICE MEMORY — APPROVED POSTS (study these for voice consistency):
${pastPosts.map((p: any, i: number) => `
Post ${i + 1}:
${p.body_text}
${p.performance_score ? `Performance score: ${p.performance_score}` : ''}
${p.editor_feedback ? `Editor feedback: ${p.editor_feedback}` : ''}
`).join('---\\n')}
Adapt your writing to match the vocabulary, rhythm, and structural patterns 
of these approved posts. The executive has already signed off on this voice.
      `.trim()
      : `No approved posts yet. Derive voice entirely from the archetype and ghostwriting_rules.`;


    // ── STEP 4: Fetch the executive's 90-day goal ─────────────
    const ninetyDayGoal = profile.primary_goal ??
      framework.mentor_insights?.find((i: any) => i.priority === 'high')?.action ??
      'Establish thought leadership and visibility in their industry';

    // S5-09: Build verified anchors context (hallucination prevention)
    const verifiedAnchors = (framework.verified_career_anchors as any[] ?? []);
    const anchorsContext = verifiedAnchors.length > 0
      ? `VERIFIED CAREER ANCHORS (from Chanakya — ONLY source of statistics you may use):
${verifiedAnchors.map((a: any, i: number) => `${i + 1}. ${a.fact} [source: ${a.source}]`).join('\n')}

⚠️ HALLUCINATION RULE: You are ONLY permitted to reference facts and statistics from the list above.
If a specific number, outcome, or achievement is not listed here, you MUST NOT invent it.
If you cannot write the post with the available anchors, say so in self_credibility_score_reasoning.`
      : `CAREER CREDIBILITY ANCHORS (draw from these for the post):
${profile.career_highlights ?? profile.differentiator ?? profile.credibility_inventory ?? 'Use career history from the profile to identify specific, owned experiences.'}`;


    // ── STEP 5: Build the full prompt ─────────────────────────
    const userPrompt = `
EXECUTIVE DOSSIER:
Name: ${profile.full_name}
Current Role: ${profile.current_title} at ${profile.company}
Industry: ${profile.industry}
90-Day Brand Goal: ${ninetyDayGoal}

BRAND ARCHITECTURE (from Chanakya):
Archetype: ${framework.archetype}
Voice Traits: ${JSON.stringify(framework.voice_traits)}
Target Audience: ${JSON.stringify(framework.target_audiences)}
Content Pillars: ${JSON.stringify(framework.content_pillars)}
Active Platforms: ${JSON.stringify(framework.social_platforms ?? [])}
Content Calendar Cadence: ${JSON.stringify(framework.content_calendar_cadence ?? [])}
Strict Ghostwriting Rules: ${JSON.stringify(framework.ghostwriting_rules ?? [])}

${anchorsContext}

MENTOR INSIGHTS (strategic context from Chanakya):
${JSON.stringify(framework.mentor_insights ?? [])}

USER EDITS APPLIED TO THIS FRAMEWORK:
${framework.user_edits_summary ?? 'None recorded'}

${briefingContext}

${voiceMemory}

Now write the LinkedIn post. Return only the JSON structure defined in your system prompt.
Remember: self_credibility_score must be 50 or above. If you cannot reach 50, explain why 
in self_credibility_score_reasoning and flag what profile data is missing.
    `.trim();


    // ── STEP 6: Call Claude Sonnet ────────────────────────────
    console.log(`[Shakespeare] Requesting Claude Sonnet...`);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: SHAKESPEARE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errStr = await anthropicResponse.text();
      throw new Error(`Anthropic Error: ${errStr}`);
    }

    const anthropicData = await anthropicResponse.json();
    const rawOutput     = anthropicData.content[0].text;
    const cleaned       = rawOutput
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed        = JSON.parse(cleaned);


    // ── STEP 7: Credibility gate ──────────────────────────────
    // If Shakespeare self-scores below 50, reject and re-prompt once.
    // This enforces the quality floor before anything reaches the Editor.
    let finalParsed = parsed;

    if (parsed.strategic_rationale?.self_credibility_score < 50) {
      console.warn(`[Shakespeare] Draft scored ${parsed.strategic_rationale.self_credibility_score} — below threshold. Re-prompting once.`);

      const retryResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          system: SHAKESPEARE_SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: rawOutput },
            {
              role: 'user',
              content: `Your credibility score was ${parsed.strategic_rationale.self_credibility_score}. 
This is below the minimum threshold of 50. 

Reason you gave: ${parsed.strategic_rationale.self_credibility_score_reasoning}

Rewrite the post. This time:
1. Anchor it in a specific career moment or decision from the executive's history
2. Make the contrarian tension sharper and more specific
3. Ensure the hook creates genuine pattern interrupt

Return the same JSON structure with an improved draft.`,
            },
          ],
        }),
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        try {
          finalParsed = JSON.parse(retryData.content[0].text);
          console.log(`[Shakespeare] Retry scored ${finalParsed.strategic_rationale?.self_credibility_score}`);
        } catch {
          // If retry JSON parse fails, use original
          console.warn(`[Shakespeare] Retry parse failed — using original draft`);
        }
      }
    }


    // ── STEP 8: Save to content_drafts ───────────────────────
    const { data: draftRow, error: insertError } = await supabase
      .from('content_drafts')
      .insert({
        user_id:              userId,
        framework_id:         framework_id,
        briefing_id:          briefing_id ?? null,
        calendar_event_id:    calendar_event_id ?? null,
        platform:             finalParsed.platform ?? 'LinkedIn',
        body_text:            finalParsed.post_body,
        hook_text:            finalParsed.hook_line,
        word_count:           finalParsed.word_count,
        credibility_anchor:   finalParsed.credibility_anchor,
        contrarian_tension:   finalParsed.contrarian_tension,
        strategic_rationale:  finalParsed.strategic_rationale,   // JSONB column
        self_credibility_score:    finalParsed.strategic_rationale?.self_credibility_score ?? null,
        status:               'draft',
        agent_version:        'shakespeare-v2',
      })
      .select()
      .single();

    if (insertError) throw insertError;


    // ── STEP 9: Audit log ─────────────────────────────────────
    await supabase.from('agent_audit_logs').insert({
      user_id:           userId,
      agent_role:        'agent-shakespeare',
      event_type:        'draft_generated',
      trigger_entity_id: draftRow.id,
      prompt_context:    { system: SHAKESPEARE_SYSTEM_PROMPT, user: userPrompt },
      response_output:   rawOutput,
      self_credibility_score: finalParsed.strategic_rationale?.self_credibility_score ?? null,
    });


    // ── STEP 10: Queue Editor ─────────────────────────────────
    await supabase.from('agent_jobs').insert({
      user_id:  userId,
      job_type: 'review_draft',
      payload:  { draft_id: draftRow.id },
    });

    console.log(`[Shakespeare] Draft ${draftRow.id} scored ${finalParsed.strategic_rationale?.self_credibility_score} — routed to Editor`);

    return new Response(
      JSON.stringify({ success: true, draft: draftRow }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(`[Shakespeare] Fatal error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
