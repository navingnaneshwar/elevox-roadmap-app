// src/components/SessionRecap.jsx
// Session-complete summary dashboard.
// Desktop: single-screen 2-column layout — each pane scrolls independently.
// Mobile: single-column, vertical scroll only.
// Font sizes optimised for 40–70 year old executive audience.

import { useState } from 'react'

/* ── Archetype lookup ───────────────────────── */
const ARCHETYPE_APPROACH = {
  'The Visionary':    { icon: '◎', description: 'You challenge the status quo and lead with bold predictions. Content focuses on where the industry is going — not where it is.', mandate: 'Posts that reframe the future, challenge consensus, and position you as the person who saw it coming.' },
  'The Architect':   { icon: '◈', description: "You build systems and frameworks others can't. Content focuses on your proprietary thinking — the mental models behind your results.", mandate: 'Posts that break down complex decisions into repeatable frameworks your audience can apply.' },
  'The Operator':    { icon: '⊞', description: 'You execute at scale. Content focuses on the operational decisions that moved the needle — the unglamorous work that compounded.', mandate: 'Posts that reveal the execution layer: the process, the trade-off, the result.' },
  'The Contrarian':  { icon: '⊘', description: 'You see what the consensus misses. Content focuses on the uncomfortable truth that everyone is ignoring but will soon be forced to face.', mandate: 'Posts that challenge popular assumptions with evidence, experience, and a clear alternative view.' },
  'The Translator':  { icon: '◷', description: 'You make the complex legible. Content focuses on turning technical depth or specialist insight into language decision-makers can act on.', mandate: 'Posts that decode complexity — the jargon-free explanation that earns trust across the boardroom table.' },
  'The Connector':   { icon: '⋈', description: "You sit at the intersection of worlds. Content focuses on the unusual combinations of expertise, perspective, or network that others can't replicate.", mandate: 'Posts that bridge disciplines — the insight that only someone with your unusual position could see.' },
  'The Authority':   { icon: '✦', description: 'You are the benchmark. Content focuses on the standards you set and enforce — intellectual rigour over broad appeal.', mandate: 'Posts that establish criteria, set the bar, and invite serious conversation from serious people.' },
  'The Practitioner':{ icon: '⬡', description: 'You have done the work. Content focuses on the specific, lived expertise that can only come from years of execution.', mandate: 'Posts anchored in specific career moments, real numbers, and decisions that shaped outcomes.' },
}

function resolveArchetype(name) {
  if (!name) return null
  if (ARCHETYPE_APPROACH[name]) return ARCHETYPE_APPROACH[name]
  const key = Object.keys(ARCHETYPE_APPROACH).find(k => name.startsWith(k))
  return key
    ? ARCHETYPE_APPROACH[key]
    : { icon: '◎', description: 'Your archetype drives a distinctive content voice built around your unique career positioning.', mandate: 'Every post Shakespeare writes will be anchored in your specific experience and strategic angle.' }
}

/* ── Inference category colours ─────────────── */
const INFERENCE_CATEGORIES = [
  { label: 'Positioning',    color: '#6366f1' },
  { label: 'Voice & Tone',   color: '#8b5cf6' },
  { label: 'Your Audience',  color: '#C8A96E' },
  { label: 'Credibility',    color: '#10b981' },
  { label: 'Contrarian Lens',color: '#5B8FA8' },
  { label: 'Leadership',     color: '#C85A5A' },
]

const PILLAR_COLORS = ['#6366f1','#8b5cf6','#C8A96E','#10b981','#5B8FA8','#C85A5A']

/* ═══════════════════════════════════════════
   SessionRecap Component
   ════════════════════════════════════════ */
