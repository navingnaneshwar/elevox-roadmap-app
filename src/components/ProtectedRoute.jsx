// src/components/ProtectedRoute.jsx
// Auth guard. Props:
//   requiredPlan        — 'starter' | 'authority' | 'legacy'  (optional)
//   skipOnboardingCheck — true for the /onboarding route itself
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PLAN_RANK = { starter: 0, authority: 1, legacy: 2 }

function hasPlan(userPlan, requiredPlan) {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0)
}

export default function ProtectedRoute({ children, requiredPlan = null, skipOnboardingCheck = false }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#070B14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid #1E2A3E',
          borderTop: '2px solid #C8A96E',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Not authenticated → login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but onboarding incomplete → /onboarding
  // (skip this check on the onboarding route itself to avoid redirect loop)
  if (!skipOnboardingCheck && profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Plan gate
  if (requiredPlan && profile && !hasPlan(profile.plan, requiredPlan)) {
    return <Navigate to="/upgrade" state={{ requiredPlan }} replace />
  }

  return children
}
