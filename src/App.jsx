// src/App.jsx
// ─────────────────────────────────────────────────────────────
// Root router. Replaces the old useState-based navigation.
//
// HOW TO MIGRATE FROM THE OLD App.jsx:
//  1. Delete the old navItems + activeComponent useState
//  2. Delete the conditional rendering block at the bottom
//  3. Replace with this file in full
//  4. Wrap <App /> in <AuthProvider> in main.jsx (see below)
// ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import LoginPage        from './pages/LoginPage'
import SignupPage       from './pages/SignupPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import UpgradePage      from './pages/UpgradePage'
import BrandBriefPage   from './pages/BrandBriefPage'

// Protected pages (existing components — just re-exported from pages/)
import Dashboard          from './components/Dashboard'
import OnboardingForm     from './components/OnboardingForm'
import ProfileView        from './components/ProfileView'
import Roadmap            from './components/Roadmap'
import CalendarLogistics  from './components/CalendarLogistics'

// ── Thin page wrappers that pass auth context to existing components ──────
import DashboardPage    from './pages/DashboardPage'
import OnboardingPage   from './pages/OnboardingPage'
import ProfilePage      from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public routes ────────────────────────────── */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/signup"         element={<SignupPage />} />
          <Route path="/auth/callback"  element={<AuthCallbackPage />} />

          {/* ── Protected routes ─────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          <Route path="/onboarding" element={
            // Onboarding is protected (must be logged in) but
            // doesn't require onboarding_complete — that's its purpose
            <ProtectedRoute skipOnboardingCheck><OnboardingPage /></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute><Roadmap /></ProtectedRoute>
          } />

          <Route path="/calendar" element={
            <ProtectedRoute><CalendarLogistics /></ProtectedRoute>
          } />

          <Route path="/brand-brief" element={
            <ProtectedRoute><BrandBriefPage /></ProtectedRoute>
          } />

          <Route path="/upgrade" element={
            <ProtectedRoute><UpgradePage /></ProtectedRoute>
          } />

          {/* Redirect root to dashboard (ProtectedRoute handles auth) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