export default function SessionRecap({
  phase, component, messages,
  framework, error, thinking, onFollowUp, onDismissError,
}) {
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const sessionDate = messages?.length
    ? new Date(messages[messages.length - 1].ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Derive summaryText: second-to-last Vox message (validation summary)
  const voxMsgs = (messages || []).filter(m => m.role === 'assistant')
  const summaryMsg = voxMsgs.length >= 2
    ? voxMsgs[voxMsgs.length - 2]
    : voxMsgs[voxMsgs.length - 1]
  const summaryText = summaryMsg?.content || ''

  // Vox inferences: first sentence from each early Vox message (Vox's own framing)
  const voxInferences = voxMsgs
    .slice(0, -2)
    .map(m => {
      const content = m.content?.trim() || ''
      const first = content.match(/[^.!?]+[.!?]+/)?.[0]?.trim()
      return first && first.length > 20 ? first : null
    })
    .filter(Boolean)
    .slice(0, 6)

  // Summary truncation: first 4 sentences
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const allSentences = summaryText ? (summaryText.match(sentenceRegex) || [summaryText]) : []
  const truncatedSummary = allSentences.slice(0, 4).join(' ').trim()
  const hasMoreSummary = allSentences.length > 4

  const archetypeApproach = resolveArchetype(framework?.archetype)
  const pc = phase?.color || '#6366f1'

  return (
    <div className="sr-root" style={{ '--pc': pc }}>
      <style>{`
        /* ─── Single-screen dashboard (desktop) ─── */
        /* Body text ≥13px, labels ≥10px for 40-70yo audience */
        .sr-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          font-family: 'Inter', sans-serif;
          animation: msg-in 0.4s ease both;
          box-sizing: border-box;
          overflow: hidden;
        }
        /* Badge row */
        .sr-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          border-radius: 9px;
          flex-shrink: 0;
          margin-bottom: 7px;
        }
        /* 2-column body */
        .sr-body {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: 8px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          margin-bottom: 7px;
        }
        /* Left pane — summary */
        .sr-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-height: 0;
          overflow: hidden;
        }
        .sr-summary-box {
          flex: 1;
          overflow-y: auto;      /* summary scrolls internally if long */
          border-radius: 9px;
          padding: 10px 13px;
          background: rgba(13,18,32,0.8);
          border: 1px solid #1E2A3E;
          border-left: 3px solid var(--pc);
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
        }
        .sr-summary-text {
          font-size: 15px;       /* readable for 40-70yo */
          color: #94A3B8;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        /* Right pane — archetype + pillars */
        .sr-right {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-height: 0;
          overflow: hidden;
        }
        .sr-archetype-card {
          flex-shrink: 0;
          border-radius: 9px;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .sr-archetype-top {
          background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 60%, rgba(200,169,110,0.05) 100%);
          border-bottom: 1px solid rgba(99,102,241,0.12);
          padding: 9px 13px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .sr-archetype-mandate {
          padding: 6px 13px;
          background: rgba(8,10,20,0.7);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .sr-pillars {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .sr-pillars-grid {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 5px;
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
        }
        /* Inference strip — horizontally scrollable 1-row */
        .sr-inferences {
          flex-shrink: 0;
          margin-bottom: 6px;
        }
        .sr-inferences-strip {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
          padding-bottom: 3px;
        }
        .sr-inf-card {
          flex-shrink: 0;
          min-width: 220px;
          max-width: 280px;
          padding: 7px 10px;
          background: rgba(13,18,32,0.5);
          border: 1px solid #1E2A3E;
          border-radius: 6px;
          border-left-width: 3px;
          overflow: hidden;
        }
        /* Section label */
        .sr-section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          color: #334155;
        }
        /* Footer CTA */
        .sr-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 14px;
          background: rgba(13,18,32,0.6);
          border: 1px solid #1E2A3E;
          border-radius: 9px;
        }
        /* Divider */
        .sr-divider {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          margin-bottom: 4px;
        }
        .sr-divider-line { flex: 1; height: 1px; background: #1E2A3E; }
        /* Mobile: single column vertical scroll */
        @media (max-width: 860px) {
          .sr-root { height: auto; overflow: visible; }
          .sr-body  { grid-template-columns: 1fr; overflow: visible; flex: none; }
          .sr-left, .sr-right { overflow: visible; }
          .sr-summary-box { flex: none; max-height: 200px; }
          .sr-pillars, .sr-pillars-grid { overflow: visible; min-height: auto; }
          .sr-inferences-strip { flex-wrap: wrap; overflow: visible; }
          .sr-inf-card { min-width: 100%; max-width: 100%; }
        }
      `}</style>

      {/* ── Badge ── */}
      <div className="sr-badge" style={{ background: `linear-gradient(135deg,${pc}12,${pc}06)`, border: `1px solid ${pc}30` }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: `${pc}20`, border: `1px solid ${pc}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: pc, letterSpacing: '2px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
            SESSION COMPLETE{sessionDate ? ` · ${sessionDate}` : ''}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
            {component?.title}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', flexShrink: 0 }}>
          {messages?.length || 0} exchanges
        </div>
      </div>

      {/* ── 2-Column Body ── */}
      <div className="sr-body">

        {/* LEFT — Strategic Summary (internal scroll) */}
        <div className="sr-left">
          <div className="sr-divider">
            <div className="sr-section-label">Vox's Strategic Summary</div>
            <div className="sr-divider-line" />
          </div>
          <div className="sr-summary-box">
            <div className="sr-summary-text">
              {summaryExpanded
                ? summaryText
                : (truncatedSummary || 'Summary will appear here once Vox finalises the strategy.')}
            </div>
            {hasMoreSummary && (
              <button
                onClick={() => setSummaryExpanded(e => !e)}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: '5px 0 0', textDecoration: 'underline' }}
              >
                {summaryExpanded ? '↑ Show less' : '↓ Read full summary'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Brand Framework */}
        <div className="sr-right">
          <div className="sr-divider">
            <div className="sr-section-label">Brand Framework</div>
            <div className="sr-divider-line" />
            <div style={{ fontSize: '12px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', flexShrink: 0 }}>CHANAKYA</div>
          </div>

          {/* Archetype Hero Card */}
          {framework?.archetype && archetypeApproach && (
            <div className="sr-archetype-card">
              <div className="sr-archetype-top">
                <div style={{
                  width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>
                  {archetypeApproach.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>YOUR ARCHETYPE</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#E0E7FF', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {framework.archetype}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {archetypeApproach.description}
                  </div>
                </div>
              </div>
              <div className="sr-archetype-mandate">
                <span style={{ color: '#6366f1', fontSize: '14px', flexShrink: 0 }}>▶</span>
                <div>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.2px', textTransform: 'uppercase', marginRight: '6px' }}>Content Mandate</span>
                  <span style={{ fontSize: '14px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{archetypeApproach.mandate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content Pillars (internal scroll) */}
          {framework?.content_pillars?.length > 0 && (
            <div className="sr-pillars">
              <div className="sr-section-label" style={{ marginBottom: '4px' }}>Content Pillars</div>
              <div className="sr-pillars-grid">
                {framework.content_pillars.map((p, i) => {
                  const title = typeof p === 'object' ? p.title : p
                  const desc  = typeof p === 'object' ? (p.description || p.desc || '') : ''
                  const col   = PILLAR_COLORS[i % PILLAR_COLORS.length]
                  return (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: 'rgba(13,18,32,0.7)',
                      border: `1px solid ${col}28`,
                      borderTop: `2px solid ${col}`,
                      borderRadius: '8px',
                    }}>
                      <div style={{ fontSize: '12px', color: col, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: '4px' }}>PILLAR {String(i + 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.25, marginBottom: desc ? '3px' : 0 }}>{title}</div>
                      {desc && (
                        <div style={{ fontSize: '13px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.45,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {desc}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Vox's Profile Read (horizontal strip) ── */}
      {voxInferences.length > 0 && (
        <div className="sr-inferences">
          <div className="sr-divider">
            <div className="sr-section-label">Vox's Profile Read</div>
            <div className="sr-divider-line" />
            <div style={{ fontSize: '12px', color: '#334155', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>scroll →</div>
          </div>
          <div className="sr-inferences-strip">
            {voxInferences.map((inference, i) => {
              const cat = INFERENCE_CATEGORIES[i % INFERENCE_CATEGORIES.length]
              return (
                <div key={i} className="sr-inf-card" style={{ borderLeftColor: cat.color }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: cat.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '14px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {inference}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '8px 14px', marginBottom: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '15px' }}>
          ⚠ {error}{' '}
          <button onClick={onDismissError} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '15px', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      {/* ── Footer CTA ── */}
      <div className="sr-footer">
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '2px' }}>Want to revisit or adjust?</div>
          <div style={{ fontSize: '14px', color: '#475569', fontFamily: "'Inter', sans-serif" }}>Vox will summarise your decisions and ask what you'd like to change.</div>
        </div>
        <button
          onClick={onFollowUp}
          disabled={thinking}
          style={{
            padding: '9px 20px',
            background: thinking ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: thinking ? '1px solid rgba(99,102,241,0.2)' : 'none',
            borderRadius: '8px',
            color: thinking ? '#64748B' : '#fff',
            fontSize: '15px', fontWeight: '600',
            cursor: thinking ? 'default' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: thinking ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {thinking ? 'Loading…' : 'Request Follow-up →'}
        </button>
      </div>
    </div>
  )
}
