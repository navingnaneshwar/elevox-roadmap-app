// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Single Supabase client instance shared across the whole app.
// Import { supabase } wherever you need DB or Auth access.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
  },
})

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Fetch the current user's profile row.
 * Returns { data: profile | null, error }
 */
export async function getProfile(userId) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

/**
 * Upsert onboarding data into profiles.
 * Called from OnboardingForm on each step save and on final submit.
 */
export async function upsertProfile(userId, fields) {
  return supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId)
}

/**
 * Mark onboarding as complete and set plan.
 */
export async function completeOnboarding(userId, budget) {
  const plan = budget?.toLowerCase().includes('legacy')    ? 'legacy'
             : budget?.toLowerCase().includes('authority') ? 'authority'
             : 'starter'
  return supabase
    .from('profiles')
    .update({ onboarding_complete: true, plan, updated_at: new Date().toISOString() })
    .eq('id', userId)
}

/**
 * Load calendar settings for the current user.
 * Returns default values if no row exists yet.
 */
export async function getCalendarSettings(userId) {
  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // No row yet — return defaults
    return { data: null, error: null }
  }
  return { data, error }
}

/**
 * Save calendar settings (upsert).
 */
export async function saveCalendarSettings(userId, settings) {
  return supabase
    .from('calendar_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

/**
 * Load all anchor events for the current user.
 */
export async function getAnchorEvents(userId) {
  return supabase
    .from('anchor_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

/**
 * Add or update an anchor event.
 */
export async function upsertAnchorEvent(userId, event) {
  const payload = { user_id: userId, ...event }
  if (event.id) {
    return supabase.from('anchor_events').update(payload).eq('id', event.id)
  }
  return supabase.from('anchor_events').insert(payload).select().single()
}

/**
 * Delete an anchor event by id.
 */
export async function deleteAnchorEvent(eventId) {
  return supabase.from('anchor_events').delete().eq('id', eventId)
}

/**
 * Load all mentor sessions for a user (optionally filter by phase).
 */
export async function getMentorSessions(userId, phaseId = null) {
  let query = supabase
    .from('mentor_sessions')
    .select('*')
    .eq('user_id', userId)

  if (phaseId) query = query.eq('phase_id', phaseId)
  return query.order('started_at', { ascending: false })
}

/**
 * Upsert a mentor session (create or update messages array).
 */
export async function upsertMentorSession(userId, phaseId, componentId, messages, status = 'active') {
  return supabase
    .from('mentor_sessions')
    .upsert({
      user_id:        userId,
      phase_id:       phaseId,
      component_id:   componentId,
      messages,
      status,
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'user_id,phase_id,component_id' })
}

/**
 * Fetch the latest brand brief for a user.
 */
export async function getBrandBrief(userId) {
  return supabase
    .from('brand_briefs')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()
}

/**
 * Save a brand brief (insert new version).
 */
export async function saveBrandBrief(userId, brief) {
  return supabase
    .from('brand_briefs')
    .insert({ user_id: userId, ...brief })
    .select()
    .single()
}

/**
 * Load all deliverables for a user.
 */
export async function getDeliverables(userId) {
  return supabase
    .from('deliverables')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

/**
 * Load content calendar events for a user.
 */
export async function getCalendarEvents(userId) {
  return supabase
    .from('content_calendar')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}
