// supabase/functions/mentor-chat/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/mentor-chat
//
// Body: {
//   session_prompt: string,   // the component-specific system prompt
//   history: [{role, content}], // prior conversation (last ~10 msgs)
//   message: string,          // the user's latest message
//   phase_id: number          // required for plan enforcement
// }
//
// Returns: { reply: string }
//
// Plan enforcement:
//   starter   → phases 1–2
//   authority → phases 1–4
//   legacy    → phases 1–6
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLAN_PHASE_ACCESS: Record<string, number[]> = {
  starter:   [1, 2],
  authority: [1, 2, 3, 4],
  legacy:    [1, 2, 3, 4, 5, 6],
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── 1. Authenticate ────────────────────────────────────
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing Authorization header')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    // ── 2. Parse request early to get phase_id ─────────────
    const body = await req.json()
    const { session_prompt, history = [], message, phase_id } = body
    if (!session_prompt) throw new Error('session_prompt is required')
    if (!message) throw new Error('message is required')

    // ── 3. Plan enforcement guard ──────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, plan_status, full_name, current_title, company, industry, primary_goal, location, three_words, topics_owned')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'profile_not_found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const blockedStatuses = ['canceled', 'past_due', 'unpaid', 'paused']
    if (profile.plan_status && blockedStatuses.includes(profile.plan_status)) {
      return new Response(
        JSON.stringify({ error: 'payment_required', current_status: profile.plan_status }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (phase_id !== undefined && phase_id !== null) {
      const phaseNum = parseInt(phase_id, 10)
      const allowed = PLAN_PHASE_ACCESS[profile.plan ?? 'starter'] ?? [1, 2]
      if (!allowed.includes(phaseNum)) {
        const required_plan = phaseNum <= 4 ? 'authority' : 'legacy'
        return new Response(
          JSON.stringify({
            error: 'plan_required',
            current_plan: profile.plan,
            required_plan,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ── 4. Build system prompt ─────────────────────────────
    const profileContext = profile ? `
EXECUTIVE PROFILE (use for personalisation):
- Name: ${profile.full_name || 'Executive'}
- Title: ${profile.current_title || 'CxO'}
- Company: ${profile.company || ''}
- Industry: ${profile.industry || ''}
- Primary goal: ${(profile.primary_goal || []).join(', ') || ''}
- Location: ${profile.location || ''}
- Three words: ${profile.three_words || ''}
- Topics owned: ${profile.topics_owned || ''}
` : ''

    const systemPrompt = `${session_prompt}

${profileContext}

IMPORTANT COACHING RULES:
- Ask only ONE question at a time. Never ask multiple questions in one message.
- Keep responses concise and punchy — max 3-4 short paragraphs.
- Give specific, actionable feedback on what they share.
- Use the executive's name and profile details to personalise your coaching.
- Build on what they've said in previous messages. Reference their specific answers.
- After they've answered, provide a brief insight/validation, then ask the next question.
- You are a senior executive brand strategist, not a generic chatbot. Sound authoritative.`

    // ── 5. Build messages array for OpenAI ────────────────
    // '__start__' is a special internal signal — no real user message yet,
    // just ask the AI to open the session with its first question.
    const isOpener = message === '__start__'
    const userContent = isOpener
      ? 'Please introduce this coaching session and ask your first question.'
      : message

    // history contains [{role: 'user'|'assistant', content: string}]
    // We keep the last 10 messages to stay within context limits
    const recentHistory = history.slice(-10).map((m: {role: string, content: string}) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))

    const messages = [
      ...recentHistory,
      { role: 'user', content: userContent },
    ]

    // ── 6. Call OpenAI ─────────────────────────────────────
    const anthropicRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'gpt-4o-mini',
        max_tokens: 800,
        messages:   [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      // Surface billing/quota errors as a friendly 402
      const isBillingError =
        anthropicRes.status === 429 ||
        anthropicRes.status === 402 ||
        errText.includes('quota') ||
        errText.includes('insufficient_quota') ||
        errText.includes('exceeded') ||
        errText.includes('billing') ||
        errText.includes('rate_limit')
      if (isBillingError) {
        return new Response(
          JSON.stringify({ error: 'billing', reply: null }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`OpenAI error: ${errText}`)
    }

    const anthropicData = await anthropicRes.json()
    const reply = anthropicData.choices[0]?.message?.content?.trim() || 'I am thinking through your response...'

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
