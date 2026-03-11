// src/components/ContentFormats.jsx
// ─────────────────────────────────────────────────────────────
// The missing "Content Formats" tab inside CalendarLogistics.
//
// Replaces the placeholder:
//   <p style={{ fontSize: "14px", color: "#A8E6FF" }}>
//     Content Formats view is under construction.
//   </p>
//
// Drop this into CalendarLogistics.jsx:
//   import ContentFormats from './ContentFormats'
//   ...
//   {activeTab === "formats" && <ContentFormats userId={userId} />}
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'

const FORMATS = [
  {
    id: 'text',
    label: 'Text Post',
    icon: 'T',
    iconBg: '#6366f1',
    desc: 'Pure insight. No image. Maximum reach on LinkedIn for thought leadership.',
    whenToUse: 'Strong opinion, personal story, contrarian take',
    avgLength: '150–300 words',
    bestDays: 'Tue, Wed, Thu',
    bestTime: '7–9am or 12–1pm',
    engagementMultiplier: '1.0×',
    difficulty: 'Low',
    diffColor: '#10b981',
    settings: [
      { id: 'hook_style', label: 'Hook style', type: 'select', options: ['Bold statement', 'Contrarian opener', 'Question', 'Story opener', 'Data point'] },
      { id: 'length', label: 'Target length', type: 'select', options: ['Short (100–150 words)', 'Standard (150–300 words)', 'Long (300–500 words)'] },
      { id: 'cta', label: 'Call to action', type: 'select', options: ['Question to audience', 'Ask for comment', 'Direct CTA', 'No CTA — statement only'] },
      { id: 'emoji', label: 'Emoji use', type: 'toggle', default: false },
    ],
  },
  {
    id: 'image',
    label: 'Text + Image',
    icon: '⊞',
    iconBg: '#8b5cf6',
    desc: 'Post with a supporting visual. Event photos, speaking shots, or branded graphics.',
    whenToUse: 'Event recaps, milestones, team announcements',
    avgLength: '100–200 words',
    bestDays: 'Mon, Wed, Fri',
    bestTime: '8–10am',
    engagementMultiplier: '1.3×',
    difficulty: 'Low',
    diffColor: '#10b981',
    settings: [
      { id: 'image_type', label: 'Image type', type: 'select', options: ['Photo of you', 'Event / conference photo', 'Team photo', 'Branded graphic', 'Screenshot / proof'] },
      { id: 'caption_length', label: 'Caption length', type: 'select', options: ['Short (under 100 words)', 'Standard (100–200 words)'] },
      { id: 'alt_text', label: 'Include alt text', type: 'toggle', default: true },
    ],
  },
  {
    id: 'carousel',
    label: 'Carousel',
    icon: '▤',
    iconBg: '#C8A96E',
    desc: 'Swipeable PDF document. Highest dwell time. Best for frameworks and lists.',
    whenToUse: 'Frameworks, step-by-step guides, top 10 lists, lessons learned',
    avgLength: '5–12 slides',
    bestDays: 'Tue, Thu',
    bestTime: '7–9am',
    engagementMultiplier: '2.2×',
    difficulty: 'Medium',
    diffColor: '#f59e0b',
    settings: [
      { id: 'slide_count', label: 'Slide count', type: 'select', options: ['5 slides (quick hit)', '7–8 slides (standard)', '10–12 slides (deep dive)'] },
      { id: 'cover_style', label: 'Cover slide', type: 'select', options: ['Bold headline only', 'Headline + subheading', 'Numbered framework', 'Question hook'] },
      { id: 'cta_slide', label: 'CTA final slide', type: 'toggle', default: true },
      { id: 'branding', label: 'Branded colour scheme', type: 'toggle', default: true },
    ],
  },
  {
    id: 'video',
    label: 'Short Video',
    icon: '▶',
    iconBg: '#ef4444',
    desc: 'Talking head, 60–90 seconds. Raw and authentic beats over-produced.',
    whenToUse: 'After a speaking event, sharing a strong opinion, team culture',
    avgLength: '60–90 seconds',
    bestDays: 'Wed, Thu',
    bestTime: '9–11am',
    engagementMultiplier: '3.0×',
    difficulty: 'High',
    diffColor: '#ef4444',
    settings: [
      { id: 'format', label: 'Format', type: 'select', options: ['Landscape (16:9)', 'Portrait (9:16 — mobile first)', 'Square (1:1)'] },
      { id: 'captions', label: 'Auto captions', type: 'toggle', default: true },
      { id: 'script', label: 'AI generates script', type: 'toggle', default: true },
      { id: 'teleprompter', label: 'Teleprompter mode', type: 'toggle', default: false },
    ],
  },
  {
    id: 'article',
    label: 'Long-form Article',
    icon: '≡',
    iconBg: '#0ea5e9',
    desc: 'LinkedIn newsletter or native article. SEO value, deep expertise signal.',
    whenToUse: 'Monthly thought leadership, industry deep dives, signature positions',
    avgLength: '800–2,000 words',
    bestDays: 'Mon or Thu',
    bestTime: '7–8am',
    engagementMultiplier: '1.8×',
    difficulty: 'High',
    diffColor: '#ef4444',
    settings: [
      { id: 'article_length', label: 'Length', type: 'select', options: ['Short form (800–1,000 words)', 'Standard (1,000–1,500 words)', 'Deep dive (1,500–2,000 words)'] },
      { id: 'structure', label: 'Structure', type: 'select', options: ['Essay (narrative flow)', 'Listicle (numbered sections)', 'How-to guide', 'Opinion piece', 'Case study'] },
      { id: 'newsletter', label: 'Post as newsletter', type: 'toggle', default: false },
      { id: 'cross_post', label: 'Cross-post to profile', type: 'toggle', default: true },
    ],
  },
  {
    id: 'poll',
    label: 'Poll / Question',
    icon: '?',
    iconBg: '#10b981',
    desc: 'Native LinkedIn poll. Engagement driver. Use to validate ideas or gather data.',
    whenToUse: 'Market research, opinion gathering, early trend validation',
    avgLength: '1 question + 2–4 options',
    bestDays: 'Mon, Tue',
    bestTime: '8–10am',
    engagementMultiplier: '1.5×',
    difficulty: 'Low',
    diffColor: '#10b981',
    settings: [
      { id: 'duration', label: 'Poll duration', type: 'select', options: ['1 day', '3 days', '1 week', '2 weeks'] },
      { id: 'option_count', label: 'Number of options', type: 'select', options: ['2 options', '3 options', '4 options'] },
      { id: 'follow_up', label: 'Auto follow-up post with results', type: 'toggle', default: true },
    ],
  },
  {
    id: 'podcast',
    label: 'Podcast Clip',
    icon: '◉',
    iconBg: '#f59e0b',
    desc: 'Audio or video snippet from a podcast appearance. Repurposed reach.',
    whenToUse: 'After appearing on any podcast or recorded interview',
    avgLength: '60–120 seconds',
    bestDays: 'Thu, Fri',
    bestTime: '10am–12pm',
    engagementMultiplier: '1.4×',
    difficulty: 'Medium',
    diffColor: '#f59e0b',
    settings: [
      { id: 'clip_type', label: 'Clip type', type: 'select', options: ['Best quote / soundbite', 'Key insight moment', 'Controversial take', 'Storytelling excerpt'] },
      { id: 'audiogram', label: 'Audiogram waveform overlay', type: 'toggle', default: true },
      { id: 'captions', label: 'Captions', type: 'toggle', default: true },
    ],
  },
  {
    id: 'collab',
    label: 'Collab / Tag Post',
    icon: '⊕',
    iconBg: '#8C2E45',
    desc: 'Feature another voice — @mention a peer, give credit, or co-create.',
    whenToUse: 'Building relationships, amplifying peers, joint thought leadership',
    avgLength: '100–200 words',
    bestDays: 'Wed, Fri',
    bestTime: '9–11am',
    engagementMultiplier: '1.6×',
    difficulty: 'Low',
    diffColor: '#10b981',
    settings: [
      { id: 'collab_type', label: 'Collab type', type: 'select', options: ['@mention + endorsement', 'Quote + reaction', 'Shared framework', 'Co-authored insight'] },
      { id: 'notify', label: 'Notify collaborator before posting', type: 'toggle', default: true },
    ],
  },
]

