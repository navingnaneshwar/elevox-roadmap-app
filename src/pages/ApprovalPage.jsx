// src/pages/ApprovalPage.jsx
// Sprint 4 — P0 Human Approval Gate
// Lists all AI-generated drafts awaiting human approval.
// Nothing reaches the content calendar until Approve is clicked here.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPendingApprovals } from '../lib/supabase'
import ApprovalCard from '../components/ApprovalCard'
import Logo from '../components/Logo'

export default function ApprovalPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [drafts,  setDrafts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await getPendingApprovals(user.id)
      if (err) throw err
      setDrafts(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleActionComplete(draftId) {
    setDrafts(prev => prev.filter(d => d.id !== draftId))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070B14',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,20,0.9)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #1E2A3E',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size="md" theme="dark" />
          <span style={{ width: '1px', height: '14px', background: '#1E2A3E' }} />
          <span style={{ fontSize: '12px', color: '#334155' }}>Approval Queue</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '7px 14px',
            background: 'transparent', border: '1px solid #1E2A3E',
            borderRadius: '8px', color: '#64748B',
            fontSize: '12px', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#94A3B8' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#1E2A3E' }}
        >
          ← Dashboard
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Human Approval Gate · Sprint 4
          </div>
          <h1 style={{
            fontSize: '32px', fontWeight: '700',
            fontFamily: "'Outfit', sans-serif",
            color: '#F1F5F9', margin: '0 0 10px',
            letterSpacing: '-0.5px',
          }}>
            Review & Approve Posts
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Nothing reaches your calendar until you approve it here.
            Edit the text directly before approving — every edit teaches the AI your voice.
          </p>
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Loading drafts awaiting approval…</div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px', background: 'rgba(200,90,90,0.08)',
            border: '1px solid rgba(200,90,90,0.2)', borderRadius: '10px',
            color: '#C85A5A', fontSize: '14px', marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && drafts.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            background: 'rgba(13,18,32,0.5)',
            border: '1px solid #1E2A3E', borderRadius: '16px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
            <div style={{ fontSize: '18px', color: '#F1F5F9', fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>
              You're all caught up
            </div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>
              No drafts awaiting your approval right now.
            </div>
          </div>
        )}

        {/* Draft cards */}
        {!loading && drafts.map(draft => (
          <ApprovalCard
            key={draft.id}
            draft={draft}
            onActionComplete={handleActionComplete}
          />
        ))}

        {/* Pending count */}
        {!loading && drafts.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#334155', marginTop: '8px' }}>
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} awaiting approval
          </div>
        )}
      </div>
    </div>
  )
}
