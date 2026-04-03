// src/components/SessionRecap.jsx
// Single-screen recap — no tabs, edge-to-edge 2-column grid.
// Desktop: badge + [Summary | Archetype+Pillars] + Profile strip + CTA footer, zero scroll.
// Mobile: vertical stack, natural scroll.

import { useState } from 'react'

/* ── Archetype lookup ─────────────────────── */
const ARCHETYPE_APPROACH = {
  'The Visionary':    { icon: '◎', description: 'You challenge the status quo and lead with bold predictions. Content focuses on where the industry is going — not where it is.', mandate: 'Posts that reframe the future and position you as the person who saw it coming.' },
  'The Architect':    { icon: '◈', description: "You build systems and frameworks others can't. Content focuses on your proprietary thinking — the mental models behind your results.", mandate: 'Posts that break down complex decisions into repeatable frameworks.' },
  'The Operator':     { icon: '⊞', description: 'You execute at scale. Content focuses on the operational decisions that moved the needle — the unglamorous work that compounded.', mandate: 'Posts that reveal the execution layer: process, trade-off, result.' },
  'The Contrarian':   { icon: '⊘', description: 'You see what the consensus misses. Content focuses on the uncomfortable truth everyone is ignoring.', mandate: 'Posts that challenge popular assumptions with evidence and a clear alternative view.' },
  'The Translator':   { icon: '◷', description: 'You make the complex legible. Content turns technical depth into language decision-makers can act on.', mandate: 'Posts that decode complexity — the jargon-free explanation that earns boardroom trust.' },
  'The Connector':    { icon: '⋈', description: "You sit at the intersection of worlds. Content focuses on the unusual combinations of expertise others can't replicate.", mandate: 'Posts that bridge disciplines — the insight only your position could see.' },
  'The Authority':    { icon: '✦', description: 'You are the benchmark. Content focuses on the standards you set and enforce — intellectual rigour over broad appeal.', mandate: 'Posts that establish criteria and invite serious conversation from serious people.' },
  'The Practitioner': { icon: '⬡', description: 'You have done the work. Content focuses on specific, lived expertise from years of execution.', mandate: 'Posts anchored in career moments, real numbers, and decisions that shaped outcomes.' },
}

function resolveArchetype(name) {
  if (!name) return null
  if (ARCHETYPE_APPROACH[name]) return ARCHETYPE_APPROACH[name]
  const key = Object.keys(ARCHETYPE_APPROACH).find(k => name.startsWith(k))
  return key ? ARCHETYPE_APPROACH[key]
    : { icon: '◎', description: 'Your archetype drives a distinctive content voice built around your unique positioning.', mandate: 'Every post Shakespeare crafts will be anchored in your specific angle.' }
}

const INFERENCE_CATEGORIES = [
  { label: 'Positioning',    color: '#6366f1' },
  { label: 'Voice & Tone',   color: '#8b5cf6' },
  { label: 'Your Audience',  color: '#C8A96E' },
  { label: 'Credibility',    color: '#10b981' },
  { label: 'Contrarian Lens',color: '#5B8FA8' },
  { label: 'Leadership',     color: '#C85A5A' },
]

const PILLAR_COLORS = ['#6366f1','#8b5cf6','#C8A96E','#10b981','#5B8FA8','#C85A5A']

