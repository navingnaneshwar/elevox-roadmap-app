// supabase/functions/ghostwrite-post/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/ghostwrite-post
//
// Body: {
//   topic: string,          // what to write about
//   content_type: string,   // text | carousel | article | poll | etc
//   anchor_event_id?: string // optional — tie to an anchor event
// }
//
// Returns: {
//   drafts: [{ body, angle, word_count }]  // 3 variants
// }
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authenticate the caller ─────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    // ── 2. Fetch the user's full profile ───────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) throw new Error('Profile not found')

    // ── 3. Parse the request body ──────────────────────────
    const { topic, content_type = 'text', anchor_event_id } = await req.json()
    if (!topic) throw new Error('topic is required')

    // Optionally fetch the anchor event for extra context
    let anchorContext = ''
    if (anchor_event_id) {
      const { data: anchor } = await supabase
        .from('anchor_events')
        .select('*')
        .eq('id', anchor_event_id)
        .single()

      if (anchor) {
        anchorContext = `
ANCHOR EVENT CONTEXT:
Event: ${anchor.title} (${anchor.type})
Date: ${anchor.event_month} ${anchor.event_day}
Notes: ${anchor.notes || 'None'}
Target audience: ${anchor.audience || 'General'}
Goal for this content: ${anchor.goal || 'Unspecified'}
`
      }
    }

    // ── 4. Build the personalised system prompt ────────────
    const systemPrompt = `You are an elite executive ghostwriter specialising in LinkedIn thought leadership for senior business leaders.

YOUR CLIENT PROFILE:
Name: ${profile.full_name || 'the executive'}
Title: ${profile.current_title || 'Executive'}
Company: ${profile.company || 'their organisation'}
Industry: ${profile.industry || 'business'}
Location: ${profile.location || ''}

THEIR VOICE:
Three words that define them: ${profile.three_words || 'not specified'}
Communication style: ${(profile.communication_style || []).join(', ') || 'not specified'}
Humour level: ${profile.humor_level || 'professional'}
Opinion strength: ${profile.opinion_strength || 'balanced'}
They NEVER sound like: ${profile.never_sound_like || 'nothing specified'}

THEIR EXPERTISE:
Topics owned: ${profile.topics_owned || 'general business leadership'}
Strong opinions: ${profile.strong_opinions || 'not specified'}
Secret weapon: ${profile.secret_weapon || 'not specified'}

THEIR AUDIENCE:
${profile.target_audience || 'senior business professionals'}

GHOSTWRITING COMFORT:
${profile.ghostwriting_comfort || 'high — they trust the draft'}

CONTENT FORMAT: ${content_type}
${anchorContext}

WRITING RULES:
1. Write in FIRST PERSON as ${profile.full_name || 'the executive'}
2. Match their stated voice exactly — tone, rhythm, sentence structure
3. Do NOT use generic business phrases: "game-changing", "synergy", "leverage", "best practices", "move the needle"
4. Every post must have a strong hook in the first 1–2 lines (LinkedIn shows 2 lines before "see more")
5. For text posts: conversational, direct, paragraph breaks for readability
6. For carousels: concise slide headers + 1–2 supporting lines per slide
7. End with a natural invitation to engage — not a forced CTA

Generate 3 distinctly different draft variants for the topic given. Each should take a different ANGLE on the same topic.`

    const userPrompt = `Write 3 different LinkedIn ${content_type} posts about: "${topic}"

For each variant, use a completely different angle and hook. Return ONLY valid JSON in this exact format with no other text:
{
  "drafts": [
    {
      "angle": "Brief description of this angle (10 words max)",
      "body": "The full post body text",
      "word_count": 150
    },
    {
      "angle": "Brief description of this angle",
      "body": "The full post body text",
      "word_count": 200
    },
    {
      "angle": "Brief description of this angle",
      "body": "The full post body text",
      "word_count": 180
    }
  ]
}`

    // ── 5. Call Anthropic API ──────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const anthropicData = await anthropicRes.json()
    const rawText = anthropicData.content[0]?.text || ''

    // ── 6. Parse JSON from response ────────────────────────
    let drafts
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      drafts = JSON.parse(clean).drafts
    } catch {
      // Fallback: return raw as single draft
      drafts = [{ angle: 'AI draft', body: rawText, word_count: rawText.split(' ').length }]
    }

    // ── 7. Return response ─────────────────────────────────
    return new Response(JSON.stringify({ drafts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status:  400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
