// src/components/ProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────
// Wraps any route that requires authentication.
// Redirects:
//   • Not logged in          → /login
//   • Logged in, no onboard  → /onboarding
//   • Wrong plan for route   → /upgrade
//
// Usage:
//   <Route path="/dashboard" element={
//     <ProtectedRoute><Dashboard /></ProtectedRoute>
//   } />
//
//   <Route path="/phase/:id" element={
//     <ProtectedRoute requiredPlan="authority"><Phase /></ProtectedRoute>
//   } />
// ─────────────────────────────────────────────────────────────
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
        minHeight: '100vh',
        background: '#070B14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

  // Not authenticated → go to login, remember where they were going
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but onboarding not complete → go to onboarding
  // (allow /onboarding itself through by checking skipOnboardingCheck)
  if (profile && !profile.onboarding_complete && !skipOnboardingCheck) {
    return <Navigate to="/onboarding" replace />
  }

  // Plan gate — only check if a requiredPlan is specified
  if (requiredPlan && profile && !hasPlan(profile.plan, requiredPlan)) {
    return <Navigate to="/upgrade" state={{ requiredPlan }} replace />
  }

  return children
}
