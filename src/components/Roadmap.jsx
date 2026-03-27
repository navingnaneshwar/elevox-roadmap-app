// src/components/Roadmap.jsx
// Sprint 2 — Task 4: Replaced the agency ops tool with the real 6-phase CxO coaching roadmap.
// Phase data is kept in sync with Dashboard.jsx PHASES array.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const PHASES = [
  {
    id: 1, label: '01', title: 'Brand Audit & Foundation',
    duration: 'Weeks 1–2', color: '#C8A96E', icon: '◈',
    pillars: ['Identity Clarity', 'Audience Definition', 'Voice Architecture'],
    components: [
      { name: 'Executive Brand Audit', desc: 'A forensic review of your current digital footprint — what exists, what\'s missing, and what\'s actively hurting you.', deliverable: 'Brand Audit Report' },
      { name: 'Archetype & Voice Mapping', desc: 'Define the character your brand embodies and the precise tone, rhythm, and vocabulary that makes you unmistakeable.', deliverable: 'Voice Guide' },
      { name: 'Ideal Audience Matrix', desc: 'Map the three tiers of people you need to reach, with behavioural profiles and content hooks for each.', deliverable: 'Audience Matrix' },
      { name: 'Competitive Positioning', desc: 'Identify your Category of One — the specific position in the market no one else occupies.', deliverable: 'Positioning Statement' },
    ],
    plans: ['starter', 'authority', 'legacy'],
    outcome: 'Complete clarity on who you are, who you serve, and what makes you the only choice.',
  },
  {
    id: 2, label: '02', title: 'Platform Architecture',
    duration: 'Weeks 3–4', color: '#5B8FA8', icon: '◎',
    pillars: ['LinkedIn Dominance', 'Content Channels', 'SEO Footprint'],
    components: [
      { name: 'LinkedIn Profile Overhaul', desc: 'Transform your LinkedIn from a CV into a conversion engine — headline, about section, featured, and banner.', deliverable: 'LinkedIn Rewrite' },
      { name: 'Content Channel Selection', desc: 'Identify the two or three platforms where your audience lives and design a channel-specific approach for each.', deliverable: 'Channel Strategy' },
      { name: 'Personal Website & Bio Page', desc: 'Build or refine your executive bio page — the anchor that all other channels point to.', deliverable: 'Bio Brief' },
      { name: 'SEO Personal Branding', desc: 'Own the search results for your name and key themes with a structured SEO approach.', deliverable: 'SEO Action Plan' },
    ],
    plans: ['starter', 'authority', 'legacy'],
    outcome: 'A professional, consistent presence across every platform your audience uses to evaluate you.',
  },
  {
    id: 3, label: '03', title: 'Content Engine',
    duration: 'Weeks 5–8', color: '#8B6DAA', icon: '◉',
    pillars: ['Signature Series', 'Content Calendar', 'Repurposing System'],
    components: [
      { name: 'Signature Content Series', desc: 'Design a recurring content format that\'s distinctly yours — the series your audience looks forward to every week.', deliverable: 'Series Framework' },
      { name: '90-Day Content Calendar', desc: 'A fully populated content calendar tied to your anchor events, milestones, and strategic moments.', deliverable: '90-Day Calendar' },
      { name: 'Repurposing Workflow', desc: 'Turn one piece of cornerstone content into five formats without writing five new pieces.', deliverable: 'Repurposing SOP' },
      { name: 'Ghost-Writing Protocol', desc: 'The system for producing authentic, on-brand content consistently — whether you write it or we do.', deliverable: 'Ghost-Writing Guide' },
    ],
    plans: ['authority', 'legacy'],
    outcome: 'A content machine that produces consistently without consuming your time.',
  },
  {
    id: 4, label: '04', title: 'Visibility & Authority',
    duration: 'Weeks 9–12', color: '#C85A5A', icon: '◆',
    pillars: ['Media Relations', 'Speaking Circuits', 'Awards Pipeline'],
    components: [
      { name: 'Media Outreach Campaign', desc: 'A targeted media strategy to land you in the publications your clients, board, and peers read.', deliverable: 'Media Pitch List' },
      { name: 'Podcast Guest Strategy', desc: 'Identify, pitch, and prepare for the top 20 podcasts in your niche.', deliverable: 'Podcast Pitch Kit' },
      { name: 'Speaking Bureau Positioning', desc: 'Build a speaker profile and outreach strategy for conferences and high-value stages.', deliverable: 'Speaker One-Pager' },
      { name: 'Awards & Recognition Pipeline', desc: 'A curated list of awards, lists, and recognition programmes worth pursuing — with applications ready to submit.', deliverable: 'Awards Calendar' },
    ],
    plans: ['authority', 'legacy'],
    outcome: 'Third-party validation that compounds your credibility faster than content alone.',
  },
  {
    id: 5, label: '05', title: 'Community & Network',
    duration: 'Weeks 13–16', color: '#4A9E7A', icon: '◇',
    pillars: ['Engagement Rituals', 'Strategic Alliances', 'Community Building'],
    components: [
      { name: 'Engagement Operating Rhythm', desc: 'The daily and weekly rituals that keep you visible to the right people without becoming a full-time job.', deliverable: 'Engagement Playbook' },
      { name: 'Peer CxO Alliance Network', desc: 'Build a curated inner circle of non-competing peers who cross-amplify each other\'s authority.', deliverable: 'Alliance Blueprint' },
      { name: 'Newsletter Growth System', desc: 'Launch or scale a newsletter that brings your audience into a channel you own.', deliverable: 'Newsletter Strategy' },
      { name: 'Private Community Blueprint', desc: 'Design a high-value private community — the inner sanctum for your most engaged followers.', deliverable: 'Community Blueprint' },
    ],
    plans: ['legacy'],
    outcome: "An audience that doesn't just follow you — it advocates for you.",
  },
  {
    id: 6, label: '06', title: 'Measure & Scale',
    duration: 'Ongoing', color: '#E8935A', icon: '◐',
    pillars: ['Analytics', 'Quarterly Reviews', 'IP & Legacy'],
    components: [
      { name: 'Thought Leadership KPI Dashboard', desc: 'The exact metrics that matter for executive brand — and none of the vanity numbers.', deliverable: 'KPI Framework' },
      { name: 'Quarterly Brand Review', desc: 'A structured 90-day review process to assess what\'s working, what\'s shifted, and where to invest next.', deliverable: 'Quarterly Review Template' },
      { name: 'Book & IP Packaging', desc: 'Turn your expertise into a book proposal, keynote framework, or scalable IP product.', deliverable: 'IP Roadmap' },
      { name: 'Legacy & 3-Year Vision', desc: 'Design the long arc — what you want to be known for in three years, and the plan to get there.', deliverable: 'Legacy Brief' },
    ],
    plans: ['legacy'],
    outcome: 'A brand that compounds in value year over year and outlasts any single role.',
  },
]

