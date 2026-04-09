// src/pages/OnboardingPage.jsx
/* eslint-disable react-refresh/only-export-components */
// ─────────────────────────────────────────────────────────────
// Wraps the existing OnboardingForm, wiring:
//  - onComplete → saves to Supabase + navigates to /dashboard
//  - Pre-fills form with existing profile data if user returns
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import OnboardingForm from '../components/OnboardingForm'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { finishOnboarding, saveStep } = useProfile()

  async function handleComplete(formData) {
    const { error } = await finishOnboarding(formData)
    if (error) {
      console.error('Failed to save onboarding:', error)
      // Non-fatal — still proceed so user isn't stuck
    }

    const { data: { session } } = await supabase.auth.getSession()

    // ─── S5-03: Two-Stage Chanakya — queue gather_intelligence ───
    // Instead of immediately building the framework, Chanakya first
    // reads the profile, identifies gaps, and formulates 3-5 targeted
    // questions specific to THIS executive. The user then answers
    // them on /clarification before Stage 2 (build_framework) runs.
    if (session) {
      try {
        const { error: jobError } = await supabase
          .from('agent_jobs')
          .insert({
            user_id:  session.user.id,
            job_type: 'gather_intelligence',
            payload:  {},
          })

        if (jobError) throw jobError

        // Immediately kick the orchestrator to process the job now
        // (rather than waiting for the 2-min pg_cron cycle)
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`,
          {
            method:  'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type':  'application/json',
            },
            body: JSON.stringify({}),
          }
        )
        console.log('[Elevox] gather_intelligence job queued — Chanakya reviewing profile')
      } catch (jobErr) {
        // Non-fatal — pg_cron will pick it up within 2 min
        console.warn('[Elevox] gather_intelligence queue failed (will retry via cron):', jobErr.message)
      }
    }

    // ─── Send welcome email (non-blocking) ───────────────────────
    if (session) {
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ type: 'welcome' }),
        }
      ).catch(e => console.warn('Welcome email failed (non-fatal):', e.message))
    }

    // ─── Redirect to clarification page ──────────────────────────
    // Chanakya's questions will be ready within a few seconds.
    // ClarificationPage polls for the pending clarification_session.
    navigate('/clarification', { replace: true })
  }


  // Convert profile DB row → form camelCase keys for pre-fill
  const initialData = profile ? dbToFormData(profile) : null

  return (
    <OnboardingForm
      onComplete={handleComplete}
      initialData={initialData}
      onSaveProgress={saveStep}
      onSignOut={signOut}
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

    // S5-06 Sprint 5 fields
    roleTenure:           profile.role_tenure,
    boardRoles:           profile.board_roles,
    companyStage:         profile.company_stage,
    credibilityInventory: profile.credibility_inventory,
    builtFromScratch:     profile.built_from_scratch,
    firstOfAKind:         profile.first_of_a_kind,
    recognition:          profile.recognition,
    originMoment:         profile.origin_moment,
    targetPersona:        profile.target_persona,
    desiredAction:        profile.desired_action,
    audienceOnline:       profile.audience_online,
    warmRelationships:    profile.warm_relationships,
    vulnerabilityComfort: profile.vulnerability_comfort,
    nervousTopics:        profile.nervous_topics,
    instantDeleteTriggers:profile.instant_delete_triggers,
    contrarianThesis:     profile.contrarian_thesis,
    platformPreferences:  profile.platform_preferences,
    platformsToAvoid:     profile.platforms_to_avoid,
    videoComfort:         profile.video_comfort,
    writingStyle:         profile.writing_style,
    competitiveWhitespace:profile.competitive_whitespace,
    contentDislike:       profile.content_dislike,
    earlySignal:          profile.early_signal,
    linkedinFollowing:    profile.linkedin_following,
    currentEngagement:    profile.current_engagement,
  }
}

// Also export as named for DashboardPage
export { dbToFormData as profileToFormData }
