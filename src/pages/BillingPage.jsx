// src/pages/BillingPage.jsx
// Billing management — current plan, status, portal access, upgrade paths
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

const PLAN_META = {
  starter: {
    name: 'Foundation',
    price: '$97',
    color: '#4A9E7A',
    phases: 'Phases 1–2',
    features: ['Brand Audit & Foundation', 'Platform Architecture', '8 Coaching Sessions', 'Brand Brief Generation'],
    next: 'authority',
  },
  authority: {
    name: 'Authority',
    price: '$197',
    color: '#C8A96E',
    phases: 'Phases 1–4',
    features: ['Everything in Foundation', 'Content Engine', 'Visibility & Authority', '16 Coaching Sessions', 'Media Kit', 'Content Calendar'],
    next: 'legacy',
  },
  legacy: {
    name: 'Legacy',
    price: '$497',
    color: '#8C2E45',
    phases: 'All 6 Phases',
    features: ['Everything in Authority', 'Community & Network', 'Measure & Scale', '24 Coaching Sessions', 'Book Packaging', '1:1 Strategy Call'],
    next: null,
  },
}

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: '#4A9E7A', bg: 'rgba(74,158,122,0.08)',  border: 'rgba(74,158,122,0.25)'  },
  past_due:  { label: 'Past due',   color: '#E8935A', bg: 'rgba(232,147,90,0.08)',  border: 'rgba(232,147,90,0.25)'  },
  cancelled: { label: 'Cancelled',  color: '#C85A5A', bg: 'rgba(200,90,90,0.08)',   border: 'rgba(200,90,90,0.25)'   },
  trialing:  { label: 'Trial',      color: '#5B8FA8', bg: 'rgba(91,143,168,0.08)',  border: 'rgba(91,143,168,0.25)'  },
  inactive:  { label: 'No plan',    color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)' },
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      padding: '24px', background: 'rgba(13,18,32,0.6)',
      border: '1px solid #1E2A3E', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '11px', color: '#64748B', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '12px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color || '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#475569' }}>{sub}</div>}
    </div>
  )
}

