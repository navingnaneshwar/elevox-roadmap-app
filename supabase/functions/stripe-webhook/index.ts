// supabase/functions/stripe-webhook/index.ts
// ─────────────────────────────────────────────────────────────
// POST /functions/v1/stripe-webhook
// Called by Stripe — DO NOT add to your app's fetch calls.
// Register this URL in Stripe Dashboard → Webhooks.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe           = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const webhookSecret    = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLAN_FROM_PRICE: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_STARTER')   || '']:   'starter',
  [Deno.env.get('STRIPE_PRICE_AUTHORITY') || '']:   'authority',
  [Deno.env.get('STRIPE_PRICE_LEGACY')    || '']:   'legacy',
}

serve(async (req) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

  async function updateProfile(customerId: string, fields: Record<string, unknown>) {
    await supabase
      .from('profiles')
      .update(fields)
      .eq('stripe_customer_id', customerId)
  }

  switch (event.type) {

    // ── Successful checkout → activate subscription ───────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = sub.items.data[0]?.price.id || ''
      const plan    = PLAN_FROM_PRICE[priceId] || 'starter'

      await updateProfile(session.customer as string, {
        plan,
        plan_status:             'active',
        stripe_subscription_id:  session.subscription,
      })
      console.log(`✓ checkout.session.completed — plan: ${plan}`)
      break
    }

    // ── Subscription updated (upgrade/downgrade) ──────────
    case 'customer.subscription.updated': {
      const sub     = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id || ''
      const plan    = PLAN_FROM_PRICE[priceId] || 'starter'

      await updateProfile(sub.customer as string, {
        plan,
        plan_status: sub.status === 'active' ? 'active' : sub.status,
      })
      console.log(`✓ subscription.updated — plan: ${plan}, status: ${sub.status}`)
      break
    }

    // ── Subscription cancelled ────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateProfile(sub.customer as string, {
        plan_status:            'cancelled',
        stripe_subscription_id: null,
      })
      console.log('✓ subscription.deleted')
      break
    }

    // ── Payment failed ────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await updateProfile(invoice.customer as string, { plan_status: 'past_due' })
      // TODO: trigger Resend email — "Your payment failed, please update your card"
      console.log('✓ invoice.payment_failed')
      break
    }

    // ── Payment succeeded (incl. renewals) ───────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      await updateProfile(invoice.customer as string, { plan_status: 'active' })
      // TODO: trigger Resend receipt email
      console.log('✓ invoice.payment_succeeded')
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
