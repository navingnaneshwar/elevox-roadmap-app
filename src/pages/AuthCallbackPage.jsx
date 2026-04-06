// src/pages/AuthCallbackPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles redirect after:
//  - Email confirmation (signup)
//  - LinkedIn / Google OAuth (PKCE flow)
//  - Password reset magic link
// With PKCE, Supabase exchanges the auth code asynchronously.
// We MUST wait for onAuthStateChange rather than calling getSession()
// immediately, which would fire before the code exchange completes.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let handled = false

    // Primary: listen for auth state change (works for PKCE + implicit)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled) return
      if (event === 'SIGNED_IN' && session) {
        handled = true
        navigate('/dashboard', { replace: true })
      } else if (event === 'SIGNED_OUT') {
        handled = true
        navigate('/login?error=auth_failed', { replace: true })
      }
    })

    // Fallback: if session already exists (e.g. implicit flow resolved first)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (handled) return
      if (session) {
        handled = true
        navigate('/dashboard', { replace: true })
      }
    })

    // Safety timeout: if nothing resolves in 12s, redirect to login
    const timeout = setTimeout(() => {
      if (handled) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        handled = true
        if (session) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/login?error=auth_failed', { replace: true })
        }
      })
    }, 12000)

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