export default function BillingPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(null)

  const plan       = profile?.plan || null
  const planStatus = profile?.plan_status || (plan ? 'active' : 'inactive')
  const meta       = PLAN_META[plan] || null
  const statusCfg  = STATUS_CONFIG[planStatus] || STATUS_CONFIG.inactive

  async function openPortal() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const { url, error: fnError } = await res.json()
      if (fnError) throw new Error(fnError)
      window.location.href = url
    } catch (err) {
      setPortalError(err.message)
      setPortalLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070B14',
      fontFamily: "'Inter', sans-serif",
      color: '#F1F5F9',
    }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1E2A3E', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(12px)' }}>
        <Logo size="sm" theme="dark" />
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[['Dashboard', '/dashboard'], ['Brand Brief', '/brand-brief'], ['Roadmap', '/roadmap'], ['Calendar', '/calendar']].map(([label, path]) => (
            <Link key={path} to={path} style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#F1F5F9'}
              onMouseLeave={e => e.target.style.color = '#64748B'}
            >{label}</Link>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#64748B', fontFamily: 'monospace', marginBottom: '12px' }}>
            ACCOUNT — BILLING
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
            Your subscription
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Manage your plan, payment method, and invoices.
          </p>
        </div>

        {/* Status + plan name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 14px',
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: '600',
            color: statusCfg.color,
            fontFamily: 'monospace',
            letterSpacing: '1px',
          }}>
            ● {statusCfg.label.toUpperCase()}
          </div>
          {meta && (
            <div style={{ fontSize: '14px', color: '#94A3B8' }}>
              Elevox <span style={{ color: meta.color, fontWeight: '600' }}>{meta.name}</span> — {meta.phases}
            </div>
          )}
          {!plan && (
            <div style={{ fontSize: '14px', color: '#64748B' }}>No active subscription</div>
          )}
        </div>

        {/* Error */}
        {portalError && (
          <div style={{ marginBottom: '24px', padding: '14px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px' }}>
            {portalError} — please try again or <a href="mailto:support@elevox.com" style={{ color: '#f87171' }}>contact support</a>.
          </div>
        )}

        {/* Past due warning */}
        {planStatus === 'past_due' && (
          <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(232,147,90,0.08)', border: '1px solid rgba(232,147,90,0.25)', borderRadius: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#E8935A', marginBottom: '6px' }}>⚠ Payment past due</div>
            <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
              Your last payment failed. Update your payment method to keep access to your coaching sessions and content engine.
            </div>
            <a href="mailto:support@elevox.com?subject=Payment%20update%20request" style={{ display: 'inline-block', marginTop: '14px', padding: '10px 20px', background: '#E8935A', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              Contact support to update payment →
            </a>
          </div>
        )}

        {/* Stat cards */}
        {plan && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <StatCard label="MONTHLY INVESTMENT" value={meta?.price || '—'} sub="per month" color={meta?.color} />
            <StatCard label="PLAN" value={meta?.name || '—'} sub={meta?.phases} />
            <StatCard label="STATUS" value={statusCfg.label} color={statusCfg.color} />
          </div>
        )}

        {/* Current plan features */}
        {meta && (
          <div style={{ padding: '28px', background: 'rgba(13,18,32,0.6)', border: `1px solid ${meta.color}30`, borderRadius: '14px', marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '3px', color: meta.color, fontFamily: 'monospace', marginBottom: '16px' }}>
              YOUR PLAN — {meta.name.toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {meta.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
                  <span style={{ color: meta.color, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage / cancel — Payment portal coming soon */}
        {plan && planStatus !== 'cancelled' && (
          <div style={{ padding: '24px', background: 'rgba(13,18,32,0.4)', border: '1px solid #1E2A3E', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', marginBottom: '6px' }}>
              Manage subscription
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '16px' }}>
              Self-service billing management (update payment method, invoices, cancellation)
              is launching soon via our payment portal. For immediate changes, contact{' '}
              <a href="mailto:support@elevox.com" style={{ color: '#6366f1', textDecoration: 'none' }}>support@elevox.com</a>.
            </div>
            <div style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', fontSize: '12px', color: '#64748B', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              ⚡ PAYMENT PORTAL — LAUNCHING FINAL SPRINT
            </div>
          </div>
        )}

        {/* Upgrade nudge */}
        {meta?.next && planStatus === 'active' && (
          <div style={{ padding: '24px', background: 'rgba(13,18,32,0.4)', border: '1px solid #1E2A3E', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', marginBottom: '6px' }}>
              Ready to go further?
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '16px' }}>
              Upgrade to <span style={{ color: PLAN_META[meta.next].color, fontWeight: '600' }}>{PLAN_META[meta.next].name}</span> to unlock {meta.next === 'authority' ? 'your Content Engine and Visibility phase' : 'all 6 phases including Book & IP Packaging and your 3-Year Vision'}.
            </div>
            <Link
              to="/upgrade"
              style={{
                display: 'inline-block', padding: '12px 24px',
                background: `linear-gradient(135deg, ${PLAN_META[meta.next].color}, ${PLAN_META[meta.next].color}cc)`,
                borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600',
                textDecoration: 'none', boxShadow: `0 4px 20px ${PLAN_META[meta.next].color}40`,
              }}
            >
              Upgrade to {PLAN_META[meta.next].name} — {PLAN_META[meta.next].price}/mo →
            </Link>
          </div>
        )}

        {/* No plan CTA */}
        {!plan && (
          <div style={{ padding: '40px', background: 'rgba(13,18,32,0.6)', border: '1px solid #1E2A3E', borderRadius: '14px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#64748B', fontFamily: 'monospace', marginBottom: '16px' }}>GET STARTED</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 12px', fontFamily: "'Outfit', sans-serif" }}>
              Choose your plan to begin
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 28px', lineHeight: '1.6' }}>
              Your executive brand is your most valuable asset. Start building it today.
            </p>
            <Link
              to="/upgrade"
              style={{
                display: 'inline-block', padding: '14px 32px',
                background: 'linear-gradient(135deg, #C8A96E, #B8975A)',
                borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '600',
                textDecoration: 'none', boxShadow: '0 4px 20px rgba(200,169,110,0.3)',
              }}
            >
              View plans →
            </Link>
          </div>
        )}

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/dashboard" style={{ color: '#334155', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
