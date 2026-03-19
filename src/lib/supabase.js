// src/lib/supabase.js
// Single Supabase client. Degrades gracefully when env vars are missing
// so the app renders (with limited functionality) before Supabase is wired.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

const CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON)

if (!CONFIGURED) {
  console.warn(
    '[Elevox] Supabase env vars missing.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and Vercel.\n' +
    'App will run in demo mode — auth and DB calls will not work.'
  )
}

// Create real client or a stub that returns empty results gracefully
export const supabase = CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        autoRefreshToken:   true,
        persistSession:     true,
        detectSessionInUrl: true,
      },
    })
  : createStubClient()

function createStubClient() {
  const noop = () => Promise.resolve({ data: null, error: null })
  const queryBuilder = { select: () => queryBuilder, eq: () => queryBuilder, order: () => queryBuilder, limit: () => queryBuilder, single: noop, then: noop }
  return {
    auth: {
      getSession:        () => Promise.resolve({ data: { session: null } }),
      getUser:           () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: noop,
      signUp:            noop,
      signOut:           noop,
      signInWithOAuth:   noop,
      resetPasswordForEmail: noop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ select: () => queryBuilder, insert: () => queryBuilder, update: () => queryBuilder, upsert: () => queryBuilder, delete: () => queryBuilder }),
  }
}

// ─── DB Helpers ───────────────────────────────────────────────

export async function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function upsertProfile(userId, fields) {
  return supabase.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', userId)
}

export async function completeOnboarding(userId, budget) {
  const plan = (budget || '').toLowerCase().includes('legacy')    ? 'legacy'
             : (budget || '').toLowerCase().includes('authority') ? 'authority'
             : 'starter'
  return supabase.from('profiles').update({
    onboarding_complete: true,
    plan,
    plan_status: 'trialing',   // grant AI mentor access on signup
    updated_at: new Date().toISOString()
  }).eq('id', userId)
}

export async function getCalendarSettings(userId) {
  const { data, error } = await supabase.from('calendar_settings').select('*').eq('user_id', userId).single()
  if (error && error.code === 'PGRST116') return { data: null, error: null }
  return { data, error }
}

export async function saveCalendarSettings(userId, settings) {
  return supabase.from('calendar_settings').upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }).eq('user_id', userId)
}

export async function getAnchorEvents(userId) {
  return supabase.from('anchor_events').select('*').eq('user_id', userId).order('created_at', { ascending: false })
}

export async function upsertAnchorEvent(userId, event) {
  const payload = { user_id: userId, ...event }
  if (event.id) return supabase.from('anchor_events').update(payload).eq('id', event.id)
  return supabase.from('anchor_events').insert(payload).select().single()
}

export async function deleteAnchorEvent(eventId) {
  return supabase.from('anchor_events').delete().eq('id', eventId)
}

export async function getMentorSessions(userId, phaseId = null) {
  let query = supabase.from('mentor_sessions').select('*').eq('user_id', userId)
  if (phaseId) query = query.eq('phase_id', phaseId)
  return query.order('started_at', { ascending: false })
}

export async function upsertMentorSession(userId, phaseId, componentId, messages, status = 'active') {
  return supabase.from('mentor_sessions').upsert({
    user_id: userId, phase_id: phaseId, component_id: componentId,
    messages, status, last_active_at: new Date().toISOString(),
  }, { onConflict: 'user_id,phase_id,component_id' })
}

export async function getBrandBrief(userId) {
  return supabase.from('brand_briefs').select('*').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).single()
}

export async function saveBrandBrief(userId, brief) {
  return supabase.from('brand_briefs').insert({ user_id: userId, ...brief }).select().single()
}

export async function getDeliverables(userId) {
  return supabase.from('deliverables').select('*').eq('user_id', userId).order('created_at', { ascending: false })
}

export async function getCalendarEvents(userId) {
  return supabase.from('content_calendar').select('*').eq('user_id', userId).order('created_at', { ascending: false })
}