/* ═══════════════════════════════════════
   SessionRecap Component
════════════════════════════════════════ */
export default function SessionRecap({
  phase, component, messages,
  framework, error, thinking, onFollowUp, onDismissError,
}) {
  const pc = phase?.color || '#6366f1'

  const sessionDate = messages?.length
    ? new Date(messages[messages.length - 1].ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const voxMsgs = (messages || []).filter(m => m.role === 'assistant')
  const summaryMsg = voxMsgs.length >= 2 ? voxMsgs[voxMsgs.length - 2] : voxMsgs[voxMsgs.length - 1]
  const summaryText = summaryMsg?.content || ''

  const voxInferences = voxMsgs
    .slice(0, -2)
    .map(m => {
      const c = m.content?.trim() || ''
      const s = c.match(/[^.!?]+[.!?]+/)?.[0]?.trim()
      return s && s.length > 20 ? s : null
    })
    .filter(Boolean)
    .slice(0, 6)

  const archetypeApproach = resolveArchetype(framework?.archetype)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      fontFamily: "'Inter', sans-serif",
      animation: 'msg-in 0.4s ease both',
      overflow: 'hidden',
    }}>
      <style>{`
        .sr-main-grid {
          display: grid;
          grid-template-columns: 42% 58%;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }
        .sr-left-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .sr-right-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
          overflow: hidden;
        }
        .sr-summary-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          font-size: 13px;
          color: #C4CDD9;
          line-height: 1.75;
          white-space: pre-wrap;
          padding: 10px 12px;
          background: rgba(13,18,32,0.7);
          border: 1px solid #1E2A3E;
          border-left: 3px solid var(--sr-pc, #6366f1);
          border-radius: 8px;
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
        }
        .sr-archetype-card {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,0.25);
          flex-shrink: 0;
        }
        .sr-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 6px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
        }
        .sr-profile-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          flex-shrink: 0;
        }
        .sr-inf-card {
          padding: 7px 10px;
          background: rgba(13,18,32,0.5);
          border: 1px solid #1E2A3E;
          border-radius: 7px;
          border-left-width: 3px;
        }
        .sr-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 12px;
          background: rgba(13,18,32,0.6);
          border: 1px solid #1E2A3E;
          border-radius: 8px;
          flex-shrink: 0;
          margin-top: 6px;
        }
        @media (max-width: 860px) {
          .sr-main-grid { grid-template-columns: 1fr; }
          .sr-profile-strip { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── Badge bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 12px', borderRadius: '8px', flexShrink: 0, marginBottom: '6px',
        background: `linear-gradient(135deg,${pc}14,${pc}06)`,
        border: `1px solid ${pc}35`,
        '--sr-pc': pc,
      }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
          background: `${pc}22`, border: `1px solid ${pc}45`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
        }}>✓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: pc, letterSpacing: '2px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
            SESSION COMPLETE{sessionDate ? ` · ${sessionDate}` : ''}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {component?.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>
            {messages?.length || 0} exchanges
          </div>
        </div>
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="sr-main-grid" style={{ '--sr-pc': pc }}>

        {/* LEFT: Strategic Summary */}
        <div className="sr-left-col">
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '2px' }}>
            VOX's Strategic Summary
          </div>
          <div className="sr-summary-body">
            {summaryText || "Vox's strategic summary will appear here once the session is finalised."}
          </div>
        </div>

        {/* RIGHT: Archetype + Pillars */}
        <div className="sr-right-col">

          {/* Archetype hero card */}
          {framework?.archetype && archetypeApproach ? (
            <div className="sr-archetype-card">
              <div style={{
                background: 'linear-gradient(135deg,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.12) 60%,rgba(200,169,110,0.05) 100%)',
                borderBottom: '1px solid rgba(99,102,241,0.12)',
                padding: '8px 12px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {archetypeApproach.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>YOUR ARCHETYPE</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#E0E7FF', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: '3px' }}>
                    {framework.archetype}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {archetypeApproach.description}
                  </div>
                </div>
              </div>
              <div style={{ padding: '6px 12px', background: 'rgba(8,10,20,0.7)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#6366f1', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>▶</span>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                  <span style={{ fontSize: '9px', color: '#6366f1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginRight: '6px' }}>Content Mandate</span>
                  {archetypeApproach.mandate}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px', color: '#475569', fontSize: '13px', background: 'rgba(13,18,32,0.5)', border: '1px solid #1E2A3E', borderRadius: '8px' }}>
              Chanakya is building your brand framework — check back shortly.
            </div>
          )}

          {/* Pillars label */}
          {framework?.content_pillars?.length > 0 && (
            <>
              <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                Content Pillars
              </div>
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
                      <div style={{ fontSize: '9px', color: col, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: '2px' }}>PILLAR {String(i + 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: desc ? '3px' : 0 }}>{title}</div>
                      {desc && <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Vox Profile Read strip ── */}
      {voxInferences.length > 0 && (
        <div style={{ flexShrink: 0, marginTop: '6px' }}>
          <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>
            VOX's Profile Read
          </div>
          <div className="sr-profile-strip">
            {voxInferences.map((inference, i) => {
              const cat = INFERENCE_CATEGORIES[i % INFERENCE_CATEGORIES.length]
              return (
                <div key={i} className="sr-inf-card" style={{ borderLeftColor: cat.color }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: cat.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
        <div style={{ flexShrink: 0, padding: '6px 12px', marginTop: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', color: '#fca5a5', fontSize: '12px' }}>
          ⚠ {error}{' '}<button onClick={onDismissError} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      {/* ── Footer CTA ── */}
      <div className="sr-footer">
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '1px' }}>Want to revisit or adjust?</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>Vox will summarise your decisions and ask what you'd like to change.</div>
        </div>
        <button
          onClick={onFollowUp}
          disabled={thinking}
          style={{
            padding: '8px 20px', flexShrink: 0,
            background: thinking ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: thinking ? '1px solid rgba(99,102,241,0.2)' : 'none',
            borderRadius: '8px', color: thinking ? '#64748B' : '#fff',
            fontSize: '13px', fontWeight: '600', cursor: thinking ? 'default' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: thinking ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {thinking ? 'Loading…' : 'Request Follow-up →'}
        </button>
      </div>
    </div>
  )
}
