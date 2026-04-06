// src/pages/ClarificationPage.jsx
// ─────────────────────────────────────────────────────────────
// Sprint 5, S5-04 — Two-Stage Chanakya: Stage 1 Response UI
//
// After Chanakya reads the onboarding profile, it generates
// 3-5 targeted follow-up questions specific to THIS executive.
// This page presents Chanakya's initial read and collects answers
// in a warm, advisor-to-executive conversational tone.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ClarificationPage() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const [session,    setSession]   = useState(null)
  const [answers,    setAnswers]   = useState({})
  const [loading,    setLoading]   = useState(true)
  const [isPolling,  setIsPolling] = useState(false)
  const [submitting, setSubmitting]= useState(false)
  const [error,      setError]     = useState(null)
  const [pollDots,   setPollDots]  = useState('.')

  // Animated dots for the waiting state
  useEffect(() => {
    if (!isPolling) return
    const t = setInterval(() => setPollDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(t)
  }, [isPolling])

  useEffect(() => {
    if (!user) return
    loadPendingSession()
  }, [user])

  async function loadPendingSession(attempt = 0) {
    const MAX_ATTEMPTS = 18  // 18 × 2.5s = 45s max wait
    const POLL_INTERVAL = 2500

    if (attempt === 0) { setLoading(true); setIsPolling(false) }
    if (attempt > 0)   { setIsPolling(true) }

    const { data, error } = await supabase
      .from('clarification_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data && !error) {
      // Session ready
      setSession(data)
      const initial = {}
      ;(data.questions || []).forEach((_, i) => { initial[i] = '' })
      setAnswers(initial)
      setLoading(false)
      setIsPolling(false)
      return
    }

    // Not ready yet — retry
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => loadPendingSession(attempt + 1), POLL_INTERVAL)
      return
    }

    // Timed out — fall back to dashboard
    console.warn('[Clarification] No session found after 45s — redirecting to dashboard')
    navigate('/dashboard')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validate all questions answered
    const questions = session.questions || []
    const allAnswered = questions.every((_, i) => answers[i]?.trim().length > 0)
    if (!allAnswered) {
      setError('Please answer all of Chanakya\'s questions before proceeding.')
      setSubmitting(false)
      return
    }

    try {
      // Save answers to clarification_sessions
      const { error: updateErr } = await supabase
        .from('clarification_sessions')
        .update({
          user_responses: answers,
          status:         'answered',
          answered_at:    new Date().toISOString(),
        })
        .eq('id', session.id)

      if (updateErr) throw updateErr

      // Queue Stage 2: build_framework with clarification context
      await supabase.from('agent_jobs').insert({
        user_id:  user.id,
        job_type: 'build_framework',
        payload:  { clarification_session_id: session.id },
      })

      navigate('/dashboard', { state: { fromClarification: true } })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function handleSkip() {
    // Mark session as answered with empty responses, proceed to direct build_framework
    supabase
      .from('clarification_sessions')
      .update({ status: 'answered', user_responses: {}, answered_at: new Date().toISOString() })
      .eq('id', session.id)
      .then(() => {
        supabase.from('agent_jobs').insert({
          user_id:  user.id,
          job_type: 'build_framework',
          payload:  { clarification_session_id: session.id },
        }).then(() => navigate('/dashboard'))
      })
  }

  if (loading) {
    const steps = [
      'Reading your profile',
      'Identifying strategic gaps',
      'Formulating targeted questions',
      'Preparing your personal read',
    ]
    return (
      <div style={styles.page}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '32px', maxWidth: '480px', textAlign: 'center', paddingTop: '60px'
        }}>
          {/* Chanakya badge */}
          <div style={styles.chanakyaBadge}>
            <span style={styles.chanakyaIcon}>⚡</span>
            <span style={styles.chanakyaLabel}>Chanakya</span>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#F1F5F9', marginBottom: '12px', lineHeight: 1.3 }}>
              Reviewing your profile{pollDots}
            </h1>
            <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              Chanakya is reading everything you shared and identifying the
              questions that will make the biggest difference to your brand strategy.
            </p>
          </div>

          {/* Step list */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', padding: '12px 16px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: isPolling ? 'linear-gradient(135deg,#C8A96E,#A07840)' : '#1E2A3E',
                  boxShadow: isPolling ? '0 0 8px rgba(200,169,110,0.5)' : 'none',
                  transition: 'all 0.4s',
                  animationDelay: `${i * 0.15}s`,
                }} />
                <span style={{ fontSize: '14px', color: isPolling ? '#94A3B8' : '#1E2A3E', transition: 'color 0.4s' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: '#1E2A3E', margin: 0 }}>
            Usually takes 10–20 seconds
          </p>
        </div>
      </div>
    )
  }

  const questions = session?.questions || []

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.chanakyaBadge}>
          <span style={styles.chanakyaIcon}>⚡</span>
          <span style={styles.chanakyaLabel}>Chanakya</span>
        </div>
        <p style={styles.headerSub}>Your Executive Brand Strategist</p>
      </div>

      <div style={styles.container}>
        {/* What Chanakya found */}
        <div style={styles.findingsCard}>
          <h2 style={styles.findingsTitle}>Here is what I understood about you.</h2>
          <p style={styles.findingsText}>{session?.chanakya_summary}</p>

          {session?.strongest_signal && (
            <div style={styles.signalBox}>
              <p style={styles.signalLabel}>YOUR STRONGEST SIGNAL</p>
              <p style={styles.signalText}>{session.strongest_signal}</p>
            </div>
          )}

          {session?.assumptions_made && (
            <div style={styles.assumptionsBox}>
              <p style={styles.assumptionsLabel}>ASSUMPTIONS I AM MAKING</p>
              <p style={styles.assumptionsText}>{session.assumptions_made}</p>
            </div>
          )}
        </div>

        {/* What Chanakya needs */}
        <div style={styles.questionsSection}>
          <h3 style={styles.questionsTitle}>Here is what I still need to know.</h3>
          <p style={styles.questionsSubtitle}>
            These are not generic questions. They are specific to your profile and will directly shape your brand strategy.
          </p>

          <form onSubmit={handleSubmit}>
            {questions.map((q, i) => (
              <div key={i} style={styles.questionBlock}>
                <div style={styles.questionMeta}>
                  {q.why_it_matters && (
                    <p style={styles.whyMatters}>Why this matters: {q.why_it_matters}</p>
                  )}
                </div>
                <label style={styles.questionLabel}>{q.question}</label>
                <textarea
                  style={styles.textarea}
                  value={answers[i] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Be specific and honest — this is between you and your strategist."
                  rows={3}
                />
              </div>
            ))}

            {error && <p style={styles.errorText}>{error}</p>}

            <div style={styles.actions}>
              <button type="submit" style={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Sending to Chanakya…' : 'Send My Answers →'}
              </button>
              <button type="button" style={styles.skipBtn} onClick={handleSkip} disabled={submitting}>
                Skip — Build framework with what you have
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:       '100vh',
    background:      '#070B14',
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    padding:         '40px 20px',
    fontFamily:      "'Inter', sans-serif",
    color:           '#F1F5F9',
  },
  spinner: {
    width: '32px', height: '32px',
    border: '2px solid #1E2A3E', borderTop: '2px solid #C8A96E',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#64748B', fontSize: '14px', marginTop: '16px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  chanakyaBadge: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    background:     'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
    border:         '1px solid rgba(200,169,110,0.3)',
    borderRadius:   '100px',
    padding:        '8px 20px',
    marginBottom:   '12px',
  },
  chanakyaIcon:   { fontSize: '16px' },
  chanakyaLabel:  { color: '#C8A96E', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' },
  headerSub:      { color: '#64748B', fontSize: '13px', margin: 0 },
  container:      { width: '100%', maxWidth: '720px' },
  findingsCard:   {
    background:   'rgba(255,255,255,0.03)',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding:      '32px',
    marginBottom: '32px',
  },
  findingsTitle:  { fontSize: '22px', fontWeight: 700, color: '#F1F5F9', marginBottom: '16px', lineHeight: 1.3 },
  findingsText:   { fontSize: '16px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '24px' },
  signalBox: {
    background:   'rgba(200,169,110,0.08)',
    border:       '1px solid rgba(200,169,110,0.2)',
    borderRadius: '10px',
    padding:      '16px 20px',
    marginBottom: '16px',
  },
  signalLabel:    { fontSize: '11px', fontWeight: 700, color: '#C8A96E', letterSpacing: '0.1em', marginBottom: '8px' },
  signalText:     { fontSize: '15px', color: '#F1F5F9', lineHeight: 1.6, margin: 0 },
  assumptionsBox: {
    background:   'rgba(100,116,139,0.08)',
    border:       '1px solid rgba(100,116,139,0.2)',
    borderRadius: '10px',
    padding:      '16px 20px',
  },
  assumptionsLabel: { fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: '8px' },
  assumptionsText:  { fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: 0 },
  questionsSection: { marginBottom: '40px' },
  questionsTitle:   { fontSize: '20px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' },
  questionsSubtitle:{ fontSize: '14px', color: '#64748B', marginBottom: '32px', lineHeight: 1.6 },
  questionBlock: {
    background:   'rgba(255,255,255,0.02)',
    border:       '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding:      '24px',
    marginBottom: '16px',
  },
  questionMeta:  { marginBottom: '10px' },
  whyMatters:    { fontSize: '12px', color: '#C8A96E', fontStyle: 'italic', margin: '0 0 10px' },
  questionLabel: { display: 'block', fontSize: '16px', fontWeight: 500, color: '#F1F5F9', marginBottom: '12px', lineHeight: 1.5 },
  textarea:      {
    width:        '100%',
    background:   '#0D1220',
    border:       '1px solid #1E2A3E',
    borderRadius: '8px',
    color:        '#F1F5F9',
    fontSize:     '15px',
    padding:      '12px 16px',
    fontFamily:   "'Inter', sans-serif",
    lineHeight:   1.6,
    resize:       'vertical',
    boxSizing:    'border-box',
    outline:      'none',
    transition:   'border-color 0.15s',
  },
  errorText:   { color: '#EF4444', fontSize: '14px', marginTop: '16px', textAlign: 'center' },
  actions:     { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', alignItems: 'center' },
  primaryBtn:  {
    width:          '100%',
    maxWidth:       '400px',
    padding:        '16px 32px',
    background:     'linear-gradient(135deg, #C8A96E, #A07840)',
    color:          '#070B14',
    border:         'none',
    borderRadius:   '10px',
    fontSize:       '16px',
    fontWeight:     700,
    cursor:         'pointer',
    transition:     'opacity 0.2s',
  },
  skipBtn:     {
    background:   'transparent',
    border:       'none',
    color:        '#4B5563',
    fontSize:     '13px',
    cursor:       'pointer',
    textDecoration:'underline',
    padding:      '4px 8px',
  },
}
