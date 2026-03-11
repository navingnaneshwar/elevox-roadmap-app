// src/pages/SignupPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function SignupPage() {
  const navigate = useNavigate()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setConfirmed(true)
    setLoading(false)
  }

  async function handleLinkedIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: '#0D1220', border: '1px solid #1E2A3E',
    borderRadius: '8px', color: '#F1F5F9',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Logo size="lg" theme="dark" />
        </div>

        <div style={{ background: 'rgba(13,18,32,0.8)', border: '1px solid #1E2A3E', borderRadius: '16px', padding: '36px', backdropFilter: 'blur(16px)' }}>
          {confirmed ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 12px' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.7', margin: 0 }}>
                We sent a confirmation link to <strong style={{ color: '#a5b4fc' }}>{email}</strong>.<br />
                Click it to activate your account and start onboarding.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 6px' }}>
                Create your account
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px' }}>
                Start building your executive brand today
              </p>

              <button onClick={handleLinkedIn} disabled={loading} style={{ width: '100%', padding: '13px', marginBottom: '20px', background: '#0A66C2', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Sign up with LinkedIn
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
                <span style={{ fontSize: '11px', color: '#334155' }}>or email</span>
                <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Alexandra Chen" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e  => e.target.style.borderColor = '#1E2A3E'} />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '12px' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ padding: '13px', background: loading ? '#0D1220' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: loading ? '1px solid #1E2A3E' : 'none', borderRadius: '8px', color: loading ? '#334155' : '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)', transition: 'all 0.15s' }}>
                  {loading ? 'Creating account…' : 'Create account →'}
                </button>

                <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
                  By signing up you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#334155' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>Sign in →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
