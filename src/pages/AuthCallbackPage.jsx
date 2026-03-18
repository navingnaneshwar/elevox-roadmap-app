// src/pages/AuthCallbackPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles redirect after:
//  - Email confirmation (signup)
//  - LinkedIn / Google OAuth
//  - Password reset magic link
// Supabase automatically exchanges the URL tokens here.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // getSession() alone is unreliable here — Supabase may not have finished
    // exchanging the OAuth hash tokens by the time it's called.
    // onAuthStateChange fires after the exchange completes, so we use that as
    // the trigger, with a getSession() fast-path for already-established sessions.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true })
        return
      }

      // No session yet — wait for the SIGNED_IN event from the token exchange
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/login?error=auth_failed', { replace: true })
          }
        }
      )

      // Safety fallback: if nothing fires within 8s, send to login
      const timeout = setTimeout(() => {
        navigate('/login?error=auth_failed', { replace: true })
      }, 8000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    })
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
