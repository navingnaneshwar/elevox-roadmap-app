// src/components/Dashboard.jsx
// Sprint 2 — All bugs fixed:
//   - dbPlan now derived correctly from profileData.plan (was undefined, crashed page)
//   - Profile nav button → /profile (was pointing to /onboarding)
//   - Sign-out button added to nav
//   - Nav links to Brand Brief, Roadmap, Calendar added
//   - Upgrade banner button has onClick → /upgrade
//   - Phase drawer component rows now navigate into coaching session
//   - Sessions driven from Supabase via getMentorSessions (with mock fallback)
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getMentorSessions, getPendingApprovals, getPendingCoachingAlerts, getActiveClarificationSession } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import CredibilityAlertCard from "./CredibilityAlertCard";

/* ─── Phase Data ─────────────────────────────────────────────── */
const PHASES = [
  {
    id: 1, label: "01", title: "Brand Audit & Foundation",
    duration: "Wks 1–2", color: "#C8A96E", icon: "◈",
    pillars: ["Identity Clarity", "Audience Definition", "Voice Architecture"],
    components: ["Executive Brand Audit", "Archetype & Voice Mapping", "Ideal Audience Matrix", "Competitive Positioning"],
  },
  {
    id: 2, label: "02", title: "Platform Architecture",
    duration: "Wks 3–4", color: "#5B8FA8", icon: "◎",
    pillars: ["LinkedIn Dominance", "Content Channels", "SEO Footprint"],
    components: ["LinkedIn Profile Overhaul", "Content Channel Selection", "Personal Website & Bio Page", "SEO Personal Branding"],
  },
  {
    id: 3, label: "03", title: "Content Engine",
    duration: "Wks 5–8", color: "#8B6DAA", icon: "◉",
    pillars: ["Signature Series", "Content Calendar", "Repurposing System"],
    components: ["Signature Content Series", "90-Day Content Calendar", "Repurposing Workflow", "Ghost-Writing Protocol"],
  },
  {
    id: 4, label: "04", title: "Visibility & Authority",
    duration: "Wks 9–12", color: "#C85A5A", icon: "◆",
    pillars: ["Media Relations", "Speaking Circuits", "Awards Pipeline"],
    components: ["Media Outreach Campaign", "Podcast Guest Strategy", "Speaking Bureau Positioning", "Awards & Recognition Pipeline"],
  },
  {
    id: 5, label: "05", title: "Community & Network",
    duration: "Wks 13–16", color: "#4A9E7A", icon: "◇",
    pillars: ["Engagement Rituals", "Strategic Alliances", "Community Building"],
    components: ["Engagement Operating Rhythm", "Peer CxO Alliance Network", "Newsletter Growth System", "Private Community Blueprint"],
  },
  {
    id: 6, label: "06", title: "Measure & Scale",
    duration: "Ongoing", color: "#E8935A", icon: "◐",
    pillars: ["Analytics", "Quarterly Reviews", "IP & Legacy"],
    components: ["Thought Leadership KPI Dashboard", "Quarterly Brand Review", "Book & IP Packaging", "Legacy & 3-Year Vision"],
  },
];

const PLAN_PHASES = {
  legacy:    [1, 2, 3, 4, 5, 6],
  authority: [1, 2, 3, 4],
  starter:   [1, 2],
};

// ⚠️ BETA: All testers are granted 'authority' — mirrors completeOnboarding() override.
// TODO: Revert to 'starter' before commercial launch.
const DEFAULT_BETA_PLAN = 'authority';

