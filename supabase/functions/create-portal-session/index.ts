// supabase/functions/create-portal-session/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/create-portal-session
// Returns: { url: string } — Stripe Customer Portal URL
// User can manage / cancel / update payment method from there.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe           = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing auth')

    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      throw new Error('No Stripe customer found. Please subscribe to a plan first.')
    }

    const origin = req.headers.get('origin') || 'http://localhost:5173'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
