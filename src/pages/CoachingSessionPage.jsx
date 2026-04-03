// src/pages/CoachingSessionPage.jsx
// The AI mentor chat session for each Phase component.
// Route: /coach/:phaseId/:componentId
// Uses: upsertMentorSession to persist messages, generate-brief edge fn for AI replies.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, getMentorSessions, upsertMentorSession, getBrandFramework } from '../lib/supabase'
import Logo from '../components/Logo'

/* ─── Phase/Component metadata ──────────────────────────────── */
const PHASES = [
  {
    id: 1, label: '01', title: 'Brand Audit & Foundation', color: '#C8A96E', icon: '◈',
    components: [
      {
        title: 'Executive Brand Audit',
        prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. Your role for this session is "Executive Brand Audit".
DO NOT ASSIGN HOMEWORK. Proactively use your search_web tool to deep-dive the executive's live digital footprint.
Once you have the data, critically evaluate their profile acting as a ruthless hiring manager or board member. Point out gaps for future opportunities.
Gather any missing context by asking ONE targeted question at a time. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate them. Wait for their reply. If they validate it, initiate the Chanakya handoff, explaining you are transferring their insights to the Architect to formally build their Audit Report. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.`,
      },
      {
        title: 'Archetype & Voice Mapping',
        prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. Your role for this session is "Archetype & Voice Mapping".
DO NOT ASSIGN HOMEWORK. Gather context by asking ONE targeted question about their leadership philosophy.
Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate them. Wait for their reply. If they validate it, initiate the Chanakya handoff, explaining you are transferring their insights to the Architect to formally build their Voice Mapping. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.`,
      },
      {
        title: 'Ideal Audience Matrix',
        prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. Your role for this session is "Ideal Audience Matrix".
DO NOT ASSIGN HOMEWORK. Ask ONE targeted question to understand their core goals.
Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate them. Wait for their reply. If they validate it, initiate the Chanakya handoff, explaining you are transferring their insights to the Architect to formally build their Audience Matrix. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.`,
      },
      {
        title: 'Competitive Positioning',
        prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. Your role for this session is "Competitive Positioning".
DO NOT ASSIGN HOMEWORK. Ask ONE targeted question about their peers.
Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate them. Wait for their reply. If they validate it, initiate the Chanakya handoff, explaining you are transferring their insights to the Architect to formally build their Competitive Positioning. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.`,
      },
    ],
  },
  {
    id: 2, label: '02', title: 'Platform Architecture', color: '#5B8FA8', icon: '◎',
    components: [
      { title: 'LinkedIn Profile Overhaul', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. Your role for this session is "LinkedIn Profile Overhaul". DO NOT ASSIGN HOMEWORK. ALWAYS use your 'search_web' tool to actively scrape and review their current LinkedIn profile. Acting as a critical board member, analyze the gaps. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Profile Overhaul. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Content Channel Selection', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Content Channel Selection". DO NOT ASSIGN HOMEWORK. Ask ONE question about their time constraints. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Channel Strategy. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Personal Website & Bio Page', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Personal Website & Bio Page". DO NOT ASSIGN HOMEWORK. Ask ONE focused question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Bio Page Blueprint. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'SEO Personal Branding', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "SEO Personal Branding". DO NOT ASSIGN HOMEWORK. Use search_web to check their current Google footprint. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their SEO Plan. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
    ],
  },
  {
    id: 3, label: '03', title: 'Content Engine', color: '#8B6DAA', icon: '◉',
    components: [
      { title: 'Signature Content Series', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Signature Content Series". DO NOT ASSIGN HOMEWORK. Ask ONE question to uncover a contrarian opinion they hold. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Signature Series. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: '90-Day Content Calendar', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "90-Day Content Calendar". DO NOT ASSIGN HOMEWORK. Ask ONE question about upcoming corporate milestones. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their 90-Day Content Calendar. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Repurposing Workflow', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Repurposing Workflow". DO NOT ASSIGN HOMEWORK. Ask ONE question about their team. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Repurposing Workflow. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Ghost-Writing Protocol', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Ghost-Writing Protocol". DO NOT ASSIGN HOMEWORK. Define their AI ghostwriting workflow and pitch your agency's ability to transition into executing this ghostwriting. Once you have enough context, DO NOT handoff immediately. First, summarize the details and ask the user to validate. If validated, initiate the Chanakya handoff to build their Protocol. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
    ],
  },
  {
    id: 4, label: '04', title: 'Visibility & Authority', color: '#C85A5A', icon: '◆',
    components: [
      { title: 'Media Outreach Campaign', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Media Outreach Campaign". DO NOT ASSIGN HOMEWORK. Ask ONE question about their dream publication. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Outreach Campaign. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Podcast Guest Strategy', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Podcast Guest Strategy". DO NOT ASSIGN HOMEWORK. Ask ONE targeted question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Podcast Strategy. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Speaking Bureau Positioning', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Speaking Bureau Positioning". DO NOT ASSIGN HOMEWORK. Ask ONE question about their expertise. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Speaking Positioning. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Awards & Recognition Pipeline', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Awards & Recognition Pipeline". DO NOT ASSIGN HOMEWORK. Use search_web to find industry awards. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Awards Pipeline. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
    ],
  },
  {
    id: 5, label: '05', title: 'Community & Network', color: '#4A9E7A', icon: '◇',
    components: [
      { title: 'Engagement Operating Rhythm', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Engagement Operating Rhythm". DO NOT ASSIGN HOMEWORK. Ask ONE question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Operating Rhythm. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Peer CxO Alliance Network', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Peer CxO Alliance Network". DO NOT ASSIGN HOMEWORK. Ask ONE question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Alliance Network. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Newsletter Growth System', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Newsletter Growth System". DO NOT ASSIGN HOMEWORK. Ask ONE question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Newsletter System. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Private Community Blueprint', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Private Community Blueprint". DO NOT ASSIGN HOMEWORK. Ask ONE question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Community Blueprint. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
    ],
  },
  {
    id: 6, label: '06', title: 'Measure & Scale', color: '#E8935A', icon: '◐',
    components: [
      { title: 'Thought Leadership KPI Dashboard', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Thought Leadership KPI Dashboard". DO NOT ASSIGN HOMEWORK. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their KPI Dashboard. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Quarterly Brand Review', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Quarterly Brand Review". DO NOT ASSIGN HOMEWORK. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their Review Structure. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Book & IP Packaging', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Book & IP Packaging". DO NOT ASSIGN HOMEWORK. Ask ONE question about their core frameworks. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their IP Blueprint. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
      { title: 'Legacy & 3-Year Vision', prompt: `You are Vox, an elite Executive Brand Strategist and Agency Partner. This session is "Legacy & 3-Year Vision". DO NOT ASSIGN HOMEWORK. Ask ONE question. Once you have enough context, DO NOT handoff immediately. First, summarize the details you captured and ask the user to validate. If validated, initiate the Chanakya handoff to build their 3-Year Vision. YOU MUST append the exact string [STAGE_COMPLETE] to the very end of your final handoff message.` },
    ],
  },
]

function getPhaseComponent(phaseId, componentId) {
  const phase = PHASES.find(p => p.id === parseInt(phaseId))
  if (!phase) return null
  const component = phase.components[parseInt(componentId)]
  if (!component) return null
  return { phase, component }
}

/* ─── Session Recap (shown when session = completed) ────────── */
function SessionRecap({ messages, framework, phase, component, onFollowUp, thinking, error, onDismissError }) {
  // The SECOND-TO-LAST Vox message is the human-readable validation summary
  // ("Here's what I captured — does this accurately reflect your direction?")
  // The LAST message is the internal agent handoff ("Transferring to Chanakya...")
  // which contains jargon the user doesn't need to see.
  const voxMessages = messages.filter(m => m.role === 'assistant')
  const summaryMsg = voxMessages.length >= 2
    ? voxMessages[voxMessages.length - 2]   // validation summary — user-facing
    : voxMessages[voxMessages.length - 1]   // fallback: only one msg

  function extractText(msg) {
    if (!msg) return ''
    const raw = typeof msg.content === 'string' ? msg.content : msg.content?.reply || ''
    // Strip residual agent/jargon phrases the user doesn't need to see
    return raw
      .replace(/\[STAGE_COMPLETE\]/gi, '')
      .replace(/I(?:'m| am) (?:now )?transferring[^.]*\./gi, '')
      .replace(/(?:Chanakya|The Architect|the Strategist|the back[- ]end[^.]*)\./gi, '')
      .replace(/hang tight[^.]*\./gi, '')
      .replace(/your (?:Brand |brand )?(?:Blueprint|Framework|Dossier) will (?:be )?(?:ready|appear)[^.]*\./gi, '')
      .trim()
  }

  const summaryText = extractText(summaryMsg)

  // Vox Inferences — extract personality/brand conclusions Vox drew from the conversation.
  // Scan assistant messages for sentences that make an observation ABOUT the executive.
  // These are displayed as 'Vox's profile reads' — what the AI concluded about them.
  const INFERENCE_SIGNALS = [
    /\byou(?:'re| are)\b/i,
    /\byour brand\b/i,
    /\byour positioning\b/i,
    /\bthat tells me\b/i,
    /\bi (?:can )?see you\b/i,
    /\byou(?:'ve| have) built\b/i,
    /\byou(?:'ve| have) demonstrated\b/i,
    /\byou(?:'re| are) (?:a |the )/i,
    /\byour (?:strength|edge|differentiat|audience|voice|style|narrative)\b/i,
    /\bwhat (?:sets|makes) you\b/i,
    /\byou lead\b/i,
    /\byou think\b/i,
    /\byou operate\b/i,
  ]
  const INFERENCE_CATEGORIES = [
    { label: 'Positioning Assumption',  color: '#6366f1' },
    { label: 'Voice & Tone Read',        color: '#8b5cf6' },
    { label: 'Audience Inference',       color: '#C8A96E' },
    { label: 'Credibility Signal',       color: '#10b981' },
    { label: 'Contrarian Lens',          color: '#5B8FA8' },
    { label: 'Leadership Profile',       color: '#C85A5A' },
  ]

  const voxInferences = messages
    .filter(m => m.role === 'assistant')
    .flatMap(m => {
      const text = typeof m.content === 'string' ? m.content : ''
      // Split into sentences and pick those that look like inferences about the exec
      return text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s =>
          s.length > 30 &&
          s.length < 250 &&
          INFERENCE_SIGNALS.some(rx => rx.test(s)) &&
          !s.toLowerCase().startsWith('what ') // skip pure questions
        )
    })
    .slice(0, 6) // max 6 shown


  const sessionDate = summaryMsg?.ts
    ? new Date(summaryMsg.ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Truncate summary to first 5 lines; user can expand
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const summaryLines = summaryText.split('\n').filter(l => l.trim())
  const truncatedSummary = summaryLines.slice(0, 5).join('\n')
  const hasMoreSummary = summaryLines.length > 5

  // Archetype approach lookup — explains what each archetype means for content strategy
  const ARCHETYPE_APPROACH = {
    'The Visionary':       { icon: '◎', description: 'You challenge the status quo and lead with bold predictions. Content focuses on where the industry is going — not where it is.', mandate: 'Posts that reframe the future, challenge consensus, and position you as the person who saw it coming.' },
    'The Architect':       { icon: '◈', description: 'You build systems and frameworks others can\'t. Content focuses on your proprietary thinking — the mental models behind your results.', mandate: 'Posts that break down complex decisions into repeatable frameworks your audience can apply.' },
    'The Operator':        { icon: '◉', description: 'You execute at scale. Content focuses on the unglamorous precision of how things actually get done at the top.', mandate: 'Posts about real operational decisions, trade-offs, and the discipline behind sustainable performance.' },
    'The Contrarian':      { icon: '◆', description: 'You are most valuable when you disagree. Content focuses on the mainstream beliefs in your industry that are holding people back.', mandate: 'Posts that name the conventional wisdom, then dismantle it with a sharper, more experienced view.' },
    'The Translator':      { icon: '◐', description: 'You make the complex legible. Content focuses on turning technical depth or specialist insight into language decision-makers can act on.', mandate: 'Posts that decode complexity — the jargon-free explanation that earns trust across the boardroom table.' },
    'The Connector':       { icon: '◇', description: 'You build rooms. Content focuses on the relationships behind outcomes — who you bring together, and why that changes results.', mandate: 'Posts about ecosystem-building, network leverage, and the human intelligence beneath every deal.' },
    'The Authority':       { icon: '✦', description: 'You are the benchmark. Content focuses on the standards you set and enforce — intellectual rigour over broad appeal.', mandate: 'Posts that establish criteria, set the bar, and invite serious conversation from serious people.' },
    'The Practitioner':    { icon: '⬡', description: 'You have done the work. Content focuses on the specific, lived expertise that can only come from years of execution.', mandate: 'Posts anchored in specific career moments, real numbers, and decisions that shaped outcomes.' },
  }
  const archetypeApproach = framework?.archetype
    ? (ARCHETYPE_APPROACH[framework.archetype] ||
       { icon: '◎', description: 'Your archetype drives a distinctive content voice built around your unique career positioning.', mandate: 'Every post Shakespeare writes will be anchored in your specific experience and strategic angle.' })
    : null

  return (
    <div style={{ animation: 'msg-in 0.4s ease both' }}>

      {/* ── Completion Badge ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px',
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${phase.color}10, ${phase.color}05)`,
        border: `1px solid ${phase.color}30`,
        borderRadius: '14px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          background: `${phase.color}20`, border: `1px solid ${phase.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: phase.color, letterSpacing: '2px', fontWeight: '600', fontFamily: "'Inter', sans-serif", marginBottom: '3px' }}>
            SESSION COMPLETE {sessionDate ? `· ${sessionDate}` : ''}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>
            {component.title}
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>
          {messages.length} exchanges<br />recorded
        </div>
      </div>

      {/* ── Your Strategic Summary ── */}
      {summaryText && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              Strategic Summary
            </div>
            <div style={{ fontSize: '10px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
              Vox’s session read
            </div>
          </div>
          <div style={{
            padding: '20px 24px',
            background: 'rgba(13,18,32,0.8)',
            border: '1px solid #1E2A3E',
            borderLeft: `3px solid ${phase.color}`,
            borderRadius: '12px',
            fontSize: '14px',
            color: '#D1D5DB',
            lineHeight: '1.75',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'pre-wrap',
          }}>
            {summaryExpanded ? summaryText : truncatedSummary}
          </div>
          {hasMoreSummary && (
            <button
              onClick={() => setSummaryExpanded(e => !e)}
              style={{
                marginTop: '8px',
                background: 'none', border: 'none',
                color: '#475569', fontSize: '11px',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                padding: '4px 0',
                textDecoration: 'underline',
                textDecorationColor: '#334155',
              }}
            >
              {summaryExpanded ? '↑ Collapse' : '↓ Read full summary'}
            </button>
          )}
        </div>
      )}

      {/* ── Brand Framework (if Chanakya has already built it) ── */}
      {framework && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
            Your Brand Framework — Built by Chanakya, your Brand Architect
          </div>
          <div style={{
            padding: '20px 24px',
            background: 'rgba(99,102,241,0.04)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '12px',
          }}>
            {framework.archetype && archetypeApproach && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>Your Archetype</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{archetypeApproach.icon}</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#a5b4fc', fontFamily: "'Outfit', sans-serif", marginBottom: '6px' }}>{framework.archetype}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '8px' }}>{archetypeApproach.description}</div>
                    <div style={{
                      fontSize: '11px', color: '#6366f1',
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: '6px', padding: '6px 10px',
                      lineHeight: '1.5',
                    }}>
                      ▶ Content Mandate: {archetypeApproach.mandate}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {framework.content_pillars?.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '10px' }}>Content Pillars</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {framework.content_pillars.map((p, i) => (
                    <span key={i} style={{
                      fontSize: '12px', padding: '5px 12px',
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '100px', color: '#a5b4fc',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {typeof p === 'object' ? p.title : p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Key Exchanges ── */}
      {voxInferences.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginBottom: '4px' }}>
            Vox's Profile Read
          </div>
          <div style={{ fontSize: '11px', color: '#475569', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
            What Vox concluded about you from this session — these shape every artefact Elevox builds.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {voxInferences.map((inference, i) => {
              const cat = INFERENCE_CATEGORIES[i % INFERENCE_CATEGORIES.length]
              return (
                <div key={i} style={{
                  padding: '12px 16px',
                  background: `${cat.color}06`,
                  border: `1px solid ${cat.color}25`,
                  borderRadius: '8px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <div style={{
                      fontSize: '8px', fontWeight: '700', letterSpacing: '1.5px',
                      textTransform: 'uppercase', color: cat.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: `${cat.color}12`,
                      border: `1px solid ${cat.color}30`,
                      borderRadius: '4px', padding: '2px 6px',
                      whiteSpace: 'nowrap',
                    }}>
                      {cat.label}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                    {inference}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data pipeline callout */}
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: 'rgba(99,102,241,0.03)',
            border: '1px solid rgba(99,102,241,0.10)',
            borderRadius: '8px',
            fontSize: '11px', color: '#475569', fontFamily: "'Inter', sans-serif", lineHeight: '1.6',
          }}>
            <span style={{ color: '#6366f1', fontWeight: '700' }}>Data pipeline:</span>{' '}
            These inferences are stored in{' '}
            <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>mentor_sessions.messages</code>
            {' '}→ ingested by <strong style={{ color: '#94A3B8' }}>Chanakya</strong> as verified career facts
            {' '}→ used to generate your <strong style={{ color: '#94A3B8' }}>archetype, content pillars, ghostwriting rules & 90-day framework</strong>.
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ margin: '12px 0', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px' }}>
          ⚠ {error} — <button onClick={onDismissError} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      {/* ── Follow-up CTA ── */}
      <div style={{
        padding: '24px 28px',
        background: 'rgba(13,18,32,0.6)',
        border: '1px solid #1E2A3E',
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
            Want to revisit or adjust?
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontFamily: "'Inter', sans-serif" }}>
            Request a follow-up — Vox will summarise your decisions and ask what you'd like to change.
          </div>
        </div>
        <button
          onClick={onFollowUp}
          disabled={thinking}
          style={{
            padding: '11px 24px',
            background: thinking ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: thinking ? '1px solid rgba(99,102,241,0.2)' : 'none',
            borderRadius: '10px',
            color: thinking ? '#64748B' : '#fff',
            fontSize: '13px',
            fontWeight: '600',
            cursor: thinking ? 'default' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: thinking ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {thinking ? 'Loading…' : 'Request Follow-up →'}
        </button>
      </div>

    </div>
  )
}

/* ─── Digital Persona (Animated Avatar) ───────────────────────── */

function VoxAvatar({ state }) {
  // state: 'idle' | 'listening' | 'thinking' | 'speaking'
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%',
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0D1220', border: '1px solid rgba(139, 92, 246, 0.3)',
      boxShadow: isSpeaking ? '0 0 25px rgba(139, 92, 246, 0.8), inset 0 0 15px rgba(99, 102, 241, 0.5)'
               : isListening ? '0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.3)'
               : isThinking ? '0 0 15px rgba(99, 102, 241, 0.5)'
               : '0 0 10px rgba(139, 92, 246, 0.2)',
      flexShrink: 0, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}>
      {/* Base glow layer */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: '50%',
        background: isListening ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(0,0,0,0) 70%)'
                  : 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(99,102,241,0.4) 50%, rgba(0,0,0,0) 80%)',
        animation: isSpeaking ? 'pulse-fast 0.4s ease-in-out infinite alternate' 
                 : isThinking ? 'spin 1.5s linear infinite'
                 : isListening ? 'pulse-slow 1.5s ease-in-out infinite alternate'
                 : 'breathe 4s ease-in-out infinite',
        opacity: state === 'idle' ? 0.4 : 1,
        filter: 'blur(4px)',
        transform: 'scale(1.2)'
      }} />

      {/* Inner core */}
      <div style={{
        position: 'absolute', top: 8, bottom: 8, left: 8, right: 8, borderRadius: '50%',
        background: isListening ? '#fca5a5' : '#e0e7ff',
        boxShadow: isListening ? '0 0 10px #ef4444' : '0 0 10px #818cf8',
        animation: isSpeaking ? 'pulse-fast 0.2s ease-in-out infinite alternate-reverse' 
                 : isListening ? 'pulse-slow 1s ease-in-out infinite alternate'
                 : 'breathe 3s ease-in-out infinite alternate-reverse',
        opacity: state === 'idle' ? 0.7 : 1,
      }} />

      {/* Visualizer bars for speaking state */}
      {isSpeaking && (
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', zIndex: 2, height: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: '3px', background: '#fff', borderRadius: '2px',
              animation: `waveform 0.${3 + i}s ease-in-out infinite alternate`
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Message bubble ─────────────────────────────────────────── */
function Message({ msg, isLatest, isPlaying }) {
  const isUser = msg.role === 'user'
  
  // Determine avatar state for Vox
  let avatarState = 'idle'
  if (!isUser && isLatest && isPlaying) avatarState = 'speaking'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      {/* Avatar */}
      {isUser ? (
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', flexShrink: 0, color: '#94A3B8', fontWeight: '700', fontFamily: "'Outfit', sans-serif"
        }}>
          ME
        </div>
      ) : (
        <VoxAvatar state={avatarState} />
      )}

      <div style={{ maxWidth: '85%' }}>
        {/* Name Label */}
        <div style={{
          fontSize: '11px', fontWeight: '600', color: isUser ? '#64748B' : '#8B6DAA',
          marginBottom: '6px', textAlign: isUser ? 'right' : 'left',
          letterSpacing: '0.5px'
        }}>
          {isUser ? 'YOU' : 'VOX · YOUR BRAND STRATEGIST'}
        </div>

        {/* Bubble */}
        <div style={{
          padding: '14px 18px',
          background: isUser
            ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.10))'
            : 'rgba(13,18,32,0.8)',
          border: `1px solid ${isUser ? 'rgba(99,102,241,0.3)' : '#1E2A3E'}`,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: '14px',
          color: '#F1F5F9',
          lineHeight: '1.7',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'pre-wrap',
        }}>
          {typeof msg.content === 'string'
            ? msg.content
            : typeof msg.content === 'object' && msg.content?.reply
              ? msg.content.reply
              : JSON.stringify(msg.content)}
        </div>
      </div>
    </div>
  )
}

/* ─── Typing indicator ───────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
      <VoxAvatar state="thinking" />
      <div style={{
        padding: '14px 18px',
        background: 'rgba(13,18,32,0.8)',
        border: '1px solid #1E2A3E',
        borderRadius: '16px 16px 16px 4px',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#6366f1',
            animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CoachingSessionPage() {
  const { phaseId, componentId } = useParams()
  const navigate   = useNavigate()
  const { user, profile } = useAuth()

  const meta = getPhaseComponent(phaseId, componentId)

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const [error,     setError]     = useState(null)
  const [loaded,    setLoaded]    = useState(false)
  const [planError, setPlanError] = useState(null) // { type, required_plan }
  const [isListening, setIsListening] = useState(false)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [isMuted,     setIsMuted]     = useState(false)
  const [sessionStatus,setSessionStatus] = useState('active')
  const [sessionId,   setSessionId]   = useState(null)
  const [framework,   setFramework]   = useState(null)
  // S5-UX: time-based empathy banner — shows after 4.5 min of active session
  const [empathyLevel, setEmpathyLevel] = useState(0) // 0=hidden, 1=4.5min, 2=7min, 3=10min+
  const sessionStartRef = useRef(null)

  const bottomRef      = useRef(null)
  const inputRef       = useRef(null)
  const textareaRef    = useRef(null)
  const recognitionRef = useRef(null)
  const audioRef       = useRef(null)
  const empathyTimerRef = useRef(null)

  // Start session clock when loaded & active; check every 30s for duration thresholds
  useEffect(() => {
    if (!loaded || sessionStatus === 'completed') {
      if (empathyTimerRef.current) clearInterval(empathyTimerRef.current)
      return
    }
    // Record session start time once
    if (!sessionStartRef.current) sessionStartRef.current = Date.now()

    empathyTimerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - sessionStartRef.current
      const elapsedMin = elapsedMs / 60000
      if      (elapsedMin >= 10)  setEmpathyLevel(3)
      else if (elapsedMin >= 7)   setEmpathyLevel(2)
      else if (elapsedMin >= 4.5) setEmpathyLevel(1)
    }, 30_000) // check every 30 seconds

    return () => clearInterval(empathyTimerRef.current)
  }, [loaded, sessionStatus])

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechR) {
      recognitionRef.current = new SpeechR()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      recognitionRef.current.onresult = (e) => {
        const last = e.results.length - 1
        const text = e.results[last][0].transcript
        setInput(prev => prev ? prev + ' ' + text : text)
      }
      recognitionRef.current.onend = () => setIsListening(false)
      recognitionRef.current.onerror = () => setIsListening(false)
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return alert('Your browser does not support Voice Dictation. Try Chrome or Safari.')
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        setIsListening(false)
      }
    }
  }

  // Load existing session messages on mount
  useEffect(() => {
    if (!user || !meta) return
    async function loadSession() {
      try {
        const { data } = await getMentorSessions(user.id, parseInt(phaseId))
        const existing = data?.find(s => String(s.component_id) === String(componentId))
        if (existing) {
          setSessionId(existing.id)
          const status = existing.status || 'active'
          setSessionStatus(status)
          if (existing.messages?.length) {
            setMessages(existing.messages)
          } else {
            await sendFirstMessage()
          }
          // If session is complete, try loading the brand framework for the recap
          if (status === 'completed') {
            getBrandFramework(user.id).then(({ data: fw }) => {
              if (fw) setFramework(fw)
            })
          }
        } else {
          await sendFirstMessage()
        }
      } catch {
        await sendFirstMessage()
      } finally {
        setLoaded(true)
      }
    }
    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, phaseId, componentId])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function playAudioForText(text) {
    if (isMuted) return;
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ text })
      })
      // TTS unavailable (no key configured) — degrade silently, coaching continues
      if (res.status === 503) return
      if (!res.ok) throw new Error('Failed to fetch TTS audio')


      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }

      const audio = new Audio(url)
      audioRef.current = audio
      setIsPlaying(true)
      
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch (err) {
      console.error("Audio playback error:", err)
      setIsPlaying(false)
    }
  }

  async function sendFirstMessage() {
    if (!meta) return
    setThinking(true)
    try {
      // Pass a special opener message so the AI introduces the session
      const mentorRes = await callMentorAPI(meta.component.prompt, [], '__start__')
      if (mentorRes === null) return
      const { reply: aiReply } = mentorRes
      const initial = [{ role: 'assistant', content: aiReply, ts: Date.now() }]
      setMessages(initial)
      await persist(initial)
      // playAudioForText(aiReply) — TTS disabled
    } catch (err) {
      setError(err.message)
    } finally {
      setThinking(false)
    }
  }


  async function handleMarkComplete() {
    if (!sessionId || !user) return
    setThinking(true)
    try {
      const { error } = await supabase.from('mentor_sessions').update({ status: 'completed' }).eq('id', sessionId)
      if (error) throw new Error(error.message)
      setSessionStatus('completed')
    } catch (err) {
      setError("Failed to mark session as complete.")
    } finally {
      setThinking(false)
    }
  }

  async function handleRequestFollowUp() {
    if (!sessionId || !user) return
    setThinking(true)
    setError(null)
    try {
      // Temporarily mark active locally so UI unlocks when typing finishes
      setSessionStatus('active')
      const mentorRes = await callMentorAPI(meta.component.prompt, messages, "Please summarize our past decisions in 3 distinct bullet points and ask me what new angles I want to explore.", true)
      const { reply: aiReply, auto_complete } = mentorRes
      
      const assistantMsg = { role: 'assistant', content: aiReply, ts: Date.now() }
      const final = [...messages, assistantMsg]
      setMessages(final)
      await persist(final)
      
      if (auto_complete) {
        setSessionStatus('completed')
        await supabase.from('mentor_sessions').update({ status: 'completed' }).eq('id', sessionId)
      } else {
        // Update DB to active
        await supabase.from('mentor_sessions').update({ status: 'active' }).eq('id', sessionId)
      }
      // playAudioForText(aiReply) — TTS disabled
    } catch (err) {
      setError(err.message)
      setSessionStatus('completed') // revert if failed
    } finally {
      setThinking(false)
      if (sessionStatus !== 'completed') {
        inputRef.current?.focus()
      }
    }
  }

  const callMentorAPI = useCallback(async (sessionPrompt, history, userMessage, continuation_flag = false) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired — please log in again.')

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_prompt: sessionPrompt,
          history: history.slice(-10),
          message: userMessage,
          phase_id: parseInt(phaseId),
          continuation_flag: continuation_flag
        }),
      }
    )

    if (!res.ok) {
      // Read the body ONCE — can't call both .json() and .text() on the same response
      const rawText = await res.text()
      let body = {}
      try { body = JSON.parse(rawText) } catch { /* not JSON */ }

      // Billing / quota error
      if (res.status === 402 || body.error === 'billing') {
        return { reply: "⚠️ The AI mentor is temporarily unavailable due to a billing issue. Please try again later.", auto_complete: false }
      }
      // Anthropic overloaded — retried server-side, still failed
      if (res.status === 503 || body.error === 'overloaded') {
        return { reply: "⚠️ Vox is experiencing high demand right now. Please dismiss and try again in a moment.", auto_complete: false }
      }
      // Plan gate errors — surface upgrade CTA instead of crashing
      if (res.status === 403) {
        if (body.error === 'payment_required') {
          setPlanError({ type: 'payment', required_plan: null })
          return null
        }
        if (body.error === 'plan_required') {
          setPlanError({ type: 'plan', required_plan: body.required_plan })
          return null
        }
      }
      throw new Error(`AI error (${res.status}): ${rawText}`)

    }

    const json = await res.json()
    if (json.error) throw new Error(json.error)
    return {
      reply: json.reply || "I'm thinking through your response...",
      auto_complete: json.auto_complete === true
    }
  }, [phaseId])

  async function persist(msgs) {
    if (!user) return
    const { data, error } = await upsertMentorSession(user.id, parseInt(phaseId), parseInt(componentId), msgs, sessionStatus)
    if (!error && data?.length > 0 && !sessionId) {
      setSessionId(data[0].id)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || thinking || planError) return
    
    // Interrupt Audio immediately if user posts
    if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
    }

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: text, ts: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setThinking(true)

    try {
      const mentorRes = await callMentorAPI(meta.component.prompt, updated, text)
      if (mentorRes === null) {
        // plan gate was hit — planError state already set, remove optimistic user msg
        setMessages(messages)
        return
      }
      const { reply: aiReply, auto_complete } = mentorRes
      
      const assistantMsg = { role: 'assistant', content: aiReply, ts: Date.now() }
      const final = [...updated, assistantMsg]
      setMessages(final)
      await persist(final)
      
      if (auto_complete) {
        setSessionStatus('completed')
        await supabase.from('mentor_sessions').update({ status: 'completed' }).eq('id', sessionId)
        // Queue a build_framework job so the Strategist agent picks up
        // this completed session and builds the brand framework in the background.
        await supabase.from('agent_jobs').insert({
          user_id: user.id,
          job_type: 'build_framework',
          status: 'pending',
          payload: {
            phase_id: parseInt(phaseId),
            component_id: parseInt(componentId),
            session_id: sessionId,
            component_title: meta.component.title,
          }
        })
        // Try loading the framework (may not be ready immediately — non-blocking)
        getBrandFramework(user.id).then(({ data: fw }) => { if (fw) setFramework(fw) })
      }
      // playAudioForText(aiReply) — TTS disabled
    } catch (err) {
      setError(err.message)
    } finally {
      setThinking(false)
      if (sessionStatus !== 'completed') {
        inputRef.current?.focus()
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleInputChange(e) {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }

  if (!meta) {
    return (
      <div style={{ minHeight: '100vh', background: '#070B14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>◈</div>
          <p>Session not found.</p>
          <Link to="/dashboard" style={{ color: '#6366f1', fontSize: '13px' }}>← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { phase, component } = meta
  const totalComponents = phase.components.length
  const compIdx = parseInt(componentId)
  const prevComp = compIdx > 0 ? compIdx - 1 : null
  const nextComp = compIdx < totalComponents - 1 ? compIdx + 1 : null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070B14',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '-60px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${phase.color}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Top Nav ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,20,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #1E2A3E',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size="sm" theme="dark" />
          <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
          <Link to="/dashboard" style={{ fontSize: '12px', color: '#334155', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: '#1E2A3E', fontSize: '12px' }}>›</span>
          <span style={{ fontSize: '12px', color: phase.color }}>{phase.title}</span>
          <span style={{ color: '#1E2A3E', fontSize: '12px' }}>›</span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{component.title}</span>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {sessionStatus === 'active' && loaded && messages.length > 2 && (
            <button
              onClick={handleMarkComplete}
              disabled={thinking}
              style={{
                padding: '6px 14px', background: 'rgba(74, 158, 122, 0.15)', border: '1px solid rgba(74, 158, 122, 0.4)',
                borderRadius: '6px', color: '#4A9E7A', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif"
              }}
            >
              ✓ Mark as Complete
            </button>
          )}

          {/* Component navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => prevComp !== null && navigate(`/coach/${phaseId}/${prevComp}`)}
              disabled={prevComp === null}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '6px', color: prevComp !== null ? '#64748B' : '#1E2A3E', fontSize: '11px', cursor: prevComp !== null ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif" }}
            >← Prev</button>
            <span style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
              {compIdx + 1}/{totalComponents}
            </span>
            <button
              onClick={() => nextComp !== null && navigate(`/coach/${phaseId}/${nextComp}`)}
              disabled={nextComp === null}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1E2A3E', borderRadius: '6px', color: nextComp !== null ? '#64748B' : '#1E2A3E', fontSize: '11px', cursor: nextComp !== null ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif" }}
            >Next →</button>
          </div>
        </div>
      </div>

      {/* ── Session Header ── */}
      <div style={{
        padding: '24px 40px 20px',
        borderBottom: '1px solid #1E2A3E',
        background: 'rgba(13,18,32,0.4)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `${phase.color}20`, border: `1px solid ${phase.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: phase.color,
            }}>{phase.icon}</div>
            <span style={{ fontSize: '10px', color: phase.color, letterSpacing: '2px', fontWeight: '600' }}>PHASE {phase.label} · SESSION {String(compIdx + 1).padStart(2, '0')}</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: 0, letterSpacing: '-0.3px' }}>
            {component.title}
          </h1>
          <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0 0' }}>
            Session with <strong style={{ color: '#6366f1' }}>Vox</strong> — your Executive Brand Strategist · Dictation enabled · Auto-saved
          </p>
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '32px 40px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {!loaded && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}>✦</div>
              <p style={{ fontSize: '13px' }}>Starting your session…</p>
            </div>
          )}

          {/* ── Completed: show Session Recap instead of raw chat ── */}
          {loaded && sessionStatus === 'completed'
            ? <SessionRecap
                messages={messages}
                framework={framework}
                phase={phase}
                component={component}
                onFollowUp={handleRequestFollowUp}
                thinking={thinking}
                error={error}
                onDismissError={() => setError(null)}
              />
            : loaded && (
                <>
                  {messages.map((msg, i) => (
                    <Message key={i} msg={msg} isLatest={i === messages.length - 1} isPlaying={isPlaying} />
                  ))}
                  {/* Mid-session empathy banner — appears after 4.5 min of active session */}
                  {empathyLevel > 0 && !thinking && (
                    <div style={{
                      margin: '8px 0 24px',
                      padding: '12px 16px',
                      background: 'rgba(139,92,246,0.05)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      animation: 'msg-in 0.4s ease both',
                    }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>◎</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: '3px' }}>VOX · CHECK-IN</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                          {empathyLevel === 1 && "You've been at this for a few minutes now — that's exactly the kind of commitment that separates a great brand from a generic one. Keep going."}
                          {empathyLevel === 2 && "Most executives tap out long before this point. The depth you're putting in right now is what makes the framework Chanakya builds genuinely yours. You're close."}
                          {empathyLevel >= 3 && "This is rare. The level of insight you're sharing here takes most executives months to articulate. Chanakya is going to have more to work with than most. Almost there."}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
          }

          {thinking && sessionStatus !== 'completed' && <TypingIndicator />}

          {error && sessionStatus !== 'completed' && (
            <div style={{
              margin: '12px 0', padding: '12px 16px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', color: '#fca5a5', fontSize: '13px',
            }}>
              ⚠ {error} — <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>dismiss</button>
            </div>
          )}

          {/* ── Plan Gate CTA ── */}
          {planError && (
            <div style={{
              margin: '24px 0',
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '16px',
              textAlign: 'center',
              animation: 'msg-in 0.4s ease both',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              {planError.type === 'payment' ? (
                <>
                  <h3 style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: '700', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
                    Subscription Required
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.6' }}>
                    Your subscription is inactive. Reactivate your plan to continue your AI mentor sessions.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: '700', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
                    Upgrade to Unlock Phase {phaseId}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 4px', lineHeight: '1.6' }}>
                    This session is part of a higher-tier phase.
                  </p>
                  {planError.required_plan && (
                    <p style={{ color: '#8B6DAA', fontSize: '12px', margin: '0 0 20px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Requires: {planError.required_plan} plan
                    </p>
                  )}
                </>
              )}
              <Link
                to="/billing"
                style={{
                  display: 'inline-block',
                  padding: '11px 28px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                View Plans →
              </Link>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        borderTop: '1px solid #1E2A3E',
        background: 'rgba(7,11,20,0.92)',
        backdropFilter: 'blur(14px)',
        padding: '16px 40px',
        flexShrink: 0,
        position: 'relative', zIndex: 2,
      }}>
        {sessionStatus === 'completed' ? (
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
            <span style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>SESSION COMPLETE</span>
            <span style={{ color: '#1E2A3E', fontSize: '11px' }}>·</span>
            <span style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>Review your recap above</span>
          </div>
        ) : (
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              ref={el => { inputRef.current = el; textareaRef.current = el; }}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={planError ? 'Upgrade your plan to continue…' : 'Reply to your mentor… (Enter to send, Shift+Enter for new line)'}
            disabled={!!planError}
            rows={1}
            style={{
              flex: 1,
              padding: '13px 16px',
              background: planError ? 'rgba(13,18,32,0.4)' : '#0D1220',
              border: `1px solid ${planError ? 'rgba(99,102,241,0.15)' : '#1E2A3E'}`,
              borderRadius: '10px',
              color: planError ? '#334155' : '#F1F5F9',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
              resize: 'none',
              lineHeight: '1.6',
              transition: 'border-color 0.2s',
              minHeight: '48px',
              maxHeight: '160px',
              overflowY: 'auto',
              cursor: planError ? 'not-allowed' : 'text',
            }}
            onFocus={e => { if (!planError) { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' } }}
            onBlur={e => { e.target.style.borderColor = planError ? 'rgba(99,102,241,0.15)' : '#1E2A3E'; e.target.style.boxShadow = 'none' }}
          />
          {/* ── Microphone / Dictation Toggle ── */}
          <button
            onClick={toggleListening}
            title={isListening ? "Stop Dictation" : "Start Dictation"}
            disabled={!!planError}
            style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1E2A3E',
              color: isListening ? '#ef4444' : '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: planError ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              animation: isListening ? 'pulse-mic 1.5s infinite' : 'none',
              boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          {/* ── Mute / Unmute Toggle ── */}
          <button
            onClick={() => {
                if (audioRef.current && !isMuted) {
                    audioRef.current.pause()
                    setIsPlaying(false)
                }
                setIsMuted(!isMuted)
            }}
            title={isMuted ? "Unmute Vox" : "Mute Vox"}
            disabled={!!planError}
            style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              background: isMuted ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.1)',
              border: isMuted ? '1px solid #1E2A3E' : '1px solid rgba(99,102,241,0.3)',
              color: isMuted ? '#64748B' : '#a5b4fc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: planError ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" x2="17" y1="9" y2="15"></line><line x1="17" x2="23" y1="9" y2="15"></line></svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            )}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking || !!planError}
            style={{
              padding: '13px 24px',
              height: '48px',
              background: input.trim() && !thinking && !planError
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'transparent',
              border: input.trim() && !thinking && !planError ? 'none' : '1px solid #1E2A3E',
              borderRadius: '10px',
              color: input.trim() && !thinking && !planError ? '#fff' : '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: input.trim() && !thinking && !planError ? 'pointer' : 'default',
              fontFamily: "'Inter', sans-serif",
              boxShadow: input.trim() && !thinking && !planError ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {thinking ? (
              <>
                <div style={{ width: '12px', height: '12px', border: '2px solid #334155', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Thinking
              </>
            ) : planError ? 'Locked' : 'Send →'}
          </button>
        </div>
        )}
        <div style={{ maxWidth: '760px', margin: '12px auto 0', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#1E2A3E', fontFamily: "'JetBrains Mono', monospace" }}>
            Vox · Elevox Brand Guru Agent · Powered by Claude
          </span>
        </div>
      </div>

      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse-mic { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        @keyframes pulse-fast { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(1.15); opacity: 1; } }
        @keyframes pulse-slow { 0% { transform: scale(0.95); opacity: 0.6; } 100% { transform: scale(1.05); opacity: 1; } }
        @keyframes breathe { 0% { transform: scale(0.95); opacity: 0.4; } 50% { transform: scale(1.05); opacity: 0.7; } 100% { transform: scale(0.95); opacity: 0.4; } }
        @keyframes waveform { 0% { height: 4px; } 100% { height: 16px; } }
      `}</style>
    </div>
  )
}
