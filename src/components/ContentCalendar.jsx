import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';

/* ── Helpers ── */
function isOverdue(updatedAtStr) {
  const updated = new Date(updatedAtStr);
  const now = new Date();
  const diffHours = (now - updated) / (1000 * 60 * 60);
  return diffHours > 24;
}

/* ── Draft Card ── */
function DraftCard({ draft, onClick }) {
  const [hovered, setHovered] = useState(false);
  const overdue = draft.status === 'approved' && isOverdue(draft.updated_at);

  // Status Colors
  const borderColor = overdue ? '#ef4444' : hovered ? '#6366f150' : '#1E2A3E';
  const shadow = overdue ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none';

  return (
    <div
      onClick={() => onClick(draft)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
             AI Draft
          </span>
          {overdue && (
            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
               Overdue
            </span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          {new Date(draft.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Hook / Content */}
      <div style={{ fontSize: '15px', fontWeight: '600', color: '#F1F5F9', lineHeight: '1.4' }}>
        {draft.hook_text || "LinkedIn Thought Leadership"}
      </div>
      <div style={{ fontSize: '12px', color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {draft.body_text}
      </div>

      {/* Footer */}
      <div style={{ fontSize: '11px', color: '#6366f1', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #1E2A3E' }}>
         Review Post →
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ContentCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDrafts();

    // Realtime Subs
    const channel = supabase.channel('drafts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_drafts', filter: `user_id=eq.${user.id}` }, () => {
        fetchDrafts();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchDrafts() {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setDrafts(data);
    setLoading(false);
  }

  async function handleAction(status) {
    if (!selectedDraft) return;
    setActionLoading(true);
    
    // Optimistic UI update
    setDrafts(prev => prev.map(d => d.id === selectedDraft.id ? { ...d, status } : d));
    const currentDraft = selectedDraft; // Keep ref
    setSelectedDraft(null);

    const { error } = await supabase
      .from('content_drafts')
      .update({ status })
      .eq('id', currentDraft.id);
      
    if (error) {
       console.error(error);
       fetchDrafts(); // Revert on error
    } else if (status === 'failed') {
       // Auto-queue a rewrite job!
       // Normally we'd also prompt the user for arbitrary "Request Rewrite" instructions
       await supabase.from('agent_jobs').insert({
          user_id: user.id,
          job_type: 'generate_drafts',
          payload: { framework_id: currentDraft.framework_id, briefing_id: currentDraft.briefing_id, notes: "User requested rewrite." }
       });
    }

    setActionLoading(false);
  }

  const reviewDrafts = drafts.filter(d => d.status === 'approved'); // Editor approved, user needs to review
  const failedDrafts = drafts.filter(d => d.status === 'failed');   // Editor or user rejected
  const scheduledDrafts = drafts.filter(d => d.status === 'scheduled');
  const publishedDrafts = drafts.filter(d => d.status === 'published');

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', fontFamily: "'Inter', sans-serif", color: '#F1F5F9' }}>
      
      {/* Top Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #1E2A3E', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
           <span style={{ fontSize: '16px' }}>←</span>
           <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>Back to Dashboard</span>
        </div>
        <Logo size="md" theme="dark" />
      </nav>

      {/* Main Kanban Content */}
      <div style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px 0' }}>Newsroom & Calendar</h1>
          <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>Review drafts generated by your AI Ghostwriter and Editor-in-Chief.</p>
        </div>

        {loading ? (
           <div style={{ color: '#64748B' }}>Syncing with AI Agents...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', alignItems: 'start' }}>
            
            {/* Column 1: Review Required */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1E2A3E', paddingBottom: '12px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                 <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Needs Review ({reviewDrafts.length})</h3>
               </div>
               {reviewDrafts.map(d => <DraftCard key={d.id} draft={d} onClick={setSelectedDraft} />)}
               {reviewDrafts.length === 0 && <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>No drafts awaiting review.</div>}
            </div>

            {/* Column 2: Revisions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1E2A3E', paddingBottom: '12px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                 <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', color: '#94A3B8' }}>Revisions ({failedDrafts.length})</h3>
               </div>
               {failedDrafts.map(d => <DraftCard key={d.id} draft={d} onClick={setSelectedDraft} />)}
            </div>

            {/* Column 3: Scheduled */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1E2A3E', paddingBottom: '12px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                 <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', color: '#94A3B8' }}>Scheduled ({scheduledDrafts.length})</h3>
               </div>
               {scheduledDrafts.map(d => <DraftCard key={d.id} draft={d} onClick={setSelectedDraft} />)}
            </div>

            {/* Column 4: Published */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1E2A3E', paddingBottom: '12px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                 <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', color: '#94A3B8' }}>Published ({publishedDrafts.length})</h3>
               </div>
               {publishedDrafts.map(d => <DraftCard key={d.id} draft={d} onClick={setSelectedDraft} />)}
            </div>

          </div>
        )}
      </div>

      {/* ── Slide-up Drawer ── */}
      {selectedDraft && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 100,
          display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease'
        }} onClick={() => setSelectedDraft(null)}>
          <div style={{
            background: '#0D1220', width: '600px', height: '100%', borderLeft: '1px solid #1E2A3E',
            padding: '40px', display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
             
             <button onClick={() => setSelectedDraft(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', alignSelf: 'flex-end', fontSize: '24px' }}>×</button>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                   Platform: {selectedDraft.platform}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   Status: {selectedDraft.status}
                </span>
             </div>

             <h2 style={{ fontSize: '24px', fontWeight: '700', fontFamily: "'Outfit', sans-serif", margin: '0 0 32px 0', color: '#F1F5F9' }}>Post Preview</h2>

            {/* Blank slate */}
            <div style={{ background: 'rgba(13, 18, 32, 0.8)', borderRadius: '12px', padding: '32px', color: '#F1F5F9', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {selectedDraft.body_text}
             </div>

             {/* Audit Trail Badge */}
             <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '16px', marginBottom: '40px' }}>
                <div style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px' }}>✓ Compliance Passed</div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>This post was generated by Claude 3.5 Sonnet and cleared by the AI Editor-in-Chief for Hallucinations and Brand Tone.</div>
                {selectedDraft.editor_feedback && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '8px', fontSize: '13px', fontStyle: 'italic', color: '#cbd5e1' }}>
                    " {selectedDraft.editor_feedback} "
                  </div>
                )}
             </div>

             {/* Action Buttons */}
             {selectedDraft.status === 'approved' && (
               <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                 <button 
                  onClick={() => handleAction('scheduled')}
                  disabled={actionLoading}
                  style={{ flex: 1, background: '#6366f1', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {actionLoading ? 'Saving...' : 'Approve & Schedule Post'}
                 </button>
                 <button 
                   onClick={() => handleAction('failed')}
                   disabled={actionLoading}
                   style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '14px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Request Rewrite
                 </button>
               </div>
             )}

             {selectedDraft.status === 'scheduled' && (
               <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                 <button 
                  onClick={() => handleAction('published')}
                  disabled={actionLoading}
                  style={{ flex: 1, background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {actionLoading ? 'Saving...' : 'Mark as Published'}
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
