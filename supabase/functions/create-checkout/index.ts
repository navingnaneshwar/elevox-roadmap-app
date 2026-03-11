// supabase/functions/create-checkout/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/create-checkout
// Body: { plan: 'starter' | 'authority' | 'legacy' }
// Returns: { url: string } — Stripe Checkout session URL
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe         = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Map plan IDs to Stripe price IDs ─────────────────────────
// TODO: Replace these with real price IDs from your Stripe dashboard
const PRICE_MAP: Record<string, string> = {
  starter:   Deno.env.get('STRIPE_PRICE_STARTER')   || 'price_starter_placeholder',
  authority: Deno.env.get('STRIPE_PRICE_AUTHORITY')  || 'price_authority_placeholder',
  legacy:    Deno.env.get('STRIPE_PRICE_LEGACY')     || 'price_legacy_placeholder',
}

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

    const { plan } = await req.json()
    const priceId = PRICE_MAP[plan]
    if (!priceId) throw new Error(`Unknown plan: ${plan}`)

    // Get or create Stripe customer
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, email, full_name').eq('id', user.id).single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name:  profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer:           customerId,
      mode:               'subscription',
      line_items:         [{ price: priceId, quantity: 1 }],
      success_url:        `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?upgraded=true`,
      cancel_url:         `${req.headers.get('origin') || 'http://localhost:5173'}/upgrade`,
      metadata:           { user_id: user.id, plan },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