/* ─── Helpers ────────────────────────────────────────────────── */
function derivePlan(profileData) {
  // Prefer the DB plan field (mapped by dbToFormData)
  if (profileData?.plan) return profileData.plan;
  // Fallback: derive from the budget text field
  const b = (profileData?.budget || "").toLowerCase();
  if (b.includes("legacy"))    return "legacy";
  if (b.includes("authority")) return "authority";
  // ⚠️ BETA: Default to authority instead of starter so testers don't see a
  // locked-out dashboard when profile.plan hasn't persisted yet.
  return DEFAULT_BETA_PLAN;
}

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ value, label, color, icon }) {
  return (
    <div style={{
      flex: "1 1 160px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #1E2A3E",
      borderRadius: "12px",
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "24px", fontWeight: "700", color, fontFamily: "'Outfit', sans-serif" }}>{value}</span>
      </div>
      <div style={{ fontSize: "10px", color: "#64748B", letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

/* ─── Phase State Helper ────────────────────────────────────── */
// Returns: 'locked' | 'not_started' | 'in_progress' | 'completed'
function getPhaseState(phase, sessions, unlockedPhases) {
  if (!unlockedPhases.includes(phase.id)) return 'locked';
  const phaseData = sessions[String(phase.id)]; // { compId: status }
  if (!phaseData || Object.keys(phaseData).length === 0) return 'not_started';
  const statuses = phase.components.map((_, i) => phaseData[String(i)] || null);
  const completedCount = statuses.filter(s => s === 'completed').length;
  if (completedCount === phase.components.length) return 'completed';
  return 'in_progress';
}

/* ─── Phase Card ─────────────────────────────────────────────── */
function PhaseCard({ phase, state, sessions, onClick }) {
  const [hovered, setHovered] = useState(false);

  const phaseData   = sessions[String(phase.id)] || {};
  const doneCount   = phase.components.filter((_, i) => phaseData[String(i)] === 'completed').length;
  const totalCount  = phase.components.length;
  const progress    = (doneCount / totalCount) * 100;

  // Visual config per state
  const cfg = {
    locked: {
      opacity: 0.22, cursor: 'default', border: '#1E2A3E',
      bg: 'rgba(255,255,255,0.01)', glow: 'none', labelColor: '#334155',
      badge: null,
    },
    not_started: {
      opacity: 0.55, cursor: 'pointer', border: '#1E2A3E',
      bg: 'rgba(255,255,255,0.015)', glow: 'none', labelColor: '#64748B',
      badge: { text: 'Not started', color: '#334155', bg: 'rgba(255,255,255,0.03)' },
    },
    in_progress: {
      opacity: 1, cursor: 'pointer', border: phase.color + '60',
      bg: `linear-gradient(135deg, ${phase.color}08, ${phase.color}03)`,
      glow: `0 0 0 1px ${phase.color}30, 0 4px 24px ${phase.color}18`,
      labelColor: phase.color,
      badge: { text: 'In progress — action needed', color: phase.color, bg: phase.color + '15' },
    },
    completed: {
      opacity: 0.45, cursor: 'pointer', border: '#1E2A3E',
      bg: 'rgba(255,255,255,0.015)', glow: 'none', labelColor: '#334155',
      badge: { text: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    },
  }[state];

  const isClickable = state !== 'locked';

  return (
    <div
      onClick={() => isClickable && onClick(phase)}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{
        background: hovered && isClickable ? (state === 'in_progress' ? `linear-gradient(135deg, ${phase.color}12, ${phase.color}06)` : 'rgba(255,255,255,0.03)') : cfg.bg,
        border: `1px solid ${hovered && isClickable ? (state === 'in_progress' ? phase.color + '80' : '#334155') : cfg.border}`,
        borderRadius: '14px',
        padding: '22px',
        cursor: cfg.cursor,
        opacity: cfg.opacity,
        transition: 'all 0.2s ease',
        transform: hovered && isClickable ? 'translateY(-2px)' : 'none',
        boxShadow: state === 'in_progress' ? cfg.glow : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ghost number */}
      <div style={{
        position: 'absolute', top: 10, right: 14,
        fontSize: '56px', fontWeight: '800',
        fontFamily: "'Outfit', sans-serif",
        color: state === 'in_progress' ? `${phase.color}12` : 'rgba(255,255,255,0.03)',
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
      }}>{phase.label}</div>

      {/* Status badge */}
      {cfg.badge && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px',
          textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
          color: cfg.badge.color, background: cfg.badge.bg,
          border: `1px solid ${cfg.badge.color}30`,
          borderRadius: '100px', padding: '3px 8px',
          marginBottom: '14px',
        }}>
          {state === 'in_progress' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: phase.color, display: 'inline-block', animation: 'badge-pulse 1.8s ease-in-out infinite' }} />}
          {state === 'completed' && '✓ '}
          {cfg.badge.text}
        </div>
      )}
      {state === 'locked' && (
        <div style={{ fontSize: '11px', color: '#334155', marginBottom: '14px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>🔒 PLAN LOCKED</div>
      )}

      {/* Phase header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: state === 'in_progress' ? `${phase.color}22` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${state === 'in_progress' ? phase.color + '50' : '#1E2A3E'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
          color: state === 'in_progress' ? phase.color : '#334155',
        }}>{phase.icon}</div>
        <div>
          <div style={{ fontSize: '10px', color: cfg.labelColor, letterSpacing: '1.5px', fontFamily: "'Inter', sans-serif", fontWeight: '600', marginBottom: '2px' }}>
            PHASE {phase.label} · {phase.duration}
          </div>
          <div style={{
            fontSize: '15px', fontWeight: '600',
            color: state === 'in_progress' ? '#F1F5F9' : state === 'locked' ? '#1E2A3E' : '#64748B',
            fontFamily: "'Outfit', sans-serif"
          }}>{phase.title}</div>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: state === 'in_progress' ? '#64748B' : '#1E2A3E', fontFamily: "'Inter', sans-serif", marginBottom: '14px' }}>
        {phase.pillars.join(' · ')}
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#0f1524', borderRadius: '1px', marginBottom: '10px', overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: state === 'completed' ? '#334155' : `linear-gradient(90deg, ${phase.color}, ${phase.color}80)`,
          borderRadius: '1px', transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Component dots */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {phase.components.map((_, i) => {
          const compStatus = phaseData[String(i)];
          return (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: compStatus === 'completed' ? (state === 'completed' ? '#334155' : phase.color)
                        : compStatus ? phase.color + '55'
                        : '#1E2A3E',
              transition: 'background 0.3s ease',
            }} />
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#1E2A3E', fontFamily: "'JetBrains Mono', monospace" }}>
          {doneCount}/{totalCount} complete
        </span>
        {state === 'in_progress' && (
          <span style={{ fontSize: '11px', color: phase.color, fontFamily: "'Inter', sans-serif", fontWeight: '600' }}>
            Continue →
          </span>
        )}
        {state === 'not_started' && (
          <span style={{ fontSize: '11px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
            Begin →
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Nav Link ───────────────────────────────────────────────── */
function NavLink({ label, route, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "7px 14px",
        background: hovered ? "rgba(99,102,241,0.08)" : "transparent",
        border: "1px solid transparent",
        borderRadius: "7px",
        color: hovered ? "#a5b4fc" : "#64748B",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Dashboard({ profileData, onSwitchTo, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPhase,      setSelectedPhase]       = useState(null);
  const [sessions,           setSessions]            = useState({});
  const [approvalCount,      setApprovalCount]       = useState(0);
  const [coachingAlerts,     setCoachingAlerts]      = useState([]);
  const [clarSession,        setClarSession]         = useState(null);  // S5-08

  // Derive plan correctly (fixes dbPlan undefined crash)
  const dbPlan       = derivePlan(profileData);
  const unlockedPhases = PLAN_PHASES[dbPlan] || PLAN_PHASES[DEFAULT_BETA_PLAN];

  // Load real session data from Supabase
  // sessions = { phaseId: { componentId: status } }
  useEffect(() => {
    if (!user) return;
    getMentorSessions(user.id).then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(s => {
        const pid = String(s.phase_id);
        const cid = String(s.component_id);
        if (!map[pid]) map[pid] = {};
        map[pid][cid] = s.status || 'active';
      });
      setSessions(map);
    });
    // Load approval badge count
    getPendingApprovals(user.id).then(({ data }) => {
      setApprovalCount(data?.length ?? 0);
    });
    // Load coaching alerts
    getPendingCoachingAlerts(user.id).then(({ data }) => {
      setCoachingAlerts(data ?? []);
    });
    // S5-08: Check for an active clarification session
    getActiveClarificationSession(user.id).then(({ data }) => {
      setClarSession(data ?? null);
    });
  }, [user]);

  const totalComponents   = PHASES.reduce((a, p) => a + p.components.length, 0);
  const completedSessions = Object.values(sessions).reduce((phaseAcc, compMap) =>
    phaseAcc + Object.values(compMap).filter(s => s === 'completed').length, 0);
  const unlockedCount     = unlockedPhases.length;
  const progressPct       = Math.round((completedSessions / totalComponents) * 100);

  // Phase states
  const phaseStates = Object.fromEntries(
    PHASES.map(p => [p.id, getPhaseState(p, sessions, unlockedPhases)])
  );
  // First phase where user action is needed
  const activePhase = PHASES.find(p => phaseStates[p.id] === 'in_progress');
  const nextUnstartedPhase = !activePhase && PHASES.find(p => phaseStates[p.id] === 'not_started');

  const firstName = profileData?.fullName?.split(" ")[0] || "there";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function handleNav(screen) {
    if (onSwitchTo) onSwitchTo(screen);
  }

  function handleStartSession(phase, componentIndex) {
    setSelectedPhase(null);
    // Navigate into coaching session — route carries phase+component context
    navigate(`/coach/${phase.id}/${componentIndex}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070B14",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "-80px", left: "-80px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "0", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />



      {/* ── Top Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,11,20,0.9)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #1E2A3E",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "56px",
      }}>
        {/* Left: logo + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Logo size="md" theme="dark" />
          <span style={{ width: "1px", height: "14px", background: "#1E2A3E" }} />
          <span style={{ fontSize: "12px", color: "#334155" }}>Dashboard</span>
        </div>

        {/* Centre: nav links */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <NavLink label="Roadmap"    onClick={() => handleNav("roadmap")} />
          <NavLink label="Brand Brief" onClick={() => handleNav("brand-brief")} />
          <NavLink label="Calendar"   onClick={() => handleNav("calendar")} />
          <NavLink label="Billing"    onClick={() => navigate("/billing")} />
          {/* Approvals nav with badge */}
          <button
            onClick={() => navigate("/approvals")}
            style={{
              position: "relative",
              padding: "7px 14px",
              background: approvalCount > 0 ? "rgba(16,185,129,0.08)" : "transparent",
              border: approvalCount > 0 ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
              borderRadius: "7px",
              color: approvalCount > 0 ? "#10b981" : "#64748B",
              fontSize: "12px", fontWeight: "500",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s",
            }}
          >
            Approvals
            {approvalCount > 0 && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                background: "#10b981", color: "#fff",
                fontSize: "9px", fontWeight: "700",
                borderRadius: "100px", padding: "1px 5px",
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: "16px", textAlign: "center",
              }}>
                {approvalCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: profile + sign out */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {profileData?.fullName && (
            <button
              onClick={() => handleNav("profile")}
              style={{
                padding: "7px 16px",
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "8px",
                color: "#a5b4fc",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {profileData.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()} · Profile
            </button>
          )}
          <button
            onClick={onSignOut}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid #1E2A3E",
              borderRadius: "8px",
              color: "#334155",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#94A3B8"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "#1E2A3E"; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px 80px", position: "relative", zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: "48px", animation: "ob-field-in 0.4s ease both" }}>
          <div style={{ fontSize: "11px", color: "#334155", letterSpacing: "2px", fontFamily: "'Inter', sans-serif", marginBottom: "10px", textTransform: "uppercase" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 46px)",
            fontWeight: "700",
            fontFamily: "'Outfit', sans-serif",
            color: "#F1F5F9",
            margin: "0 0 10px",
            letterSpacing: "-1px",
            lineHeight: "1.15",
          }}>
            {greeting},&nbsp;
            <span style={{
              background: "linear-gradient(135deg, #a5b4fc, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {firstName}.
            </span>
          </h1>
          {profileData?.currentTitle && (
            <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
              {profileData.currentTitle}
              {profileData.company ? ` · ${profileData.company}` : ""}
            </p>
          )}
        </div>

        {/* Stats Strip */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "48px", flexWrap: "wrap", animation: "ob-field-in 0.4s 0.05s ease both" }}>
          <StatCard value={`${completedSessions}/${totalComponents}`} label="Sessions Started"   color="#6366f1" icon="💬" />
          <StatCard value={`${unlockedCount}/6`}                      label="Phases Unlocked"    color="#8b5cf6" icon="🔓" />
          <StatCard value={`${progressPct}%`}                         label="Programme Progress" color="#10b981" icon="📈" />
          <StatCard
            value={dbPlan === "legacy" ? "Legacy" : dbPlan === "authority" ? "Authority" : "Starter"}
            label="Current Plan"
            color="#C8A96E"
            icon="⭐"
          />
        </div>

        {/* S5-08: Clarification Session Banner */}
        {clarSession && (
          <div
            onClick={() => navigate('/clarification')}
            style={{
              marginBottom: '32px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))',
              border: '1px solid rgba(200,169,110,0.35)',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              transition: 'all 0.2s ease',
              animation: 'ob-field-in 0.4s 0.1s ease both',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.6)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.05))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.35)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))'; }}
          >
            {/* Pulse indicator */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
              position: 'relative',
            }}>
              ✦
              <span style={{
                position: 'absolute', inset: '-4px',
                borderRadius: '50%',
                border: '1px solid rgba(200,169,110,0.25)',
                animation: 'badge-pulse 2s ease-in-out infinite',
              }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '10px', fontWeight: '700', letterSpacing: '1.8px',
                textTransform: 'uppercase', color: '#C8A96E',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px',
              }}>
                Chanakya · Action Required
              </div>
              <div style={{
                fontSize: '15px', fontWeight: '600', color: '#F1F5F9',
                fontFamily: "'Outfit', sans-serif", marginBottom: '3px',
              }}>
                Complete your brand profile
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Chanakya has prepared {clarSession.questions?.length ?? 6} targeted questions to
                personalise your 90-day framework. Takes ~5 minutes.
              </div>
            </div>

            <div style={{
              padding: '8px 18px',
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.3)',
              borderRadius: '8px',
              color: '#C8A96E',
              fontSize: '12px', fontWeight: '600',
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Continue →
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "48px", flexWrap: "wrap" }}>
          {[
            { label: "✦ Brand Brief", color: "#6366f1", action: () => handleNav("brand-brief") },
            { label: "◈ Roadmap",     color: "#C8A96E", action: () => handleNav("roadmap") },
            { label: "◉ Calendar",    color: "#8B6DAA", action: () => handleNav("calendar") },
            { label: "✎ Submit Post", color: "#10b981", action: () => navigate("/submit-post") },
          ].map(({ label, color, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                padding: "9px 20px",
                background: `${color}10`,
                border: `1px solid ${color}30`,
                borderRadius: "8px",
                color,
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.borderColor = `${color}60`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Coaching Alerts — surface when Aristotle stalled the pipeline */}
        {coachingAlerts.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            {coachingAlerts.map(alert => (
              <CredibilityAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={(id) => setCoachingAlerts(prev => prev.filter(a => a.id !== id))}
              />
            ))}
          </div>
        )}

        {/* Phase Grid */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase' }}>Your Roadmap</div>
            <button onClick={() => handleNav('roadmap')} style={{ fontSize: '11px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              View full roadmap →
            </button>
          </div>

          {/* ── Next Step Banner ── */}
          {(activePhase || nextUnstartedPhase) && (() => {
            const focus = activePhase || nextUnstartedPhase;
            const isActive = !!activePhase;
            return (
              <div
                onClick={() => setSelectedPhase(focus)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 20px', marginBottom: '20px',
                  background: isActive ? `linear-gradient(135deg, ${focus.color}14, ${focus.color}06)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? focus.color + '50' : '#1E2A3E'}`,
                  borderRadius: '12px', cursor: 'pointer',
                  boxShadow: isActive ? `0 0 0 1px ${focus.color}20, 0 4px 20px ${focus.color}12` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? `${focus.color}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? focus.color + '60' : '#1E2A3E'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: isActive ? focus.color : '#334155',
                }}>{focus.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', color: isActive ? focus.color : '#334155', letterSpacing: '2px', fontWeight: '700', fontFamily: "'Inter', sans-serif", marginBottom: '3px' }}>
                    {isActive ? '▶ YOUR NEXT ACTION' : '→ START HERE'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: isActive ? '#F1F5F9' : '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                    {focus.title}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: isActive ? focus.color : '#334155', fontFamily: "'Inter', sans-serif", fontWeight: '600', flexShrink: 0 }}>
                  {isActive ? 'Continue →' : 'Begin →'}
                </span>
              </div>
            );
          })()}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            {PHASES.map((phase, idx) => (
              <div key={phase.id} style={{ animation: `ob-field-in 0.4s ${0.05 + idx * 0.06}s ease both`, opacity: 0 }}>
                <PhaseCard
                  phase={phase}
                  state={phaseStates[phase.id]}
                  sessions={sessions}
                  onClick={(p) => setSelectedPhase(p)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Phase Detail Drawer ── */}
      {selectedPhase && (
        <div
          onClick={() => setSelectedPhase(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 100,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0D1220",
              border: "1px solid #1E2A3E",
              borderRadius: "20px 20px 0 0",
              padding: "32px 40px 48px",
              width: "100%",
              maxWidth: "760px",
              animation: "drawer-in 0.3s ease both",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "10px", color: selectedPhase.color, letterSpacing: "2.5px", fontWeight: "600", marginBottom: "4px" }}>
                  PHASE {selectedPhase.label} · {selectedPhase.duration}
                </div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "#F1F5F9", fontFamily: "'Outfit', sans-serif" }}>
                  {selectedPhase.icon} {selectedPhase.title}
                </div>
              </div>
              <button
                onClick={() => setSelectedPhase(null)}
                style={{ background: "transparent", border: "1px solid #1E2A3E", borderRadius: "8px", color: "#64748B", padding: "8px 14px", cursor: "pointer", fontSize: "18px", fontFamily: "'Inter', sans-serif" }}
              >
                ×
              </button>
            </div>

            {/* Pillar pills */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
              {selectedPhase.pillars.map(p => (
                <span key={p} style={{
                  fontSize: "11px", padding: "5px 12px",
                  background: `${selectedPhase.color}15`,
                  border: `1px solid ${selectedPhase.color}30`,
                  borderRadius: "100px", color: selectedPhase.color,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {p}
                </span>
              ))}
            </div>

            {/* Component rows — each is clickable and navigates */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedPhase.components.map((comp, i) => {
                const done = (sessions[String(selectedPhase.id)] || 0) > i;
                return (
                  <div
                    key={i}
                    onClick={() => handleStartSession(selectedPhase, i)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "14px 18px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid #1E2A3E",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = selectedPhase.color + "50"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2A3E"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  >
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      background: done ? `${selectedPhase.color}25` : `${selectedPhase.color}10`,
                      border: `1px solid ${selectedPhase.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", color: selectedPhase.color,
                      fontFamily: "'Inter', sans-serif", fontWeight: "700", flexShrink: 0,
                    }}>
                      {done ? "✓" : String(i + 1).padStart(2, "0")}
                    </div>
                    <span style={{ fontSize: "14px", color: "#94A3B8", fontFamily: "'Inter', sans-serif", flex: 1 }}>
                      {comp}
                    </span>
                    <span style={{ fontSize: "11px", color: selectedPhase.color, fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                      {done ? "Review →" : "Begin →"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ob-field-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawer-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
