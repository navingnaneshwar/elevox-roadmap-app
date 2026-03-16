// src/pages/CoachingSessionPage.jsx
// The AI mentor chat session for each Phase component.
// Route: /coach/:phaseId/:componentId
// Uses: upsertMentorSession to persist messages, generate-brief edge fn for AI replies.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, getMentorSessions, upsertMentorSession } from '../lib/supabase'
import Logo from '../components/Logo'

/* ─── Phase/Component metadata ──────────────────────────────── */
const PHASES = [
  {
    id: 1, label: '01', title: 'Brand Audit & Foundation', color: '#C8A96E', icon: '◈',
    components: [
      {
        title: 'Executive Brand Audit',
        prompt: `You are an expert executive brand strategist coaching a senior CxO. 
Your role for this session is "Executive Brand Audit". 
Guide them through a structured audit of their current brand presence:
1. Ask about their current online visibility and reputation
2. Explore gaps between how they're perceived vs. how they want to be known
3. Identify their strongest existing brand assets
4. Uncover hidden opportunities
Be incisive, ask one question at a time, and give actionable feedback. Start by introducing this session and asking your first question.`,
      },
      {
        title: 'Archetype & Voice Mapping',
        prompt: `You are an expert executive brand strategist coaching a senior CxO.
Your role for this session is "Archetype & Voice Mapping".
Guide them to discover their authentic brand archetype and communication voice:
1. Explore how they naturally communicate in high-stakes situations
2. Identify their leadership philosophy through storytelling
3. Map their voice to one of the 12 brand archetypes (Sage, Hero, Ruler, Creator, etc.)
4. Define 3 voice signature traits that will govern all their content
Be thoughtful, ask one question at a time. Start by introducing this session and asking your first question.`,
      },
      {
        title: 'Ideal Audience Matrix',
        prompt: `You are an expert executive brand strategist coaching a senior CxO.
Your role for this session is "Ideal Audience Matrix".
Guide them to precisely define and prioritise their 3 audience tiers:
1. Primary: The exact people who need to notice them to achieve their core goal
2. Secondary: Amplifiers who spread influence to the primary audience
3. Tertiary: The broader community they want to be visible to
For each tier, define: who they are, what they care about, how to reach them.
Ask one question at a time. Start by introducing this session and your first question.`,
      },
      {
        title: 'Competitive Positioning',
        prompt: `You are an expert executive brand strategist coaching a senior CxO.
Your role for this session is "Competitive Positioning".
Guide them to find their Category of One position in the market:
1. Map their peer set — who else occupies their space
2. Identify white space no one else owns
3. Articulate a positioning statement: "The only [X] who [Y] for [Z]"
4. Stress-test differentiation — is it real and defensible?
Ask one focused question at a time. Start by introducing this session and your first question.`,
      },
    ],
  },
  {
    id: 2, label: '02', title: 'Platform Architecture', color: '#5B8FA8', icon: '◎',
    components: [
      { title: 'LinkedIn Profile Overhaul', prompt: `You are an expert executive brand strategist. This session is "LinkedIn Profile Overhaul". Guide the executive through rewriting every element of their LinkedIn profile for maximum impact: headline, about section, featured, experience. Ask one section at a time, give specific rewrite suggestions. Start with an introduction and your first question.` },
      { title: 'Content Channel Selection', prompt: `You are an expert executive brand strategist. This session is "Content Channel Selection". Help the executive choose the right 2-3 platforms to focus on beyond LinkedIn, based on their audience, goals, and available time. Ask about their current channels, audience behavior, and content comfort zones. Start with an introduction and your first question.` },
      { title: 'Personal Website & Bio Page', prompt: `You are an expert executive brand strategist. This session is "Personal Website & Bio Page". Guide the executive in planning their personal website: what pages to have, the right bio length and framing, hero statement, social proof elements. Ask one focused question at a time. Start with an introduction and your first question.` },
      { title: 'SEO Personal Branding', prompt: `You are an expert executive brand strategist. This session is "SEO Personal Branding". Help the executive understand how to own their name in search: Google Knowledge Panel, content clusters around their key topics, press mentions strategy, podcast appearances as SEO. Ask one question at a time. Start with an introduction and your first question.` },
    ],
  },
  {
    id: 3, label: '03', title: 'Content Engine', color: '#8B6DAA', icon: '◉',
    components: [
      { title: 'Signature Content Series', prompt: `You are an expert executive brand strategist. This session is "Signature Content Series". Help the executive develop 2-3 recurring content formats that will define their voice — e.g. weekly insight, "unpopular opinion", case study breakdown. Guide them to name and structure each series. Ask one question at a time. Start with an introduction and your first question.` },
      { title: '90-Day Content Calendar', prompt: `You are an expert executive brand strategist. This session is "90-Day Content Calendar". Guide the executive in planning their first 90 days of content: anchor events, evergreen themes, content mix by format and cadence. Ask about upcoming milestones, strong opinions they hold, and stories they can tell. Start with an introduction and your first question.` },
      { title: 'Repurposing Workflow', prompt: `You are an expert executive brand strategist. This session is "Repurposing Workflow". Help the executive build a system to turn one piece of content into many: LinkedIn post → newsletter → Twitter thread → quote card → podcast talking point. Ask about their current workflow and available team. Start with an introduction and your first question.` },
      { title: 'Ghost-Writing Protocol', prompt: `You are an expert executive brand strategist. This session is "Ghost-Writing Protocol". Help the executive set up their AI ghostwriting workflow: how they brief the AI, their review process, what percentage they rewrite, approval cadence. Ask about their current content creation process. Start with an introduction and your first question.` },
    ],
  },
  {
    id: 4, label: '04', title: 'Visibility & Authority', color: '#C85A5A', icon: '◆',
    components: [
      { title: 'Media Outreach Campaign', prompt: `You are an expert executive brand strategist. This session is "Media Outreach Campaign". Guide the executive in building their media presence: identifying target publications, crafting a compelling pitch angle, building relationships with journalists. Ask about their story angles and target publications. Start with an introduction and your first question.` },
      { title: 'Podcast Guest Strategy', prompt: `You are an expert executive brand strategist. This session is "Podcast Guest Strategy". Help the executive land podcast appearances: identifying right shows, crafting their talking points, making a memorable guest. Guide them to define their 3 core go-to stories. Start with an introduction and your first question.` },
      { title: 'Speaking Bureau Positioning', prompt: `You are an expert executive brand strategist. This session is "Speaking Bureau Positioning". Help the executive position themselves for paid speaking: defining their signature talk, building a speaker page, approaching event organisers. Ask about their expertise and potential talk topics. Start with an introduction and your first question.` },
      { title: 'Awards & Recognition Pipeline', prompt: `You are an expert executive brand strategist. This session is "Awards & Recognition Pipeline". Help the executive build a systematic awards strategy: identifying relevant awards in their industry, crafting compelling nominations, leveraging wins for PR. Start with an introduction and your first question.` },
    ],
  },
  {
    id: 5, label: '05', title: 'Community & Network', color: '#4A9E7A', icon: '◇',
    components: [
      { title: 'Engagement Operating Rhythm', prompt: `You are an expert executive brand strategist. This session is "Engagement Operating Rhythm". Help the executive build a daily/weekly LinkedIn engagement habit: who to follow, what content to comment on, how to initiate conversations. Ask about their current time constraints. Start with an introduction and your first question.` },
      { title: 'Peer CxO Alliance Network', prompt: `You are an expert executive brand strategist. This session is "Peer CxO Alliance Network". Guide the executive in building a strategic peer network: identifying 10-15 peer CxOs to build genuine relationships with, co-creation opportunities, mutual amplification. Start with an introduction and your first question.` },
      { title: 'Newsletter Growth System', prompt: `You are an expert executive brand strategist. This session is "Newsletter Growth System". Help the executive build and grow a personal newsletter: picking a platform, defining the editorial angle, growth tactics, monetisation options. Start with an introduction and your first question.` },
      { title: 'Private Community Blueprint', prompt: `You are an expert executive brand strategist. This session is "Private Community Blueprint". Guide the executive in designing a private community: Slack, Circle, or WhatsApp group for their top audience. Define membership criteria, value delivered, and moderation approach. Start with an introduction and your first question.` },
    ],
  },
  {
    id: 6, label: '06', title: 'Measure & Scale', color: '#E8935A', icon: '◐',
    components: [
      { title: 'Thought Leadership KPI Dashboard', prompt: `You are an expert executive brand strategist. This session is "Thought Leadership KPI Dashboard". Help the executive define the 5-7 metrics that matter for their personal brand: follower quality, engagement rate, inbound opportunities, speaking invitations, media mentions. Start with an introduction and your first question.` },
      { title: 'Quarterly Brand Review', prompt: `You are an expert executive brand strategist. This session is "Quarterly Brand Review". Guide the executive through a structured quarterly review process: what to measure, how to adjust strategy, setting the next 90-day goals. Ask about their progress so far. Start with an introduction and your first question.` },
      { title: 'Book & IP Packaging', prompt: `You are an expert executive brand strategist. This session is "Book & IP Packaging". Help the executive explore how to package their knowledge into a book, course, framework, or methodology. Explore their core ideas, potential book angles, and publishing paths. Start with an introduction and your first question.` },
      { title: 'Legacy & 3-Year Vision', prompt: `You are an expert executive brand strategist. This session is "Legacy & 3-Year Vision". Guide the executive in articulating their 3-year personal brand vision: what they want to be known for, the impact they want to have, the legacy they are building. Start with an introduction and your first question.` },
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

/* ─── Message bubble ─────────────────────────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      animation: 'msg-in 0.3s ease both',
    }}>
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0, marginRight: '10px', marginTop: '2px',
        }}>
          ✦
        </div>
      )}
      <div style={{
        maxWidth: '72%',
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
        {msg.content}
      </div>
    </div>
  )
}

/* ─── Typing indicator ───────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
      }}>✦</div>
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

  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const textareaRef  = useRef(null)

  // Load existing session messages on mount
  useEffect(() => {
    if (!user || !meta) return
    async function loadSession() {
      try {
        const { data } = await getMentorSessions(user.id, parseInt(phaseId))
        const existing = data?.find(s => s.component_id === parseInt(componentId))
        if (existing?.messages?.length) {
          setMessages(existing.messages)
        } else {
          // No prior session — send the system prompt to get the first AI message
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

  async function sendFirstMessage() {
    if (!meta) return
    setThinking(true)
    try {
      // Pass a special opener message so the AI introduces the session
      const aiReply = await callMentorAPI(meta.component.prompt, [], '__start__')
      const initial = [{ role: 'assistant', content: aiReply, ts: Date.now() }]
      setMessages(initial)
      await persist(initial)
    } catch (err) {
      setError(err.message)
    } finally {
      setThinking(false)
    }
  }

  const callMentorAPI = useCallback(async (sessionPrompt, history, userMessage) => {
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
        }),
      }
    )

    if (!res.ok) {
      // OpenAI billing error — show a friendly in-chat message
      if (res.status === 402) {
        return "⚠️ The AI mentor is temporarily unavailable — the OpenAI API credits need to be topped up. Please visit **platform.openai.com/settings/billing** to add credits, then try again."
      }
      // Plan gate errors — surface upgrade CTA instead of crashing
      if (res.status === 403) {
        let body = {}
        try { body = await res.json() } catch { /* ignore */ }
        if (body.code === 'payment_required') {
          setPlanError({ type: 'payment', required_plan: null })
          return null
        }
        if (body.code === 'plan_required') {
          setPlanError({ type: 'plan', required_plan: body.required_plan })
          return null
        }
      }
      const text = await res.text()
      throw new Error(`AI error (${res.status}): ${text}`)
    }

    const json = await res.json()
    if (json.error) throw new Error(json.error)
    return json.reply || "I'm thinking through your response..."
  }, [phaseId])

  async function persist(msgs) {
    if (!user) return
    await upsertMentorSession(user.id, parseInt(phaseId), parseInt(componentId), msgs)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || thinking || planError) return
    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: text, ts: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setThinking(true)

    try {
      const aiReply = await callMentorAPI(meta.component.prompt, updated, text)
      if (aiReply === null) {
        // plan gate was hit — planError state already set, remove optimistic user msg
        setMessages(messages)
        return
      }
      const assistantMsg = { role: 'assistant', content: aiReply, ts: Date.now() }
      const final = [...updated, assistantMsg]
      setMessages(final)
      await persist(final)
    } catch (err) {
      setError(err.message)
    } finally {
      setThinking(false)
      inputRef.current?.focus()
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
          <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0 0', fontStyle: 'italic' }}>
            AI mentor session · responses are saved automatically
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

          {loaded && messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}

          {thinking && <TypingIndicator />}

          {error && (
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
                to="/upgrade"
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
          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking || !!planError}
            style={{
              padding: '13px 24px',
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
        <div style={{ maxWidth: '760px', margin: '8px auto 0', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#1E2A3E', fontFamily: "'JetBrains Mono', monospace" }}>
            Elevox AI Mentor · Powered by Claude · Session saved automatically
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
      `}</style>
    </div>
  )
}
