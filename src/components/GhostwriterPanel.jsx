// src/components/GhostwriterPanel.jsx
// Sprint 2 — Task 3: AI Ghostwriter panel
// Usage in CalendarLogistics Schedule tab:
//   import GhostwriterPanel from './GhostwriterPanel'
//   <GhostwriterPanel onSelectDraft={(body) => handleDraftSelected(body)} onClose={() => setGhostwriterOpen(false)} />
import { useState } from 'react'
import { supabase, saveContentDraft } from '../lib/supabase'

const CONTENT_TYPES = [
  { id: 'text',     label: 'Text Post',     icon: 'T' },
  { id: 'carousel', label: 'Carousel',      icon: '▤' },
  { id: 'article',  label: 'Long-form',     icon: '≡' },
  { id: 'poll',     label: 'Poll',          icon: '?' },
  { id: 'video',    label: 'Video Script',  icon: '▶' },
]

function DraftCard({ draft, index, selected, onSelect }) {
  const [copied, setCopied] = useState(false)
  const colors = ['#C8A96E', '#5B8FA8', '#8B6DAA']
  const color  = colors[index % colors.length]

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      border: `1px solid ${selected ? color + '60' : '#1E2A3E'}`,
      borderRadius: '10px',
      overflow: 'hidden',
      background: selected ? `${color}08` : 'rgba(13,18,32,0.4)',
      transition: 'all 0.2s',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #1E2A3E' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color, fontWeight: '700', flexShrink: 0 }}>
          {index + 1}
        </div>
        <span style={{ fontSize: '12px', color: color, fontFamily: "'Inter', sans-serif", flex: 1 }}>
          {draft.angle}
        </span>
        <span style={{ fontSize: '10px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
          ~{draft.word_count}w
        </span>
      </div>

      {/* Draft body */}
      <div style={{ padding: '16px', fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif", maxHeight: '180px', overflowY: 'auto' }}>
        {draft.body}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E2A3E', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={handleCopy} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '6px', color: copied ? '#10b981' : '#64748B', fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button onClick={() => onSelect(draft)} style={{ padding: '6px 14px', background: selected ? `${color}20` : 'transparent', border: `1px solid ${selected ? color + '60' : '#1E2A3E'}`, borderRadius: '6px', color: selected ? color : '#64748B', fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          {selected ? '✓ Selected' : 'Use this draft'}
        </button>
      </div>
    </div>
  )
}

export default function GhostwriterPanel({ onSelectDraft, onClose, anchorEventId = null }) {
  const [topic,       setTopic]       = useState('')
  const [contentType, setContentType] = useState('text')
  const [drafts,      setDrafts]      = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(null)

  async function handleGenerate() {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setDrafts([])
    setSelectedIdx(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired.')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghostwrite-post`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            content_type: contentType,
            ...(anchorEventId ? { anchor_event_id: anchorEventId } : {}),
          }),
        }
      )
      const { drafts: newDrafts, error: fnError } = await res.json()
      if (fnError) throw new Error(fnError)
      setDrafts(newDrafts || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(idx, draftObj) {
    setSelectedIdx(idx)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await saveContentDraft(user.id, {
          ...draftObj,
          platform: contentType === 'linkedin_post' ? 'LinkedIn' : 'LinkedIn', // currently hardcoded as LinkedIn
          framework_id: 'ghostwriter',
          anchor_event_id: anchorEventId
        })
      }
    } catch (err) {
      console.error('Failed to save draft to database:', err)
    } finally {
      setLoading(false)
    }
    if (onSelectDraft) onSelectDraft(draftObj.body)
  }

  return (
    <div style={{ background: '#070B14', border: '1px solid #1E2A3E', borderRadius: '16px', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

      {/* Panel header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #1E2A3E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.03)' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>AI Ghostwriter</div>
          <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>Generates 3 personalised draft variants in your voice</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '18px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>×</button>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        {/* Content type selector */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>Format</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CONTENT_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setContentType(ct.id)} style={{ padding: '6px 14px', background: contentType === ct.id ? 'rgba(99,102,241,0.12)' : 'transparent', border: `1px solid ${contentType === ct.id ? 'rgba(99,102,241,0.4)' : '#1E2A3E'}`, borderRadius: '6px', color: contentType === ct.id ? '#a5b4fc' : '#64748B', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Inter', sans-serif" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>Topic / Idea</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
              placeholder="e.g. Why most CxOs are invisible online"
              style={{ flex: 1, padding: '11px 16px', background: '#0D1220', border: '1px solid #1E2A3E', borderRadius: '8px', color: '#F1F5F9', fontSize: '13px', outline: 'none', fontFamily: "'Inter', sans-serif' " }}
              onFocus={e  => e.target.style.borderColor = '#6366f1'}
              onBlur={e   => e.target.style.borderColor = '#1E2A3E'}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              style={{ padding: '11px 22px', background: loading || !topic.trim() ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: loading || !topic.trim() ? '1px solid #1E2A3E' : 'none', borderRadius: '8px', color: loading || !topic.trim() ? '#334155' : '#fff', fontSize: '12px', fontWeight: '600', cursor: loading || !topic.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: loading || !topic.trim() ? 'none' : '0 4px 14px rgba(99,102,241,0.3)' }}
            >
              {loading ? (
                <><div style={{ width: '12px', height: '12px', border: '2px solid #334155', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating…</>
              ) : (
                '✦ Draft'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', color: '#fca5a5', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px', animation: 'pulse 1.5s ease-in-out infinite' }}>✦</div>
            <p style={{ fontSize: '12px', color: '#64748B' }}>Writing in your voice…</p>
          </div>
        )}

        {/* Draft cards */}
        {!loading && drafts.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>
              3 Draft Variants — pick your favourite
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drafts.map((draft, i) => (
                <DraftCard
                  key={i}
                  draft={draft}
                  index={i}
                  selected={selectedIdx === i}
                  onSelect={(body) => handleSelect(i, body)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty / prompt state */}
        {!loading && drafts.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155', fontSize: '12px' }}>
            Enter a topic and hit Draft to generate 3 personalised variants
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
