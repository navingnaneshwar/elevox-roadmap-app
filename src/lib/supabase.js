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
  // ⚠️ BETA OVERRIDE: All testers get 'authority' plan to unlock the full pipeline.
  // TODO: Revert to budget-derived plan logic before commercial launch.
  // Original: 'legacy' | 'authority' | 'starter' based on budget field
  const plan = 'authority'

  const { error } = await supabase.from('profiles').update({
    onboarding_complete: true,
    plan,
    plan_status: 'trialing',   // grant AI mentor access on signup
    updated_at: new Date().toISOString()
  }).eq('id', userId)

  if (error) return { error }

  // Kick off the Vox agent pipeline:
  // Analyst (discovery sweep) → Strategist (brand framework) → Analyst (news sweep)
  // → Machiavelli (reserve slot) → Shakespeare (draft) → Aristotle (edit) → Machiavelli (schedule)
  const { error: jobError } = await supabase.from('agent_jobs').insert({
    user_id:  userId,
    job_type: 'run_discovery_sweep',
    status:   'pending',
    payload:  {},
  })

  if (jobError) {
    console.error('[Elevox] Failed to queue Vox pipeline after onboarding:', jobError)
    // Non-fatal — profile is saved, but agent won't auto-run
    // User can manually trigger from dashboard
  }

  return { error: null }
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

export async function getBrandFramework(userId) {
  return supabase
    .from('brand_frameworks')
    .select('archetype, mentor_memo, voice_traits, content_pillars, mentor_insights, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
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

export async function saveContentDraft(userId, draftData) {
  return supabase.from('content_drafts').insert({
    user_id: userId,
    status: 'approved',
    hook_text: draftData.angle || 'AI Draft',
    body_text: draftData.body,
    platform: draftData.platform || 'LinkedIn',
    framework_id: draftData.framework_id || 'ghostwriter',
    briefing_id: draftData.anchor_event_id || null
  }).select().single()
}

// ── Sprint 4: Human Approval Queue ────────────────────────────

export async function getPendingApprovals(userId) {
  return supabase
    .from('content_drafts')
    .select('*, brand_frameworks(archetype, voice_traits, content_pillars)')
    .eq('user_id', userId)
    .eq('approved_for_publish', true)
    .is('human_approved_at', null)
    .is('human_rejected_at', null)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
}

export async function approveContentDraft(draftId, userId, editedBody = null) {
  const updates = {
    human_approved_at: new Date().toISOString(),
    human_approved_by: userId,
    status: 'human_approved',
  }
  if (editedBody !== null) updates.body_text = editedBody
  return supabase.from('content_drafts').update(updates).eq('id', draftId)
}

export async function rejectContentDraft(draftId, note) {
  return supabase.from('content_drafts').update({
    human_rejected_at: new Date().toISOString(),
    rejection_note: note,
    status: 'rejected',
  }).eq('id', draftId)
}

export async function saveEditToDraft(draftId, bodyText) {
  return supabase.from('content_drafts').update({ body_text: bodyText }).eq('id', draftId)
}

// ── Sprint 4: Coaching Alerts ───────────────────────────────

export async function getPendingCoachingAlerts(userId) {
  return supabase
    .from('coaching_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
}

export async function acknowledgeCoachingAlert(alertId) {
  return supabase.from('coaching_alerts').update({ status: 'acknowledged' }).eq('id', alertId)
}

// ── Sprint 4: Voice Examples (voice learning) ────────────────

export async function getVoiceExamples(userId, limit = 5) {
  return supabase
    .from('voice_examples')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function saveVoiceExample(userId, { source, originalText, finalText, editDelta, contentPillar }) {
  return supabase.from('voice_examples').insert({
    user_id:       userId,
    source,
    original_text: originalText ?? null,
    final_text:    finalText,
    edit_delta:    editDelta ?? null,
    content_pillar: contentPillar ?? null,
  }).select().single()
}

// ── Sprint 4: User-submitted drafts ─────────────────────────

export async function saveUserSubmittedDraft(userId, { bodyText, frameworkId }) {
  return supabase.from('content_drafts').insert({
    user_id:     userId,
    body_text:   bodyText,
    status:      'user_submitted',
    source:      'user_submitted',
    framework_id: frameworkId ?? null,
    platform:    'linkedin',
  }).select().single()
}

