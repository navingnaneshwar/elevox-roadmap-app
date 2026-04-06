// src/pages/DashboardPage.jsx
// Thin wrapper — passes real profile from auth context to Dashboard component.
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dashboard from '../components/Dashboard'
import { profileToFormData } from './OnboardingPage'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSwitchTo(screen) {
    const routes = {
      onboarding:   '/onboarding',
      profile:      '/profile',
      roadmap:      '/roadmap',
      calendar:     '/calendar',
      'brand-brief': '/brand-brief',
    }
    if (routes[screen]) navigate(routes[screen])
  }

  return (
    <Dashboard
      profileData={profile ? profileToFormData(profile) : null}
      onSwitchTo={handleSwitchTo}
      onSignOut={signOut}
    />
  )
}
