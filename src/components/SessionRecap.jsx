// src/components/SessionRecap.jsx
// Session-complete summary dashboard.
// Desktop: single-screen 2-column layout (no vertical scroll).
// Mobile: single-column, vertical-scroll only.

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
  { label: 'Positioning Assumption', color: '#6366f1' },
  { label: 'Voice & Tone Read',      color: '#8b5cf6' },
  { label: 'Audience Inference',     color: '#C8A96E' },
  { label: 'Credibility Signal',     color: '#10b981' },
  { label: 'Contrarian Lens',        color: '#5B8FA8' },
  { label: 'Leadership Profile',     color: '#C85A5A' },
]

/* ── Pillar colours ─────────────────────────── */
const PILLAR_COLORS = ['#6366f1','#8b5cf6','#C8A96E','#10b981','#5B8FA8','#C85A5A']

/* ═══════════════════════════════════════════════
   SessionRecap Component
   Props: phase, component, messages, framework,
          summaryText, voxInferences, error,
          thinking, onFollowUp, onDismissError
═══════════════════════════════════════════════ */
export default function SessionRecap({
  phase, component, messages,
  framework, error, thinking, onFollowUp, onDismissError,
}) {
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  // Date from last message
  const sessionDate = messages?.length
    ? new Date(messages[messages.length - 1].ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Derive summaryText: second-to-last Vox message (validation summary)
  const voxMsgs = (messages || []).filter(m => m.role === 'assistant')
  const summaryMsg = voxMsgs.length >= 2
    ? voxMsgs[voxMsgs.length - 2]
    : voxMsgs[voxMsgs.length - 1]
  const summaryText = summaryMsg?.content || ''

  // Derive voxInferences: user messages that provide substantive answers
  const userMsgs = (messages || []).filter(m => m.role === 'user')
  const voxInferences = userMsgs
    .map(m => m.content?.trim())
    .filter(c => c && c.length > 8 && c.toLowerCase() !== 'yes' && c.toLowerCase() !== 'no')

  // Summary: first 5 sentences (Vox writes single paragraphs)
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const allSentences = summaryText ? (summaryText.match(sentenceRegex) || [summaryText]) : []
  const truncatedSummary = allSentences.slice(0, 5).join(' ').trim()
  const hasMoreSummary = allSentences.length > 5

  const archetypeApproach = resolveArchetype(framework?.archetype)
  const pc = phase?.color || '#6366f1'

  return (
    <div className="sr-root" style={{ '--pc': pc }}>
      <style>{`
        /* ── Root ── */
        .sr-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          font-family: 'Inter', sans-serif;
          animation: msg-in 0.4s ease both;
          padding: 4px 0;
          box-sizing: border-box;
        }
        /* ── Badge ── */
        .sr-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          border-radius: 9px;
          flex-shrink: 0;
          margin-bottom: 8px;
        }
        /* ── 2-col body ── */
        .sr-body {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: 10px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          margin-bottom: 8px;
        }
        /* ── Left pane: summary ── */
        .sr-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
          overflow: hidden;
        }
        .sr-summary-box {
          flex: 1;
          overflow: hidden;
          border-radius: 8px;
          padding: 10px 12px;
          background: rgba(13,18,32,0.8);
          border: 1px solid #1E2A3E;
          border-left: 3px solid var(--pc);
        }
        .sr-summary-text {
          font-size: 11.5px;
          color: #94A3B8;
          line-height: 1.65;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* ── Right pane: archetype + pillars ── */
        .sr-right {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
          overflow: hidden;
        }
        .sr-archetype-card {
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .sr-archetype-top {
          background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 60%, rgba(200,169,110,0.05) 100%);
          border-bottom: 1px solid rgba(99,102,241,0.12);
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .sr-archetype-mandate {
          padding: 7px 14px;
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
        }
        /* ── Inference grid ── */
        .sr-inferences {
          flex-shrink: 0;
          margin-bottom: 7px;
        }
        .sr-inferences-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }
        .sr-inf-card {
          padding: 6px 8px;
          background: rgba(13,18,32,0.5);
          border: 1px solid #1E2A3E;
          border-radius: 5px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          overflow: hidden;
        }
        /* ── Section divider ── */
        .sr-divider {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        /* ── Footer ── */
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
        /* ── Mobile: single column, vertical scroll only ── */
        @media (max-width: 860px) {
          .sr-root { height: auto; overflow: visible; }
          .sr-body  { grid-template-columns: 1fr; overflow: visible; flex: none; }
          .sr-left, .sr-right { overflow: visible; }
          .sr-summary-box { flex: none; }
          .sr-pillars, .sr-pillars-grid { overflow: visible; min-height: auto; }
          .sr-inferences-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Badge ── */}
      <div className="sr-badge" style={{ background: `linear-gradient(135deg,${pc}12,${pc}06)`, border: `1px solid ${pc}30` }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: `${pc}20`, border: `1px solid ${pc}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0,
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '8px', color: pc, letterSpacing: '2px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
            SESSION COMPLETE{sessionDate ? ` · ${sessionDate}` : ''}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
            {component?.title}
          </div>
        </div>
        <div style={{ fontSize: '8px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', flexShrink: 0 }}>
          {messages?.length || 0} exchanges
        </div>
      </div>

      {/* ── 2-Column Body ── */}
      <div className="sr-body">

        {/* LEFT — Strategic Summary */}
        <div className="sr-left">
          <div className="sr-divider">
            <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Vox's Strategic Summary</div>
            <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
          </div>
          <div className="sr-summary-box">
            <div
              className="sr-summary-text"
              style={{ WebkitLineClamp: summaryExpanded ? 'unset' : 18 }}
            >
              {summaryText || 'Summary will appear here once Vox finalises the strategy.'}
            </div>
            {hasMoreSummary && (
              <button
                onClick={() => setSummaryExpanded(e => !e)}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: '10px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: '4px 0 0', textDecoration: 'underline' }}
              >
                {summaryExpanded ? '↑ Less' : '↓ Full summary'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Brand Framework */}
        <div className="sr-right">
          <div className="sr-divider">
            <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Brand Framework</div>
            <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
            <div style={{ fontSize: '7px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>CHANAKYA</div>
          </div>

          {/* Archetype Card */}
          {framework?.archetype && archetypeApproach && (
            <div className="sr-archetype-card">
              <div className="sr-archetype-top">
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
                }}>
                  {archetypeApproach.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '7px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>YOUR ARCHETYPE</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#E0E7FF', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {framework.archetype}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.45, fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {archetypeApproach.description}
                  </div>
                </div>
              </div>
              <div className="sr-archetype-mandate">
                <span style={{ color: '#6366f1', fontSize: '11px', flexShrink: 0 }}>▶</span>
                <div>
                  <span style={{ fontSize: '7px', color: '#6366f1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.2px', textTransform: 'uppercase', marginRight: '6px' }}>Content Mandate</span>
                  <span style={{ fontSize: '11px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.45 }}>{archetypeApproach.mandate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content Pillars */}
          {framework?.content_pillars?.length > 0 && (
            <div className="sr-pillars">
              <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px', flexShrink: 0 }}>Content Pillars</div>
              <div className="sr-pillars-grid">
                {framework.content_pillars.map((p, i) => {
                  const title = typeof p === 'object' ? p.title : p
                  const desc  = typeof p === 'object' ? (p.description || p.desc || '') : ''
                  const col   = PILLAR_COLORS[i % PILLAR_COLORS.length]
                  return (
                    <div key={i} style={{
                      padding: '7px 9px',
                      background: 'rgba(13,18,32,0.7)',
                      border: `1px solid ${col}28`,
                      borderTop: `2px solid ${col}`,
                      borderRadius: '7px',
                    }}>
                      <div style={{ fontSize: '7px', color: col, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: '3px' }}>P{String(i + 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.25, marginBottom: desc ? '2px' : 0 }}>{title}</div>
                      {desc && (
                        <div style={{ fontSize: '10px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.4,
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

      {/* ── Vox Inferences ── */}
      {voxInferences?.length > 0 && (
        <div className="sr-inferences">
          <div className="sr-divider" style={{ marginBottom: '5px' }}>
            <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Vox's Profile Read</div>
            <div style={{ flex: 1, height: '1px', background: '#1E2A3E' }} />
            <div style={{ fontSize: '8px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>shapes every artefact Elevox builds</div>
          </div>
          <div className="sr-inferences-grid">
            {voxInferences.map((inference, i) => {
              const cat = INFERENCE_CATEGORIES[i % INFERENCE_CATEGORIES.length]
              return (
                <div key={i} className="sr-inf-card" style={{ borderLeft: `2px solid ${cat.color}` }}>
                  <div style={{
                    fontSize: '7px', fontWeight: '700', letterSpacing: '1px',
                    textTransform: 'uppercase', color: cat.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0, marginTop: '1px', minWidth: '80px',
                  }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
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
        <div style={{ padding: '7px 12px', marginBottom: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', color: '#fca5a5', fontSize: '12px' }}>
          ⚠ {error}{' '}
          <button onClick={onDismissError} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      {/* ── Footer CTA ── */}
      <div className="sr-footer">
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '1px' }}>Want to revisit or adjust?</div>
          <div style={{ fontSize: '10px', color: '#475569', fontFamily: "'Inter', sans-serif" }}>Vox will summarise your decisions and ask what you'd like to change.</div>
        </div>
        <button
          onClick={onFollowUp}
          disabled={thinking}
          style={{
            padding: '8px 18px',
            background: thinking ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: thinking ? '1px solid rgba(99,102,241,0.2)' : 'none',
            borderRadius: '8px',
            color: thinking ? '#64748B' : '#fff',
            fontSize: '12px', fontWeight: '600',
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
