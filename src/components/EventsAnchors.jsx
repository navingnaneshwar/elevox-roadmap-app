import { useState, useRef, useEffect } from "react";

const EVENT_TYPES = [
  { id: "speaking",      label: "Speaking / Panel",           color: "#B8965A", bg: "#B8965A12", icon: "◆", pre: 3, post: 2 },
  { id: "announcement",  label: "Company Announcement",       color: "#4EC9B0", bg: "#4EC9B012", icon: "◉", pre: 2, post: 3 },
  { id: "fundraise",     label: "Fundraise / Deal Close",     color: "#CE9178", bg: "#CE917812", icon: "◈", pre: 1, post: 4 },
  { id: "media",         label: "Media / Press Interview",    color: "#DCDCAA", bg: "#DCDCAA12", icon: "◎", pre: 1, post: 2 },
  { id: "board",         label: "Board Appointment",          color: "#C586C0", bg: "#C586C012", icon: "▣", pre: 2, post: 2 },
  { id: "award",         label: "Award / Recognition",        color: "#F1C40F", bg: "#F1C40F12", icon: "★", pre: 1, post: 3 },
  { id: "launch",        label: "Product Launch",             color: "#569CD6", bg: "#569CD612", icon: "◐", pre: 3, post: 3 },
  { id: "conference",    label: "Conference Attendance",      color: "#6A9955", bg: "#6A995512", icon: "◑", pre: 2, post: 2 },
  { id: "podcast",       label: "Podcast Appearance",         color: "#FF79C6", bg: "#FF79C612", icon: "⊙", pre: 1, post: 2 },
  { id: "milestone",     label: "Company Milestone",          color: "#50FA7B", bg: "#50FA7B12", icon: "◇", pre: 1, post: 2 },
];

const CONTENT_ANGLES = {
  speaking:     ["The one idea I'm bringing to [EVENT]", "Why this topic matters now — my prep notes", "3 questions I hope the audience asks me", "What I learned from 500 people in one room", "The slide I almost didn't include (but should have)"],
  announcement: ["Why we made this decision", "What this means for our industry", "The problem we set out to solve — and what we found", "To my team: here's why this matters", "The questions everyone's asking — answered honestly"],
  fundraise:    ["What we're building and why now", "What I look for in investors (and what I don't)", "The moment I knew this company had something real", "What this capital actually unlocks", "Lessons from the raise: what I'd do differently"],
  media:        ["The question the journalist asked that stopped me cold", "What I said on [OUTLET] — and what I meant", "The 60-second version of my 45-minute interview", "Why I agreed to this interview (and what I hoped to say)", "The topic I've been waiting to discuss publicly"],
  board:        ["What I look for in a board — and why it matters", "The governance question every CxO should ask themselves", "What being on a board has taught me about leadership", "Why diverse boards build better companies", "The conversation I had that changed how I think about governance"],
  award:        ["To everyone who deserved this more than me", "What this recognition actually represents", "The team behind the name on the award", "Why I almost didn't apply — and why I'm glad I did", "What I'd tell myself when I started this journey"],
  launch:       ["We built this because [PROBLEM] was costing [AUDIENCE] too much", "The feature we almost shipped — and why we didn't", "What our first 100 users taught us", "The decision that changed the product completely", "Here's exactly what we launched and why it matters to you"],
  conference:   ["My one non-negotiable takeaway from [CONFERENCE]", "The conversation in the hallway that mattered most", "3 ideas I'm bringing back to my team", "The speaker who made me rethink everything", "What the smartest people at [CONFERENCE] are worried about"],
  podcast:      ["Full episode out now — here's the 90-second version", "The question [HOST] asked that I'm still thinking about", "Why I said yes to this conversation", "The thing I've never said publicly — until this episode", "Listen to this if you want the unfiltered version"],
  milestone:    ["We just crossed [MILESTONE] — here's what it took", "The number nobody sees behind the headline metric", "What this milestone means (and what it doesn't)", "A letter to the version of us that started this", "What we got wrong on the way to this moment"],
};

