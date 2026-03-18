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
    // onAuthStateChange fires INITIAL_SESSION immediately (session=null while
    // tokens are still being exchanged), then SIGNED_IN once exchange completes.
    // We only act when session is present, or on an explicit SIGNED_OUT.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard', { replace: true })
      } else if (event === 'SIGNED_OUT') {
        navigate('/login?error=auth_failed', { replace: true })
      }
      // INITIAL_SESSION with no session = exchange still in progress, wait
    })

    // Safety fallback: if SIGNED_IN never fires within 10s something went wrong
    const timeout = setTimeout(() => {
      navigate('/login?error=auth_failed', { replace: true })
    }, 10000)

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
