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

      // Send payment failed email via Resend
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (profile?.email) {
          const firstName = profile.full_name?.split(' ')[0] || 'there'
          const portalUrl = `https://billing.stripe.com/p/login/` // fallback — real portal URL comes from create-portal-session

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: Deno.env.get('EMAIL_FROM'),
              to: [profile.email],
              subject: 'Action required — your Elevox payment failed',
              html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#070B14;font-family:'Inter',Arial,sans-serif;">
                  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
                    <div style="margin-bottom:40px;">
                      <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#F1F5F9;">Elev<span style="color:#C8A96E;">OX</span></span>
                    </div>
                    <h1 style="color:#F1F5F9;font-size:24px;font-weight:700;margin:0 0 16px;">Payment failed, ${firstName}</h1>
                    <p style="color:#94A3B8;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      We weren't able to process your latest Elevox subscription payment. Your account has been moved to a grace period — please update your payment method to keep your access.
                    </p>
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:20px;margin-bottom:32px;">
                      <div style="color:#fca5a5;font-size:13px;font-weight:600;margin-bottom:4px;">Amount due</div>
                      <div style="color:#F1F5F9;font-size:24px;font-weight:700;">${((invoice.amount_due || 0) / 100).toFixed(2)} ${(invoice.currency || 'usd').toUpperCase()}</div>
                    </div>
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#C8A96E,#B8975A);border-radius:8px;color:#fff;font-weight:600;font-size:14px;text-decoration:none;margin-bottom:32px;">
                      Update payment method →
                    </a>
                    <p style="color:#475569;font-size:13px;line-height:1.6;border-top:1px solid #1E2A3E;padding-top:24px;">
                      If you need help, reply to this email or contact <a href="mailto:support@elevox.com" style="color:#C8A96E;">support@elevox.com</a>
                    </p>
                  </div>
                </body>
                </html>
              `,
            }),
          })
        }
      } catch (emailErr) {
        console.error('Failed to send payment failed email:', emailErr)
      }

      console.log('✓ invoice.payment_failed — email sent')
      break
    }

    // ── Payment succeeded (incl. renewals) ───────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      await updateProfile(invoice.customer as string, { plan_status: 'active' })

      // Send receipt email via Resend (skip $0 invoices — e.g. trial starts)
      if ((invoice.amount_paid || 0) > 0) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, plan')
            .eq('stripe_customer_id', invoice.customer as string)
            .single()

          if (profile?.email) {
            const firstName  = profile.full_name?.split(' ')[0] || 'there'
            const planLabel  = { starter: 'Foundation', authority: 'Authority', legacy: 'Legacy' }[profile.plan || 'starter'] || 'Elevox'
            const periodEnd  = invoice.period_end
              ? new Date(invoice.period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : 'next month'

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: Deno.env.get('EMAIL_FROM'),
                to: [profile.email],
                subject: `Payment confirmed — Elevox ${planLabel}`,
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                  <body style="margin:0;padding:0;background:#070B14;font-family:'Inter',Arial,sans-serif;">
                    <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
                      <div style="margin-bottom:40px;">
                        <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#F1F5F9;">Elev<span style="color:#C8A96E;">OX</span></span>
                      </div>
                      <h1 style="color:#F1F5F9;font-size:24px;font-weight:700;margin:0 0 8px;">Payment confirmed ✓</h1>
                      <p style="color:#94A3B8;font-size:15px;line-height:1.7;margin:0 0 32px;">Thanks ${firstName} — your ${planLabel} subscription has been renewed.</p>

                      <div style="background:rgba(13,18,32,0.8);border:1px solid #1E2A3E;border-radius:10px;padding:24px;margin-bottom:32px;">
                        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1E2A3E;">
                          <span style="color:#64748B;font-size:13px;">Plan</span>
                          <span style="color:#C8A96E;font-size:13px;font-weight:600;">Elevox ${planLabel}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1E2A3E;">
                          <span style="color:#64748B;font-size:13px;">Amount</span>
                          <span style="color:#F1F5F9;font-size:13px;font-weight:600;">${((invoice.amount_paid || 0) / 100).toFixed(2)} ${(invoice.currency || 'usd').toUpperCase()}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:10px 0;">
                          <span style="color:#64748B;font-size:13px;">Next renewal</span>
                          <span style="color:#F1F5F9;font-size:13px;">${periodEnd}</span>
                        </div>
                      </div>

                      <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://app'}.elevox.com/dashboard" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#C8A96E,#B8975A);border-radius:8px;color:#fff;font-weight:600;font-size:14px;text-decoration:none;margin-bottom:32px;">
                        Continue your sessions →
                      </a>

                      <p style="color:#475569;font-size:13px;line-height:1.6;border-top:1px solid #1E2A3E;padding-top:24px;">
                        Questions? Reply to this email or visit <a href="mailto:support@elevox.com" style="color:#C8A96E;">support@elevox.com</a>
                      </p>
                    </div>
                  </body>
                  </html>
                `,
              }),
            })
          }
        } catch (emailErr) {
          console.error('Failed to send receipt email:', emailErr)
        }
      }

      console.log('✓ invoice.payment_succeeded — receipt sent')
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
