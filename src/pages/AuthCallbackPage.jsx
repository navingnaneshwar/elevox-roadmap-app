// src/pages/AuthCallbackPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles redirect after:
//  - Email confirmation (signup)
//  - LinkedIn / Google OAuth (PKCE flow)
//  - Password reset magic link
//
// PKCE flow: Supabase exchanges the auth code asynchronously.
// onAuthStateChange fires INITIAL_SESSION immediately (session=null),
// then SIGNED_IN once the code exchange completes.
// We use a `handled` guard so only the first resolution fires.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let handled = false

    const go = (path) => {
      if (handled) return
      handled = true
      navigate(path, { replace: true })
    }

    // Primary: wait for SIGNED_IN (fires after PKCE code exchange completes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        go('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        go('/login?error=auth_failed')
      }
      // INITIAL_SESSION with null session = code exchange still in progress, wait
    })

    // Safety timeout: LinkedIn PKCE can take up to 20-30s on slow connections.
    // Do a final getSession() check — if session exists by then, go to dashboard.
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      go(session ? '/dashboard' : '/login?error=auth_failed')
    }, 30000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

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
