// src/components/ApprovalCard.jsx
// Sprint 4 — P0 Human Approval Gate
// Renders a single draft card for the CxO/EA to review, edit, approve, or reject.
import { useState, useRef } from 'react'
import { approveContentDraft, rejectContentDraft, saveEditToDraft, saveVoiceExample } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function ScorePill({ label, score, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 16px',
      background: `${color}12`,
      border: `1px solid ${color}30`,
      borderRadius: '10px',
      minWidth: '80px',
    }}>
      <span style={{ fontSize: '22px', fontWeight: '700', color, fontFamily: "'Outfit', sans-serif" }}>{score ?? '—'}</span>
      <span style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>{label}</span>
    </div>
  )
}

function SourceLink({ url, title, how_used }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '8px 12px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '8px',
        textDecoration: 'none',
        marginBottom: '6px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
    >
      <div style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '500', marginBottom: '2px' }}>{title}</div>
      {how_used && <div style={{ fontSize: '11px', color: '#64748B' }}>{how_used}</div>}
    </a>
  )
}

export default function ApprovalCard({ draft, onActionComplete }) {
  const { user } = useAuth()
  const [editedBody, setEditedBody]     = useState(draft.body_text ?? '')
  const [showReject, setShowReject]     = useState(false)
  const [rejectNote, setRejectNote]     = useState('')
  const [loading, setLoading]           = useState(false)
  const [saved, setSaved]               = useState(false)
  const saveTimer                       = useRef(null)

  const evaluation     = draft.aristotle_evaluation ?? {}
  const sourceLinks    = evaluation.source_links_used ?? []
  const rationale      = draft.strategic_rationale ?? {}
  const isEdited       = editedBody !== draft.body_text
  const compositeColor = (draft.aristotle_composite_score ?? 0) >= 75 ? '#10b981'
                       : (draft.aristotle_composite_score ?? 0) >= 50 ? '#C8A96E' : '#C85A5A'

  // Auto-save edits to DB 1.5s after typing stops
  function handleBodyChange(val) {
    setEditedBody(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await saveEditToDraft(draft.id, val)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1500)
  }

  async function handleApprove() {
    setLoading(true)
    const finalBody = editedBody.trim()
    const originalBody = draft.body_text ?? ''

    await approveContentDraft(draft.id, user.id, finalBody)

    // Save to voice_examples so Shakespeare learns from this
    const source = draft.source === 'user_submitted' ? 'user_submitted'
                 : isEdited ? 'shakespeare_edited' : 'shakespeare_approved'
    await saveVoiceExample(user.id, {
      source,
      originalText: source !== 'user_submitted' ? originalBody : null,
      finalText: finalBody,
      editDelta: isEdited ? `Original: ${originalBody}\nFinal: ${finalBody}` : null,
      contentPillar: rationale.pillar_alignment ?? null,
    })

    setLoading(false)
    onActionComplete(draft.id)
  }

  async function handleReject() {
    if (!rejectNote.trim()) return
    setLoading(true)
    await rejectContentDraft(draft.id, rejectNote)
    setLoading(false)
    onActionComplete(draft.id)
  }

  const firstLine = (draft.body_text ?? '').split('\n').find(l => l.trim()) ?? ''

  return (
    <div style={{
      background: 'rgba(13,18,32,0.8)',
      border: '1px solid #1E2A3E',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '20px',
      animation: 'ob-field-in 0.3s ease both',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
            AWAITING YOUR APPROVAL
          </div>
          <div style={{ fontSize: '15px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", maxWidth: '520px' }}>
            "{firstLine.slice(0, 100)}{firstLine.length > 100 ? '…' : ''}"
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
          {new Date(draft.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Aristotle Scores */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <ScorePill label="CX"          score={draft.aristotle_cx_score}          color="#5B8FA8" />
        <ScorePill label="Credibility" score={draft.aristotle_credibility_score} color="#8B6DAA" />
        <ScorePill label="Composite"   score={draft.aristotle_composite_score}   color={compositeColor} />
      </div>

      {/* Strategic Rationale */}
      {(rationale.why_now || rationale.pillar_alignment || rationale.goal_alignment) && (
        <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.10)', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Why Shakespeare wrote this
          </div>
          {rationale.why_now && (
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>Why now: </span>{rationale.why_now}
            </div>
          )}
          {rationale.pillar_alignment && (
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>Pillar: </span>{rationale.pillar_alignment}
            </div>
          )}
          {rationale.goal_alignment && (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              <span style={{ color: '#64748B' }}>Goal: </span>{rationale.goal_alignment}
            </div>
          )}
        </div>
      )}

      {/* Verified Sources */}
      {sourceLinks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Verified Sources
          </div>
          {sourceLinks.map((s, i) => (
            <SourceLink key={i} url={s.url} title={s.title} how_used={s.how_used} />
          ))}
        </div>
      )}

      {/* Editable Draft */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Draft Post {isEdited && <span style={{ color: '#C8A96E', marginLeft: '8px' }}>· Edited</span>}
          </div>
          {saved && <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Saved</span>}
        </div>
        <textarea
          value={editedBody}
          onChange={e => handleBodyChange(e.target.value)}
          rows={10}
          style={{
            width: '100%',
            background: 'rgba(7,11,20,0.8)',
            border: '1px solid #1E2A3E',
            borderRadius: '10px',
            color: '#F1F5F9',
            fontSize: '14px',
            lineHeight: '1.7',
            padding: '16px',
            fontFamily: "'Inter', sans-serif",
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
          onBlur={e  => { e.currentTarget.style.borderColor = '#1E2A3E' }}
        />
        <div style={{ fontSize: '11px', color: '#334155', marginTop: '6px' }}>
          {editedBody.length} chars · edits save automatically · saved to your voice profile on approve
        </div>
      </div>

      {/* Actions */}
      {!showReject ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 24px',
              background: loading ? '#1E2A3E' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Approving…' : '✓ Approve & Schedule'}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: '1px solid #C85A5A40',
              borderRadius: '10px',
              color: '#C85A5A',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,90,90,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            ✕ Reject
          </button>
        </div>
      ) : (
        <div>
          <textarea
            placeholder="What needs to change? Shakespeare will use this to rewrite."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
            style={{
              width: '100%', marginBottom: '10px',
              background: 'rgba(200,90,90,0.05)',
              border: '1px solid #C85A5A40',
              borderRadius: '10px', color: '#F1F5F9',
              fontSize: '13px', padding: '12px',
              fontFamily: "'Inter', sans-serif",
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleReject}
              disabled={!rejectNote.trim() || loading}
              style={{
                flex: 1, padding: '11px',
                background: rejectNote.trim() ? '#C85A5A' : '#1E2A3E',
                border: 'none', borderRadius: '10px',
                color: rejectNote.trim() ? '#fff' : '#334155',
                fontSize: '13px', fontWeight: '600',
                cursor: rejectNote.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Rejecting…' : 'Submit Rejection'}
            </button>
            <button
              onClick={() => { setShowReject(false); setRejectNote('') }}
              style={{
                padding: '11px 20px',
                background: 'transparent', border: '1px solid #1E2A3E',
                borderRadius: '10px', color: '#64748B',
                fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ob-field-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