const MONTHS = [
  { name: "March",  days: 31, start: 2026 },
  { name: "April",  days: 30, start: 2026 },
  { name: "May",    days: 31, start: 2026 },
  { name: "June",   days: 30, start: 2026 },
];

const WEEK_DAYS = ["M","T","W","T","F","S","S"];

function buildCalendar() {
  const weeks = [];
  let dayCounter = 1;
  MONTHS.forEach((m, mi) => {
    const firstDow = [6,2,4,0][mi]; // approximate first weekday for each month
    let week = [];
    for (let d = 0; d < firstDow; d++) week.push(null);
    for (let d = 1; d <= m.days; d++) {
      week.push({ month: m.name, day: d, monthIdx: mi });
      if (week.length === 7) { weeks.push({ month: m.name, cells: week }); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push({ month: m.name, cells: week }); }
  });
  return weeks;
}

export default function EventsAnchors() {
  const [events, setEvents] = useState([
    { id: 1, type: "speaking",     title: "SaaStr Annual Keynote",         month: "April",  day: 14, notes: "30-min slot on AI in enterprise sales. 5,000 attendees. Need teaser posts beforehand and recap after.", audience: "SaaS founders, VCs", goal: "Position as AI-forward CxO" },
    { id: 2, type: "launch",       title: "Product v3.0 Launch",           month: "May",    day: 6,  notes: "Major release with AI features. PR announcement going out same day. Need LinkedIn to amplify.", audience: "Existing customers, prospects", goal: "Drive trial signups" },
    { id: 3, type: "announcement", title: "Series B Close — $42M",         month: "May",    day: 21, notes: "Led by Sequoia. Embargo until 9am ET. Need post ready to go live instantly.", audience: "Investors, talent, customers", goal: "Attract A-players to open roles" },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView]     = useState("timeline"); // timeline | grid | list
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [activeAngle, setActiveAngle] = useState(0);
  const [draft, setDraft]   = useState({ type: "speaking", title: "", month: "March", day: 15, notes: "", audience: "", goal: "" });
  const timelineRef = useRef(null);

  const filtered = filter === "all" ? events : events.filter(e => e.type === filter);
  const totalPosts = events.reduce((s, e) => { const t = EVENT_TYPES.find(t => t.id === e.type); return s + (t ? t.pre + t.post : 4); }, 0);

  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents([...events, { ...draft, id: Date.now() }]);
    setDraft({ type: "speaking", title: "", month: "March", day: 15, notes: "", audience: "", goal: "" });
    setShowForm(false);
  };

  const removeEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
    if (selectedEvent?.id === id) setSelectedEvent(null);
  };

  const typeFor = (e) => EVENT_TYPES.find(t => t.id === e.type);

  const angles = selectedEvent ? (CONTENT_ANGLES[selectedEvent.type] || []) : [];

  // Build month-keyed event map
  const eventsByMonth = {};
  MONTHS.forEach(m => { eventsByMonth[m.name] = events.filter(e => e.month === m.name).sort((a,b) => a.day - b.day); });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F2EDE3",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      color: "#1C1612",
      position: "relative",
    }}>
      {/* Noise texture overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px"
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── MASTHEAD ── */}
        <div style={{
          borderBottom: "3px solid #1C1612",
          padding: "0",
          background: "#1C1612",
        }}>
          <div style={{ padding: "28px 48px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "6px", color: "#B8965A", marginBottom: "8px", fontFamily: "monospace" }}>
                ELEVOX — SECTION 06 — EVENTS &amp; ANCHORS
              </div>
              <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "400", color: "#F2EDE3", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                The 90-Day Content War Room
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#7A6E60", fontStyle: "italic" }}>
                Every milestone becomes a content anchor — plan the narrative before it happens
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", color: "#B8965A", fontFamily: "monospace" }}>{events.length}</div>
              <div style={{ fontSize: "10px", color: "#7A6E60", letterSpacing: "2px", fontFamily: "monospace" }}>MILESTONES</div>
              <div style={{ fontSize: "18px", color: "#4EC9B0", fontFamily: "monospace", marginTop: "4px" }}>{totalPosts}</div>
              <div style={{ fontSize: "10px", color: "#7A6E60", letterSpacing: "2px", fontFamily: "monospace" }}>CONTENT PIECES UNLOCKED</div>
            </div>
          </div>

          {/* Controls bar */}
          <div style={{ padding: "0 48px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["timeline","grid","list"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "7px 18px",
                  background: view === v ? "#B8965A" : "transparent",
                  border: `1px solid ${view === v ? "#B8965A" : "#3A3028"}`,
                  color: view === v ? "#1C1612" : "#7A6E60",
                  fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "monospace", transition: "all 0.15s"
                }}>{v}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#7A6E60", fontFamily: "monospace", marginRight: "8px" }}>FILTER:</span>
              <button onClick={() => setFilter("all")} style={{
                padding: "6px 14px",
                background: filter === "all" ? "#F2EDE3" : "transparent",
                border: `1px solid ${filter === "all" ? "#F2EDE3" : "#3A3028"}`,
                color: filter === "all" ? "#1C1612" : "#7A6E60",
                fontSize: "10px", fontFamily: "monospace", cursor: "pointer"
              }}>ALL</button>
              {EVENT_TYPES.filter(t => events.some(e => e.type === t.id)).map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)} style={{
                  padding: "6px 12px",
                  background: filter === t.id ? t.color + "33" : "transparent",
                  border: `1px solid ${filter === t.id ? t.color : "#3A3028"}`,
                  color: filter === t.id ? t.color : "#7A6E60",
                  fontSize: "10px", fontFamily: "monospace", cursor: "pointer"
                }}>{t.icon}</button>
              ))}
            </div>
            <button onClick={() => { setShowForm(true); setSelectedEvent(null); }} style={{
              padding: "9px 24px",
              background: "#B8965A", border: "none",
              color: "#1C1612", fontSize: "11px", letterSpacing: "2px",
              fontFamily: "monospace", cursor: "pointer", fontWeight: "bold"
            }}>+ ADD MILESTONE</button>
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 172px)" }}>

          {/* ── LEFT / MAIN PANEL ── */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>

            {/* ADD EVENT FORM */}
            {showForm && (
              <div style={{
                margin: "24px 40px",
                padding: "28px 32px",
                background: "#fff",
                border: "2px solid #1C1612",
                boxShadow: "6px 6px 0 #1C1612",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#B8965A", fontFamily: "monospace" }}>NEW MILESTONE</div>
                  <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#999" }}>×</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>MILESTONE TITLE *</label>
                    <input value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})}
                      placeholder="e.g. SaaStr Keynote, Series B Close, Product Launch..."
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "15px", fontFamily: "Palatino, serif", outline: "none", boxSizing: "border-box", background: "#FAFAF8" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>EVENT TYPE *</label>
                    <select value={draft.type} onChange={e => setDraft({...draft, type: e.target.value})}
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "13px", fontFamily: "monospace", outline: "none", background: "#FAFAF8", cursor: "pointer" }}>
                      {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>MONTH *</label>
                      <select value={draft.month} onChange={e => setDraft({...draft, month: e.target.value})}
                        style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "13px", fontFamily: "monospace", outline: "none", background: "#FAFAF8" }}>
                        {MONTHS.map(m => <option key={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>DAY *</label>
                      <input type="number" min="1" max="31" value={draft.day} onChange={e => setDraft({...draft, day: Number(e.target.value)})}
                        style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "15px", fontFamily: "monospace", outline: "none", background: "#FAFAF8", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>TARGET AUDIENCE</label>
                    <input value={draft.audience} onChange={e => setDraft({...draft, audience: e.target.value})}
                      placeholder="Who is watching / reading this?"
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "13px", fontFamily: "Palatino, serif", outline: "none", background: "#FAFAF8", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>BRAND GOAL</label>
                    <input value={draft.goal} onChange={e => setDraft({...draft, goal: e.target.value})}
                      placeholder="What should people think/feel/do?"
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "13px", fontFamily: "Palatino, serif", outline: "none", background: "#FAFAF8", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>CONTEXT & NOTES</label>
                    <textarea value={draft.notes} onChange={e => setDraft({...draft, notes: e.target.value})}
                      rows={3} placeholder="Embargo dates, key messages, co-panelists, what you want the world to know, sensitivities..."
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD", fontSize: "13px", fontFamily: "Palatino, serif", outline: "none", resize: "none", background: "#FAFAF8", lineHeight: "1.7", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "11px", color: "#999", fontFamily: "monospace", fontStyle: "italic" }}>
                    → This event will unlock {(EVENT_TYPES.find(t => t.id === draft.type)?.pre || 2) + (EVENT_TYPES.find(t => t.id === draft.type)?.post || 2)} content pieces
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setShowForm(false)} style={{ padding: "11px 22px", background: "none", border: "1px solid #DDD", color: "#999", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>CANCEL</button>
                    <button onClick={addEvent} style={{ padding: "11px 32px", background: draft.title ? "#1C1612" : "#CCC", border: "none", color: draft.title ? "#F2EDE3" : "#999", fontSize: "11px", letterSpacing: "2px", fontFamily: "monospace", cursor: draft.title ? "pointer" : "default" }}>ADD TO CALENDAR</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TIMELINE VIEW ── */}
            {view === "timeline" && (
              <div style={{ padding: "32px 40px" }} ref={timelineRef}>
                {MONTHS.map((month, mi) => {
                  const mEvents = filtered.filter(e => e.month === month.name);
                  return (
                    <div key={month.name} style={{ marginBottom: "48px" }}>
                      {/* Month header */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid #1C1612" }}>
                        <h2 style={{ margin: 0, fontSize: "36px", fontWeight: "400", letterSpacing: "-1px", color: "#1C1612" }}>{month.name}</h2>
                        <span style={{ fontSize: "11px", color: "#AAA", fontFamily: "monospace", letterSpacing: "2px" }}>2026</span>
                        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#B8965A", fontFamily: "monospace" }}>
                          {mEvents.length} event{mEvents.length !== 1 ? "s" : ""} · {mEvents.reduce((s,e) => { const t = typeFor(e); return s + (t ? t.pre + t.post : 4); }, 0)} posts
                        </span>
                      </div>

                      {mEvents.length === 0 ? (
                        <div style={{ padding: "24px", border: "1px dashed #CCC", textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "#BBB", fontStyle: "italic" }}>No events in {month.name} — add a milestone above</p>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          {/* Timeline spine */}
                          <div style={{ position: "absolute", left: "16px", top: 0, bottom: 0, width: "1px", background: "#DDD5C0" }} />

                          {mEvents.map((ev, ei) => {
                            const t = typeFor(ev);
                            const isSelected = selectedEvent?.id === ev.id;
                            const postCount = t ? t.pre + t.post : 4;
                            return (
                              <div key={ev.id} style={{ marginBottom: "20px", paddingLeft: "48px", position: "relative" }}>
                                {/* Spine dot */}
                                <div style={{
                                  position: "absolute", left: "10px", top: "18px",
                                  width: "13px", height: "13px", borderRadius: "50%",
                                  background: t?.color || "#CCC",
                                  border: "2px solid #F2EDE3",
                                  boxShadow: `0 0 0 1px ${t?.color || "#CCC"}`,
                                  zIndex: 2
                                }} />
                                {/* Day badge */}
                                <div style={{
                                  position: "absolute", left: "28px", top: "14px",
                                  fontSize: "9px", color: "#AAA", fontFamily: "monospace"
                                }}>{ev.day}</div>

                                <div
                                  onClick={() => { setSelectedEvent(isSelected ? null : ev); setActiveAngle(0); setShowForm(false); }}
                                  style={{
                                    padding: "18px 22px",
                                    background: isSelected ? t?.bg || "#F5F5F0" : "#fff",
                                    border: `1px solid ${isSelected ? t?.color || "#CCC" : "#E8E0D0"}`,
                                    borderLeft: `4px solid ${t?.color || "#CCC"}`,
                                    cursor: "pointer",
                                    transition: "all 0.18s",
                                    boxShadow: isSelected ? `3px 3px 0 ${t?.color}44` : "none"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "14px", color: t?.color }}>{t?.icon}</span>
                                        <span style={{ fontSize: "10px", color: t?.color, fontFamily: "monospace", letterSpacing: "1px" }}>{t?.label?.toUpperCase()}</span>
                                        <span style={{ fontSize: "10px", color: "#CCC", fontFamily: "monospace" }}>—</span>
                                        <span style={{ fontSize: "10px", color: "#AAA", fontFamily: "monospace" }}>{month.name} {ev.day}</span>
                                      </div>
                                      <div style={{ fontSize: "17px", color: "#1C1612", marginBottom: ev.notes ? "8px" : "0", lineHeight: "1.3" }}>
                                        {ev.title}
                                      </div>
                                      {ev.notes && !isSelected && (
                                        <div style={{ fontSize: "12px", color: "#888", fontStyle: "italic", lineHeight: "1.5" }}>
                                          {ev.notes.length > 90 ? ev.notes.slice(0, 90) + "…" : ev.notes}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ textAlign: "right", marginLeft: "20px", flexShrink: 0 }}>
                                      <div style={{ fontSize: "22px", color: t?.color, fontFamily: "monospace" }}>{postCount}</div>
                                      <div style={{ fontSize: "9px", color: "#BBB", fontFamily: "monospace" }}>POSTS</div>
                                      <div style={{ fontSize: "9px", color: "#CCC", fontFamily: "monospace", marginTop: "2px" }}>
                                        {t?.pre}↑ {t?.post}↓
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content window indicators */}
                                  {!isSelected && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "12px" }}>
                                      {Array(t?.pre || 2).fill(0).map((_,i) => (
                                        <div key={`pre-${i}`} style={{ height: "4px", flex: 1, background: t?.color + "44", borderRadius: "2px" }} />
                                      ))}
                                      <div style={{ width: "8px", height: "8px", background: t?.color, borderRadius: "50%", flexShrink: 0 }} />
                                      {Array(t?.post || 2).fill(0).map((_,i) => (
                                        <div key={`post-${i}`} style={{ height: "4px", flex: 1, background: t?.color + "22", borderRadius: "2px" }} />
                                      ))}
                                      <span style={{ fontSize: "9px", color: "#CCC", fontFamily: "monospace", marginLeft: "8px", whiteSpace: "nowrap" }}>
                                        {t?.pre} before · EVENT · {t?.post} after
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {view === "grid" && (
              <div style={{ padding: "32px 40px" }}>
                {MONTHS.map(month => {
                  const mDays = month.days;
                  const mEvents = filtered.filter(e => e.month === month.name);
                  const firstDow = [6,2,4,0][MONTHS.indexOf(month)];
                  const cells = [];
                  for (let i = 0; i < firstDow; i++) cells.push(null);
                  for (let d = 1; d <= mDays; d++) cells.push(d);

                  return (
                    <div key={month.name} style={{ marginBottom: "40px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "2px solid #1C1612" }}>
                        <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "400" }}>{month.name}</h2>
                        <span style={{ fontSize: "11px", color: "#B8965A", fontFamily: "monospace" }}>{mEvents.length} events</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "6px" }}>
                        {WEEK_DAYS.map(d => (
                          <div key={d} style={{ textAlign: "center", fontSize: "9px", color: "#AAA", fontFamily: "monospace", letterSpacing: "1px", padding: "4px 0" }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                        {cells.map((cell, ci) => {
                          if (!cell) return <div key={`e-${ci}`} />;
                          const dayEvents = mEvents.filter(e => e.day === cell);
                          const isToday = month.name === "March" && cell === 9;
                          return (
                            <div key={cell}
                              onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                              style={{
                                minHeight: "56px", padding: "6px",
                                background: dayEvents.length > 0 ? typeFor(dayEvents[0])?.bg : isToday ? "#1C161208" : "transparent",
                                border: `1px solid ${dayEvents.length > 0 ? typeFor(dayEvents[0])?.color + "44" : isToday ? "#B8965A44" : "#E8E0D0"}`,
                                cursor: dayEvents.length > 0 ? "pointer" : "default",
                                transition: "all 0.12s",
                                position: "relative"
                              }}>
                              <div style={{ fontSize: "10px", color: isToday ? "#B8965A" : "#999", fontFamily: "monospace" }}>{cell}</div>
                              {dayEvents.map(ev => {
                                const t = typeFor(ev);
                                return (
                                  <div key={ev.id} style={{ marginTop: "3px" }}>
                                    <div style={{ fontSize: "9px", color: t?.color, fontFamily: "monospace", lineHeight: "1.3" }}>{t?.icon} {ev.title.slice(0,12)}{ev.title.length > 12 ? "…" : ""}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {view === "list" && (
              <div style={{ padding: "32px 40px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #1C1612" }}>
                      {["Date","Event","Type","Audience","Goal","Posts",""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "9px", letterSpacing: "3px", color: "#AAA", fontFamily: "monospace", fontWeight: "400" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.sort((a,b) => {
                      const mi = m => MONTHS.findIndex(mo => mo.name === m);
                      return mi(a.month) !== mi(b.month) ? mi(a.month) - mi(b.month) : a.day - b.day;
                    }).map((ev, i) => {
                      const t = typeFor(ev);
                      const isSelected = selectedEvent?.id === ev.id;
                      return (
                        <tr key={ev.id}
                          onClick={() => { setSelectedEvent(isSelected ? null : ev); setActiveAngle(0); }}
                          style={{
                            borderBottom: "1px solid #E8E0D0",
                            background: isSelected ? t?.bg : i % 2 === 0 ? "#fff" : "transparent",
                            cursor: "pointer", transition: "background 0.12s"
                          }}>
                          <td style={{ padding: "14px", fontSize: "13px", fontFamily: "monospace", color: "#888", whiteSpace: "nowrap" }}>{ev.month.slice(0,3)} {ev.day}</td>
                          <td style={{ padding: "14px", fontSize: "14px", color: "#1C1612", fontWeight: isSelected ? "bold" : "normal" }}>{ev.title}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ padding: "3px 10px", background: t?.bg, border: `1px solid ${t?.color}44`, color: t?.color, fontSize: "10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{t?.icon} {t?.label}</span>
                          </td>
                          <td style={{ padding: "14px", fontSize: "12px", color: "#888" }}>{ev.audience || "—"}</td>
                          <td style={{ padding: "14px", fontSize: "12px", color: "#888" }}>{ev.goal || "—"}</td>
                          <td style={{ padding: "14px", fontSize: "16px", color: t?.color, fontFamily: "monospace", textAlign: "center" }}>{(t?.pre||2)+(t?.post||2)}</td>
                          <td style={{ padding: "14px" }}>
                            <button onClick={e => { e.stopPropagation(); removeEvent(ev.id); }}
                              style={{ background: "none", border: "none", color: "#CCC", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#BBB", fontStyle: "italic" }}>No events yet — add your first milestone above</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL — DETAIL / STRATEGY ── */}
          <div style={{
            width: selectedEvent ? "380px" : "0",
            overflow: "hidden",
            transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
            borderLeft: selectedEvent ? "2px solid #1C1612" : "none",
            background: "#1C1612",
            flexShrink: 0,
            position: "relative"
          }}>
            {selectedEvent && (() => {
              const t = typeFor(selectedEvent);
              return (
                <div style={{ width: "380px", padding: "28px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
                  {/* Close */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <span style={{ fontSize: "9px", letterSpacing: "4px", color: t?.color, fontFamily: "monospace" }}>EVENT STRATEGY</span>
                    <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
                  </div>

                  {/* Event identity */}
                  <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #2A2420" }}>
                    <div style={{ fontSize: "11px", color: t?.color, fontFamily: "monospace", marginBottom: "6px" }}>{t?.icon} {t?.label} · {selectedEvent.month} {selectedEvent.day}</div>
                    <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: "400", color: "#F2EDE3", lineHeight: "1.3" }}>{selectedEvent.title}</h3>
                    {selectedEvent.notes && (
                      <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#7A6E60", lineHeight: "1.7", fontStyle: "italic" }}>{selectedEvent.notes}</p>
                    )}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {selectedEvent.audience && (
                        <span style={{ padding: "4px 10px", background: "#2A2420", fontSize: "10px", color: "#7A6E60", fontFamily: "monospace" }}>👥 {selectedEvent.audience}</span>
                      )}
                      {selectedEvent.goal && (
                        <span style={{ padding: "4px 10px", background: "#2A2420", fontSize: "10px", color: "#7A6E60", fontFamily: "monospace" }}>🎯 {selectedEvent.goal}</span>
                      )}
                    </div>
                  </div>

                  {/* Content window */}
                  <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #2A2420" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#3D3028", marginBottom: "14px", fontFamily: "monospace" }}>CONTENT WINDOW</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                      {Array(t?.pre||2).fill(0).map((_,i) => (
                        <div key={i} style={{ flex:1, padding: "10px 6px", background: t?.color+"22", border: `1px solid ${t?.color}44`, textAlign: "center" }}>
                          <div style={{ fontSize: "16px", color: t?.color, fontFamily: "monospace" }}>{(t?.pre||2)-i}</div>
                          <div style={{ fontSize: "8px", color: "#555", fontFamily: "monospace", marginTop: "2px" }}>PRE</div>
                        </div>
                      ))}
                      <div style={{ padding: "14px 10px", background: t?.color, textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: "12px", color: "#1C1612", fontFamily: "monospace" }}>{t?.icon}</div>
                        <div style={{ fontSize: "8px", color: "#1C1612", fontFamily: "monospace", marginTop: "2px" }}>DAY</div>
                      </div>
                      {Array(t?.post||2).fill(0).map((_,i) => (
                        <div key={i} style={{ flex:1, padding: "10px 6px", background: "#2A2420", border: `1px solid #3A3028`, textAlign: "center" }}>
                          <div style={{ fontSize: "16px", color: "#7A6E60", fontFamily: "monospace" }}>+{i+1}</div>
                          <div style={{ fontSize: "8px", color: "#555", fontFamily: "monospace", marginTop: "2px" }}>POST</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>
                      {(t?.pre||2)} posts before · event day · {(t?.post||2)} posts after = <span style={{ color: t?.color }}>{(t?.pre||2)+(t?.post||2)} pieces total</span>
                    </div>
                  </div>

                  {/* Content angles */}
                  <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #2A2420" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#3D3028", marginBottom: "14px", fontFamily: "monospace" }}>AI CONTENT ANGLES</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(CONTENT_ANGLES[selectedEvent.type]||[]).map((angle, i) => (
                        <div key={i}
                          onClick={() => setActiveAngle(i)}
                          style={{
                            padding: "12px 14px",
                            background: activeAngle === i ? t?.color+"22" : "#2A2420",
                            border: `1px solid ${activeAngle === i ? t?.color+"66" : "#3A3028"}`,
                            cursor: "pointer", transition: "all 0.12s"
                          }}>
                          <div style={{ fontSize: "11px", color: activeAngle === i ? t?.color : "#7A6E60", lineHeight: "1.5", fontStyle: "italic" }}>
                            "{angle.replace("[EVENT]", selectedEvent.title).replace("[OUTLET]", "the publication").replace("[HOST]", "the host").replace("[CONFERENCE]", selectedEvent.title).replace("[MILESTONE]", "the milestone")}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timing advice */}
                  <div style={{ marginBottom: "20px", padding: "16px", background: "#2A2420", border: `1px solid ${t?.color}22` }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: t?.color, marginBottom: "10px", fontFamily: "monospace" }}>TIMING STRATEGY</div>
                    <div style={{ fontSize: "12px", color: "#7A6E60", lineHeight: "1.8" }}>
                      {t?.id === "speaking" && "Start teasing 2 weeks out with topic hints. Post live the day of. Share key quotes + audience reactions within 24hrs. Write the reflection piece within the week."}
                      {t?.id === "announcement" && "Stay silent until embargo lifts. Have your post ready to publish the instant it's public. Follow up with 'what this means for the industry' within 48hrs."}
                      {t?.id === "fundraise" && "Let the PR wire hit first. Your post goes 30 minutes later — personal, grateful, vision-forward. The 'what we're building next' post lands 2–3 days after."}
                      {t?.id === "media" && "Share a teaser before the piece drops. Post when it goes live. Always write your own summary — never rely on the headline alone."}
                      {t?.id === "launch" && "Build anticipation 2 weeks out. Day-of post is crisp and product-forward. Follow with customer story and technical 'how we built it' posts."}
                      {t?.id === "award" && "Be humble and specific. Name the team. The acceptance is one post. The reflection piece — 'what the journey looked like from the inside' — is often stronger."}
                      {t?.id === "conference" && "Pre-post your session details. Live-post your 1–2 biggest insights. Write the synthesis piece within 48hrs while it's fresh."}
                      {t?.id === "podcast" && "Tease the episode 48hrs before. Drop the post when it's live with a key pull quote. Your own 'what I meant by X' post often outperforms the original."}
                      {t?.id === "board" && "Announce the appointment with context — why this board, why now. Write a piece on what governance means to you as a builder."}
                      {t?.id === "milestone" && "The human story behind the number always outperforms the stat. Who made it possible? What nearly stopped you? That's the post."}
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeEvent(selectedEvent.id)} style={{
                    width: "100%", padding: "12px",
                    background: "transparent", border: "1px solid #3A3028",
                    color: "#555", fontSize: "10px", letterSpacing: "2px",
                    fontFamily: "monospace", cursor: "pointer", transition: "all 0.15s"
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = "#FF6B6B"; e.target.style.color = "#FF6B6B"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "#3A3028"; e.target.style.color = "#555"; }}
                  >REMOVE EVENT</button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── FOOTER STATS ── */}
        <div style={{ borderTop: "2px solid #1C1612", padding: "18px 48px", background: "#1C1612", display: "flex", gap: "48px", alignItems: "center" }}>
          {[
            ["Total milestones", events.length, "#B8965A"],
            ["Content pieces unlocked", totalPosts, "#4EC9B0"],
            ["Months covered", [...new Set(events.map(e=>e.month))].length, "#C586C0"],
            ["Most active month", (() => { let best = "—"; let max = 0; MONTHS.forEach(m => { const c = events.filter(e => e.month === m.name).length; if (c > max) { max = c; best = m.name; } }); return best; })(), "#DCDCAA"],
          ].map(([label, val, col]) => (
            <div key={label}>
              <div style={{ fontSize: "22px", color: col, fontFamily: "monospace" }}>{val}</div>
              <div style={{ fontSize: "9px", color: "#7A6E60", letterSpacing: "2px", fontFamily: "monospace", marginTop: "2px" }}>{label.toUpperCase()}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: "11px", color: "#3D3028", fontFamily: "monospace", fontStyle: "italic" }}>
            Click any event to open its content strategy →
          </div>
        </div>

      </div>
    </div>
  );
}
