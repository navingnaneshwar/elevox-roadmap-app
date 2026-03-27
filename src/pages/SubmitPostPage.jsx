// src/pages/SubmitPostPage.jsx
// Sprint 4 — P4 User Content Submission
// CxO pastes their own draft. Aristotle scores it.
// If score < 75, Shakespeare suggests one improvement shown side-by-side.
// CxO chooses which version to keep. Both routes into the standard pipeline.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

const SCORE_THRESHOLD = 75

export default function SubmitPostPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [step,          setStep]          = useState('compose')   // compose | scoring | suggest | done
  const [body,          setBody]          = useState('')
  const [scores,        setScores]        = useState(null)        // { cx, cred, composite, revision_brief }
  const [suggestion,    setSuggestion]    = useState(null)        // Shakespeare's rewrite
  const [chosen,        setChosen]        = useState(null)        // 'original' | 'suggested'
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [draftId,       setDraftId]       = useState(null)

  // ── Step 1: Submit to Aristotle for scoring ────────────────
  async function handleSubmit() {
    if (!body.trim()) return
    setLoading(true)
    setError(null)
    setStep('scoring')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Save as user_submitted draft first so agents have a DB row to update
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-submission`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body_text: body }),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Evaluation failed')

      setDraftId(json.draft_id)
      setScores({
        cx:         json.cx_score,
        cred:       json.credibility_score,
        composite:  json.composite_score,
        brief:      json.revision_brief,
      })

      if (json.composite_score >= SCORE_THRESHOLD) {
        // Strong enough — goes straight to approval queue
        setStep('done')
      } else {
        // Below threshold — fetch Shakespeare suggestion
        setSuggestion(json.shakespeare_suggestion)
        setStep('suggest')
      }
    } catch (err) {
      setError(err.message)
      setStep('compose')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: CxO chooses version → routes to approval queue ─
  async function handleChoose(pick) {
    setChosen(pick)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const finalText = pick === 'original' ? body : suggestion

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-submission`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ draft_id: draftId, chosen_text: finalText, finalise: true }),
        }
      )
      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#C8A96E' : '#C85A5A'

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #1E2A3E',
        padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size="md" theme="dark" />
          <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
          <span style={{ fontSize: '12px', color: '#334155' }}>Submit Your Post</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '8px', color: '#64748B', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          ← Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your Words · Your Voice
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: '700', fontFamily: "'Outfit', sans-serif", color: '#F1F5F9', margin: '0 0 8px' }}>
            Submit Your Own Post
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Aristotle will score it for credibility. If it scores below 75, Shakespeare will suggest one improvement — your version stays on the left.
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px', background: 'rgba(200,90,90,0.08)', border: '1px solid rgba(200,90,90,0.2)', borderRadius: '10px', color: '#C85A5A', fontSize: '14px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* ── COMPOSE ── */}
        {(step === 'compose' || step === 'scoring') && (
          <div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Paste or write your LinkedIn post here…"
              rows={14}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(13,18,32,0.8)', border: '1px solid #1E2A3E',
                borderRadius: '12px', color: '#F1F5F9', fontSize: '15px',
                lineHeight: '1.7', padding: '20px',
                fontFamily: "'Inter', sans-serif", resize: 'vertical', outline: 'none',
                transition: 'border-color 0.15s', marginBottom: '16px',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#1E2A3E' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#334155' }}>{body.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || loading}
                style={{
                  padding: '12px 32px',
                  background: body.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1E2A3E',
                  border: 'none', borderRadius: '10px',
                  color: body.trim() && !loading ? '#fff' : '#334155',
                  fontSize: '14px', fontWeight: '600',
                  cursor: body.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                }}
              >
                {loading ? 'Aristotle is scoring…' : 'Score & Submit →'}
              </button>
            </div>
          </div>
        )}

        {/* ── SIDE-BY-SIDE SUGGESTION ── */}
        {step === 'suggest' && scores && (
          <div>
            {/* Scores */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {[['CX', scores.cx], ['Credibility', scores.cred], ['Composite', scores.composite]].map(([l, s]) => (
                <div key={l} style={{ padding: '10px 18px', background: `${scoreColor(s)}12`, border: `1px solid ${scoreColor(s)}30`, borderRadius: '10px', textAlign: 'center', minWidth: '90px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: scoreColor(s), fontFamily: "'Outfit', sans-serif" }}>{s}</div>
                  <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
                </div>
              ))}
            </div>

            {scores.brief && (
              <div style={{ padding: '14px 18px', background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: '10px', marginBottom: '28px' }}>
                <div style={{ fontSize: '10px', color: '#C8A96E', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Aristotle's note</div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>{scores.brief}</div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
              Choose your version
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Original */}
              <div style={{ background: 'rgba(13,18,32,0.8)', border: '1px solid #1E2A3E', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>Your version</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{body}</div>
                <button onClick={() => handleChoose('original')} disabled={loading}
                  style={{ width: '100%', padding: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Keep mine →
                </button>
              </div>

              {/* Shakespeare suggestion */}
              <div style={{ background: 'rgba(13,18,32,0.8)', border: '1px solid rgba(139,109,170,0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: '#8B6DAA', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>Shakespeare's suggestion</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{suggestion ?? 'Generating…'}</div>
                <button onClick={() => handleChoose('suggested')} disabled={loading || !suggestion}
                  style={{ width: '100%', padding: '10px', background: 'rgba(139,109,170,0.12)', border: '1px solid rgba(139,109,170,0.3)', borderRadius: '8px', color: '#8B6DAA', fontSize: '13px', fontWeight: '600', cursor: suggestion ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif" }}>
                  Use suggestion →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <div style={{ fontSize: '22px', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '10px' }}>
              Submitted to the approval queue
            </div>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px' }}>
              Find it in Approvals to give it a final read before it schedules.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/approvals')}
                style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Go to Approvals →
              </button>
              <button onClick={() => { setStep('compose'); setBody(''); setScores(null); setSuggestion(null) }}
                style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '10px', color: '#64748B', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Submit another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
