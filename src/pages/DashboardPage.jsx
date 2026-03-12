// src/pages/DashboardPage.jsx
// Thin wrapper — passes real profile from auth context to Dashboard
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dashboard from '../components/Dashboard'
import { profileToFormData } from './OnboardingPage'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSwitchTo(screen) {
    const routes = {
      onboarding: '/onboarding',
      profile:    '/profile',
      roadmap:    '/roadmap',
      calendar:   '/calendar',
      upgrade:    '/upgrade',
    }
    if (routes[screen]) navigate(routes[screen])
  }

  return (
    <Dashboard
      profileData={profileToFormData(profile)}
      onSwitchTo={handleSwitchTo}
      onSignOut={signOut}
    />
  )
}

// ── src/pages/OnboardingPage.jsx ──────────────────────────────────────────
// Saves each step to Supabase and redirects to dashboard on complete.
