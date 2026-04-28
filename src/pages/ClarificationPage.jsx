// src/pages/ClarificationPage.jsx
// S5-04: Two-Stage Chanakya — conversational clarification UI.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import { AGENTS } from '../lib/agents'

const CATEGORY_META = {
  career_anchors:      { label: 'Career Anchors',      color: '#C8A96E', icon: '◈' },
  contrarian_view:     { label: 'Market Position',     color: '#8B6DAA', icon: '◆' },
  audience_definition: { label: 'Your Audience',       color: '#5B8FA8', icon: '◎' },
  platform_strategy:   { label: 'Platform Strategy',   color: '#4A9E7A', icon: '◉' },
  voice_tone:          { label: 'Voice & Tone',         color: '#C85A5A', icon: '◐' },
  mission_legacy:      { label: 'Mission & Legacy',     color: '#E8935A', icon: '◇' },
}

export default function ClarificationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession]         = useState(null)
  const [questions, setQuestions]     = useState([])
  const [answers, setAnswers]         = useState({})
  const [intro, setIntro]             = useState('')
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState(null)
  const [draftAnswer, setDraftAnswer] = useState('')

  // Load active clarification session for this user
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error: err } = await supabase
        .from('clarification_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (err || !data) {
        // No active session — go to dashboard
        navigate('/dashboard')
        return
      }

      setSession(data)
      setQuestions(data.questions ?? [])
      setAnswers(data.answers ?? {})
      setIntro(data.context_summary || '')   // Chanakya's personalised opening
      setLoading(false)
    })()
  }, [user])

  const currentQ = questions[currentIdx]
  const isLast   = currentIdx === questions.length - 1
  const progress = questions.length ? Math.round(((currentIdx) / questions.length) * 100) : 0

  // Save current answer and advance
  const handleNext = async () => {
    if (!draftAnswer.trim()) return
    const updated = { ...answers, [currentQ.id]: draftAnswer.trim() }
    setAnswers(updated)
    setDraftAnswer('')

    // Persist answers to DB
    await supabase
      .from('clarification_sessions')
      .update({ answers: updated, updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (isLast) {
      await handleSubmitAll(updated)
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  const handleSubmitAll = async (finalAnswers) => {
    setSubmitting(true)
    try {
      // Mark session complete + ready_for_framework
      await supabase
        .from('clarification_sessions')
        .update({
          status: 'complete',
          answers: finalAnswers,
          ready_for_framework: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      // Queue Chanakya Stage 2 — build_framework with enriched context
      await supabase
        .from('agent_jobs')
        .insert({
          user_id: user.id,
          job_type: 'build_framework',
          payload: {
            session_id: session.id,
            signal_id:  session.signal_id ?? null,
            answers:    finalAnswers,
          },
        })

      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#334155', fontSize: '14px', fontFamily: "'Inter', sans-serif", letterSpacing: '2px' }}>
        Loading your session…
      </div>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '40px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '24px' }}>
        ◈
      </div>
      <div style={{ fontSize: '14px', color: '#C8A96E', letterSpacing: '2px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '12px' }}>CHANAKYA · YOUR BRAND ARCHITECT</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', textAlign: 'center' }}>
        Your blueprint is being built
      </div>
      <div style={{ fontSize: '16px', color: '#64748B', textAlign: 'center', maxWidth: '480px', lineHeight: '1.8', marginBottom: '8px' }}>
        Chanakya — your Brand Architect — is now cross-referencing your answers with live industry signals to build a 90-day framework that is uniquely yours.
      </div>
      <div style={{ fontSize: '16px', color: '#334155', textAlign: 'center', maxWidth: '480px', lineHeight: '1.8', marginBottom: '32px' }}>
        This is the blueprint that will govern every post Shakespeare writes, every angle Aristotle checks, and every decision Machiavelli makes about your distribution. Takes 1–2 minutes.
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ padding: '11px 28px', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: '8px', color: '#C8A96E', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
      >
        Back to Dashboard →
      </button>
    </div>
  )

  const meta = CATEGORY_META[currentQ?.category] ?? { label: 'About You', color: '#4A9EFF', icon: '◎' }

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif" }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1E2A3E', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
        <Logo size="sm" theme="dark" />
        <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
        <span style={{ fontSize: '14px', color: '#334155' }}>Brand Intelligence</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: '#334155', letterSpacing: '1.5px' }}>
          {currentIdx + 1} of {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#0f1524' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}80)`, transition: 'width 0.5s ease' }} />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 40px 80px', position: 'relative', zIndex: 1 }}>

        {/* Chanakya intro card — first question only */}
        {currentIdx === 0 && (
          <div style={{ marginBottom: '36px', padding: '20px 24px', background: 'rgba(200,169,110,0.05)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>◈</span>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '2px', color: '#C8A96E', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>CHANAKYA · YOUR BRAND ARCHITECT</div>
                <div style={{ fontSize: '15px', color: '#475569', marginTop: '2px' }}>The strategist who turns your story into a 90-day framework.</div>
              </div>
            </div>
            <div style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.8' }}>
              {intro || "I've reviewed your industry, your career, and today's market signals. Before I build your framework, I need to hear it directly from you — in your own words. Your answers become the verified career facts that govern everything Elevox creates for you."}
            </div>
          </div>
        )}

        {/* Empathy nudge — shows from Q3 onwards to keep momentum */}
        {currentIdx >= 2 && currentIdx < questions.length - 1 && (
          <div style={{ marginBottom: '20px', padding: '10px 16px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>◎</span>
            <div style={{ fontSize: '16px', color: '#475569', lineHeight: '1.7' }}>
              {currentIdx === 2 && "You're halfway there. The answers you're sharing right now are what separates a generic strategy from one that's entirely yours."}
              {currentIdx === 3 && "Chanakya is already seeing a pattern. Every answer is sharpening your positioning in ways most executives never have the patience for — well done."}
              {currentIdx >= 4 && "Almost done. These final answers are the highest-leverage input in your entire brand framework. This is the work that compounds."}
            </div>
          </div>
        )}

        {/* Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', color: meta.color }}>{meta.icon}</span>
          <span style={{ fontSize: '12px', letterSpacing: '2px', color: meta.color, fontWeight: '600' }}>
            {meta.label.toUpperCase()}
          </span>
          {currentQ?.priority === 'high' && (
            <span style={{ fontSize: '8px', padding: '2px 8px', background: `${meta.color}20`, color: meta.color, letterSpacing: '1px', borderRadius: '100px' }}>
              ESSENTIAL
            </span>
          )}
        </div>

        {/* Question */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 12px', letterSpacing: '-0.3px', lineHeight: '1.4' }}>
          {currentQ?.question}
        </h2>

        {/* Why we ask */}
        {currentQ?.why_we_ask && (
          <div style={{ fontSize: '16px', color: '#475569', marginBottom: '28px', lineHeight: '1.75', fontStyle: 'italic' }}>
            {currentQ.why_we_ask}
          </div>
        )}

        {/* Answer textarea */}
        <textarea
          value={draftAnswer}
          onChange={e => setDraftAnswer(e.target.value)}
          placeholder={currentQ?.placeholder ?? 'Share a specific example, number, or story…'}
          rows={5}
          style={{
            width: '100%',
            padding: '16px 18px',
            background: 'rgba(13,18,32,0.7)',
            border: `1px solid ${draftAnswer.trim() ? meta.color + '60' : '#1E2A3E'}`,
            borderRadius: '10px',
            color: '#F1F5F9',
            fontSize: '16px',
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.7',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNext()
          }}
        />
        <div style={{ fontSize: '12px', color: '#334155', marginTop: '6px', textAlign: 'right' }}>
          ⌘↵ to continue
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(200,90,90,0.1)', border: '1px solid rgba(200,90,90,0.3)', borderRadius: '6px', fontSize: '15px', color: '#ff8080' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          <button
            onClick={handleNext}
            disabled={!draftAnswer.trim() || submitting}
            style={{
              padding: '12px 28px',
              background: draftAnswer.trim() ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` : '#1E2A3E',
              border: 'none',
              borderRadius: '8px',
              color: draftAnswer.trim() ? '#070B14' : '#334155',
              fontSize: '15px',
              fontWeight: '700',
              cursor: draftAnswer.trim() ? 'pointer' : 'not-allowed',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Building framework…' : isLast ? 'Complete →' : 'Next →'}
          </button>

          {currentIdx > 0 && (
            <button
              onClick={() => { setCurrentIdx(i => i - 1); setDraftAnswer(answers[questions[currentIdx - 1]?.id] ?? '') }}
              style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '8px', color: '#334155', fontSize: '15px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Previous answers recap */}
        {Object.keys(answers).length > 0 && (
          <div style={{ marginTop: '48px', borderTop: '1px solid #1E2A3E', paddingTop: '24px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '2px', color: '#334155', marginBottom: '16px' }}>YOUR ANSWERS SO FAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions.slice(0, currentIdx).map((q, i) => {
                const qMeta = CATEGORY_META[q.category] ?? { color: '#4A9EFF', icon: '◎' }
                return (
                  <div key={q.id} style={{ padding: '14px 16px', background: 'rgba(13,18,32,0.6)', border: '1px solid #1E2A3E', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: qMeta.color, marginBottom: '6px', letterSpacing: '1px' }}>
                      {qMeta.icon} {q.question.slice(0, 60)}{q.question.length > 60 ? '…' : ''}
                    </div>
                    <div style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.7' }}>
                      {answers[q.id] ?? '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
