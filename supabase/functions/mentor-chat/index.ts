// supabase/functions/mentor-chat/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/mentor-chat
//
// Body: {
//   session_prompt: string,   // the component-specific system prompt
//   history: [{role, content}], // prior conversation (last ~10 msgs)
//   message: string           // the user's latest message
// }
//
// Returns: { reply: string }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    // ── 2. Load profile for personalisation ───────────────
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    // ── 3. Parse request ───────────────────────────────────
    const { session_prompt, history = [], message } = await req.json()
    if (!session_prompt) throw new Error('session_prompt is required')
    if (!message) throw new Error('message is required')

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

    // ── 5. Build messages array for Anthropic ─────────────
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

    // ── 6. Call Anthropic ──────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 600,
        system:     systemPrompt,
        messages,
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const anthropicData = await anthropicRes.json()
    const reply = anthropicData.content[0]?.text?.trim() || 'I am thinking through your response...'

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
