// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [email,              setEmail]              = useState('')
  const [password,           setPassword]           = useState('')
  const [loading,            setLoading]            = useState(false)
  const [error,              setError]              = useState(null)
  const [mode,               setMode]               = useState('login') // 'login' | 'forgot'
  const [sent,               setSent]               = useState(false)
  // For the "unconfirmed email" helper
  const [maybeUnconfirmed,   setMaybeUnconfirmed]   = useState(false)
  const [resendSent,         setResendSent]         = useState(false)
  const [resendLoading,      setResendLoading]      = useState(false)

  // Staggered entry animations classes
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    // Pick up ?error= message forwarded by AuthCallbackPage (e.g. LinkedIn failure)
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [])

  // ── Email + Password Login ───────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMaybeUnconfirmed(false)
    setResendSent(false)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase returns "Invalid login credentials" for BOTH wrong password
      // AND unconfirmed email. Surface a helpful hint for the latter case.
      const isCredError = error.message?.toLowerCase().includes('invalid login credentials')
      setMaybeUnconfirmed(isCredError)
      setError(isCredError
        ? 'Invalid email or password.'
        : error.message
      )
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  // ── Resend confirmation email ────────────────────────────
  async function handleResendConfirmation() {
    if (!email) { setError('Please enter your email address above first.'); return }
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    if (error) {
      // "User already confirmed" → email IS confirmed, it's just a wrong password
      if (error.message?.includes('already confirmed')) {
        setMaybeUnconfirmed(false)
        setError('Your email is confirmed. Please check your password.')
      } else {
        setError(error.message)
      }
    } else {
      setResendSent(true)
    }
  }

  // ── LinkedIn OAuth ───────────────────────────────────────
  async function handleLinkedIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
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

  // ── Shared Styles ───────────────────────────────────────
  const inputContainerStyle = {
    position: 'relative',
    transition: 'all 0.3s ease',
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    background: 'rgba(13, 18, 32, 0.6)',
    border: '1px solid rgba(30, 42, 62, 0.8)',
    borderRadius: '10px',
    color: '#F1F5F9',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
    backdropFilter: 'blur(8px)',
  }

  const inputFocusStyle = {
    borderColor: '#6366f1',
    background: 'rgba(13, 18, 32, 0.9)',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
  }

  const labelStyle = {
    fontSize: '11px',
    color: '#94A3B8',
    letterSpacing: '1.5px',
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    fontFamily: "'Outfit', sans-serif",
    textTransform: 'uppercase',
  }

  const primaryBtnStyle = {
    padding: '14px',
    background: loading ? 'rgba(30, 42, 62, 0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: loading ? '1px solid #1E2A3E' : 'none',
    borderRadius: '10px',
    color: loading ? '#64748B' : '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: loading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.25)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
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
      overflow: 'hidden',
    }}>
      {/* Dynamic Backgrounds */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)', pointerEvents: 'none', filter: 'blur(40px)', mixBlendMode: 'screen' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)', pointerEvents: 'none', filter: 'blur(40px)', mixBlendMode: 'screen' }} />

      <div style={{ width: '100%', maxWidth: '440px', padding: '0 24px', position: 'relative', zIndex: 1, ...(!mounted ? { opacity: 0 } : {}), transition: 'opacity 0.6s ease' }}>
        
        {/* Logo Container with floating animation */}
        <div style={{ textAlign: 'center', marginBottom: '48px', animation: mounted ? 'ob-slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none' }}>
          <Logo size="lg" theme="dark" />
        </div>

        <div style={{
          background: 'rgba(13, 18, 32, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          animation: mounted ? 'ob-slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' : 'none',
        }}>
          {mode === 'forgot' ? (
            <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.2s' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px', letterSpacing: '-0.5px' }}>Reset password</h2>
              <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 32px', lineHeight: '1.6' }}>
                Enter your email address to receive a secure reset link.
              </p>

              {sent ? (
                <div style={{ padding: '16px 20px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#34d399', fontSize: '14px', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>✓</span>
                  <div>Reset link successfully sent to <strong style={{ color: '#6ee7b7', fontWeight: '500' }}>{email}</strong>. Please check your inbox.</div>
                </div>
              ) : (
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={inputContainerStyle}>
                    <label style={labelStyle}>Work Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      placeholder="you@company.com" 
                      style={inputStyle}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e  => Object.assign(e.target.style, inputStyle)} 
                    />
                  </div>
                  {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>}
                  
                  <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, marginTop: '8px' }}>
                    {loading ? (
                       <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Sending link...</>
                    ) : 'Send reset link'}
                  </button>
                </form>
              )}

              <button 
                onClick={() => { setMode('login'); setError(null); setSent(false) }} 
                style={{ marginTop: '24px', background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#F1F5F9'}
                onMouseLeave={e => e.target.style.color = '#64748B'}
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.15s' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome back</h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 32px' }}>Sign in to continue to your dashboard</p>
              </div>

              {/* LinkedIn OAuth */}
              <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.2s' }}>
                <button 
                  type="button"
                  onClick={handleLinkedIn} 
                  disabled={loading} 
                  style={{
                    width: '100%', padding: '14px', marginBottom: '24px',
                    background: 'rgba(10, 102, 194, 0.1)', 
                    border: '1px solid rgba(10, 102, 194, 0.3)', 
                    borderRadius: '10px',
                    color: '#F1F5F9', fontSize: '14px', fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if(!loading) { e.currentTarget.style.background = '#0A66C2'; e.currentTarget.style.borderColor = '#0A66C2'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10, 102, 194, 0.3)'; } }}
                  onMouseLeave={e => { if(!loading) { e.currentTarget.style.background = 'rgba(10, 102, 194, 0.1)'; e.currentTarget.style.borderColor = 'rgba(10, 102, 194, 0.3)'; e.currentTarget.style.boxShadow = 'none'; } }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Continue with LinkedIn
                </button>
              </div>

              <div className={mounted ? "ob-field-enter" : ""} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', animationDelay: '0.25s' }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>or with email</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1))' }} />
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.3s' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e  => Object.assign(e.target.style, inputStyle)} />
                </div>

                <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.35s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                    <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: '500', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#c7d2fe'}
                      onMouseLeave={e => e.target.style.color = '#a5b4fc'}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e  => Object.assign(e.target.style, inputStyle)} />
                </div>

                {error && (
                  <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.4s' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px' }}>
                      {error}
                    </div>
                    {/* Show confirmation helper when error is likely an unconfirmed email */}
                    {maybeUnconfirmed && (
                      <div style={{ marginTop: '10px', padding: '12px 16px', background: 'rgba(250, 204, 21, 0.06)', border: '1px solid rgba(250, 204, 21, 0.2)', borderRadius: '10px', fontSize: '12px', color: '#fde68a', lineHeight: 1.6 }}>
                        {resendSent ? (
                          <span style={{ color: '#34d399' }}>✓ Confirmation email sent! Check your inbox and click the link, then try signing in again.</span>
                        ) : (
                          <>
                            <span>Just signed up? You may need to <strong>confirm your email</strong> first.</span>{' '}
                            <button
                              type="button"
                              onClick={handleResendConfirmation}
                              disabled={resendLoading}
                              style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: '600', cursor: resendLoading ? 'not-allowed' : 'pointer', textDecoration: 'underline', fontSize: '12px', padding: 0 }}
                            >
                              {resendLoading ? 'Sending…' : 'Resend confirmation →'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={mounted ? "ob-field-enter" : ""} style={{ animationDelay: '0.4s', marginTop: '4px' }}>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    style={primaryBtnStyle}
                    onMouseEnter={e => { if(!loading) { e.target.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)'; e.target.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.4)'; e.target.style.transform = 'translateY(-1px)' } }}
                    onMouseLeave={e => { if(!loading) { e.target.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)'; e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.25)'; e.target.style.transform = 'translateY(0)' } }}
                  >
                    {loading ? (
                      <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Authenticating...</>
                    ) : (
                      <>Sign into Elevox <span style={{ marginLeft: '4px', fontSize: '16px' }}>→</span></>
                    )}
                  </button>
                </div>
              </form>

              <div className={mounted ? "ob-field-enter" : ""} style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#64748B', animationDelay: '0.45s' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#c7d2fe'}
                  onMouseLeave={e => e.target.style.color = '#a5b4fc'}
                >
                  Apply for access
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

