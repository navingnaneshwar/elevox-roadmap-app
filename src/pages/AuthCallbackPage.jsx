// src/pages/AuthCallbackPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles redirect after LinkedIn / Google OAuth, email confirm,
// and password reset.
//
// IMPLICIT FLOW: Supabase processes #access_token from the URL hash
// immediately on client init — BEFORE this component mounts.
// So onAuthStateChange fires INITIAL_SESSION (not SIGNED_IN) with
// the session already set. We must handle BOTH events.
//
// ERROR HANDLING: If the OAuth provider or Supabase returns ?error=
// in the query string (e.g. LinkedIn redirect_uri_mismatch, access_denied,
// expired_code, etc.) we surface it immediately instead of spinning 30s.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    // ── 1. Detect error params from OAuth provider or Supabase ────
    // e.g. LinkedIn returns: ?error=access_denied&error_description=...
    // Supabase may return:  ?error=invalid_request&error_code=...
    const params = new URLSearchParams(window.location.search)
    const oauthError       = params.get('error')
    const oauthErrorDesc   = params.get('error_description') || params.get('error_code') || ''

    if (oauthError) {
      // Surface the error right away — don't spin for 30 seconds
      const friendly = friendlyError(oauthError, oauthErrorDesc)
      setErrorMsg(friendly)
      // Redirect to login with error after 4s so user can read the message
      setTimeout(() => {
        navigate(`/login?error=${encodeURIComponent(friendly)}`, { replace: true })
      }, 4000)
      return
    }

    let handled = false
    const go = (path) => {
      if (handled) return
      handled = true
      navigate(path, { replace: true })
    }

    // ── 2. Fast path: session already set by Supabase client on URL hash ─
    // For implicit flow, supabase.js parses the hash before this fires.
    // Check immediately before subscribing to avoid race condition.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go('/dashboard')
    })

    // ── 3. Handle PKCE code exchange (LinkedIn OIDC, email OTP with code) ─
    // SIGNED_IN  = PKCE code exchanged successfully
    // INITIAL_SESSION = implicit flow token already parsed from hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        go('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        go('/login?error=auth_failed')
      }
      // INITIAL_SESSION with session=null = PKCE exchange still underway, wait
    })

    // ── 4. Safety net: 30s final check ───────────────────────────────────
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      go(session ? '/dashboard' : '/login?error=auth_failed')
    }, 30000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  // Human-readable errors for common OAuth failure codes
  function friendlyError(code, desc) {
    if (code === 'access_denied')      return 'Sign-in was cancelled or denied. Please try again.'
    if (code === 'invalid_client')     return 'OAuth configuration error. Please contact support.'
    if (code === 'redirect_uri_mismatch') return 'Redirect URI mismatch — please contact support.'
    if (code === 'expired_code')       return 'The sign-in link has expired. Please try again.'
    if (code === 'invalid_request')    return desc || 'Invalid sign-in request. Please try again.'
    return desc || `Sign-in error: ${code}. Please try again.`
  }

  if (errorMsg) {
    return (
      <div style={{
        minHeight: '100vh', background: '#070B14',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: '32px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: '#fca5a5', fontSize: '15px', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 }}>{errorMsg}</p>
        <p style={{ color: '#475569', fontSize: '12px', marginTop: '12px' }}>Redirecting you back to login…</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#070B14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #1E2A3E', borderTop: '2px solid #C8A96E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#334155', fontSize: '13px', marginTop: '20px' }}>Completing sign in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
