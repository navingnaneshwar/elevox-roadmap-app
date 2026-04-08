// src/pages/ResetPasswordPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles Supabase password-reset links (type=recovery in URL hash).
// Supabase fires PASSWORD_RECOVERY via onAuthStateChange when the
// user lands here — we then show a form to set a new password.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [ready,     setReady]     = useState(false) // true once PASSWORD_RECOVERY fires
  const [done,      setDone]      = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // Supabase processes the token from the URL hash automatically.
    // PASSWORD_RECOVERY fires when the recovery token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Safety fallback — if token is bad, redirect after 10s
    const timeout = setTimeout(() => {
      if (!ready) navigate('/login?error=auth_failed', { replace: true })
    }, 10000)
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [navigate, ready])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => navigate('/login', { replace: true }), 2500)
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px',
    background: 'rgba(13, 18, 32, 0.6)',
    border: '1px solid rgba(30, 42, 62, 0.8)',
    borderRadius: '10px', color: '#F1F5F9',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
  }
  const inputFocusStyle = {
    borderColor: '#6366f1', background: 'rgba(13, 18, 32, 0.9)',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
  }
  const labelStyle = {
    fontSize: '11px', color: '#94A3B8', letterSpacing: '1.5px',
    display: 'block', marginBottom: '8px', fontWeight: '500',
    fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#070B14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

      <div style={{ width: '100%', maxWidth: '440px', padding: '0 24px', position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Logo size="lg" theme="dark" />
        </div>

        <div style={{
          background: 'rgba(13, 18, 32, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px', padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 12px' }}>Password updated</h2>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.7' }}>Redirecting you to sign in…</p>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid #1E2A3E', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <p style={{ color: '#64748B', fontSize: '14px' }}>Verifying reset link…</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px', letterSpacing: '-0.5px' }}>Set new password</h2>
              <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 32px' }}>Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="Min. 8 characters" style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e  => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    required placeholder="Repeat password" style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e  => Object.assign(e.target.style, inputStyle)}
                  />
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  style={{
                    padding: '14px', marginTop: '4px',
                    background: loading ? 'rgba(30, 42, 62, 0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: loading ? '1px solid #1E2A3E' : 'none',
                    borderRadius: '10px', color: loading ? '#64748B' : '#fff',
                    fontSize: '14px', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading
                    ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Updating…</>
                    : <>Update password <span style={{ fontSize: '16px' }}>→</span></>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
