// src/pages/AuthCallbackPage.jsx
// ─────────────────────────────────────────────────────────────
// Handles redirect after LinkedIn / Google OAuth, email confirm,
// and password reset.
//
// IMPLICIT FLOW: Supabase processes #access_token from the URL hash
// immediately on client init — BEFORE this component mounts.
// So onAuthStateChange fires INITIAL_SESSION (not SIGNED_IN) with
// the session already set. We must handle BOTH events.
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

    // Handle both INITIAL_SESSION (implicit flow — tokens already parsed from hash)
    // and SIGNED_IN (PKCE flow — fires after async code exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        go('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        go('/login?error=auth_failed')
      }
      // INITIAL_SESSION with session=null = still exchanging, wait
    })

    // Safety net: after 30s do a final check
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
