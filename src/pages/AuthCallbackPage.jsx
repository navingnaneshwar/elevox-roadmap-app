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
    // Supabase client picks up the tokens from the URL hash automatically.
    // We just wait for the session to be established, then redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        // Something went wrong — send them back to login
        navigate('/login?error=auth_failed', { replace: true })
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
