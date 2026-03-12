// src/pages/BrandBriefPage.jsx
// Sprint 2 — Task 2: Brand Brief display + generation trigger
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, getBrandBrief } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

// Maps DB field keys → display config
const BRIEF_SECTIONS = [
  {
    key: 'executive_summary',
    label: 'Executive Summary',
    icon: '◈',
    color: '#C8A96E',
    desc: 'Your brand in a nutshell',
  },
  {
    key: 'brand_archetype',
    label: 'Brand Archetype',
    icon: '◎',
    color: '#8B6DAA',
    desc: 'The character your brand embodies',
  },
  {
    key: 'positioning_statement',
    label: 'Positioning Statement',
    icon: '◉',
    color: '#5B8FA8',
    desc: 'Your Category of One declaration',
    highlight: true,
  },
  {
    key: 'audience_map',
    label: 'Audience Map',
    icon: '◆',
    color: '#C85A5A',
    desc: 'The three tiers of people you need to reach',
  },
  {
    key: 'voice_signature',
    label: 'Voice Signature',
    icon: '◇',
    color: '#4A9E7A',
    desc: 'How you sound and why it works',
  },
  {
    key: 'content_themes',
    label: 'Content Themes',
    icon: '◐',
    color: '#E8935A',
    desc: 'The five pillars you own',
  },
  {
    key: 'priority_actions',
    label: '30-Day Priority Actions',
    icon: '→',
    color: '#6366f1',
    desc: 'What to do first, in order',
  },
  {
    key: 'recommended_phase',
    label: 'Recommended Starting Phase',
    icon: '✦',
    color: '#C8A96E',
    desc: 'Where to begin your coaching journey',
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} style={{
      padding: '4px 10px', background: 'transparent',
      border: '1px solid #1E2A3E', borderRadius: '5px',
      color: copied ? '#10b981' : '#64748B',
      fontSize: '10px', cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.15s',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function BriefSection({ section, content }) {
  return (
    <div style={{
      background: 'rgba(13,18,32,0.6)',
      border: `1px solid ${section.highlight ? section.color + '40' : '#1E2A3E'}`,
      borderRadius: '12px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px',
        background: `linear-gradient(180deg, ${section.color}, ${section.color}40)`,
        borderRadius: '3px 0 0 3px',
      }} />

      <div style={{ paddingLeft: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '14px', color: section.color }}>{section.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>
                {section.label}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
              {section.desc}
            </div>
          </div>
          <CopyButton text={content} />
        </div>

        {/* Content */}
        <div style={{
          fontSize: '14px',
          color: section.highlight ? '#F1F5F9' : '#94A3B8',
          fontFamily: section.highlight ? "'Outfit', sans-serif" : "'Inter', sans-serif",
          fontWeight: section.highlight ? '500' : '400',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap',
        }}>
          {content || <span style={{ color: '#334155', fontStyle: 'italic' }}>Not generated yet</span>}
        </div>
      </div>
    </div>
  )
}

export default function BrandBriefPage() {
  const { user, profile } = useAuth()

  const [brief,     setBrief]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error,     setError]     = useState(null)

  // Load existing brief on mount
  useEffect(() => {
    if (!user) return
    async function loadBrief() {
      setLoading(true)
      try {
        const { data } = await getBrandBrief(user.id)
        setBrief(data || null)
      } catch {
        // No brief yet — that's fine
      } finally {
        setLoading(false)
      }
    }
    loadBrief()
  }, [user])

  async function generateBrief() {
    setGenerating(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired — please log in again.')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-brief`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const { brief: newBrief, error: fnError } = await res.json()
      if (fnError) throw new Error(fnError)
      setBrief(newBrief)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Executive'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070B14',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Bg grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      {/* Gold glow */}
      <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1E2A3E', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
        <Logo size="sm" theme="dark" />
        <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
        <span style={{ fontSize: '12px', color: '#334155' }}>Brand Brief</span>
        <div style={{ flex: 1 }} />
        <Link to="/dashboard" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 40px 80px', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: '#334155', marginBottom: '10px', textTransform: 'uppercase' }}>
            Your Executive Brand
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            {firstName}'s Brand Brief
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.6' }}>
            {brief
              ? `Generated ${new Date(brief.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Version ${brief.version || 1}`
              : 'AI-generated from your onboarding profile. Takes about 15 seconds.'}
          </p>
        </div>

        {/* Generate / Regenerate CTA */}
        <div style={{
          marginBottom: '40px',
          padding: '24px 28px',
          background: brief ? 'rgba(255,255,255,0.01)' : 'rgba(99,102,241,0.05)',
          border: `1px solid ${brief ? '#1E2A3E' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '20px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
              {brief ? 'Regenerate your brief' : 'Generate your Brand Brief'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {brief
                ? 'Updated your profile? Regenerate to reflect your latest answers.'
                : 'Analyses your complete onboarding profile using Claude AI.'}
            </div>
          </div>
          <button
            onClick={generateBrief}
            disabled={generating}
            style={{
              padding: '11px 28px',
              background: generating ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: generating ? '1px solid #1E2A3E' : 'none',
              borderRadius: '8px',
              color: generating ? '#334155' : '#fff',
              fontSize: '13px', fontWeight: '600',
              cursor: generating ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: generating ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid #334155', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating…
              </>
            ) : brief ? (
              '↻ Regenerate brief'
            ) : (
              '✦ Generate my brief'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '100px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1E2A3E', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : generating ? (
          // Generating state — show shimmer
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>✦</div>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Analysing your profile and crafting your Brand Brief…
            </p>
            <p style={{ fontSize: '12px', color: '#334155', marginTop: '6px' }}>This takes about 15 seconds</p>
          </div>
        ) : brief ? (
          // Brief sections
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {BRIEF_SECTIONS.map(section => (
              <BriefSection
                key={section.key}
                section={section}
                content={brief[section.key]}
              />
            ))}

            {/* Footer metadata */}
            <div style={{ marginTop: '8px', padding: '16px 20px', background: 'rgba(255,255,255,0.01)', border: '1px solid #1E2A3E', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
                brief_v{brief.version || 1} · {new Date(brief.generated_at).toISOString().split('T')[0]}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/dashboard" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}>
                  Start Phase 01 →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>✦</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px' }}>
              No brief generated yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Click "Generate my brief" above to create your personalised Brand Brief.
            </p>
            {!profile?.onboarding_complete && (
              <p style={{ fontSize: '12px', color: '#334155', marginTop: '12px' }}>
                Complete your <Link to="/onboarding" style={{ color: '#6366f1', textDecoration: 'none' }}>onboarding profile</Link> first for the best results.
              </p>
            )}
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
