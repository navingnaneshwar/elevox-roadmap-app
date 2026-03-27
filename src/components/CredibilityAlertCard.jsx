// src/components/CredibilityAlertCard.jsx
// Sprint 4 — P6 Credibility Gap Alert UI
// Surfaced in Dashboard when Aristotle stops the pipeline due to
// missing profile data. Coaching card, not an error message.
import { useState } from 'react'
import { acknowledgeCoachingAlert } from '../lib/supabase'

export default function CredibilityAlertCard({ alert, onDismiss }) {
  const [loading, setLoading] = useState(false)

  async function handleDismiss() {
    setLoading(true)
    await acknowledgeCoachingAlert(alert.id)
    onDismiss(alert.id)
  }

  const isHallucination = alert.alert_type === 'hallucination_detected'
  const accentColor = '#C8A96E'   // Phase 01 Gold — this is a coach, not an error

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(200,169,110,0.06), rgba(200,169,110,0.02))`,
      border: `1px solid ${accentColor}30`,
      borderRadius: '14px',
      padding: '24px 28px',
      marginBottom: '20px',
      animation: 'ob-field-in 0.3s ease both',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}15, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>
          {isHallucination ? '🔍' : '✦'}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: accentColor, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>
            {isHallucination ? 'Aristotle needs more real data' : 'A coaching moment'}
          </div>
          <div style={{ fontSize: '15px', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", fontWeight: '600' }}>
            {isHallucination ? 'We need your real story' : 'Help us write with your voice'}
          </div>
        </div>
      </div>

      {/* Coach message */}
      <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 20px' }}>
        {alert.alert_message}
      </p>

      {/* Questions */}
      {alert.questions?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Share these with us
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alert.questions.map((q, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '10px 14px',
                background: 'rgba(7,11,20,0.6)',
                border: '1px solid #1E2A3E',
                borderRadius: '8px',
              }}>
                <span style={{ color: accentColor, flexShrink: 0, marginTop: '1px' }}>→</span>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {alert.suggestions?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Examples of the kind of detail that works
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {alert.suggestions.map((s, i) => {
              const label = typeof s === 'object' ? s.label : s
              return (
                <span key={i} style={{
                  padding: '5px 12px',
                  background: `${accentColor}10`,
                  border: `1px solid ${accentColor}25`,
                  borderRadius: '100px',
                  fontSize: '11px', color: accentColor,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        disabled={loading}
        style={{
          padding: '10px 24px',
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
          borderRadius: '8px',
          color: accentColor,
          fontSize: '13px', fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Inter', sans-serif",
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}25` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${accentColor}15` }}
      >
        {loading ? 'Saving…' : "Got it — I'll add more detail"}
      </button>
    </div>
  )
}
