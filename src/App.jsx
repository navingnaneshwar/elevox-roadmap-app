// src/App.jsx — React Router root. All routes defined here.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import LoginPage        from './pages/LoginPage'
import SignupPage       from './pages/SignupPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// Protected pages
import DashboardPage   from './pages/DashboardPage'
import OnboardingPage  from './pages/OnboardingPage'
import ProfilePage     from './pages/ProfilePage'
import BrandBriefPage       from './pages/BrandBriefPage'
import CoachingSessionPage  from './pages/CoachingSessionPage'
import BillingPage     from './pages/BillingPage'

import Roadmap           from './components/Roadmap'
import ContentCalendar     from './components/ContentCalendar'
import LandingPage         from './pages/LandingPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public ──────────────────────────────────── */}
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/signup"        element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* ── Protected ───────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* skipOnboardingCheck — avoids redirect loop on the onboarding page itself */}
          <Route path="/onboarding" element={
            <ProtectedRoute skipOnboardingCheck><OnboardingPage /></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute><Roadmap /></ProtectedRoute>
          } />

          <Route path="/calendar" element={
            <ProtectedRoute><ContentCalendar /></ProtectedRoute>
          } />

          {/* Coaching session — phase + component driven */}
          <Route path="/coach/:phaseId/:componentId" element={
            <ProtectedRoute><CoachingSessionPage /></ProtectedRoute>
          } />

          <Route path="/brand-brief" element={
            <ProtectedRoute><BrandBriefPage /></ProtectedRoute>
          } />

          <Route path="/billing" element={
            <ProtectedRoute><BillingPage /></ProtectedRoute>
          } />

          <Route path="/website" element={
            <ProtectedRoute><LandingPage /></ProtectedRoute>
          } />

          {/* Root → dashboard (ProtectedRoute redirects to /login if needed) */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