const PLAN_PHASES = {
  starter:   [1, 2],
  authority: [1, 2, 3, 4],
  legacy:    [1, 2, 3, 4, 5, 6],
}

function ComponentRow({ comp, phaseId, compId, phaseColor, unlocked }) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ borderTop: '1px solid #1E2A3E' }}>
      <button
        onClick={() => unlocked && navigate(`/coach/${phaseId}/${compId}`)}
        onMouseEnter={() => unlocked && setIsHovered(true)}
        onMouseLeave={() => unlocked && setIsHovered(false)}
        style={{ width: '100%', padding: '14px 20px', background: isHovered ? 'rgba(74, 158, 255, 0.05)' : 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: unlocked ? 'pointer' : 'default', textAlign: 'left', transition: 'all 0.2s' }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: unlocked ? (isHovered ? '#4A9EFF' : phaseColor) : '#1E2A3E', flexShrink: 0, transition: 'background 0.2s' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: unlocked ? (isHovered ? '#4A9EFF' : '#F1F5F9') : '#334155', fontFamily: "'Outfit', sans-serif", transition: 'color 0.2s', marginBottom: '4px' }}>{comp.name}</div>
          <div style={{ fontSize: '11px', color: unlocked ? '#64748B' : '#334155', fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>{comp.desc}</div>
        </div>
        {unlocked && <span style={{ fontSize: '12px', color: isHovered ? '#4A9EFF' : '#334155', fontFamily: "'JetBrains Mono', monospace", transition: 'color 0.2s', transform: isHovered ? 'translateX(4px)' : 'none' }}>→</span>}
      </button>
    </div>
  )
}

