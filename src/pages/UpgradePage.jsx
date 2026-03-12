// src/pages/UpgradePage.jsx
// Payments deferred to Sprint 3 — CTA routes to email for now
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const PLANS = [
  {
    id: 'starter',
    name: 'Foundation',
    price: '$97',
    color: '#4A9E7A',
    phases: 'Phases 1–2',
    features: ['Brand Audit & Foundation', 'Platform Architecture', '8 Coaching Sessions', 'Brand Brief Generation', 'Voice & Export'],
  },
  {
    id: 'authority',
    name: 'Authority',
    price: '$197',
    color: '#C8A96E',
    phases: 'Phases 1–4',
    badge: 'MOST POPULAR',
    features: ['Everything in Foundation', 'Content Engine', 'Visibility & Authority', '16 Coaching Sessions', 'Media Kit', 'Content Calendar'],
  },
  {
    id: 'legacy',
    name: 'Legacy',
    price: '$497',
    color: '#8C2E45',
    phases: 'All 6 Phases',
    features: ['Everything in Authority', 'Community & Network', 'Measure & Scale', '24 Coaching Sessions', 'IP Blueprint', 'Book Packaging', '1:1 Strategy Call'],
  },
]

export default function UpgradePage() {
  const location     = useLocation()
  const { profile }  = useAuth()
  const requiredPlan = location.state?.requiredPlan
  const currentPlan  = profile?.plan || null
  const [loadingPlan] = useState(null)

  function handleSelectPlan(planId) {
    const subject = encodeURIComponent(`Elevox — Interested in the ${planId} plan`)
    const body    = encodeURIComponent(`Hi,\n\nI'd like to learn more about the ${planId} plan.\n\nName: ${profile?.full_name || ''}\nEmail: ${profile?.email || ''}\n`)
    window.location.assign(`mailto:hello@elevox.com?subject=${subject}&body=${body}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif", padding: '60px 24px' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Logo size="md" theme="dark" />
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '32px 0 12px', letterSpacing: '-0.5px' }}>
            {requiredPlan ? `Unlock ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} features` : 'Choose your plan'}
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>Invest in your executive brand. Cancel anytime.</p>
        </div>

        <div style={{ marginBottom: '32px', padding: '14px 20px', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: '10px', color: '#C8A96E', fontSize: '13px', textAlign: 'center' }}>
          🚀 We're onboarding founding members personally — click a plan to reach out directly.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {PLANS.map(plan => {
            const isCurrentPlan = currentPlan === plan.id
            const isLoading     = loadingPlan === plan.id
            const anyLoading    = loadingPlan !== null
            return (
              <div key={plan.id} style={{ background: 'rgba(13,18,32,0.8)', border: `1px solid ${plan.badge ? plan.color + '60' : '#1E2A3E'}`, borderRadius: '16px', padding: '32px 28px', position: 'relative', backdropFilter: 'blur(16px)', opacity: anyLoading && !isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {plan.badge && !isCurrentPlan && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: plan.color, borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{plan.badge}</div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: '#1E2A3E', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#64748B', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>CURRENT PLAN</div>
                )}
                <div style={{ fontSize: '11px', color: plan.color, letterSpacing: '2px', fontWeight: '600', marginBottom: '8px' }}>{plan.phases}</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{plan.name}</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: plan.color, fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{plan.price}<span style={{ fontSize: '14px', color: '#64748B', fontWeight: '400' }}>/mo</span></div>
                <div style={{ margin: '24px 0', height: '1px', background: '#1E2A3E' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  style={{ width: '100%', padding: '13px', background: isCurrentPlan ? '#1E2A3E' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, border: isCurrentPlan ? '1px solid #1E2A3E' : 'none', borderRadius: '8px', color: isCurrentPlan ? '#334155' : '#fff', fontSize: '13px', fontWeight: '600', cursor: isCurrentPlan ? 'default' : 'pointer', boxShadow: isCurrentPlan ? 'none' : `0 4px 20px ${plan.color}40` }}
                >
                  {isCurrentPlan ? 'Current plan' : 'Get in touch →'}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {[['🔒', 'Secure checkout via Stripe'], ['↩', 'Cancel anytime'], ['✦', 'Instant access after payment']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <span>{icon}</span>{text}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#334155' }}>
          <Link to="/dashboard" style={{ color: '#6366f1', textDecoration: 'none' }}>← Back to dashboard</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
