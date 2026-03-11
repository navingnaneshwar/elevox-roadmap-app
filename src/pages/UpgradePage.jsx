// src/pages/UpgradePage.jsx
import { useLocation, Link } from 'react-router-dom'
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
  const location = useLocation()
  const requiredPlan = location.state?.requiredPlan

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif", padding: '60px 24px' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Logo size="md" theme="dark" />
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '32px 0 12px', letterSpacing: '-0.5px' }}>
            {requiredPlan ? `Unlock ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} features` : 'Choose your plan'}
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
            Invest in your executive brand. Cancel anytime.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: 'rgba(13,18,32,0.8)', border: `1px solid ${plan.badge ? plan.color + '60' : '#1E2A3E'}`,
              borderRadius: '16px', padding: '32px 28px', position: 'relative',
              backdropFilter: 'blur(16px)',
            }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: plan.color, borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ fontSize: '11px', color: plan.color, letterSpacing: '2px', fontWeight: '600', marginBottom: '8px' }}>{plan.phases}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{plan.name}</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: plan.color, fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{plan.price}<span style={{ fontSize: '14px', color: '#64748B', fontWeight: '400' }}>/mo</span></div>

              <div style={{ margin: '24px 0', height: '1px', background: '#1E2A3E' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: '1px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* TODO: wire to Stripe checkout Edge Function */}
              <button
                onClick={() => alert(`Stripe checkout for ${plan.name} — wire to /functions/v1/create-checkout`)}
                style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: `0 4px 20px ${plan.color}40` }}
              >
                Get started →
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '13px', color: '#334155' }}>
          <Link to="/dashboard" style={{ color: '#6366f1', textDecoration: 'none' }}>← Back to dashboard</Link>
        </p>
      </div>
    </div>
  )
}