function PhaseCard({ phase, unlocked, isExpanded, onToggle }) {
  const navigate = useNavigate()
  return (
    <div style={{ border: `1px solid ${isExpanded && unlocked ? phase.color + '40' : '#1E2A3E'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s', opacity: unlocked ? 1 : 0.4 }}>
      {/* Phase header */}
      <button
        onClick={() => unlocked && onToggle()}
        style={{ width: '100%', padding: '22px 24px', background: isExpanded && unlocked ? `${phase.color}08` : 'rgba(13,18,32,0.5)', border: 'none', display: 'flex', alignItems: 'center', gap: '16px', cursor: unlocked ? 'pointer' : 'default', textAlign: 'left' }}
      >
        {/* Phase icon */}
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${phase.color}18`, border: `1px solid ${phase.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: phase.color, flexShrink: 0 }}>
          {phase.icon}
        </div>

        {/* Phase info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: phase.color, letterSpacing: '2.5px', fontWeight: '600', marginBottom: '3px', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>
            Phase {phase.label} · {phase.duration}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '3px' }}>
            {phase.title}
          </div>
          <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
            {phase.pillars.join(' · ')}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#334155' }}>{phase.components.length} sessions</div>
          {!unlocked && <div style={{ fontSize: '16px', opacity: 0.4 }}>🔒</div>}
          {unlocked && <div style={{ fontSize: '12px', color: isExpanded ? phase.color : '#334155' }}>{isExpanded ? '↑' : '↓'}</div>}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && unlocked && (
        <>
          {/* Outcome strip */}
          <div style={{ padding: '12px 24px', background: `${phase.color}06`, borderTop: `1px solid ${phase.color}20`, borderBottom: '1px solid #1E2A3E' }}>
            <span style={{ fontSize: '11px', color: phase.color, fontWeight: '500', fontFamily: "'Inter', sans-serif" }}>Outcome: </span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: "'Inter', sans-serif" }}>{phase.outcome}</span>
          </div>

          {/* Components */}
          {phase.components.map((comp, idx) => (
            <ComponentRow key={comp.name} comp={comp} phaseId={phase.id} compId={idx} phaseColor={phase.color} unlocked={unlocked} />
          ))}

          {/* Start Phase CTA */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #1E2A3E', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '9px 20px', background: `${phase.color}18`, border: `1px solid ${phase.color}40`, borderRadius: '7px', color: phase.color, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Start Phase {phase.label} →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Roadmap({ profileData }) {
  const navigate = useNavigate()
  const { profile: authProfile } = useAuth()
  const profile = profileData || authProfile

  const [expandedPhase, setExpandedPhase] = useState(1)

  const plan = profile?.plan || profile?.budget?.toLowerCase().includes('legacy') ? 'legacy'
             : profile?.budget?.toLowerCase().includes('authority') ? 'authority'
             : 'starter'

  const unlockedPhases = PLAN_PHASES[plan] || PLAN_PHASES.starter
  const unlockedComponents = PHASES
    .filter(p => unlockedPhases.includes(p.id))
    .reduce((sum, p) => sum + p.components.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif" }}>
      {/* Bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1E2A3E', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
        <Logo size="sm" theme="dark" />
        <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
        <span style={{ fontSize: '12px', color: '#334155' }}>Coaching Roadmap</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/dashboard')} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>← Dashboard</button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 40px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: '#334155', marginBottom: '10px', textTransform: 'uppercase' }}>Your Journey</div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            6-Phase Coaching Roadmap
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.6', maxWidth: '560px' }}>
            A structured programme designed to build, scale, and sustain your executive brand. Each phase builds on the last.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
          {[
            { label: 'Phases unlocked', value: `${unlockedPhases.length}/6`, color: '#C8A96E' },
            { label: 'Coaching sessions', value: `${unlockedComponents}`, color: '#5B8FA8' },
            { label: 'Deliverables', value: `${unlockedComponents}`, color: '#8B6DAA' },
            { label: 'Programme length', value: plan === 'legacy' ? '16+ wks' : plan === 'authority' ? '12 wks' : '4 wks', color: '#4A9E7A' },
          ].map(stat => (
            <div key={stat.label} style={{ padding: '16px 18px', background: 'rgba(13,18,32,0.6)', border: '1px solid #1E2A3E', borderRadius: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color, fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '1px', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Plan gate banner — show if not on legacy */}
        {plan !== 'legacy' && (
          <div style={{ marginBottom: '32px', padding: '16px 24px', background: 'rgba(200,169,110,0.05)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#C8A96E', fontFamily: "'Outfit', sans-serif", marginBottom: '3px' }}>
                {6 - unlockedPhases.length} phases locked on your current plan
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Upgrade to {plan === 'starter' ? 'Authority or Legacy' : 'Legacy'} to unlock all {6 - unlockedPhases.length} remaining phases.
              </div>
            </div>
            <button onClick={() => navigate('/billing')} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #C8A96E, #C8A96Ecc)', border: 'none', borderRadius: '7px', color: '#070B14', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Upgrade plan →
            </button>
          </div>
        )}

        {/* Phase cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PHASES.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              unlocked={unlockedPhases.includes(phase.id)}
              isExpanded={expandedPhase === phase.id}
              onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
