// src/hooks/useProfile.js
// ─────────────────────────────────────────────────────────────
// Maps the camelCase onboarding form field IDs to the
// snake_case database columns and saves them via Supabase.
//
// Usage in OnboardingForm:
//   const { saveStep, completeOnboarding } = useProfile()
//   await saveStep(formData)          // saves partial progress
//   await completeOnboarding(formData) // final submit
// ─────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext'
import { upsertProfile, completeOnboarding as dbCompleteOnboarding } from '../lib/supabase'

// Maps camelCase form field IDs → snake_case DB column names
const FIELD_MAP = {
  fullName:             'full_name',
  currentTitle:         'current_title',
  company:              'company',
  companySize:          'company_size',
  industry:             'industry',
  linkedinUrl:          'linkedin_url',
  location:             'location',
  email:                'email',
  phone:                'phone',
  eaName:               'ea_name',
  eaEmail:              'ea_email',

  careerSummary:        'career_summary',
  biggestWin:           'biggest_win',
  pivotMoment:          'pivot_moment',
  unusualBackground:    'unusual_background',
  currentFocus:         'current_focus',

  primaryGoal:          'primary_goal',
  dreamOutcome:         'dream_outcome',
  targetAudience:       'target_audience',
  keyPeople:            'key_people',
  geographicScope:      'geographic_scope',
  timeline:             'timeline',

  threeWords:           'three_words',
  communicationStyle:   'communication_style',
  neverSoundLike:       'never_sound_like',
  humorLevel:           'humor_level',
  opinionStrength:      'opinion_strength',
  existingContent:      'existing_content',
  contentYouAdmire:     'content_you_admire',

  topicsOwned:          'topics_owned',
  topicsAspire:         'topics_aspire',
  strongOpinions:       'strong_opinions',
  industryTrends:       'industry_trends',
  secretWeapon:         'secret_weapon',
  contentTaboos:        'content_taboos',

  upcomingEvents:       'upcoming_events',
  weeklyTime:           'weekly_time',
  approvalChannel:      'approval_channel',
  approvalTimeframe:    'approval_timeframe',
  postingFrequency:     'posting_frequency',
  contentFormats:       'content_formats',
  ghostwritingComfort:  'ghostwriting_comfort',

  peerCxOs:             'peer_cxos',
  differentiator:       'differentiator',
  reputationNow:        'reputation_now',
  brandGaps:            'brand_gaps',
  associations:         'associations',

  successIn30:          'success_in_30',
  successIn90:          'success_in_90',
  dealbreakers:         'dealbreakers',
  previousAttempts:     'previous_attempts',
  budget:               'budget',
  additionalContext:    'additional_context',
}

function mapFormToDb(formData) {
  const dbRow = {}
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (formData[camel] !== undefined) {
      dbRow[snake] = formData[camel]
    }
  }
  return dbRow
}

export function useProfile() {
  const { user, refreshProfile } = useAuth()

  /**
   * Save a partial step of onboarding to the database.
   * Call this when the user advances past each step.
   * @param {object} formData - the full form state object
   */
  async function saveStep(formData) {
    if (!user) return { error: new Error('Not authenticated') }

    const dbRow = mapFormToDb(formData)
    const { error } = await upsertProfile(user.id, dbRow)

    if (!error) await refreshProfile()
    return { error }
  }

  /**
   * Final onboarding submit.
   * Saves all data, marks onboarding_complete = true, sets plan.
   * @param {object} formData - the full form state object
   */
  async function finishOnboarding(formData) {
    if (!user) return { error: new Error('Not authenticated') }

    const dbRow = mapFormToDb(formData)

    // Save all the form data first
    const { error: saveError } = await upsertProfile(user.id, dbRow)
    if (saveError) return { error: saveError }

    // Then mark complete and extract plan from budget field
    const { error: completeError } = await dbCompleteOnboarding(user.id, formData.budget)
    if (completeError) return { error: completeError }

    await refreshProfile()
    return { error: null }
  }

  return { saveStep, finishOnboarding }
}
