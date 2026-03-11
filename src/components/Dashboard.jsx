import { useState } from "react";
import Logo from "./Logo";

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

/* ─── Phase Card ─────────────────────────────────────────────── */
function PhaseCard({ phase, unlocked, sessionsStarted, onClick }) {
  const [hovered, setHovered] = useState(false);
  const progress = (sessionsStarted / phase.components.length) * 100;

  return (
    <div
      onClick={() => unlocked && onClick(phase)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && unlocked
          ? `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered && unlocked ? phase.color + "50" : "#1E2A3E"}`,
        borderRadius: "14px",
        padding: "24px",
        cursor: unlocked ? "pointer" : "default",
        opacity: unlocked ? 1 : 0.35,
        transition: "all 0.2s ease",
        transform: hovered && unlocked ? "translateY(-2px)" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ghost number */}
      <div style={{
        position: "absolute", top: 12, right: 16,
        fontSize: "64px", fontWeight: "800",
        fontFamily: "'Outfit', sans-serif",
        color: `${phase.color}08`,
        lineHeight: 1, userSelect: "none",
      }}>
        {phase.label}
      </div>

      {/* Lock icon */}
      {!unlocked && (
        <div style={{ position: "absolute", top: 14, right: 16, fontSize: "16px", opacity: 0.4 }}>🔒</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${phase.color}25, ${phase.color}08)`,
            border: `1px solid ${phase.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", color: phase.color, flexShrink: 0,
          }}>
            {phase.icon}
          </div>
          <div>
            <div style={{ fontSize: "10px", color: phase.color, letterSpacing: "2px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }}>
              PHASE {phase.label} · {phase.duration}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "16px", fontWeight: "600", color: "#F1F5F9", fontFamily: "'Outfit', sans-serif", marginBottom: "6px" }}>
          {phase.title}
        </div>
        <div style={{ fontSize: "11px", color: "#334155", fontFamily: "'Inter', sans-serif" }}>
          {phase.pillars.join(" · ")}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ height: "3px", background: "#1E2A3E", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${phase.color}, ${phase.color}99)`,
            borderRadius: "2px",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Component dots */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
        {phase.components.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: "4px", borderRadius: "2px",
            background: i < sessionsStarted ? phase.color : "#1E2A3E",
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: "#334155", fontFamily: "'Inter', sans-serif" }}>
          {sessionsStarted}/{phase.components.length} sessions
        </span>
        {unlocked && (
          <span style={{
            fontSize: "10px", color: phase.color,
            fontFamily: "'Inter', sans-serif", fontWeight: "600",
            letterSpacing: "0.5px",
          }}>
            {sessionsStarted === 0 ? "Begin →" : sessionsStarted === phase.components.length ? "Complete ✓" : "Continue →"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ value, label, color, icon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #1E2A3E",
      borderRadius: "12px",
      padding: "20px 24px",
      flex: "1 1 140px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontSize: "24px", fontWeight: "700", color, fontFamily: "'Outfit', sans-serif" }}>{value}</span>
      </div>
      <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1.5px", fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard({ profileData, onSwitchTo }) {
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Mock sessions state — in a real app, persisted to localStorage
  const [sessions] = useState({
    "1": 1, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0,
  });

  // Determine plan from profileData budget field
  const budget = profileData?.budget || "";
  const unlockedPhases = budget.includes("Legacy") ? [1,2,3,4,5,6]
    : budget.includes("Authority") ? [1,2,3,4]
    : [1,2]; // Starter or default

  const totalComponents = PHASES.reduce((a, p) => a + p.components.length, 0);
  const completedSessions = Object.values(sessions).reduce((a, b) => a + b, 0);
  const unlockedCount = unlockedPhases.length;
  const progressPct = Math.round((completedSessions / totalComponents) * 100);

  const firstName = profileData?.fullName?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--ob-bg, #070B14)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "-80px", left: "-80px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "0", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Top Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,11,20,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #1E2A3E",
        padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Logo size="md" theme="dark" />
          <span style={{ width: "1px", height: "14px", background: "#1E2A3E" }} />
          <span style={{ fontSize: "12px", color: "#334155" }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {profileData?.fullName && (
            <button
              onClick={() => onSwitchTo && onSwitchTo("onboarding")}
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
                letterSpacing: "0.3px",
              }}
            >
              {profileData.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()} · Profile
            </button>
          )}
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
        <div style={{ display: "flex", gap: "12px", marginBottom: "48px", flexWrap: "wrap", animation: "ob-field-in 0.4s 0.05s ease both", opacity: 0 }}>
          <StatCard value={`${completedSessions}/${totalComponents}`} label="Sessions Started" color="#6366f1" icon="💬" />
          <StatCard value={`${unlockedCount}/6`}                      label="Phases Unlocked"  color="#8b5cf6" icon="🔓" />
          <StatCard value={`${progressPct}%`}                         label="Programme Progress" color="#10b981" icon="📈" />
          <StatCard value={budget.split("(")[1]?.replace(")", "") || "Starter"} label="Current Plan" color="#C8A96E" icon="⭐" />
        </div>

        {/* Phase Grid */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "20px",
          }}>
            <div style={{ fontSize: "11px", color: "#334155", letterSpacing: "2px", textTransform: "uppercase" }}>
              Your Roadmap
            </div>
            <div style={{ fontSize: "11px", color: "#6366f1" }}>
              {unlockedCount} of 6 phases unlocked
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
            gap: "14px",
          }}>
            {PHASES.map((phase, idx) => (
              <div key={phase.id} style={{ animation: `ob-field-in 0.4s ${0.05 + idx * 0.06}s ease both`, opacity: 0 }}>
                <PhaseCard
                  phase={phase}
                  unlocked={unlockedPhases.includes(phase.id)}
                  sessionsStarted={sessions[String(phase.id)] || 0}
                  onClick={(p) => setSelectedPhase(p)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Banner — only if not on Legacy */}
        {!budget.includes("Legacy") && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "14px",
            padding: "28px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            animation: "ob-field-in 0.4s 0.4s ease both",
            opacity: 0,
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "#6366f1", letterSpacing: "2px", fontFamily: "'Inter', sans-serif", fontWeight: "600", marginBottom: "6px" }}>
                UNLOCK YOUR FULL POTENTIAL
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#F1F5F9", fontFamily: "'Outfit', sans-serif" }}>
                {!budget.includes("Authority")
                  ? "Upgrade to Authority — unlock Phase 03 & 04"
                  : "Upgrade to Legacy — unlock all 6 phases"}
              </div>
            </div>
            <button style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "600",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.5px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            }}>
              Upgrade Plan →
            </button>
          </div>
        )}
      </div>

      {/* Phase Detail Drawer (simplified) */}
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
              animation: "ob-slide-in 0.3s ease both",
            }}
          >
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedPhase.components.map((comp, i) => (
                <div key={i} style={{
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
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${selectedPhase.color}15`, border: `1px solid ${selectedPhase.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: selectedPhase.color, fontFamily: "'Inter', sans-serif", fontWeight: "700", flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span style={{ fontSize: "14px", color: "#94A3B8", fontFamily: "'Inter', sans-serif", flex: 1 }}>{comp}</span>
                  <span style={{ fontSize: "11px", color: selectedPhase.color, fontFamily: "'Inter', sans-serif" }}>Begin →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
