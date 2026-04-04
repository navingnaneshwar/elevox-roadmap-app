// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

const SUPABASE_CONFIGURED = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [mode,     setMode]     = useState('login') // 'login' | 'forgot'
  const [sent,     setSent]     = useState(false)

  // ── Email + Password Login ───────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  // ── LinkedIn OAuth ───────────────────────────────────────
  async function handleLinkedIn() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    // If no error, browser redirects to LinkedIn — loading stays true intentionally
  }

  // ── Forgot Password ──────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  // ── Styles ───────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: '#0D1220',
    border: '1px solid #1E2A3E',
    borderRadius: '8px',
    color: '#F1F5F9',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070B14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      {/* Glow */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Logo size="lg" theme="dark" />
        </div>

        <div style={{
          background: 'rgba(13,18,32,0.8)',
          border: '1px solid #1E2A3E',
          borderRadius: '16px',
          padding: '36px',
          backdropFilter: 'blur(16px)',
        }}>

          {/* Dev warning banner */}
          {!SUPABASE_CONFIGURED && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fcd34d',
              lineHeight: '1.6',
            }}>
              <strong>⚠️ Local dev mode</strong> — Supabase not connected.<br />
              Add <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>VITE_SUPABASE_URL</code> and <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>VITE_SUPABASE_ANON_KEY</code> to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>.env</code> to enable login.
            </div>
          )}

          {mode === 'forgot' ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 6px' }}>Reset password</h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px', lineHeight: '1.6' }}>
                Enter your email and we'll send a reset link.
              </p>

              {sent ? (
                <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#6ee7b7', fontSize: '13px', lineHeight: '1.6' }}>
                  ✓ Reset link sent to {email}. Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                  </div>
                  {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading} style={{ padding: '13px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              )}

              <button onClick={() => { setMode('login'); setError(null); setSent(false) }} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                ← Back to sign in
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 6px' }}>Welcome back</h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px' }}>Sign in to your Elevox account</p>

              {/* LinkedIn OAuth */}
              <button onClick={handleLinkedIn} disabled={loading} style={{
                width: '100%', padding: '13px', marginBottom: '20px',
                background: '#0A66C2', border: 'none', borderRadius: '8px',
                color: '#fff', fontSize: '13px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Continue with LinkedIn
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
                <span style={{ fontSize: '11px', color: '#334155' }}>or email</span>
                <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px' }}>PASSWORD</label>
                    <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                      Forgot?
                    </button>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '12px' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  padding: '13px',
                  background: loading ? '#0D1220' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border: loading ? '1px solid #1E2A3E' : 'none',
                  borderRadius: '8px', color: loading ? '#334155' : '#fff',
                  fontSize: '13px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
                  transition: 'all 0.15s',
                }}>
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#334155' }}>
                No account?{' '}
                <Link to="/signup" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>
                  Create one →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
