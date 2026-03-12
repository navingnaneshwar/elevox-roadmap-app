import { useState } from "react";
import GhostwriterPanel from './GhostwriterPanel';
import EventsAnchors from './EventsAnchors';
import ApprovalWorkflow from './ApprovalWorkflow';
import ContentFormats from './ContentFormats';

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["March", "April", "May", "June"];
const EVENT_TYPES = [
  { id: "speaking", label: "Speaking / Panel", color: "#4ECDC4", icon: "◆" },
  { id: "announcement", label: "Company Announcement", color: "#B8965A", icon: "◉" },
  { id: "fundraise", label: "Fundraise / Deal Close", color: "#A8E6CF", icon: "◈" },
  { id: "media", label: "Media / Press Interview", color: "#FF8B94", icon: "◎" },
  { id: "board", label: "Board Meeting", color: "#C9A8FF", icon: "▣" },
  { id: "award", label: "Award / Recognition", color: "#FFB347", icon: "★" },
  { id: "launch", label: "Product / Initiative Launch", color: "#87CEEB", icon: "◐" },
  { id: "conference", label: "Conference Attendance", color: "#98FB98", icon: "◑" },
  { id: "other", label: "Other Milestone", color: "#DDA0DD", icon: "●" },
];

const FORMAT_OPTIONS = [
  { id: "text", label: "Text Post", icon: "T", desc: "Pure insight, no image" },
  { id: "image", label: "Text + Image", icon: "⊞", desc: "Post with visual" },
  { id: "carousel", label: "Carousel", icon: "▤", desc: "Swipeable slides" },
  { id: "video", label: "Short Video", icon: "▶", desc: "Talking to camera" },
  { id: "article", label: "Long-form Article", icon: "≡", desc: "LinkedIn newsletter" },
  { id: "poll", label: "Poll / Question", icon: "?", desc: "Engagement driver" },
  { id: "podcast", label: "Podcast Clip", icon: "◉", desc: "Audio/video snippet" },
  { id: "collab", label: "Collab / Tag post", icon: "⊕", desc: "Feature another voice" },
];

const APPROVAL_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", desc: "Fast, no login needed" },
  { id: "slack", label: "Slack", icon: "⚡", desc: "Already in my workflow" },
  { id: "email", label: "Email", icon: "✉", desc: "Formal trail" },
  { id: "notion", label: "Notion", icon: "◻", desc: "In the platform" },
  { id: "ea", label: "Via EA First", icon: "◈", desc: "EA filters, I approve final" },
];

const TIME_SLOTS = [
  { id: "5min", label: "5 min", sublabel: "Async only", color: "#4ECDC4" },
  { id: "15min", label: "15 min", sublabel: "Approvals + notes", color: "#87CEEB" },
  { id: "30min", label: "30 min", sublabel: "One weekly sync", color: "#A8E6CF" },
  { id: "60min", label: "1 hour", sublabel: "Active collaboration", color: "#B8965A" },
  { id: "more", label: "1 hr+", sublabel: "Deep involvement", color: "#FFB347" },
];

const POSTING_FREQ = [
  { id: "1x", label: "1×", sublabel: "week", days: [2] },
  { id: "2x", label: "2×", sublabel: "week", days: [1, 4] },
  { id: "3x", label: "3×", sublabel: "week", days: [0, 2, 4] },
  { id: "5x", label: "5×", sublabel: "week", days: [0, 1, 2, 3, 4] },
  { id: "daily", label: "7×", sublabel: "week", days: [0, 1, 2, 3, 4, 5, 6] },
];

const GHOST_LEVELS = [
  { id: "full", label: "Full Trust", desc: "I approve, it publishes", pct: 0 },
  { id: "light", label: "Light Touch", desc: "I tweak ~10%", pct: 10 },
  { id: "medium", label: "Collaborative", desc: "I rewrite ~40%", pct: 40 },
  { id: "heavy", label: "Heavy Edit", desc: "AI drafts, I rewrite", pct: 70 },
  { id: "own", label: "AI Assists", desc: "I write, AI polishes", pct: 90 },
];

function Tag({ children, color, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 10px", background: color + "22",
      border: `1px solid ${color}66`, borderRadius: "2px",
      fontSize: "11px", color, fontFamily: "monospace"
    }}>
      {children}
      {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.6, fontSize: "14px", lineHeight: 1 }}>×</span>}
    </span>
  );
}