function SettingControl({ setting, value, onChange }) {
  if (setting.type === 'select') {
    return (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {setting.options.map(opt => {
          const active = value === opt || (!value && setting.options[0] === opt)
          return (
            <button key={opt} onClick={() => onChange(setting.id, opt)} style={{
              padding: '5px 12px',
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : '#1E2A3E'}`,
              borderRadius: '6px',
              color: active ? '#a5b4fc' : '#64748B',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.12s',
              fontFamily: "'Inter', sans-serif",
            }}>
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (setting.type === 'toggle') {
    const on = value !== undefined ? value : setting.default
    return (
      <button onClick={() => onChange(setting.id, !on)} style={{
        width: '42px', height: '24px', borderRadius: '12px',
        background: on ? '#6366f1' : '#1E2A3E',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '3px',
          left: on ? '21px' : '3px', transition: 'left 0.2s',
        }} />
      </button>
    )
  }

  return null
}

function FormatCard({ format, enabled, settings, onToggleEnabled, onChangeSetting }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
      border: `1px solid ${enabled ? 'rgba(99,102,241,0.2)' : '#1E2A3E'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      opacity: enabled ? 1 : 0.55,
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: format.iconBg + '20',
          border: `1px solid ${format.iconBg}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', color: format.iconBg, flexShrink: 0,
          fontFamily: "'Inter', sans-serif", fontWeight: '700',
        }}>
          {format.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>
              {format.label}
            </span>
            <span style={{
              fontSize: '9px', padding: '2px 8px',
              background: format.diffColor + '15',
              border: `1px solid ${format.diffColor}30`,
              borderRadius: '100px', color: format.diffColor,
              fontFamily: "'Inter', sans-serif",
            }}>
              {format.difficulty}
            </span>
            <span style={{ fontSize: '10px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
              {format.engagementMultiplier} engagement
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontFamily: "'Inter', sans-serif", lineHeight: '1.5' }}>
            {format.desc}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {enabled && (
            <button onClick={() => setExpanded(!expanded)} style={{
              padding: '6px 12px', background: 'transparent',
              border: '1px solid #1E2A3E', borderRadius: '6px',
              color: '#64748B', fontSize: '11px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", transition: 'all 0.12s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#6366f1'; e.target.style.color = '#a5b4fc' }}
              onMouseLeave={e => { e.target.style.borderColor = '#1E2A3E'; e.target.style.color = '#64748B' }}
            >
              {expanded ? 'Less ↑' : 'Configure ↓'}
            </button>
          )}
          {/* Enable/Disable toggle */}
          <button onClick={() => onToggleEnabled(format.id)} style={{
            width: '46px', height: '26px', borderRadius: '13px',
            background: enabled ? '#6366f1' : '#1E2A3E',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px',
              left: enabled ? '23px' : '3px', transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {enabled && (
        <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #1E2A3E' }}>
          {[
            ['Best for',    format.whenToUse],
            ['Length',      format.avgLength],
            ['Best days',   format.bestDays],
            ['Best time',   format.bestTime],
          ].map(([label, value], i, arr) => (
            <div key={label} style={{
              flex: 1, padding: '10px 14px',
              borderRight: i < arr.length - 1 ? '1px solid #1E2A3E' : 'none',
            }}>
              <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '1px', marginBottom: '3px', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>
                {label}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'Inter', sans-serif", lineHeight: '1.4' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded settings */}
      {enabled && expanded && (
        <div style={{ borderTop: '1px solid #1E2A3E', padding: '20px' }}>
          <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginBottom: '16px', fontFamily: "'Inter', sans-serif', textTransform: 'uppercase'" }}>
            FORMAT SETTINGS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {format.settings.map(setting => (
              <div key={setting.id}>
                <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'Inter', sans-serif", marginBottom: '8px' }}>
                  {setting.label}
                </div>
                <SettingControl
                  setting={setting}
                  value={settings[setting.id]}
                  onChange={onChangeSetting}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ContentFormats() {
  const [enabledFormats, setEnabledFormats] = useState(
    new Set(['text', 'image', 'carousel'])
  )
  const [formatSettings, setFormatSettings] = useState({})
  const [saved, setSaved] = useState(false)

  function toggleEnabled(formatId) {
    setEnabledFormats(prev => {
      const next = new Set(prev)
      if (next.has(formatId)) next.delete(formatId)
      else next.add(formatId)
      return next
    })
  }

  function changeSetting(formatId, settingId, value) {
    setFormatSettings(prev => ({
      ...prev,
      [formatId]: { ...(prev[formatId] || {}), [settingId]: value },
    }))
  }

  function handleSave() {
    // TODO: wire to saveCalendarSettings(userId, { formats_enabled: [...enabledFormats], format_settings: formatSettings })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const enabledCount = enabledFormats.size

  return (
    <div style={{ padding: '36px 44px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
            Content Formats
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>
            Choose your content mix
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
            Enable the formats you're comfortable with. We'll weight your calendar accordingly.
            <br />
            <span style={{ color: '#334155', fontSize: '12px' }}>
              {enabledCount} of {FORMATS.length} formats active
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mix visualiser */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {FORMATS.map(f => (
              <div key={f.id} title={f.label} style={{
                width: enabledFormats.has(f.id) ? '18px' : '6px',
                height: '28px',
                borderRadius: '3px',
                background: enabledFormats.has(f.id) ? f.iconBg : '#1E2A3E',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          <button onClick={handleSave} style={{
            padding: '10px 24px',
            background: saved ? 'rgba(16,185,129,0.1)' : 'transparent',
            border: `1px solid ${saved ? '#10b981' : '#1E2A3E'}`,
            borderRadius: '8px',
            color: saved ? '#6ee7b7' : '#64748B',
            fontSize: '11px', letterSpacing: '1.5px',
            cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: "'Inter', sans-serif",
          }}>
            {saved ? '✓ SAVED' : 'SAVE FORMATS'}
          </button>
        </div>
      </div>

      {/* Format cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FORMATS.map(format => (
          <FormatCard
            key={format.id}
            format={format}
            enabled={enabledFormats.has(format.id)}
            settings={formatSettings[format.id] || {}}
            onToggleEnabled={toggleEnabled}
            onChangeSetting={(settingId, value) => changeSetting(format.id, settingId, value)}
          />
        ))}
      </div>

      {/* Monthly mix summary */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #1E2A3E',
        borderRadius: '12px',
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#334155', marginBottom: '16px', textTransform: 'uppercase' }}>
          Your Projected Monthly Mix
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FORMATS.filter(f => enabledFormats.has(f.id)).map(f => (
            <div key={f.id} style={{
              padding: '8px 14px',
              background: f.iconBg + '12',
              border: `1px solid ${f.iconBg}25`,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '13px', color: f.iconBg }}>{f.icon}</span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: "'Inter', sans-serif" }}>{f.label}</span>
            </div>
          ))}
          {enabledCount === 0 && (
            <p style={{ color: '#334155', fontSize: '13px', margin: 0 }}>
              Enable at least one format to see your mix.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
