// src/pages/UpgradePage.jsx
// Payment gateway: Razorpay (India-compatible) — wiring deferred to final sprint.
// This page captures plan interest via inline confirmation (no payment collected).
// Profile.plan is set manually by the team until the payment integration is live.
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const PLANS = [
  {
    id: 'starter',
    name: 'Foundation',
    price: '$97',
    period: '/mo',
    color: '#4A9E7A',
    phases: 'Phases 1–2',
    features: [
      'Brand Audit & Foundation',
      'Platform Architecture',
      '8 AI Coaching Sessions',
      'Brand Brief Generation',
      'Voice & Archetype Mapping',
    ],
  },
  {
    id: 'authority',
    name: 'Authority',
    price: '$197',
    period: '/mo',
    color: '#C8A96E',
    phases: 'Phases 1–4',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Foundation',
      'Content Engine',
      'Visibility & Authority',
      '16 AI Coaching Sessions',
      'Media Kit',
      'Content Calendar + Ghostwriter',
    ],
  },
  {
    id: 'legacy',
    name: 'Legacy',
    price: '$497',
    period: '/mo',
    color: '#8C2E45',
    phases: 'All 6 Phases',
    features: [
      'Everything in Authority',
      'Community & Network',
      'Measure & Scale',
      '24 AI Coaching Sessions',
      'IP & Book Packaging',
      '1:1 Strategy Call',
    ],
  },
]

export default function UpgradePage() {
  const location     = useLocation()
  const { profile }  = useAuth()
  const requiredPlan = location.state?.requiredPlan
  const currentPlan  = profile?.plan || null

  const [selectedPlan, setSelectedPlan] = useState(null) // awaiting confirm
  const [submitted,    setSubmitted]    = useState(null) // confirmed interest

  function handleSelectPlan(planId) { setSelectedPlan(planId) }
  function handleCancel()           { setSelectedPlan(null) }

  function handleConfirm() {
    // TODO (final sprint): replace this block with Razorpay checkout initiation.
    // Razorpay is India-compatible and supports international cards + UPI.
    // See docs/sprint3/BRD.md BR-01 and docs/PAYMENT_GATEWAY.md for integration guide.
    setSubmitted(selectedPlan)
    setSelectedPlan(null)
  }

  const planLabel = (id) => PLANS.find(p => p.id === id)?.name ?? id

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif", padding: '60px 24px' }}>

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Logo size="md" theme="dark" />
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '32px 0 12px', letterSpacing: '-0.5px' }}>
            {requiredPlan ? `Unlock ${planLabel(requiredPlan)} features` : 'Choose your plan'}
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
            Invest in your executive brand. Cancel anytime.
          </p>
        </div>

        {/* Founding-member / payment-soon banner */}
        <div style={{ marginBottom: '32px', padding: '16px 24px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#a5b4fc', marginBottom: '4px', fontFamily: "'Outfit', sans-serif", letterSpacing: '1.5px' }}>
              FOUNDING MEMBER PRICING — PAYMENT LAUNCHING SOON
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
              We're onboarding founding members personally while our payment system goes live.
              Select a plan — our team will contact you within{' '}
              <strong style={{ color: '#94A3B8' }}>24 hours</strong> to complete enrollment.
              Your pricing is locked at the rates shown.
            </div>
          </div>
        </div>

        {/* Post-confirmation success bar */}
        {submitted && (
          <div style={{ marginBottom: '32px', padding: '20px 24px', background: 'rgba(74,158,122,0.08)', border: '1px solid rgba(74,158,122,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>✅</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A9E7A', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
                Interest registered — {planLabel(submitted)} plan
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
                We've noted your interest. Our team will contact{' '}
                <strong style={{ color: '#F1F5F9' }}>{profile?.email || 'you'}</strong>{' '}
                within 24 hours to complete your enrollment and unlock your phases.
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {PLANS.map(plan => {
            const isCurrentPlan = currentPlan === plan.id
            const isConfirmed   = submitted === plan.id
            const isPending     = selectedPlan === plan.id

            return (
              <div
                key={plan.id}
                style={{
                  background: 'rgba(13,18,32,0.8)',
                  border: `1px solid ${isPending ? plan.color + '80' : plan.badge && !isCurrentPlan ? plan.color + '60' : '#1E2A3E'}`,
                  borderRadius: '16px', padding: '32px 28px',
                  position: 'relative', backdropFilter: 'blur(16px)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Badges */}
                {plan.badge && !isCurrentPlan && !isConfirmed && !isPending && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: plan.color, borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: '#1E2A3E', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#64748B', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                    CURRENT PLAN
                  </div>
                )}
                {isConfirmed && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: '#4A9E7A', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                    INTEREST REGISTERED
                  </div>
                )}

                {/* Plan info */}
                <div style={{ fontSize: '11px', color: plan.color, letterSpacing: '2px', fontWeight: '600', marginBottom: '8px' }}>{plan.phases}</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{plan.name}</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: plan.color, fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
                  {plan.price}<span style={{ fontSize: '14px', color: '#64748B', fontWeight: '400' }}>{plan.period}</span>
                </div>

                <div style={{ margin: '24px 0', height: '1px', background: '#1E2A3E' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                {/* CTA — four states */}
                {isCurrentPlan ? (
                  <button disabled style={{ width: '100%', padding: '13px', background: '#1E2A3E', border: '1px solid #1E2A3E', borderRadius: '8px', color: '#334155', fontSize: '13px', fontWeight: '600', cursor: 'default' }}>
                    Current plan
                  </button>
                ) : isConfirmed ? (
                  <button disabled style={{ width: '100%', padding: '13px', background: 'rgba(74,158,122,0.12)', border: '1px solid rgba(74,158,122,0.3)', borderRadius: '8px', color: '#4A9E7A', fontSize: '13px', fontWeight: '600', cursor: 'default' }}>
                    ✓ Team will reach out
                  </button>
                ) : isPending ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 4px', textAlign: 'center', lineHeight: '1.6' }}>
                      Confirm interest in <strong style={{ color: '#F1F5F9' }}>{plan.name}</strong>?<br />
                      <span style={{ color: '#64748B' }}>No payment collected yet.</span>
                    </p>
                    <button
                      onClick={handleConfirm}
                      style={{ width: '100%', padding: '12px', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: `0 4px 20px ${plan.color}40` }}
                    >
                      Yes, register my interest
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '8px', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: `0 4px 20px ${plan.color}40`, transition: 'opacity 0.15s' }}
                  >
                    Select {plan.name} →
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {[
            ['🔒', 'Secure payment via Razorpay (launching soon)'],
            ['↩', 'Cancel anytime'],
            ['✦', 'Access granted within 24h of enrollment'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <span>{icon}</span>{text}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#334155' }}>
          <Link to="/dashboard" style={{ color: '#6366f1', textDecoration: 'none' }}>← Back to dashboard</Link>
        </p>

      </div>
    </div>
  )
}