export default function CalendarLogistics() {
  const [postingFreq, setPostingFreq] = useState("3x");
  const [activeDays, setActiveDays] = useState([0, 2, 4]);
  const [blackoutDays, setBlackoutDays] = useState([]);
  const [formats, setFormats] = useState(["text", "image", "carousel"]);
  const [approvalChannel, setApprovalChannel] = useState("whatsapp");
  const [approvalSLA, setApprovalSLA] = useState("24h");
  const [weeklyTime, setWeeklyTime] = useState("15min");
  const [ghostLevel, setGhostLevel] = useState("light");
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", type: "speaking", month: "March", week: 1, notes: "" });
  const [showEventForm, setShowEventForm] = useState(false);
  const [approvalDelegate, setApprovalDelegate] = useState(false);
  const [eaName, setEaName] = useState("");
  const [activeTab, setActiveTab] = useState("schedule");
  const [ghostwriterOpen, setGhostwriterOpen] = useState(false);
  const [draftSelected, setDraftSelected] = useState(null);
  const [saved, setSaved] = useState(false);

  const currentFreq = POSTING_FREQ.find(f => f.id === postingFreq);
  const currentGhost = GHOST_LEVELS.find(g => g.id === ghostLevel);
  const postsPerMonth = currentFreq ? currentFreq.days.length * 4 : 12;

  const toggleDay = (d) => {
    if (activeDays.includes(d)) {
      if (activeDays.length > 1) setActiveDays(activeDays.filter(x => x !== d));
    } else {
      setActiveDays([...activeDays, d].sort());
    }
  };

  const toggleBlackout = (key) => {
    if (blackoutDays.includes(key)) setBlackoutDays(blackoutDays.filter(x => x !== key));
    else setBlackoutDays([...blackoutDays, key]);
  };

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    setEvents([...events, { ...newEvent, id: Date.now() }]);
    setNewEvent({ title: "", type: "speaking", month: "March", week: 1, notes: "" });
    setShowEventForm(false);
  };

  const removeEvent = (id) => setEvents(events.filter(e => e.id !== id));

  const toggleFormat = (id) => {
    if (formats.includes(id)) {
      if (formats.length > 1) setFormats(formats.filter(f => f !== id));
    } else setFormats([...formats, id]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const TABS = ["schedule", "events", "approval", "formats"];

  const accentColors = {
    schedule: "#4ECDC4",
    events: "#B8965A",
    approval: "#FF8B94",
    formats: "#A8E6FF",
  };
  const accent = accentColors[activeTab];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#0F172A",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      {/* Accent glow */}
      <div style={{
        position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px",
        borderRadius: "50%", background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.6s ease"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "0 0 80px" }}>
        {/* Header */}
        <div style={{
          padding: "36px 48px 28px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end"
        }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "5px", color: accent, marginBottom: "8px", transition: "color 0.4s", fontFamily: "monospace" }}>
              ELEVOX — SECTION 06
            </div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "400", letterSpacing: "-0.5px", color: "#0F172A" }}>
              Calendar & Logistics
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748B", fontStyle: "italic" }}>
              Where your brand meets the real world — configure your operating rhythm
            </p>
          </div>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 28px",
              background: saved ? "#4ECDC422" : accent + "22",
              border: `1px solid ${saved ? "#4ECDC4" : accent}`,
              color: saved ? "#4ECDC4" : accent,
              fontSize: "11px", letterSpacing: "2px", fontFamily: "monospace",
              cursor: "pointer", transition: "all 0.3s"
            }}>
            {saved ? "✓ SAVED" : "SAVE SECTION"}
          </button>
        </div>

        {/* Tab nav */}
        <div style={{
          display: "flex", borderBottom: "1px solid #E2E8F0",
          padding: "0 48px", background: "#FFFFFF"
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "16px 28px", background: "transparent",
              border: "none", borderBottom: `2px solid ${activeTab === t ? accentColors[t] : "transparent"}`,
              color: activeTab === t ? accentColors[t] : "#64748B",
              fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s"
            }}>
              {t === "schedule" ? "Posting Schedule" : t === "events" ? "Events & Anchors" : t === "approval" ? "Approval Workflow" : "Content Formats"}
            </button>
          ))}
        </div>

        {/* ── TAB: POSTING SCHEDULE ── */}
        {activeTab === "schedule" && (
          <div style={{ padding: "40px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              {/* Left: frequency + day picker */}
              <div>
                <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "20px", fontFamily: "monospace" }}>
                  POSTING FREQUENCY
                </div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "36px", flexWrap: "wrap" }}>
                  {POSTING_FREQ.map(f => (
                    <button key={f.id} onClick={() => { setPostingFreq(f.id); setActiveDays([...f.days]); }}
                      style={{
                        padding: "14px 18px", textAlign: "center",
                        background: postingFreq === f.id ? "#4ECDC4" : "#F8FAFC",
                        border: `1px solid ${postingFreq === f.id ? "#4ECDC4" : "#E2E8F0"}`,
                        color: postingFreq === f.id ? "#F8FAFC" : "#64748B",
                        cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all 0.15s",
                        minWidth: "60px"
                      }}>
                      <div style={{ fontSize: "18px", fontWeight: "400" }}>{f.label}</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", opacity: 0.7, marginTop: "2px" }}>{f.sublabel}</div>
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "16px", fontFamily: "monospace" }}>
                  POSTING DAYS — click to toggle
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "36px" }}>
                  {DAYS.map((d, i) => {
                    const isActive = activeDays.includes(i);
                    const isWeekend = i >= 5;
                    return (
                      <button key={d} onClick={() => toggleDay(i)} style={{
                        width: "52px", height: "52px",
                        background: isActive ? "#4ECDC4" : "#F8FAFC",
                        border: `1px solid ${isActive ? "#4ECDC4" : isWeekend ? "#E2E8F0" : "#E2E8F0"}`,
                        color: isActive ? "#F8FAFC" : isWeekend ? "#94A3B8" : "#64748B",
                        cursor: "pointer", fontSize: "11px", fontFamily: "monospace",
                        letterSpacing: "0.5px", transition: "all 0.15s"
                      }}>{d}</button>
                    );
                  })}
                </div>

                {/* Weekly time */}
                <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "16px", fontFamily: "monospace" }}>
                  WEEKLY TIME COMMITMENT
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {TIME_SLOTS.map(t => (
                    <button key={t.id} onClick={() => setWeeklyTime(t.id)} style={{
                      padding: "13px 18px", textAlign: "left",
                      background: weeklyTime === t.id ? t.color + "18" : "#F8FAFC",
                      border: `1px solid ${weeklyTime === t.id ? t.color : "#E2E8F0"}`,
                      color: weeklyTime === t.id ? t.color : "#64748B",
                      cursor: "pointer", fontFamily: "monospace", fontSize: "12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      transition: "all 0.15s"
                    }}>
                      <span style={{ fontSize: "14px", fontFamily: "'Georgia', serif" }}>{t.label}</span>
                      <span style={{ fontSize: "11px", opacity: 0.7 }}>{t.sublabel}</span>
                    </button>
                  ))}
                </div>
                
                <div style={{ marginTop: "36px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "16px", fontFamily: "monospace" }}>
                    GHOSTWRITING COMFORT LEVEL
                  </div>
                  <div>
                    {GHOST_LEVELS.map(g => (
                      <button key={g.id} onClick={() => setGhostLevel(g.id)} style={{
                        width: "100%", padding: "14px 18px", marginBottom: "8px",
                        background: ghostLevel === g.id ? "#A8E6CF18" : "#F8FAFC",
                        border: `1px solid ${ghostLevel === g.id ? "#A8E6CF" : "#E2E8F0"}`,
                        color: ghostLevel === g.id ? "#A8E6CF" : "#64748B",
                        cursor: "pointer", fontFamily: "monospace", fontSize: "12px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all 0.15s"
                      }}>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "13px", fontFamily: "'Georgia', serif", marginBottom: "2px" }}>{g.label}</div>
                          <div style={{ fontSize: "10px", opacity: 0.6 }}>{g.desc}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", color: ghostLevel === g.id ? "#A8E6CF" : "#94A3B8" }}>{g.pct}%</div>
                          <div style={{ fontSize: "9px", opacity: 0.5 }}>you write</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Monthly rhythm preview + AI Ghostwriter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Monthly preview card */}
                <div style={{ padding: "24px", background: "rgba(13,18,32,0.6)", border: "1px solid #1E2A3E", borderRadius: "10px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "18px", fontFamily: "monospace" }}>
                    YOUR MONTHLY RHYTHM — PREVIEW
                  </div>
                  {[
                    ["Posts per month", `~${postsPerMonth} posts`],
                    ["Active days", activeDays.map(d => DAYS[d]).join(", ")],
                    ["Your time/week", TIME_SLOTS.find(t => t.id === weeklyTime)?.label],
                    ["Writing involvement", `${currentGhost?.pct}% — ${currentGhost?.label}`],
                    ["Content needed/week", `${currentFreq?.days.length || 3} pieces`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E2A3E" }}>
                      <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace" }}>{k}</span>
                      <span style={{ fontSize: "12px", color: "#A8E6CF", fontFamily: "monospace", textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* AI Ghostwriter toggle */}
                {!ghostwriterOpen ? (
                  <button
                    onClick={() => setGhostwriterOpen(true)}
                    style={{
                      padding: "14px 20px",
                      background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: "10px",
                      color: "#a5b4fc",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      display: "flex", alignItems: "center", gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <span>✦</span> Draft a post with AI
                  </button>
                ) : (
                  <GhostwriterPanel
                    onSelectDraft={(body) => { setDraftSelected(body); setGhostwriterOpen(false); }}
                    onClose={() => setGhostwriterOpen(false)}
                  />
                )}

                {/* Show selected draft */}
                {draftSelected && !ghostwriterOpen && (
                  <div style={{ padding: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#6366f1", marginBottom: "10px", fontFamily: "monospace" }}>SELECTED DRAFT</div>
                    <div style={{ fontSize: "13px", color: "#94A3B8", lineHeight: "1.6", fontFamily: "'Inter', sans-serif", whiteSpace: "pre-wrap", maxHeight: "200px", overflowY: "auto" }}>
                      {draftSelected}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button onClick={async () => { await navigator.clipboard.writeText(draftSelected); }} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #1E2A3E", borderRadius: "6px", color: "#64748B", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Copy</button>
                      <button onClick={() => { setDraftSelected(null); setGhostwriterOpen(true); }} style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: "#a5b4fc", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>New draft</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blackout weeks */}
            <div style={{ marginTop: "40px", paddingTop: "40px", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#64748B", marginBottom: "8px", fontFamily: "monospace" }}>
                BLACKOUT WEEKS — click to mark weeks you cannot post
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 20px", fontStyle: "italic" }}>
                Holidays, board retreats, earnings blackout periods, personal leave — we won't publish during these windows.
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {MONTHS.flatMap(m => [1, 2, 3, 4].map(w => ({ key: `${m}-W${w}`, label: `${m} W${w}` }))).map(({ key, label }) => {
                  const isOut = blackoutDays.includes(key);
                  return (
                    <button key={key} onClick={() => toggleBlackout(key)} style={{
                      padding: "8px 14px",
                      background: isOut ? "#FF8B9422" : "#F8FAFC",
                      border: `1px solid ${isOut ? "#FF8B94" : "#E2E8F0"}`,
                      color: isOut ? "#FF8B94" : "#94A3B8",
                      fontSize: "11px", fontFamily: "monospace",
                      cursor: "pointer", transition: "all 0.15s",
                      textDecoration: isOut ? "line-through" : "none"
                    }}>{label}</button>
                  );
                })}
              </div>
              {blackoutDays.length > 0 && (
                <p style={{ fontSize: "11px", color: "#FF8B94", marginTop: "12px", fontFamily: "monospace" }}>
                  ✕ {blackoutDays.length} week{blackoutDays.length > 1 ? "s" : ""} blocked — we will pause scheduling during these periods
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: EVENTS & ANCHORS ── */}
        {activeTab === "events" && (
          <div style={{ padding: "0" }}>
             <EventsAnchors />
          </div>
        )}

        {/* ── TAB: APPROVAL WORKFLOW ── */}
        {activeTab === "approval" && (
          <div style={{ padding: "0" }}>
             <ApprovalWorkflow />
          </div>
        )}

        {/* ── TAB: CONTENT FORMATS ── */}
        {activeTab === "formats" && (
          <ContentFormats />
        )}
      </div>
    </div>
  );
}
