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
const TAVILY_API_KEY    = Deno.env.get('TAVILY_API_KEY')

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
      .select('*')
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
EXECUTIVE BACKGROUND DOSSIER (Internal use only):
---
# Identity & Role
- Name: ${profile.full_name || 'Executive'}
- Title: ${profile.current_title || 'CxO'}
- Company/Size: ${profile.company || ''} (${profile.company_size || ''})
- Industry: ${profile.industry || ''}
- Location: ${profile.location || ''}
- LinkedIn: ${profile.linkedin_url || ''}

# Career & Background
- Career Summary: ${profile.career_summary || ''}
- Biggest Win/Achievement: ${profile.biggest_win || ''}
- Pivot Moment: ${profile.pivot_moment || ''}
- Unusual Background: ${profile.unusual_background || ''}
- Current Focus: ${profile.current_focus || ''}

# Goals & Audience
- Primary Goal: ${(profile.primary_goal || []).join(', ') || ''}
- Dream Outcome: ${profile.dream_outcome || ''}
- Target Audience: ${profile.target_audience || ''}
- Key People to Influence: ${profile.key_people || ''}
- Geographic Scope: ${profile.geographic_scope || ''}
- Timeline: ${profile.timeline || ''}

# Voice & Communication
- Three Words: ${profile.three_words || ''}
- Communication Style: ${profile.communication_style || ''}
- Never Sound Like: ${profile.never_sound_like || ''}
- Humor Level: ${profile.humor_level || ''}
- Opinion Strength: ${profile.opinion_strength || ''}

# Content & Expertise
- Topics Owned: ${profile.topics_owned || ''}
- Topics Aspire to Own: ${profile.topics_aspire || ''}
- Strong Opinions/Contrarian Views: ${profile.strong_opinions || ''}
- Industry Trends: ${profile.industry_trends || ''}
- Secret Weapon/Unfair Advantage: ${profile.secret_weapon || ''}
- Content Taboos: ${profile.content_taboos || ''}

# Positioning
- Peer CxOs (Comparisons): ${profile.peer_cxos || ''}
- Differentiator: ${profile.differentiator || ''}
- Current Reputation: ${profile.reputation_now || ''}
- Brand Gaps: ${profile.brand_gaps || ''}

# Constraints & Logistics
- Success in 30 Days looks like: ${profile.success_in_30 || ''}
- Success in 90 Days looks like: ${profile.success_in_90 || ''}
- Dealbreakers: ${profile.dealbreakers || ''}
- Available Weekly Time: ${profile.weekly_time || ''}
---
` : ''

    const systemPrompt = `${session_prompt}

${profileContext}

ELEVOX MULTI-AGENT ARCHITECTURE (Your Context):
You are part of a 6-Agent AI ecosystem designed to fully manage an executive's brand.
1. Vox (YOU) - The Intake Strategist. You chat with the executive to build their overarching 6-Phase macro-strategy.
2. The Back-End Strategist - Silently builds the final Brand Framework JSON from your notes.
3. The Industry Analyst - Scours the web daily for relevant news.
4. The Ghostwriter - Does the actual manual labor of typing out LinkedIn posts.
5. The Editor-In-Chief - Approves or Rejects the Ghostwriter's drafts for compliance before the user sees them.

YOUR EXCLUSIVE MISSION:
You are a pure, high-level Macro-Strategist. Your only job is to interview the executive, challenge their core assumptions, define their positioning, and build the High-Level Roadmap. You are mapping the blueprint; you are NOT swinging the hammer.

AGENCY PARTNER RULES:
1. ZERO REDUNDANCY: Never ask the user to provide information that is already answered in their dossier. 
2. BE A MACRO-STRATEGIST, NOT A TACTICIAN. You must focus on the end-goal: building an end-to-end roadmap (Audience Matrix, Positioning, Content Pillars). Do NOT get bogged down asking for specific "articles" or "tactics". Focus on the "Why" and "Who", not the "What".
3. CRITICAL EVALUATION LENS. Actively assume the mindset of a critical hiring manager or board member. Point out gaps and logical fallacies in their positioning.
4. DELEGATE EXECUTION. If the user pivots to discussing tactical execution (e.g. "let's write a post" or "can you review this line?"), politely but firmly redirect them. Explain that your role is to finalize the Roadmap, and that the "Ghostwriter and Editor-In-Chief Agents will automatically handle all copywriting in the background."
5. DEEP DIVE WITH WEB SEARCH. Use your 'search_web' tool to gather live context on their brand to provide harsh, actionable feedback.
6. PRESTIGE TONE. Keep responses concise, punchy, and highly authoritative. You are Vox, a premium Senior Executive Brand Strategist advising Fortune 500 CXOs.
7. MICRO-LEARNING FORMAT. Keep responses EXTREMELY short. Limit to 2 or 3 sentences maximum per message. Derive the macro-strategy conversationally, one small point at a time.`

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

    // ── 6. Call OpenAI with Tools ──────────────────────────
    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Actively search the web for the user\'s current digital footprint, press mentions, company news, or LinkedIn profile to gather live outside context.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query, e.g. "John Doe CEO digital footprint" or "Jane Meyer LinkedIn"' }
            },
            required: ['query']
          }
        }
      }
    ]

    async function callOpenAI(msgs: any[]) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 800,
          messages: [{ role: 'system', content: systemPrompt }, ...msgs],
          tools,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        const isBillingError =
          res.status === 429 || res.status === 402 ||
          errText.includes('quota') || errText.includes('insufficient_quota') ||
          errText.includes('exceeded') || errText.includes('billing')
        if (isBillingError) throw new Error('BILLING_ERROR')
        throw new Error(`OpenAI error: ${errText}`)
      }
      return await res.json()
    }

    let anthropicData
    try {
      anthropicData = await callOpenAI(messages)
    } catch (e: any) {
      if (e.message === 'BILLING_ERROR') {
        return new Response(
          JSON.stringify({ error: 'billing', reply: null }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw e
    }

    let responseMessage = anthropicData.choices[0]?.message

    // ── 7. Handle Tool Calls (Agentic Loop) ────────────────
    if (responseMessage?.tool_calls) {
      messages.push(responseMessage) // Append Assistant's tool_call request

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'search_web') {
          const args = JSON.parse(toolCall.function.arguments)
          let toolResponse = "No results found."
          
          if (TAVILY_API_KEY) {
            try {
              const tavilyRes = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  api_key: TAVILY_API_KEY,
                  query: args.query,
                  search_depth: 'basic',
                  include_answer: true,
                })
              })
              const tavilyData = await tavilyRes.json()
              toolResponse = JSON.stringify({
                answer: tavilyData.answer,
                results: tavilyData.results?.slice(0, 3) || []
              })
            } catch (err) {
              toolResponse = "Web search failed. Proceed without live data."
            }
          } else {
             toolResponse = "TAVILY_API_KEY is not configured in Supabase Secrets. Please rely on user input."
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResponse
          })
        }
      }

      // Call OpenAI again with the tool results
      anthropicData = await callOpenAI(messages)
      responseMessage = anthropicData.choices[0]?.message
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reply = responseMessage?.content?.trim() || 'I am thinking through your response...'

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
