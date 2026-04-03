// src/components/SessionRecap.jsx
// Session-complete recap — tabbed single-screen dashboard.
// Desktop: badge + tab bar + full-height content panel + pinned CTA — zero scroll.
// Mobile: stacks vertically, vertical scroll only.
// Fonts: ≥15px body, ≥12px labels — optimised for 40-70yo executives.

import { useState } from 'react'

/* ── Archetype lookup ─────────────────────── */
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
  return key ? ARCHETYPE_APPROACH[key]
    : { icon: '◎', description: 'Your archetype drives a distinctive content voice built around your unique career positioning.', mandate: 'Every post Shakespeare writes will be anchored in your specific experience and strategic angle.' }
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

const TABS = [
  { id: 'summary', label: '📋 Summary'       },
  { id: 'brand',   label: '🏆 Brand Framework'},
  { id: 'profile', label: '🧠 Profile Read'   },
]

/* ═══════════════════════════════════════
   SessionRecap Component
════════════════════════════════════════ */
export default function SessionRecap({
  phase, component, messages,
  framework, error, thinking, onFollowUp, onDismissError,
}) {
  const [activeTab, setActiveTab] = useState('summary')

  const pc = phase?.color || '#6366f1'

  const sessionDate = messages?.length
    ? new Date(messages[messages.length - 1].ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Summary: second-to-last Vox message
  const voxMsgs = (messages || []).filter(m => m.role === 'assistant')
  const summaryMsg = voxMsgs.length >= 2 ? voxMsgs[voxMsgs.length - 2] : voxMsgs[voxMsgs.length - 1]
  const summaryText = summaryMsg?.content || ''

  // Vox inferences: first sentence from each early Vox message
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
    <div className="sr-root" style={{ '--pc': pc }}>
      <style>{`
        /* Zero-scroll tabbed dashboard */
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

        /* ── Badge ── */
        .sr-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 16px;
          border-radius: 10px;
          flex-shrink: 0;
          margin-bottom: 8px;
        }

        /* ── Tab bar ── */
        .sr-tabs {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          margin-bottom: 8px;
          background: rgba(13,18,32,0.6);
          border: 1px solid #1E2A3E;
          border-radius: 10px;
          padding: 4px;
        }
        .sr-tab {
          flex: 1;
          padding: 8px 10px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .sr-tab:hover { color: #94A3B8; background: rgba(255,255,255,0.04); }
        .sr-tab.active {
          background: rgba(99,102,241,0.18);
          color: #E0E7FF;
          border: 1px solid rgba(99,102,241,0.3);
        }

        /* ── Content panel (fills remaining height) ── */
        .sr-panel {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1E2A3E transparent;
          animation: sr-fade 0.2s ease both;
        }
        @keyframes sr-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Summary tab ── */
        .sr-summary-text {
          font-size: 15px;
          color: #C4CDD9;
          line-height: 1.8;
          white-space: pre-wrap;
          padding: 14px 16px;
          background: rgba(13,18,32,0.7);
          border: 1px solid #1E2A3E;
          border-left: 3px solid var(--pc);
          border-radius: 10px;
        }

        /* ── Brand tab ── */
        .sr-archetype-card {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,0.25);
          margin-bottom: 10px;
        }
        .sr-archetype-top {
          background: linear-gradient(135deg,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.12) 60%,rgba(200,169,110,0.05) 100%);
          border-bottom: 1px solid rgba(99,102,241,0.12);
          padding: 14px 18px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .sr-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(165px,1fr));
          gap: 8px;
        }

        /* ── Profile tab ── */
        .sr-inferences-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .sr-inf-card {
          padding: 10px 13px;
          background: rgba(13,18,32,0.5);
          border: 1px solid #1E2A3E;
          border-radius: 8px;
          border-left-width: 3px;
        }

        /* ── Footer ── */
        .sr-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 8px 16px;
          background: rgba(13,18,32,0.6);
          border: 1px solid #1E2A3E;
          border-radius: 10px;
          margin-top: 8px;
        }

        /* ── Mobile ── */
        @media (max-width: 860px) {
          .sr-root { height: auto; overflow: visible; }
          .sr-tabs { overflow-x: auto; }
          .sr-panel { overflow: visible; flex: none; min-height: 300px; }
          .sr-inferences-grid { grid-template-columns: 1fr; }
          .sr-pillars-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── Badge ── */}
      <div className="sr-badge" style={{ background: `linear-gradient(135deg,${pc}14,${pc}06)`, border: `1px solid ${pc}35` }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: `${pc}22`, border: `1px solid ${pc}45`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', flexShrink: 0,
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: pc, letterSpacing: '2px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
            SESSION COMPLETE{sessionDate ? ` · ${sessionDate}` : ''}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
            {component?.title}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', flexShrink: 0 }}>
          {messages?.length || 0} exchanges
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sr-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sr-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={activeTab === t.id ? { borderColor: `${pc}50` } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content Panel ── */}
      <div className="sr-panel" key={activeTab}>

        {/* ═══ SUMMARY TAB ═══ */}
        {activeTab === 'summary' && (
          <div className="sr-summary-text">
            {summaryText || 'Vox's strategic summary will appear here once the session is finalised.'}
          </div>
        )}

        {/* ═══ BRAND FRAMEWORK TAB ═══ */}
        {activeTab === 'brand' && (
          <div>
            {/* Archetype Hero Card */}
            {framework?.archetype && archetypeApproach ? (
              <div className="sr-archetype-card">
                <div className="sr-archetype-top">
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
                  }}>
                    {archetypeApproach.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>YOUR ARCHETYPE</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#E0E7FF', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: '6px' }}>
                      {framework.archetype}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                      {archetypeApproach.description}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '10px 18px', background: 'rgba(8,10,20,0.7)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: '#6366f1', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>▶</span>
                  <div>
                    <span style={{ fontSize: '11px', color: '#6366f1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginRight: '8px' }}>Content Mandate</span>
                    <span style={{ fontSize: '14px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{archetypeApproach.mandate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', color: '#475569', fontSize: '15px' }}>Brand framework is being built by Chanakya — check back shortly.</div>
            )}

            {/* Content Pillars */}
            {framework?.content_pillars?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>Content Pillars</div>
                <div className="sr-pillars-grid">
                  {framework.content_pillars.map((p, i) => {
                    const title = typeof p === 'object' ? p.title : p
                    const desc  = typeof p === 'object' ? (p.description || p.desc || '') : ''
                    const col   = PILLAR_COLORS[i % PILLAR_COLORS.length]
                    return (
                      <div key={i} style={{ padding: '12px 14px', background: 'rgba(13,18,32,0.7)', border: `1px solid ${col}28`, borderTop: `3px solid ${col}`, borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: col, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: '5px' }}>PILLAR {String(i + 1).padStart(2, '0')}</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", lineHeight: 1.3, marginBottom: desc ? '5px' : 0 }}>{title}</div>
                        {desc && <div style={{ fontSize: '13px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{desc}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PROFILE READ TAB ═══ */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ fontSize: '14px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: 1.7, marginBottom: '12px' }}>
              What Vox concluded about you — these inferences inform every piece of content Elevox builds on your behalf.
            </div>
            {voxInferences.length > 0 ? (
              <div className="sr-inferences-grid">
                {voxInferences.map((inference, i) => {
                  const cat = INFERENCE_CATEGORIES[i % INFERENCE_CATEGORIES.length]
                  return (
                    <div key={i} className="sr-inf-card" style={{ borderLeftColor: cat.color }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: cat.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: '5px' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '14px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                        {inference}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: '#475569', fontSize: '15px' }}>Profile inferences are being synthesised — check back once Chanakya finalises the framework.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ flexShrink: 0, padding: '8px 14px', marginTop: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px' }}>
          ⚠ {error}{' '}<button onClick={onDismissError} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      {/* ── Footer CTA ── */}
      <div className="sr-footer">
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '2px' }}>Want to revisit or adjust?</div>
          <div style={{ fontSize: '13px', color: '#475569', fontFamily: "'Inter', sans-serif" }}>Vox will summarise your decisions and ask what you'd like to change.</div>
        </div>
        <button
          onClick={onFollowUp}
          disabled={thinking}
          style={{
            padding: '10px 22px',
            background: thinking ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: thinking ? '1px solid rgba(99,102,241,0.2)' : 'none',
            borderRadius: '9px',
            color: thinking ? '#64748B' : '#fff',
            fontSize: '14px', fontWeight: '600',
            cursor: thinking ? 'default' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: thinking ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {thinking ? 'Loading…' : 'Request Follow-up →'}
        </button>
      </div>
    </div>
  )
}
