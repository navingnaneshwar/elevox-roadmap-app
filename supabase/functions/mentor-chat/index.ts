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

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
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
    const { session_prompt, history = [], message, phase_id, continuation_flag } = body
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
      // ⚠️ BETA: Default to 'authority' — mirrors completeOnboarding() override.
      // TODO: Revert to 'starter' before commercial launch.
      const allowed = PLAN_PHASE_ACCESS[profile.plan ?? 'authority'] ?? [1, 2, 3, 4]
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

# Brand Voice & Persona
- Three Words to Describe Them: ${profile.three_words || ''}
- Communication Style: ${profile.communication_style || ''}
- Never Sound Like: ${profile.never_sound_like || ''}
- Humor Level: ${profile.humor_level || ''}
- Opinion Strength: ${profile.opinion_strength || ''}

# Topics & Expertise
- Core Topics Owned: ${profile.topics_owned || ''}
- Topics they Aspire to Own: ${profile.topics_aspire || ''}
- Strong/Contrarian Opinions: ${profile.strong_opinions || ''}
- Industry Trends they follow: ${profile.industry_trends || ''}
- Secret Weapon / Unique Advantage: ${profile.secret_weapon || ''}
- Content Taboos (What they won't discuss): ${profile.content_taboos || ''}

# Preferences & Workflow
- Upcoming Events: ${profile.upcoming_events || ''}
- Available Weekly Time: ${profile.weekly_time || ''}
- Output Format Preference: ${profile.content_formats || ''}
- Ghostwriting Comfort Level: ${profile.ghostwriting_comfort || ''}

# Brand Gaps & Market
- Differentiator: ${profile.differentiator || ''}
- Current Reputation: ${profile.reputation_now || ''}
- Known Brand Gaps: ${profile.brand_gaps || ''}

# Constraints
- Success in 30 Days: ${profile.success_in_30 || ''}
- Success in 90 Days: ${profile.success_in_90 || ''}
- Dealbreakers: ${profile.dealbreakers || ''}
---
` : ''

    let systemPrompt = `${session_prompt}

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
7. MICRO-LEARNING FORMAT. Keep responses EXTREMELY short. Limit to 2 or 3 sentences maximum per message. Derive the macro-strategy conversationally, one small point at a time.
8. CLOSING THE SESSION (THE HANDOFF): When you have gathered enough strategic context and the user agrees with the direction, YOU MUST EXPLICITLY INITIATE THE HANDOFF. Do NOT say "Good luck" or "Start posting". Instead, you must explain that you are transferring their dossier to the backend Agent Strategist to compile their official Brand Blueprint. Tell them to hang tight while the Ghostwriter and Editor-in-Chief begin drafting their first batch of aligned content, which will appear in their Content Dashboard soon.
9. NO CHATGPT CLICHÉS: Never use generic affirmations like "Fantastic!", "Great!", "That makes sense", or "I understand". Be stoic, professional, and slightly intimidating. NEVER EVER use bulleted markdown lists, bolded headers, or long paragraph dumps. Your responses MUST look like pure, unformatted conversational text messages from a busy executive.`

    if (continuation_flag) {
      systemPrompt = `You are Vox, the Executive Brand Strategist. The user is returning to a previously COMPLETED session to make adjustments.
      
CRITICAL INSTRUCTION FOR THIS TURN ONLY:
You must strictly read the chat history, output a concise 3-bullet summary of everything decided in this session so far, and warmly ask the user what they would like to change or explore further today. Do NOT execute your standard role prompt until the user replies to your summary.
`
    }

    // ── 5. Build messages array for Anthropic ─────────────
    // '__start__' is a special internal signal — no real user message yet,
    // just ask the AI to open the session with its first question.
    const isOpener = message === '__start__'
    const userContent = isOpener
      ? 'Please introduce this coaching session and ask your first question.'
      : message

    // ── 5b. Natural conclusion guidance ───────────────────
    // No hard turn limit. Vox concludes when it has genuine strategic clarity,
    // not after a fixed message count.
    const userTurnCount = history.filter((m: {role: string}) => m.role === 'user').length

    if (!isOpener && !continuation_flag) {
      systemPrompt += `

CONCLUSION GUIDANCE (read every turn, act only when the conversation is genuinely ready):
Your goal is strategic clarity on four things:
  1. The executive's positioning / Category of One
  2. Primary audience and the key decision-makers they need to influence
  3. Voice signature and content pillars they own
  4. Recommended starting phase of the coaching journey

When you have clear, specific answers to all four AND the executive has agreed — THEN:
- Summarise the 3-4 key decisions in 2-3 plain conversational sentences (no lists, no headers).
- Ask ONE closing validation question: "Does this capture your direction accurately?"
- Once they confirm, initiate the Chanakya handoff and append [STAGE_COMPLETE] at the very end of that message. Do NOT append [STAGE_COMPLETE] before their explicit confirmation.

You have had ${userTurnCount} exchanges so far. If you still lack clarity on any of the four areas, continue probing — but ask only ONE focused question per turn. Stay concise. Do NOT restart the conversation or loop back to earlier questions.`
    }

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


    // ── 6. Call Anthropic with Tools ───────────────────────
    const tools = [
      {
        name: 'search_web',
        description: "Actively search the web for the user's current digital footprint, press mentions, company news, or LinkedIn profile to gather live outside context.",
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query, e.g. "John Doe CEO digital footprint" or "Jane Meyer LinkedIn"' }
          },
          required: ['query']
        }
      }
    ]

    // ── 6. Anthropic helpers ───────────────────────────────
    async function callAnthropic(msgs: any[], withTools = true) {
      const body: any = {
        model:      'claude-sonnet-4-5',
        max_tokens: 800,
        system:     systemPrompt,
        messages:   msgs,
      }
      if (withTools) body.tools = tools

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        const isBillingError =
          res.status === 429 || res.status === 402 ||
          errText.includes('quota') || errText.includes('credit') ||
          errText.includes('exceeded') || errText.includes('billing')
        if (isBillingError) throw new Error('BILLING_ERROR')
        const isOverloaded = errText.includes('overloaded_error') || errText.includes('Overloaded')
        if (isOverloaded) throw new Error('OVERLOADED_ERROR')
        throw new Error(`Anthropic error: ${errText}`)
      }
      return await res.json()
    }

    const useTools = !isOpener
    let anthropicData
    try {
      anthropicData = await callAnthropic(messages, useTools)
    } catch (e: any) {
      if (e.message === 'BILLING_ERROR') {
        return new Response(
          JSON.stringify({ error: 'billing', reply: null }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (e.message === 'OVERLOADED_ERROR') {
        // Retry once after 2s before giving up
        await new Promise(r => setTimeout(r, 2000))
        try {
          anthropicData = await callAnthropic(messages)
        } catch (retryErr: any) {
          return new Response(
            JSON.stringify({ error: 'overloaded', reply: null }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        throw e
      }
    }

    // ── 7. Agentic Tool Loop ───────────────────────────────
    // One round only: Anthropic decides to search → Tavily runs → Anthropic
    // generates the final reply WITHOUT tools so it can't chain more searches.
    // 5 rounds × (Tavily + Anthropic) = potential 150s+ platform timeout.
    const MAX_TOOL_ROUNDS = 1
    let toolRound = 0

    while (toolRound < MAX_TOOL_ROUNDS) {
      const toolUseBlocks = anthropicData.content?.filter((b: any) => b.type === 'tool_use') ?? []
      if (toolUseBlocks.length === 0) break

      toolRound++
      messages.push({ role: 'assistant', content: anthropicData.content })

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolBlock: any) => {
          let toolResponse = 'No results found.'
          if (toolBlock.name === 'search_web') {
            if (TAVILY_API_KEY) {
              try {
                const tavilyController = new AbortController()
                const tavilyTimeout = setTimeout(() => tavilyController.abort(), 8000)
                const tavilyRes = await fetch('https://api.tavily.com/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    api_key: TAVILY_API_KEY,
                    query: toolBlock.input.query,
                    search_depth: 'basic',
                    include_answer: true,
                  }),
                  signal: tavilyController.signal,
                }).finally(() => clearTimeout(tavilyTimeout))
                const tavilyData = await tavilyRes.json()
                toolResponse = JSON.stringify({
                  answer: tavilyData.answer,
                  results: tavilyData.results?.slice(0, 3) || []
                })
              } catch (err: any) {
                const errMsg = err.name === 'AbortError' ? 'TIMEOUT_8s' : err.message
                toolResponse = `Web search failed (${errMsg}). Proceed without live data.`
              }
            } else {
              toolResponse = 'TAVILY_API_KEY is not configured.'
            }
          }
          return { type: 'tool_result', tool_use_id: toolBlock.id, content: toolResponse }
        })
      )

      messages.push({ role: 'user', content: toolResults })
      // ↓ withTools=false — after search results Anthropic must reply immediately
      anthropicData = await callAnthropic(messages, false)
    }


    const textBlock = anthropicData.content?.find((b: any) => b.type === 'text')
    let replyText = textBlock?.text?.trim() || 'I am thinking through your response...'
    let auto_complete = false
    
    // Check for the hidden auto-advancement token
    if (replyText.includes('[STAGE_COMPLETE]')) {
      auto_complete = true
      replyText = replyText.replace(/\[STAGE_COMPLETE\]/gi, '').trim()
    }

    return new Response(
      JSON.stringify({ reply: replyText, auto_complete }),
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
