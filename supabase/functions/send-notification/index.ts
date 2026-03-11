// supabase/functions/send-notification/index.ts
// Sprint 2 — Task 5: Welcome email via Resend on onboarding complete
//
// POST /functions/v1/send-notification
// Body: { type: 'welcome' | 'brief_ready' | 'payment_confirmed' | 'session_summary', payload?: object }
// Returns: { sent: true } | { error: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EMAIL_FROM       = Deno.env.get('EMAIL_FROM') || 'Elevox <hello@elevox.com>'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Email templates ──────────────────────────────────────────

function welcomeEmail(firstName: string, plan: string): { subject: string; html: string } {
  const planName = plan === 'legacy' ? 'Legacy' : plan === 'authority' ? 'Authority' : 'Foundation'
  const phaseCount = plan === 'legacy' ? 6 : plan === 'authority' ? 4 : 2

  return {
    subject: `Welcome to Elevox, ${firstName} — your brand journey starts now`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #070B14; font-family: 'Inter', -apple-system, sans-serif; color: #94A3B8; }
    .container { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
    .logo { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #F1F5F9; letter-spacing: -0.5px; margin-bottom: 40px; }
    .logo span { color: #C8A96E; }
    h1 { font-size: 28px; font-weight: 700; color: #F1F5F9; margin: 0 0 16px; line-height: 1.2; }
    p { font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
    .plan-badge { display: inline-block; padding: 6px 16px; background: rgba(200,169,110,0.12); border: 1px solid rgba(200,169,110,0.3); border-radius: 100px; color: #C8A96E; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 32px; }
    .next-steps { background: rgba(255,255,255,0.03); border: 1px solid #1E2A3E; border-radius: 12px; padding: 28px; margin: 32px 0; }
    .step { display: flex; gap: 14px; margin-bottom: 20px; }
    .step:last-child { margin-bottom: 0; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(200,169,110,0.12); border: 1px solid rgba(200,169,110,0.3); display: flex; align-items: center; justify-content: center; color: #C8A96E; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-content h3 { font-size: 14px; font-weight: 600; color: #F1F5F9; margin: 0 0 3px; }
    .step-content p { font-size: 13px; color: #64748B; margin: 0; line-height: 1.5; }
    .cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #C8A96E, #C8A96Ecc); border-radius: 8px; color: #070B14; font-size: 14px; font-weight: 700; text-decoration: none; margin: 8px 0 32px; }
    .divider { height: 1px; background: #1E2A3E; margin: 32px 0; }
    .footer { font-size: 12px; color: #334155; line-height: 1.6; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Elev<span>ox</span></div>

    <div class="plan-badge">${planName.toUpperCase()} PLAN — ${phaseCount} PHASES</div>

    <h1>Welcome, ${firstName}.<br/>Let's build your executive brand.</h1>

    <p>
      You've just done something most senior executives never do — decided to take
      ownership of how the world perceives you. Your ${planName} programme gives you
      access to ${phaseCount} coaching phases, AI-powered ghostwriting, and a personalised
      Brand Brief built from everything you told us about yourself.
    </p>

    <div class="next-steps">
      <div style="font-size: 10px; color: #64748B; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;">Your First Three Moves</div>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-content">
          <h3>Generate your Brand Brief</h3>
          <p>Your AI-powered brand analysis is ready to generate. It takes 15 seconds and sets the direction for everything that follows.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-content">
          <h3>Start Phase 01 — Brand Audit</h3>
          <p>Begin your first coaching session with an honest forensic review of where your brand stands today.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-content">
          <h3>Set up your content calendar</h3>
          <p>Block your first anchor events and let the system build your 90-day content plan around them.</p>
        </div>
      </div>
    </div>

    <a href="https://elevox.com/dashboard" class="cta">Go to your dashboard →</a>

    <div class="divider"></div>

    <div class="footer">
      <p>
        Questions? Reply to this email or reach us at
        <a href="mailto:hello@elevox.com">hello@elevox.com</a>.
        We typically respond within one business day.
      </p>
      <p style="margin-top: 12px; color: #1E2A3E;">
        Elevox · Executive Thought Leadership · You're receiving this because you created an account.
        <a href="https://elevox.com/unsubscribe" style="color: #334155;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  }
}

function briefReadyEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, your Brand Brief is ready`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; padding: 0; background: #070B14; font-family: 'Inter', -apple-system, sans-serif; color: #94A3B8; }
    .container { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
    .logo { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #F1F5F9; margin-bottom: 40px; }
    .logo span { color: #C8A96E; }
    h1 { font-size: 26px; font-weight: 700; color: #F1F5F9; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
    .cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
    .footer { margin-top: 40px; font-size: 12px; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Elev<span>ox</span></div>
    <h1>✦ Your Brand Brief is ready, ${firstName}</h1>
    <p>
      We've analysed your full profile and built your personalised Brand Brief —
      your archetype, positioning statement, audience map, voice signature,
      and the five content themes you should own.
    </p>
    <a href="https://elevox.com/brand-brief" class="cta">View your Brand Brief →</a>
    <div class="footer">
      <p>Elevox · <a href="mailto:hello@elevox.com" style="color: #6366f1;">hello@elevox.com</a></p>
    </div>
  </div>
</body>
</html>`,
  }
}

function paymentConfirmedEmail(firstName: string, plan: string, amount: string): { subject: string; html: string } {
  const planName = plan === 'legacy' ? 'Legacy' : plan === 'authority' ? 'Authority' : 'Foundation'
  return {
    subject: `Payment confirmed — ${planName} plan activated`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; padding: 0; background: #070B14; font-family: 'Inter', -apple-system, sans-serif; color: #94A3B8; }
    .container { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
    .logo { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #F1F5F9; margin-bottom: 40px; }
    .logo span { color: #C8A96E; }
    h1 { font-size: 24px; font-weight: 700; color: #F1F5F9; margin: 0 0 16px; }
    .receipt { background: rgba(255,255,255,0.02); border: 1px solid #1E2A3E; border-radius: 10px; padding: 24px; margin: 24px 0; }
    .receipt-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
    .receipt-row:last-child { margin-bottom: 0; border-top: 1px solid #1E2A3E; padding-top: 10px; }
    .receipt-row span:first-child { color: #64748B; }
    .receipt-row span:last-child { color: #F1F5F9; font-weight: 600; }
    .cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4A9E7A, #4A9E7Acc); border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
    .footer { margin-top: 40px; font-size: 12px; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Elev<span>ox</span></div>
    <h1>✓ Payment confirmed</h1>
    <p>Thank you, ${firstName}. Your ${planName} plan is now active.</p>
    <div class="receipt">
      <div class="receipt-row"><span>Plan</span><span>Elevox ${planName}</span></div>
      <div class="receipt-row"><span>Billing</span><span>Monthly</span></div>
      <div class="receipt-row"><span>Amount</span><span>${amount}/mo</span></div>
    </div>
    <a href="https://elevox.com/dashboard" class="cta">Go to dashboard →</a>
    <div class="footer">
      <p>Keep this email as your receipt. Questions: <a href="mailto:hello@elevox.com" style="color: #6366f1;">hello@elevox.com</a></p>
    </div>
  </div>
</body>
</html>`,
  }
}

// ── Main handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing Authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    // Fetch profile for personalisation
    const { data: profile } = await supabase
      .from('profiles').select('full_name, email, plan').eq('id', user.id).single()

    if (!profile) throw new Error('Profile not found')

    const firstName = profile.full_name?.split(' ')[0] || 'Executive'
    const email     = profile.email || user.email

    const { type, payload = {} } = await req.json()

    let emailContent: { subject: string; html: string }

    switch (type) {
      case 'welcome':
        emailContent = welcomeEmail(firstName, profile.plan || 'starter')
        break
      case 'brief_ready':
        emailContent = briefReadyEmail(firstName)
        break
      case 'payment_confirmed':
        emailContent = paymentConfirmedEmail(firstName, profile.plan || 'starter', payload.amount || '$97')
        break
      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    EMAIL_FROM,
        to:      [email],
        subject: emailContent.subject,
        html:    emailContent.html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error(`Resend error: ${err}`)
    }

    const resendData = await resendRes.json()

    return new Response(
      JSON.stringify({ sent: true, id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
