// src/pages/OnboardingPage.jsx
/* eslint-disable react-refresh/only-export-components */
// ─────────────────────────────────────────────────────────────
// Wraps the existing OnboardingForm, wiring:
//  - onComplete → saves to Supabase + navigates to /dashboard
//  - Pre-fills form with existing profile data if user returns
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import OnboardingForm from '../components/OnboardingForm'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { finishOnboarding, saveStep } = useProfile()

  // Track whether the user has submitted; we navigate only AFTER the profile
  // context has actually updated onboarding_complete → true.  If we call
  // navigate() immediately after finishOnboarding(), React may not have flushed
  // the refreshProfile() state update yet and ProtectedRoute would bounce back.
  const [isCompleting, setIsCompleting] = useState(false)
  const [submitError,  setSubmitError]  = useState(null)

  // Navigate to dashboard once onboarding_complete is true in context
  useEffect(() => {
    if (isCompleting && profile?.onboarding_complete) {
      navigate('/dashboard', { replace: true })
    }
  }, [isCompleting, profile, navigate])

  async function handleComplete(formData) {
    setSubmitError(null)

    const { error } = await finishOnboarding(formData)
    if (error) {
      console.error('[Elevox] Failed to save onboarding:', error)
      setSubmitError(
        error.message ||
        'Something went wrong saving your profile. Please try again.'
      )
      return          // ← do NOT navigate on failure
    }

    // Get the session once — reused for both fire-and-forget calls below
    const { data: { session } } = await supabase.auth.getSession()

    // Immediately kick the orchestrator so the Vox pipeline starts now
    // rather than waiting for the pg_cron 2-minute cycle. Non-fatal.
    if (session) {
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      ).catch(e => console.warn('[Elevox] Orchestrator immediate trigger failed (cron will retry):', e.message))

      // Send welcome email — non-fatal, don't await
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'welcome' }),
        }
      ).catch(e => console.warn('[Elevox] Welcome email failed (non-fatal):', e.message))
    }

    // Signal completion — useEffect above will navigate once
    // profile.onboarding_complete flips to true in context.
    setIsCompleting(true)
  }


  // Convert profile DB row → form camelCase keys for pre-fill
  const initialData = profile ? dbToFormData(profile) : null

  return (
    <OnboardingForm
      onComplete={handleComplete}
      initialData={initialData}
      onSaveProgress={saveStep}
      onSignOut={signOut}
      submitError={submitError}
      isCompleting={isCompleting}
      onSaveAndExit={async (formData) => {
        await saveStep(formData)
        navigate('/dashboard', { replace: true })
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// src/pages/ProfilePage.jsx
// ─────────────────────────────────────────────────────────────
// Wraps ProfileView with real auth context data.
// (Exported as a named export for simplicity)
// ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  return (
    <ProfileView
      profileData={profile ? dbToFormData(profile) : null}
      onStartOnboarding={() => navigate('/onboarding')}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Shared mapper: DB snake_case row → form camelCase object
// Mirrors the reverse mapping in useProfile.js
// ─────────────────────────────────────────────────────────────
export function dbToFormData(profile) {
  if (!profile) return null
  return {
    fullName:             profile.full_name,
    currentTitle:         profile.current_title,
    company:              profile.company,
    companySize:          profile.company_size,
    industry:             profile.industry,
    linkedinUrl:          profile.linkedin_url,
    location:             profile.location,
    email:                profile.email,
    phone:                profile.phone,
    eaName:               profile.ea_name,
    eaEmail:              profile.ea_email,

    careerSummary:        profile.career_summary,
    biggestWin:           profile.biggest_win,
    pivotMoment:          profile.pivot_moment,
    unusualBackground:    profile.unusual_background,
    currentFocus:         profile.current_focus,

    primaryGoal:          profile.primary_goal,
    dreamOutcome:         profile.dream_outcome,
    targetAudience:       profile.target_audience,
    keyPeople:            profile.key_people,
    geographicScope:      profile.geographic_scope,
    timeline:             profile.timeline,

    threeWords:           profile.three_words,
    communicationStyle:   profile.communication_style,
    neverSoundLike:       profile.never_sound_like,
    humorLevel:           profile.humor_level,
    opinionStrength:      profile.opinion_strength,
    existingContent:      profile.existing_content,
    contentYouAdmire:     profile.content_you_admire,

    topicsOwned:          profile.topics_owned,
    topicsAspire:         profile.topics_aspire,
    strongOpinions:       profile.strong_opinions,
    industryTrends:       profile.industry_trends,
    secretWeapon:         profile.secret_weapon,
    contentTaboos:        profile.content_taboos,

    upcomingEvents:       profile.upcoming_events,
    weeklyTime:           profile.weekly_time,
    approvalChannel:      profile.approval_channel,
    approvalTimeframe:    profile.approval_timeframe,
    postingFrequency:     profile.posting_frequency,
    contentFormats:       profile.content_formats,
    ghostwritingComfort:  profile.ghostwriting_comfort,

    peerCxOs:             profile.peer_cxos,
    differentiator:       profile.differentiator,
    reputationNow:        profile.reputation_now,
    brandGaps:            profile.brand_gaps,
    associations:         profile.associations,

    successIn30:          profile.success_in_30,
    successIn90:          profile.success_in_90,
    dealbreakers:         profile.dealbreakers,
    previousAttempts:     profile.previous_attempts,
    budget:               profile.budget,
    plan:                 profile.plan,
    additionalContext:    profile.additional_context,
  }
}

// Also export as named for DashboardPage
export { dbToFormData as profileToFormData }
