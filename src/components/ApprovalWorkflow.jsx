import { useState, useEffect } from "react";

const CHANNELS = [
  { id: "whatsapp",  label: "WhatsApp",         icon: "◉", color: "#25D366", desc: "Instant, no login. Most executives already live here.",     badge: "RECOMMENDED", sla: "< 1 hour typical" },
  { id: "slack",     label: "Slack",             icon: "◈", color: "#E01E5A", desc: "Fits naturally into your existing team workflow.",          badge: "",            sla: "< 2 hours typical" },
  { id: "email",     label: "Email",             icon: "◎", color: "#4A9EFF", desc: "Formal paper trail. EA-friendly. Slower to action.",        badge: "",            sla: "24–48 hrs typical" },
  { id: "notion",    label: "Notion",            icon: "◻", color: "#E8E8E8", desc: "Review in-platform. Best for collaborative edits.",         badge: "",            sla: "Batch review" },
  { id: "sms",       label: "SMS / iMessage",    icon: "◆", color: "#0A84FF", desc: "Highest open rate. Pure approve/reject only.",              badge: "",            sla: "< 30 min typical" },
];

const SLA_OPTIONS = [
  { id: "2h",     label: "2 hours",     sublabel: "High priority",        risk: "low" },
  { id: "12h",    label: "12 hours",    sublabel: "Same day",             risk: "low" },
  { id: "24h",    label: "24 hours",    sublabel: "Next day",             risk: "medium" },
  { id: "48h",    label: "48 hours",    sublabel: "Travel buffer",        risk: "medium" },
  { id: "weekly", label: "Weekly",      sublabel: "Batch review",         risk: "high" },
];

const ESCALATION_RULES = [
  { id: "noresponse", label: "If no response after SLA", default: "hold" },
  { id: "revision",   label: "If revision requested",    default: "reassign" },
  { id: "breaking",   label: "If breaking news hook",    default: "expedite" },
  { id: "sensitive",  label: "If sensitive topic flagged",default: "skip" },
];

const ESCALATION_ACTIONS = {
  hold:     { label: "Hold & wait",            color: "#FFB347" },
  publish:  { label: "Auto-publish",           color: "#50FA7B" },
  skip:     { label: "Skip this post",         color: "#FF6B6B" },
  expedite: { label: "Expedite to top",        color: "#4A9EFF" },
  reassign: { label: "Reassign to EA",         color: "#C586C0" },
};

const CONTENT_TYPES = [
  { id: "linkedin_post", label: "LinkedIn Post",       turnaround: "48h before publish" },
  { id: "article",       label: "Long-form Article",   turnaround: "72h before publish" },
  { id: "carousel",      label: "Carousel / Slides",   turnaround: "48h before publish" },
  { id: "video_script",  label: "Video Script",        turnaround: "5 days before shoot" },
  { id: "press_quote",   label: "Press / Media Quote", turnaround: "2h before deadline" },
  { id: "newsletter",    label: "Newsletter",          turnaround: "4 days before send" },
];

const REVIEW_MODES = [
  { id: "full",    label: "Full review",     desc: "Read everything, edit freely",         time: "3–5 min/post" },
  { id: "approve", label: "Approve / reject", desc: "Yes or no. No edits.",                time: "< 30 sec/post" },
  { id: "delegate", label: "EA pre-screens", desc: "EA filters, you see final picks only", time: "2 min/week" },
  { id: "async",   label: "Voice note",      desc: "Record changes, we transcribe & apply",time: "1 min/post" },
];

