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

  const [isCompleting, setIsCompleting] = useState(false)
  const [submitError,  setSubmitError]  = useState(null)

  async function handleComplete(formData) {
    setSubmitError(null)
    setIsCompleting(true)

    const { error } = await finishOnboarding(formData)
    if (error) {
      console.error('[Elevox] Failed to save onboarding:', error)
      setSubmitError(error.message || 'Something went wrong saving your profile.')
      setIsCompleting(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(e => console.warn('[Elevox] Orchestrator trigger failed:', e.message))
    }

    // S5-11: Poll every 5s for active clarification session → redirect to /clarification
    // Re-kick orchestrator every 30s: the pipeline has two stages (sweep_industry →
    // gather_intelligence) each needing a separate invocation. pg_cron handles this
    // in production; re-kicking here ensures it works in QA without cron too.
    const userId    = profile?.id
    const startTime = Date.now()
    let lastKick    = Date.now()

    const kickOrchestrator = () => {
      if (!session) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(e => console.warn('[Elevox] Orchestrator re-kick failed:', e.message))
    }

    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > 180000) {
        clearInterval(pollInterval)
        navigate('/dashboard', { replace: true })
        return
      }

      // Re-kick every 30s to advance the pipeline to the next stage
      if (Date.now() - lastKick >= 30000) {
        lastKick = Date.now()
        kickOrchestrator()
      }

      const { data } = await supabase
        .from('clarification_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.id) {
        clearInterval(pollInterval)
        navigate('/clarification', { replace: true })
      }
    }, 5000)
  }

  const initialData = profile ? dbToFormData(profile) : null

  if (isCompleting) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", color: '#fff',
        textAlign: 'center', padding: '2rem',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #7c3aed, #4f46e5)',
          boxShadow: '0 0 40px rgba(124,58,237,0.6)',
          marginBottom: '2rem',
          animation: 'elevox-pulse 2s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes elevox-pulse {
            0%,100% { transform:scale(1); box-shadow:0 0 40px rgba(124,58,237,0.6); }
            50%      { transform:scale(1.08); box-shadow:0 0 60px rgba(124,58,237,0.9); }
          }
        `}</style>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Chanakya is preparing your profile…
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', maxWidth: 420, lineHeight: 1.7 }}>
          Scanning your industry, mapping the competitive landscape, and crafting
          personalised questions — usually ready in under 90 seconds.
        </p>
      </div>
    )
  }

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
