// supabase/functions/generate-brief/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/generate-brief
// No body required — reads everything from the user's profile.
//
// Returns: { brief: { executive_summary, brand_archetype, ... } }
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing Authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (!profile) throw new Error('Profile not found')

    const prompt = `You are an elite brand strategist specialising in executive personal branding.
Based on the executive profile below, generate a comprehensive Brand Brief.

EXECUTIVE PROFILE:
Name: ${profile.full_name}
Title: ${profile.current_title} at ${profile.company}
Industry: ${profile.industry}
Location: ${profile.location || 'Not specified'}
Career arc: ${profile.career_summary || 'Not provided'}
Biggest win: ${profile.biggest_win || 'Not provided'}
Pivot moment: ${profile.pivot_moment || 'Not provided'}
Current focus: ${profile.current_focus || 'Not provided'}
Primary goals: ${(profile.primary_goal || []).join(', ')}
Dream outcome: ${profile.dream_outcome || 'Not provided'}
Target audience: ${profile.target_audience || 'Not provided'}
Geographic scope: ${profile.geographic_scope || 'Global'}
Three words: ${profile.three_words || 'Not provided'}
Communication style: ${(profile.communication_style || []).join(', ')}
Never sound like: ${profile.never_sound_like || 'Not provided'}
Topics owned: ${profile.topics_owned || 'Not provided'}
Strong opinions: ${profile.strong_opinions || 'Not provided'}
Differentiator: ${profile.differentiator || 'Not provided'}
Brand gaps: ${(profile.brand_gaps || []).join(', ')}
Success in 30 days: ${profile.success_in_30 || 'Not provided'}
Success in 90 days: ${profile.success_in_90 || 'Not provided'}

Return ONLY valid JSON with no other text:
{
  "executive_summary": "2-3 sentence overview of this executive's brand opportunity",
  "brand_archetype": "The primary archetype (e.g. The Sage, The Rebel, The Hero) with 2-sentence explanation",
  "positioning_statement": "A Category of One positioning statement: '[Name] is the only [role/person] who [unique attribute] for [audience] who want [outcome]'",
  "audience_map": "Tier 1 (decision makers): [description]. Tier 2 (influencers): [description]. Tier 3 (followers): [description]",
  "voice_signature": "Voice formula: [adjective] + [adjective] + [adjective]. Then 2-3 sentences defining how they should sound.",
  "content_themes": "5 content themes to own, each as: Theme Name: one sentence description",
  "priority_actions": "Ordered list of 5 immediate actions to take in the next 30 days",
  "recommended_phase": "Which Elevox phase to start with and why (Phase 01-06)"
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const raw = data.content[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const brief = JSON.parse(clean)

    // Save to database
    const { data: savedBrief } = await supabase
      .from('brand_briefs')
      .insert({ user_id: user.id, ...brief })
      .select().single()

    return new Response(
      JSON.stringify({ brief: savedBrief || brief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