function FlowNode({ label, sub, color, icon, isActive, onClick, pulse }) {
  return (
    <div onClick={onClick} style={{
      padding: "14px 18px",
      background: isActive ? color + "18" : "#0E1419",
      border: `1.5px solid ${isActive ? color : "#E2E8F0"}`,
      borderRadius: "4px",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      position: "relative",
      minWidth: "130px",
      textAlign: "center",
    }}>
      {pulse && <div style={{
        position: "absolute", inset: -3, borderRadius: "6px",
        border: `2px solid ${color}`,
        animation: "pulse 1.8s infinite",
        opacity: 0.4,
      }} />}
      <div style={{ fontSize: "16px", color, marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "11px", color: isActive ? color : "#475569", fontFamily: "monospace", fontWeight: isActive ? "bold" : "normal" }}>{label}</div>
      {sub && <div style={{ fontSize: "9px", color: "#64748B", fontFamily: "monospace", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function Arrow({ color = "#E2E8F0", vertical }) {
  if (vertical) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <div style={{ width: "1px", height: "20px", background: color, opacity: 0.5 }} />
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 6px", color, opacity: 0.5, fontSize: "14px", fontFamily: "monospace" }}>
      →
    </div>
  );
}

export default function ApprovalWorkflow() {
  const [channel, setChannel]         = useState("whatsapp");
  const [sla, setSla]                 = useState("24h");
  const [reviewMode, setReviewMode]   = useState("approve");
  const [eaEnabled, setEaEnabled]     = useState(false);
  const [eaName, setEaName]           = useState("");
  const [eaEmail, setEaEmail]         = useState("");
  const [escalations, setEscalations] = useState({ noresponse: "hold", revision: "reassign", breaking: "expedite", sensitive: "skip" });
  const [contentTypes, setContentTypes] = useState({ linkedin_post: true, article: true, carousel: true, video_script: false, press_quote: true, newsletter: false });
  const [activeDemo, setActiveDemo]   = useState(0);
  const [simStep, setSimStep]         = useState(0);
  const [saved, setSaved]             = useState(false);
  const [tab, setTab]                 = useState("config"); // config | flow | sim | sla

  const ch = CHANNELS.find(c => c.id === channel);
  const slaCurrent = SLA_OPTIONS.find(s => s.id === sla);
  const rm = REVIEW_MODES.find(r => r.id === reviewMode);

  useEffect(() => {
    if (tab === "sim") {
      const t = setInterval(() => setSimStep(s => s < 6 ? s + 1 : 0), 1200);
      return () => clearInterval(t);
    }
  }, [tab]);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const flowSteps = [
    { label: "Content drafted", icon: "✍", color: "#4EC9B0", sub: "AI + team" },
    ...(eaEnabled ? [{ label: "EA screens", icon: "◈", color: "#C586C0", sub: eaName || "Your EA" }] : []),
    { label: "Sent to you", icon: ch.icon, color: ch.color, sub: `via ${ch.label}`, pulse: true },
    { label: "You review", icon: "◎", color: "#DCDCAA", sub: rm.time },
    { label: "Approved", icon: "✓", color: "#50FA7B", sub: "or revised" },
    { label: "Scheduled", icon: "◉", color: "#4A9EFF", sub: "auto-publishes" },
  ];

  const demoMessages = [
    {
      platform: "WhatsApp",
      preview: "📝 *LinkedIn Post — Ready for review*\n\n\"The question every CxO should ask before their next board meeting...\"\n\n✅ Approve · ✏️ Edit · ❌ Skip",
      action: "Tap ✅ to publish",
      icon: "◉", color: "#25D366"
    },
    {
      platform: "Slack",
      preview: "#brand-approvals\n\n🟡 *Draft ready: Product launch post*\n\nClick to review → [Open in Notion]\n\nReact with ✅ ✏️ or ❌",
      action: "React or click to open",
      icon: "◈", color: "#E01E5A"
    },
    {
      platform: "Email",
      preview: "Subject: [APPROVAL] LinkedIn Post — April 14\n\n\"We just crossed 1,000 customers...\"\n\nApprove | Request Edits | Skip",
      action: "Click link in email",
      icon: "◎", color: "#4A9EFF"
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      color: "#1E293B",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.04)} }
        @keyframes slidein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #E2E8F0", padding: "24px 44px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", background: "#FFFFFF" }}>
        <div>
          <div style={{ fontSize: "8px", letterSpacing: "5px", color: "#4A9EFF", marginBottom: "6px" }}>ELEVOX — SECTION 06 · APPROVAL WORKFLOW</div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "400", color: "#0F172A", letterSpacing: "-0.3px" }}>Content Approval Engine</h1>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748B", fontStyle: "italic" }}>
            Configure exactly how content flows from draft to live — zero friction, full control
          </p>
        </div>
        <button onClick={handleSave} style={{
          padding: "10px 24px",
          background: saved ? "#50FA7B22" : "transparent",
          border: `1px solid ${saved ? "#50FA7B" : "#E2E8F0"}`,
          color: saved ? "#50FA7B" : "#64748B",
          fontSize: "10px", letterSpacing: "2px",
          cursor: "pointer", transition: "all 0.3s"
        }}>{saved ? "✓ SAVED" : "SAVE WORKFLOW"}</button>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", padding: "0 44px", background: "#FFFFFF" }}>
        {[
          { id: "config", label: "Configuration" },
          { id: "flow",   label: "Flow Builder" },
          { id: "sim",    label: "Simulation" },
          { id: "sla",    label: "SLA & Escalation" },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "sim") setSimStep(0); }} style={{
            padding: "14px 24px",
            background: "transparent", border: "none",
            borderBottom: `2px solid ${tab === t.id ? "#4A9EFF" : "transparent"}`,
            color: tab === t.id ? "#4A9EFF" : "#64748B",
            fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: CONFIG ── */}
      {tab === "config" && (
        <div style={{ padding: "36px 44px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>

            {/* Left col */}
            <div>
              {/* Approval Channel */}
              <div style={{ marginBottom: "36px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>APPROVAL CHANNEL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {CHANNELS.map(c => (
                    <button key={c.id} onClick={() => setChannel(c.id)} style={{
                      padding: "14px 18px", textAlign: "left",
                      background: channel === c.id ? c.color + "12" : "#FFFFFF",
                      border: `1px solid ${channel === c.id ? c.color + "55" : "#E2E8F0"}`,
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: "14px"
                    }}>
                      <div style={{ fontSize: "18px", color: c.color, flexShrink: 0 }}>{c.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "13px", color: channel === c.id ? c.color : "#475569" }}>{c.label}</span>
                          {c.badge && <span style={{ fontSize: "8px", padding: "2px 7px", background: c.color + "22", color: c.color, letterSpacing: "1.5px" }}>{c.badge}</span>}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748B" }}>{c.desc}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>{c.sla}</div>
                        {channel === c.id && <div style={{ fontSize: "12px", color: c.color, marginTop: "2px" }}>✓</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review mode */}
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>REVIEW MODE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {REVIEW_MODES.map(r => (
                    <button key={r.id} onClick={() => setReviewMode(r.id)} style={{
                      padding: "16px 14px", textAlign: "left",
                      background: reviewMode === r.id ? "#4A9EFF12" : "#FFFFFF",
                      border: `1px solid ${reviewMode === r.id ? "#4A9EFF44" : "#E2E8F0"}`,
                      cursor: "pointer", transition: "all 0.15s"
                    }}>
                      <div style={{ fontSize: "12px", color: reviewMode === r.id ? "#4A9EFF" : "#475569", marginBottom: "5px" }}>{r.label}</div>
                      <div style={{ fontSize: "10px", color: "#64748B", lineHeight: "1.5", marginBottom: "8px" }}>{r.desc}</div>
                      <div style={{ fontSize: "9px", color: reviewMode === r.id ? "#4A9EFF66" : "#E2E8F0", padding: "3px 8px", border: `1px solid ${reviewMode === r.id ? "#4A9EFF33" : "#E2E8F0"}`, display: "inline-block" }}>
                        ⏱ {r.time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right col */}
            <div>
              {/* EA delegation */}
              <div style={{ marginBottom: "28px", padding: "22px", background: "#FFFFFF", border: `1px solid ${eaEnabled ? "#C586C044" : "#E2E8F0"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: eaEnabled ? "18px" : "0" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: eaEnabled ? "#C586C0" : "#475569", marginBottom: "3px" }}>EA / Chief of Staff Filter</div>
                    <div style={{ fontSize: "10px", color: "#64748B" }}>EA reviews all drafts — you only see approved picks</div>
                  </div>
                  <button onClick={() => setEaEnabled(!eaEnabled)} style={{
                    width: "46px", height: "26px", borderRadius: "13px",
                    background: eaEnabled ? "#C586C0" : "#E2E8F0",
                    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0
                  }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
                      position: "absolute", top: "3px",
                      left: eaEnabled ? "23px" : "3px", transition: "left 0.2s"
                    }} />
                  </button>
                </div>
                {eaEnabled && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", animation: "slidein 0.2s ease" }}>
                    <div>
                      <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#64748B", marginBottom: "6px" }}>EA NAME</div>
                      <input value={eaName} onChange={e => setEaName(e.target.value)}
                        placeholder="e.g. Sarah Chen"
                        style={{ width: "100%", padding: "10px 12px", background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", fontSize: "12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#64748B", marginBottom: "6px" }}>EA EMAIL / SLACK</div>
                      <input value={eaEmail} onChange={e => setEaEmail(e.target.value)}
                        placeholder="ea@company.com or @slack-handle"
                        style={{ width: "100%", padding: "10px 12px", background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", fontSize: "12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ padding: "10px 12px", background: "#C586C011", border: "1px solid #C586C022", fontSize: "10px", color: "#7A6E9A" }}>
                      → EA receives all drafts first. Only posts they mark ✅ reach your inbox. Revisions go back to the content team automatically.
                    </div>
                  </div>
                )}
              </div>

              {/* Content type toggles */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>CONTENT TYPES REQUIRING YOUR APPROVAL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {CONTENT_TYPES.map(ct => {
                    const on = contentTypes[ct.id];
                    return (
                      <div key={ct.id} onClick={() => setContentTypes({...contentTypes, [ct.id]: !on})}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: on ? "#0D1822" : "#070B10", border: `1px solid ${on ? "#1C2D42" : "#0A0F16"}`, cursor: "pointer", transition: "all 0.15s" }}>
                        <div>
                          <span style={{ fontSize: "12px", color: on ? "#475569" : "#64748B" }}>{ct.label}</span>
                          <span style={{ fontSize: "9px", color: "#94A3B8", marginLeft: "12px" }}>{ct.turnaround}</span>
                        </div>
                        <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: on ? "#4A9EFF" : "#E2E8F0", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                          <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: on ? "19px" : "3px", transition: "left 0.2s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live preview */}
              <div style={{ padding: "18px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>LIVE CONFIG PREVIEW</div>
                {[
                  ["Channel", ch.label, ch.color],
                  ["SLA", SLA_OPTIONS.find(s => s.id === sla)?.label, "#DCDCAA"],
                  ["Review mode", rm.label, "#4A9EFF"],
                  ["EA filter", eaEnabled ? (eaName || "Enabled") : "Off", eaEnabled ? "#C586C0" : "#64748B"],
                  ["Types active", Object.values(contentTypes).filter(Boolean).length + " / " + CONTENT_TYPES.length, "#50FA7B"],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>{k}</span>
                    <span style={{ fontSize: "10px", color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FLOW BUILDER ── */}
      {tab === "flow" && (
        <div style={{ padding: "36px 44px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>

            {/* Visual flow */}
            <div>
              <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "24px" }}>YOUR APPROVAL FLOW</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0" }}>
                {flowSteps.map((step, i) => (
                  <div key={i} style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <FlowNode
                        label={step.label}
                        sub={step.sub}
                        color={step.color}
                        icon={step.icon}
                        isActive={true}
                        pulse={step.pulse}
                      />
                      {/* Branch for escalation */}
                      {step.pulse && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "9px", color: "#64748B", marginBottom: "6px" }}>
                            If no response after {SLA_OPTIONS.find(s=>s.id===sla)?.label}:
                          </div>
                          <div style={{
                            padding: "8px 12px",
                            background: ESCALATION_ACTIONS[escalations.noresponse]?.color + "15",
                            border: `1px solid ${ESCALATION_ACTIONS[escalations.noresponse]?.color}44`,
                            fontSize: "10px",
                            color: ESCALATION_ACTIONS[escalations.noresponse]?.color,
                            display: "inline-block"
                          }}>
                            → {ESCALATION_ACTIONS[escalations.noresponse]?.label}
                          </div>
                        </div>
                      )}
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div style={{ paddingLeft: "65px", paddingTop: "4px", paddingBottom: "4px" }}>
                        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Parallel branch: revision */}
              <div style={{ marginTop: "28px", padding: "18px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#64748B", marginBottom: "12px" }}>REVISION BRANCH</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ padding: "8px 12px", background: "#DCDCAA18", border: "1px solid #DCDCAA33", fontSize: "10px", color: "#DCDCAA" }}>You request edit</div>
                  <Arrow color="#94A3B8" />
                  <div style={{ padding: "8px 12px", background: "#E2E8F0", border: "1px solid #E2E8F0", fontSize: "10px", color: "#475569" }}>Returns to team</div>
                  <Arrow color="#94A3B8" />
                  <div style={{ padding: "8px 12px", background: "#4A9EFF18", border: "1px solid #4A9EFF33", fontSize: "10px", color: "#4A9EFF" }}>Re-delivered in {sla === "2h" ? "2h" : "24h"}</div>
                </div>
              </div>
            </div>

            {/* Channel demo */}
            <div>
              <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>HOW IT ARRIVES — CHANNEL PREVIEWS</div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {demoMessages.map((d, i) => (
                  <button key={i} onClick={() => setActiveDemo(i)} style={{
                    padding: "6px 14px",
                    background: activeDemo === i ? d.color + "22" : "transparent",
                    border: `1px solid ${activeDemo === i ? d.color + "55" : "#E2E8F0"}`,
                    color: activeDemo === i ? d.color : "#64748B",
                    fontSize: "10px", cursor: "pointer"
                  }}>{d.icon} {d.platform}</button>
                ))}
              </div>

              {/* Phone mockup */}
              <div style={{ position: "relative", maxWidth: "300px" }}>
                <div style={{
                  background: "#101820",
                  border: "2px solid #E2E8F0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                }}>
                  {/* Status bar */}
                  <div style={{ background: "#FFFFFF", padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#555" }}>9:41</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[1,2,3].map(i => <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#333" }} />)}
                    </div>
                  </div>
                  {/* App header */}
                  <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "10px", background: demoMessages[activeDemo].color + "10" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: demoMessages[activeDemo].color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: demoMessages[activeDemo].color }}>
                      {demoMessages[activeDemo].icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#1E293B" }}>{demoMessages[activeDemo].platform}</div>
                      <div style={{ fontSize: "9px", color: "#64748B" }}>ExecBrand Team · now</div>
                    </div>
                  </div>
                  {/* Message bubble */}
                  <div style={{ padding: "16px" }}>
                    <div style={{
                      padding: "14px 16px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "2px 8px 8px 8px",
                      fontSize: "11px",
                      color: "#475569",
                      lineHeight: "1.7",
                      whiteSpace: "pre-line",
                      fontFamily: "monospace"
                    }}>
                      {demoMessages[activeDemo].preview}
                    </div>
                    {/* Action hint */}
                    <div style={{ marginTop: "10px", fontSize: "9px", color: "#64748B", fontStyle: "italic", textAlign: "center" }}>
                      {demoMessages[activeDemo].action}
                    </div>
                  </div>
                  {/* Reply bar */}
                  <div style={{ padding: "10px 14px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0", display: "flex", gap: "8px" }}>
                    {["✅ Approve", "✏️ Edit", "❌ Skip"].map(a => (
                      <div key={a} style={{ flex: 1, padding: "8px 4px", background: "#141C28", border: "1px solid #E2E8F0", fontSize: "9px", color: "#64748B", textAlign: "center", borderRadius: "4px" }}>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", padding: "14px 16px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#64748B", marginBottom: "8px" }}>WHAT EACH ACTION TRIGGERS</div>
                {[
                  ["✅ Approve",  "Auto-schedules to next optimal posting slot", "#50FA7B"],
                  ["✏️ Edit",    "Opens draft for inline editing, re-queues", "#DCDCAA"],
                  ["❌ Skip",    "Removes post, logs skip reason, not published", "#FF6B6B"],
                ].map(([a, b, c]) => (
                  <div key={a} style={{ display: "flex", gap: "12px", padding: "6px 0", borderBottom: "1px solid #E2E8F0", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "10px", color: c, fontFamily: "monospace", whiteSpace: "nowrap", minWidth: "80px" }}>{a}</span>
                    <span style={{ fontSize: "10px", color: "#64748B", lineHeight: "1.5" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SIMULATION ── */}
      {tab === "sim" && (
        <div style={{ padding: "36px 44px" }}>
          <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "8px" }}>LIVE APPROVAL SIMULATION</div>
          <p style={{ fontSize: "11px", color: "#64748B", margin: "0 0 32px", fontStyle: "italic" }}>
            Watch a post travel through your configured workflow in real time →
          </p>

          <div style={{ position: "relative", overflowX: "auto" }}>
            {/* Track */}
            <div style={{ display: "flex", alignItems: "center", gap: "0", minWidth: "700px", marginBottom: "40px" }}>
              {[
                { label: "DRAFT READY",      color: "#4EC9B0", icon: "✍", step: 0 },
                { label: "QUALITY CHECK",    color: "#DCDCAA", icon: "◎", step: 1 },
                ...(eaEnabled ? [{ label: "EA SCREEN", color: "#C586C0", icon: "◈", step: 2 }] : []),
                { label: `TO ${ch.label.toUpperCase()}`, color: ch.color, icon: ch.icon, step: eaEnabled ? 3 : 2 },
                { label: "YOUR REVIEW",      color: "#4A9EFF", icon: "◉", step: eaEnabled ? 4 : 3 },
                { label: "APPROVED",         color: "#50FA7B", icon: "✓", step: eaEnabled ? 5 : 4 },
                { label: "SCHEDULED",        color: "#F8F8F2", icon: "◆", step: eaEnabled ? 6 : 5 },
              ].map((node, i, arr) => {
                const isPast = simStep > node.step;
                const isCurrent = simStep === node.step;
                const isFuture = simStep < node.step;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? "1 1 auto" : "0 0 auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <div style={{
                        width: "52px", height: "52px",
                        borderRadius: "50%",
                        background: isPast ? node.color + "22" : isCurrent ? node.color + "33" : "#FFFFFF",
                        border: `2px solid ${isPast ? node.color + "66" : isCurrent ? node.color : "#E2E8F0"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px", color: isFuture ? "#E2E8F0" : node.color,
                        transition: "all 0.4s",
                        boxShadow: isCurrent ? `0 0 20px ${node.color}44` : "none",
                        animation: isCurrent ? "pulse 1.2s infinite" : "none",
                        position: "relative"
                      }}>
                        {isPast ? "✓" : node.icon}
                      </div>
                      <div style={{ fontSize: "8px", color: isFuture ? "#E2E8F0" : isCurrent ? node.color : "#64748B", letterSpacing: "1px", textAlign: "center", maxWidth: "80px" }}>
                        {node.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ flex: 1, height: "2px", margin: "0 4px", marginBottom: "24px", position: "relative", overflow: "hidden", background: "#E2E8F0" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          background: isPast ? "#4A9EFF" : "#E2E8F0",
                          width: isPast ? "100%" : isCurrent ? "50%" : "0%",
                          transition: "width 0.8s ease"
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status card */}
          <div style={{ maxWidth: "560px", padding: "24px", background: "#FFFFFF", border: "1px solid #E2E8F0", marginBottom: "28px" }}>
            <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#64748B", marginBottom: "14px" }}>CURRENT STATUS</div>
            {(() => {
              const msgs = [
                { title: "Content drafted by AI team", desc: "Voice model applied. 3 angle variants generated. Best performer selected based on your topic history.", color: "#4EC9B0", time: "T+0:00" },
                { title: "Quality & brand check passed", desc: "Voice fidelity score: 94/100. No sensitive topics detected. Formatting verified for LinkedIn algorithm.", color: "#DCDCAA", time: `T+${sla === "2h" ? "01:30" : "04:00"}` },
                { title: "EA pre-screening", desc: `${eaName || "Your EA"} reviewing against your topic preferences and recent posts. Checking for duplication.`, color: "#C586C0", time: `T+02:00` },
                { title: `Delivered via ${ch.label}`, desc: `Approval request sent to your ${ch.label}. Awaiting your response within ${slaCurrent?.label}.`, color: ch.color, time: `T+02:10` },
                { title: "Awaiting your review", desc: "You have the post in your hands. One tap to approve, edit, or skip. No login required.", color: "#4A9EFF", time: "T+02:12", blink: true },
                { title: "Approved ✓", desc: "Post confirmed. Auto-scheduling to next optimal window based on your follower activity patterns.", color: "#50FA7B", time: "T+02:15" },
                { title: "Scheduled for publication", desc: "Goes live Tuesday 8:47am — your peak engagement window. You're done.", color: "#F8F8F2", time: "T+02:16" },
              ];
              const idx = eaEnabled ? simStep : (simStep >= 2 ? simStep + 1 : simStep);
              const msg = msgs[Math.min(idx, msgs.length - 1)];
              return (
                <div style={{ animation: "slidein 0.3s ease" }} key={simStep}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: msg.color }}>{msg.title}</span>
                    <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>{msg.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#5A6A7A", lineHeight: "1.7" }}>{msg.desc}</p>
                  {msg.blink && (
                    <div style={{ marginTop: "12px", fontSize: "10px", color: msg.color, fontFamily: "monospace", animation: "blink 1.2s infinite" }}>
                      ● WAITING FOR YOUR RESPONSE
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Manual controls */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => setSimStep(0)} style={{ padding: "9px 20px", background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", fontSize: "10px", letterSpacing: "2px", cursor: "pointer" }}>
              ↺ RESTART
            </button>
            <button onClick={() => setSimStep(s => Math.max(0, s - 1))} style={{ padding: "9px 20px", background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", fontSize: "10px", cursor: "pointer" }}>
              ← BACK
            </button>
            <button onClick={() => setSimStep(s => Math.min(6, s + 1))} style={{ padding: "9px 24px", background: "#4A9EFF22", border: "1px solid #4A9EFF55", color: "#4A9EFF", fontSize: "10px", letterSpacing: "2px", cursor: "pointer" }}>
              NEXT STEP →
            </button>
            <span style={{ fontSize: "10px", color: "#E2E8F0", marginLeft: "8px" }}>
              Step {simStep + 1} of {eaEnabled ? 7 : 6} — {simStep === (eaEnabled ? 6 : 5) ? "Complete ✓" : "In progress..."}
            </span>
          </div>
        </div>
      )}

      {/* ── TAB: SLA & ESCALATION ── */}
      {tab === "sla" && (
        <div style={{ padding: "36px 44px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
            <div>
              {/* SLA selector */}
              <div style={{ marginBottom: "36px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>APPROVAL WINDOW (SLA)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {SLA_OPTIONS.map(s => (
                    <button key={s.id} onClick={() => setSla(s.id)} style={{
                      padding: "14px 18px", textAlign: "left",
                      background: sla === s.id ? "#DCDCAA0E" : "#FFFFFF",
                      border: `1px solid ${sla === s.id ? "#DCDCAA44" : "#E2E8F0"}`,
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div>
                        <span style={{ fontSize: "15px", color: sla === s.id ? "#DCDCAA" : "#475569", marginRight: "12px" }}>{s.label}</span>
                        <span style={{ fontSize: "10px", color: "#64748B" }}>{s.sublabel}</span>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {["low","medium","high"].map(r => (
                          <div key={r} style={{ width: "8px", height: "8px", borderRadius: "50%", background: (s.risk === "low" && r === "low") || (s.risk === "medium" && (r === "low" || r === "medium")) || s.risk === "high" ? (r === "high" ? "#FF6B6B" : r === "medium" ? "#FFB347" : "#50FA7B") : "#E2E8F0" }} />
                        ))}
                        <span style={{ fontSize: "9px", color: "#64748B", marginLeft: "4px" }}>
                          {s.risk === "low" ? "low miss risk" : s.risk === "medium" ? "medium risk" : "high miss risk"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Escalation matrix */}
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>ESCALATION RULES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {ESCALATION_RULES.map(rule => {
                    const current = escalations[rule.id];
                    return (
                      <div key={rule.id} style={{ padding: "14px 16px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "11px", color: "#475569", marginBottom: "10px" }}>{rule.label}</div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {Object.entries(ESCALATION_ACTIONS).map(([key, action]) => (
                            <button key={key}
                              onClick={() => setEscalations({ ...escalations, [rule.id]: key })}
                              style={{
                                padding: "6px 12px",
                                background: current === key ? action.color + "20" : "transparent",
                                border: `1px solid ${current === key ? action.color + "55" : "#E2E8F0"}`,
                                color: current === key ? action.color : "#64748B",
                                fontSize: "9px", letterSpacing: "0.5px",
                                cursor: "pointer", transition: "all 0.12s"
                              }}>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: SLA health + escalation summary */}
            <div>
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "16px" }}>SLA HEALTH MONITOR</div>
                <div style={{ padding: "24px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  {/* Gauge */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    {SLA_OPTIONS.map((s, i) => {
                      const isActive = sla === s.id;
                      const heights = [80, 65, 50, 34, 18];
                      const colors = ["#50FA7B", "#A8FF78", "#DCDCAA", "#FFB347", "#FF6B6B"];
                      return (
                        <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            width: "100%",
                            height: `${heights[i]}px`,
                            background: isActive ? colors[i] : colors[i] + "22",
                            border: `1px solid ${isActive ? colors[i] : colors[i] + "44"}`,
                            transition: "all 0.3s"
                          }} />
                          <div style={{ fontSize: "8px", color: isActive ? colors[i] : "#94A3B8", textAlign: "center", lineHeight: "1.2" }}>
                            {s.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", textAlign: "center" }}>
                    {sla === "2h" && "Optimal — content stays timely & trend-responsive"}
                    {sla === "12h" && "Good — same-day posting maintained"}
                    {sla === "24h" && "Acceptable — some time-sensitive posts may miss window"}
                    {sla === "48h" && "Caution — trending hooks will be stale by publish"}
                    {sla === "weekly" && "Risk — batch review causes scheduling backlogs"}
                  </div>
                </div>
              </div>

              {/* Escalation summary */}
              <div style={{ padding: "22px", background: "#FFFFFF", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "16px" }}>ESCALATION SUMMARY</div>
                {ESCALATION_RULES.map(rule => {
                  const action = ESCALATION_ACTIONS[escalations[rule.id]];
                  return (
                    <div key={rule.id} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #E2E8F0", alignItems: "center" }}>
                      <div style={{ flex: 1, fontSize: "10px", color: "#5A6A7A" }}>{rule.label}</div>
                      <div style={{ padding: "3px 10px", background: action.color + "18", border: `1px solid ${action.color}33`, fontSize: "9px", color: action.color, whiteSpace: "nowrap" }}>
                        {action.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final config summary */}
              <div style={{ padding: "20px", background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#64748B", marginBottom: "14px" }}>WORKFLOW COMPLETE — SUMMARY</div>
                {[
                  ["Channel",       ch.label,                                          ch.color],
                  ["SLA",           slaCurrent?.label || "—",                          "#DCDCAA"],
                  ["Review mode",   rm.label,                                          "#4A9EFF"],
                  ["EA enabled",    eaEnabled ? (eaName || "Yes") : "No",              eaEnabled ? "#C586C0" : "#64748B"],
                  ["Types active",  Object.values(contentTypes).filter(Boolean).length + " of " + CONTENT_TYPES.length, "#50FA7B"],
                  ["No-response",   ESCALATION_ACTIONS[escalations.noresponse]?.label, ESCALATION_ACTIONS[escalations.noresponse]?.color],
                  ["On revision",   ESCALATION_ACTIONS[escalations.revision]?.label,   ESCALATION_ACTIONS[escalations.revision]?.color],
                  ["Breaking news", ESCALATION_ACTIONS[escalations.breaking]?.label,   ESCALATION_ACTIONS[escalations.breaking]?.color],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0A0F16" }}>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>{k}</span>
                    <span style={{ fontSize: "10px", color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #E2E8F0", padding: "14px 44px", background: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            ["Channel", ch.label, ch.color],
            ["SLA", slaCurrent?.label, "#DCDCAA"],
            ["Mode", rm.label, "#4A9EFF"],
            ["Your time/post", rm.time, "#50FA7B"],
          ].map(([k, v, c]) => (
            <div key={k}>
              <div style={{ fontSize: "8px", color: "#64748B", letterSpacing: "2px" }}>{k}</div>
              <div style={{ fontSize: "12px", color: c, marginTop: "2px" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "10px", color: "#E2E8F0", fontStyle: "italic" }}>
          Configure → Flow → Simulate → finalize SLA
        </div>
      </div>
    </div>
  );
}
