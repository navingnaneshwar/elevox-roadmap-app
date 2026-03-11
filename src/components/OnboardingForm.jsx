import { useState, useEffect, useRef, useCallback } from "react";
import Logo from "./Logo";

/* ─── Data ──────────────────────────────────────────────────── */
const STEPS = [
  {
    id: "identity",
    number: "01",
    title: "Identity & Profile",
    subtitle: "Who you are in the world",
    icon: "⬡",
    fields: [
      { id: "fullName",     label: "Full Name",                    type: "text",   placeholder: "e.g. Alexandra Chen",                               required: true  },
      { id: "currentTitle", label: "Current Title",                type: "text",   placeholder: "e.g. Chief Technology Officer",                     required: true  },
      { id: "company",      label: "Company",                      type: "text",   placeholder: "e.g. Meridian Technologies",                        required: true  },
      { id: "companySize",  label: "Company Size",                 type: "select", options: ["<50 employees","50–200","200–1,000","1,000–10,000","10,000+","PE-backed","Public company"], required: true },
      { id: "industry",     label: "Industry",                     type: "text",   placeholder: "e.g. Enterprise SaaS, FinTech, Healthcare Tech",    required: true  },
      { id: "linkedinUrl",  label: "LinkedIn Profile URL",         type: "text",   placeholder: "https://linkedin.com/in/yourname",                  required: true  },
      { id: "location",     label: "Location",                     type: "text",   placeholder: "e.g. New York, NY / London, UK",                    required: false },
      { id: "email",        label: "Primary Email",                type: "email",  placeholder: "you@company.com",                                   required: true  },
      { id: "phone",        label: "WhatsApp / Mobile",            type: "text",   placeholder: "+1 (555) 000-0000",                                 required: false },
      { id: "eaName",       label: "EA / Chief of Staff Name",     type: "text",   placeholder: "If applicable — who manages your calendar?",        required: false },
      { id: "eaEmail",      label: "EA / Chief of Staff Email",    type: "email",  placeholder: "ea@company.com",                                    required: false },
    ],
  },
  {
    id: "narrative", number: "02", title: "Career Narrative", subtitle: "The story only you can tell", icon: "◎",
    fields: [
      { id: "careerSummary",    label: "Career Arc in 3–5 sentences",                       type: "textarea", placeholder: "Walk us through your journey — where you started, the pivotal moves, where you are now.", required: true, tall: true },
      { id: "biggestWin",       label: "The career achievement you're most proud of",        type: "textarea", placeholder: "Not the most impressive on paper — the one that genuinely matters to you.", required: true },
      { id: "pivotMoment",      label: "A defining professional pivot or failure",           type: "textarea", placeholder: "The moment that changed your thinking. Vulnerability builds trust.", required: false },
      { id: "unusualBackground",label: "What's unusual or unexpected about your path?",     type: "textarea", placeholder: "Non-linear career, unconventional education, industry crossover…", required: false },
      { id: "currentFocus",     label: "What are you most focused on building or solving?", type: "textarea", placeholder: "The challenge, transformation, or mission that consumes your thinking right now.", required: true },
    ],
  },
  {
    id: "goals", number: "03", title: "Brand Goals", subtitle: "What success looks like in 90 days and beyond", icon: "◉",
    fields: [
      { id: "primaryGoal",    label: "Primary goal for building your personal brand",           type: "multiselect", options: ["Attract board seat opportunities","Raise capital / attract investors","Attract & retain top talent","Win enterprise clients / partnerships","Establish thought leadership","Secure speaking invitations (paid)","Build pipeline for consulting/advisory","Support company's PR","Post-exit relevance","Become known beyond my current role"], required: true },
      { id: "dreamOutcome",   label: "The single outcome that would make this worth it",        type: "textarea",    placeholder: "Be specific. 'A board seat at a Series C fintech' beats 'more visibility'.", required: true },
      { id: "targetAudience", label: "Who must notice you?",                                   type: "textarea",    placeholder: "e.g. PE partners at mid-market funds, CTOs at Fortune 500 retailers…", required: true },
      { id: "keyPeople",      label: "5 specific people or organisations you want to reach",   type: "textarea",    placeholder: "Names, companies, or roles. Be bold — these become targeting signals.", required: false },
      { id: "geographicScope",label: "Geographic ambition",                                    type: "select",      options: ["Local / national only","Regional (e.g. APAC, EMEA)","Global from day one","US-focused","India-focused","India + Global"], required: true },
      { id: "timeline",       label: "When do you need results by?",                           type: "select",      options: ["30 days — there's an event / announcement coming","60–90 days — building momentum","6 months — playing the long game","12+ months — legacy building"], required: true },
    ],
  },
  {
    id: "voice", number: "04", title: "Voice & Tone", subtitle: "How you speak when you're at your best", icon: "⬡",
    fields: [
      { id: "threeWords",         label: "Three words that describe how you communicate",          type: "text",        placeholder: "e.g. Direct, Empathetic, Provocative", required: true },
      { id: "communicationStyle", label: "Your natural communication style",                       type: "multiselect", options: ["Data-driven and analytical","Storytelling and narrative","Contrarian and provocative","Empathetic and people-first","Visionary and big-picture","Tactical and practical","Academic and rigorous","Conversational and approachable","Authoritative and definitive","Humble and collaborative"], required: true },
      { id: "neverSoundLike",     label: "What you NEVER want to sound like",                      type: "textarea",    placeholder: "e.g. Corporate buzzword-heavy, overly promotional, preachy. Hard constraints only.", required: true },
      { id: "humorLevel",         label: "Your relationship with humour",                          type: "select",      options: ["Zero — strictly professional","Dry wit occasionally","Warm and human — I laugh at myself","Sharp and sardonic","Openly funny — it's part of my brand"], required: true },
      { id: "opinionStrength",    label: "How strong are your public opinions?",                   type: "select",      options: ["I prefer to present multiple sides","I have views but state them carefully","I take clear positions and defend them","I'm known for controversial takes","I enjoy provoking constructive debate"], required: true },
      { id: "existingContent",    label: "Links to your 5 best existing posts or articles",        type: "textarea",    placeholder: "Paste URLs or describe them. These teach us your actual voice best.", required: false, tall: true },
      { id: "contentYouAdmire",   label: "3 public figures whose content you admire — and why",   type: "textarea",    placeholder: "Not who you want to copy — who you aspire to feel like.", required: false },
    ],
  },
  {
    id: "expertise", number: "05", title: "Topics & Expertise", subtitle: "The territory you own — and want to own", icon: "◎",
    fields: [
      { id: "topicsOwned",    label: "Topics you already have deep expertise in",                     type: "textarea", placeholder: "List 5–10. Be specific: 'AI governance in regulated industries' beats 'AI'.", required: true, tall: true },
      { id: "topicsAspire",  label: "Topics you want to be known for but aren't there yet",          type: "textarea", placeholder: "Your adjacency moves — topics you're building conviction on.", required: false },
      { id: "strongOpinions",label: "Your 3 most strongly held opinions most people get wrong",       type: "textarea", placeholder: "The takes you argue at dinner. These become your signature content.", required: true, tall: true },
      { id: "industryTrends",label: "2–3 industry trends you think are overhyped",                   type: "textarea", placeholder: "Everyone's talking about X but they're missing Y.", required: false },
      { id: "secretWeapon",  label: "The knowledge or experience nobody else in your field has",     type: "textarea", placeholder: "Cross-industry experience, unusual vantage point, built something no one else has.", required: false },
      { id: "contentTaboos", label: "Topics you will NEVER discuss publicly",                         type: "textarea", placeholder: "Political views, competitor criticism, legal matters. Hard stops only.", required: true },
    ],
  },
  {
    id: "calendar", number: "06", title: "Calendar & Logistics", subtitle: "Where your brand intersects with real events", icon: "◉",
    fields: [
      { id: "upcomingEvents",       label: "Upcoming events or announcements in the next 90 days",    type: "textarea", placeholder: "Conference appearances, company announcements, product launches, awards…", required: false, tall: true },
      { id: "weeklyTime",           label: "Time you can give per week",                              type: "select",   options: ["5 minutes — async approvals only","15 minutes — approvals + brief voice notes","30 minutes — one weekly sync call","1 hour — engaged collaboration","More — I want to be deeply involved"], required: true },
      { id: "approvalChannel",      label: "Preferred content approval channel",                      type: "select",   options: ["WhatsApp — fast, familiar","Slack — already using it","Email — keep it professional","Notion — I'll review in the tool","Delegate to EA — I'll review final only"], required: true },
      { id: "approvalTimeframe",    label: "How quickly can you typically approve content?",          type: "select",   options: ["Within 2 hours (same day)","Within 24 hours","Within 48 hours","Weekly batch review","EA reviews first, I do final check"], required: true },
      { id: "postingFrequency",     label: "Target posting frequency on LinkedIn",                   type: "select",   options: ["1–2x per week — quality over quantity","3–4x per week — consistent presence","Daily — maximum visibility","Start slow (2x) and ramp up"], required: true },
      { id: "contentFormats",       label: "Content formats you're comfortable with",                 type: "multiselect", options: ["Text posts (no image)","Text + image","Carousel / document posts","Video (recorded)","Live video","Newsletter / long-form articles","Podcast appearances","Quoted in media / press"], required: true },
      { id: "ghostwritingComfort",  label: "Comfort level with AI-assisted ghostwriting",             type: "select",   options: ["Full trust — I approve, it publishes","High — I'll tweak 10–20%","Medium — I want to rewrite at least 50%","Low — use AI for research, I write final","Collaborative — I dictate, you polish"], required: true },
    ],
  },
  {
    id: "competitive", number: "07", title: "Competitive Landscape", subtitle: "Your peer set and positioning", icon: "⬡",
    fields: [
      { id: "peerCxOs",       label: "5 CxOs whose LinkedIn presence you respect or envy",      type: "textarea",    placeholder: "Names and LinkedIn URLs. We'll analyse their strategy to position you distinctly.", required: false, tall: true },
      { id: "differentiator", label: "What makes you fundamentally different from your peers?", type: "textarea",    placeholder: "Not better — different. Background, lens, philosophy. What makes your perspective irreplaceable.", required: true },
      { id: "reputationNow",  label: "What is your reputation right now?",                      type: "textarea",    placeholder: "Be honest. What do people say when your name comes up? Gap between perception and goal?", required: false },
      { id: "brandGaps",      label: "The biggest gap in your current online presence",         type: "multiselect", options: ["No presence at all — starting from zero","Profile exists but outdated","Posting inconsistently or stopped","No clear point of view or niche","Content is too corporate / not personal","Not reaching the right people","High reach but low engagement","Known locally but not globally"], required: true },
      { id: "associations",   label: "Brands or communities you want to be associated with",   type: "textarea",    placeholder: "e.g. World Economic Forum, YPO, specific accelerators, prestigious publications…", required: false },
    ],
  },
  {
    id: "success", number: "08", title: "Success Metrics", subtitle: "How we'll know it's working", icon: "◉",
    fields: [
      { id: "successIn30",      label: "What does success look like in 30 days?",              type: "textarea", placeholder: "Be specific and measurable. 'A DM from a PE partner I didn't know' or '500 new relevant followers'.", required: true },
      { id: "successIn90",      label: "What does success look like in 90 days?",              type: "textarea", placeholder: "The milestone that justifies this investment continuing.", required: true },
      { id: "dealbreakers",     label: "What would make you stop this engagement?",            type: "textarea", placeholder: "Honest answer only. Help us know what to protect against.", required: true },
      { id: "previousAttempts", label: "Have you tried building your personal brand before?", type: "textarea", placeholder: "Ghostwriter that didn't capture your voice, started and stopped. What failed and why?", required: false },
      { id: "budget",           label: "Monthly investment range you're considering",          type: "select",   options: ["$1,500–3,000/mo (Starter)","$3,000–6,000/mo (Growth)","$6,000–12,000/mo (Authority)","$12,000–25,000/mo (Legacy)","TBD — depends on the proposal"], required: true },
      { id: "additionalContext",label: "Anything else we should know before we start?",        type: "textarea", placeholder: "Context that doesn't fit anywhere above. The more you share, the more we can tailor this.", required: false, tall: true },
    ],
  },
];

/* ─── MultiSelect ───────────────────────────────────────────── */
function MultiSelect({ field, value, onChange }) {
  const selected = value || [];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {field.options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
            style={{
              padding: "7px 13px",
              background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
              border: `1px solid ${active ? "transparent" : "#1E2A3E"}`,
              color: active ? "#fff" : "#64748B",
              fontSize: "12px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: active ? "500" : "400",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.18s",
              letterSpacing: "0.2px",
            }}
            onMouseEnter={e => { if (!active) { e.target.style.borderColor = "#6366f1"; e.target.style.color = "#a5b4fc"; }}}
            onMouseLeave={e => { if (!active) { e.target.style.borderColor = "#1E2A3E"; e.target.style.color = "#64748B"; }}}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Field Input ───────────────────────────────────────────── */
function FieldInput({ field, value, onChange }) {
  const baseInput = {
    width: "100%",
    padding: "13px 16px",
    background: "#0D1220",
    border: "1px solid #1E2A3E",
    borderBottom: `2px solid ${value ? "#6366f1" : "#1E2A3E"}`,
    borderRadius: "8px 8px 4px 4px",
    fontSize: "14px",
    color: "#F1F5F9",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    letterSpacing: "0.1px",
  };

  const onFocus = e => {
    e.target.style.borderColor = "#6366f1";
    e.target.style.borderBottomColor = "#6366f1";
    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
  };
  const onBlur = e => {
    e.target.style.borderColor = "#1E2A3E";
    e.target.style.borderBottomColor = value ? "#6366f1" : "#1E2A3E";
    e.target.style.boxShadow = "none";
  };

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={e => onChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        rows={field.tall ? 6 : 4}
        style={{ ...baseInput, lineHeight: "1.7", resize: "vertical" }}
        onFocus={onFocus} onBlur={onBlur}
      />
    );
  }
  if (field.type === "select") {
    return (
      <div style={{ position: "relative" }}>
        <select
          value={value || ""}
          onChange={e => onChange(field.id, e.target.value)}
          style={{
            ...baseInput,
            appearance: "none",
            cursor: "pointer",
            color: value ? "#F1F5F9" : "#334155",
            paddingRight: "40px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236366f1' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
          }}
          onFocus={onFocus} onBlur={onBlur}
        >
          <option value="" disabled>Select an option…</option>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === "multiselect") {
    return <MultiSelect field={field} value={value} onChange={v => onChange(field.id, v)} />;
  }
  return (
    <input
      type={field.type}
      value={value || ""}
      onChange={e => onChange(field.id, e.target.value)}
      placeholder={field.placeholder}
      style={baseInput}
      onFocus={onFocus} onBlur={onBlur}
    />
  );
}

/* ─── Hero Screen ───────────────────────────────────────────── */
function HeroScreen({ onStart, isResuming }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Enter") onStart(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStart]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--ob-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow blobs */}
      <div style={{ position: "absolute", top: "15%", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: "640px", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 14px",
          background: "rgba(99,102,241,0.10)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "100px",
          marginBottom: "32px",
          animation: "ob-hero-line 0.5s ease both",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
          <Logo size="sm" theme="dark" />
          <span style={{ fontSize: "11px", color: "#a5b4fc", letterSpacing: "2px", fontWeight: "500", fontFamily: "'Inter', sans-serif" }}>CLIENT INTELLIGENCE BRIEF</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: "700",
          fontFamily: "'Outfit', sans-serif",
          lineHeight: "1.15",
          letterSpacing: "-1px",
          margin: "0 0 20px",
          animation: "ob-hero-line 0.5s 0.1s ease both",
          opacity: 0,
          background: "linear-gradient(135deg, #F1F5F9 40%, #a5b4fc)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Let's build your<br />brand intelligence brief.
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: "16px",
          color: "#64748B",
          lineHeight: "1.7",
          margin: "0 auto 48px",
          maxWidth: "480px",
          fontFamily: "'Inter', sans-serif",
          animation: "ob-hero-line 0.5s 0.2s ease both",
          opacity: 0,
        }}>
          8 sections. ~20 minutes. The most important document your brand team will ever work from.
        </p>

        {/* Stats row */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "40px", marginBottom: "48px",
          animation: "ob-hero-line 0.5s 0.3s ease both",
          opacity: 0,
        }}>
          {[["8", "Sections"], ["53", "Data Points"], ["72 hrs", "First Delivery"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", color: "#a5b4fc" }}>{val}</div>
              <div style={{ fontSize: "11px", color: "#334155", letterSpacing: "1.5px", fontFamily: "'Inter', sans-serif", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ animation: "ob-hero-line 0.5s 0.4s ease both", opacity: 0 }}>
          <button
            onClick={onStart}
            style={{
              padding: "16px 40px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.5px",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(99,102,241,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 8px 32px rgba(99,102,241,0.35)"; }}
          >
            {isResuming ? "Resume Brief →" : "Start the Brief →"}
          </button>
          <div style={{ marginTop: "14px", fontSize: "11px", color: "#334155", fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px" }}>
            Press <kbd style={{ background: "#1E2A3E", color: "#a5b4fc", border: "1px solid #2D3D5A", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>Enter</kbd> to start
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Success Screen ────────────────────────────────────────── */
function SuccessScreen({ formData }) {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "brand-brief.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ob-bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "20%", left: "20%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: "520px", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Check icon */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
          border: "1px solid rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
          animation: "ob-field-in 0.5s ease both",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#10b981", marginBottom: "12px", fontFamily: "'Inter', sans-serif", fontWeight: "600", animation: "ob-field-in 0.5s 0.1s ease both", opacity: 0 }}>BRIEF RECEIVED</div>
        <h2 style={{ fontSize: "30px", color: "#F1F5F9", fontWeight: "700", fontFamily: "'Outfit', sans-serif", margin: "0 0 14px", letterSpacing: "-0.5px", animation: "ob-field-in 0.5s 0.15s ease both", opacity: 0 }}>
          Your brand intelligence<br />brief is in our hands.
        </h2>
        <p style={{ fontSize: "14px", color: "#64748B", lineHeight: "1.8", margin: "0 0 40px", fontFamily: "'Inter', sans-serif", animation: "ob-field-in 0.5s 0.2s ease both", opacity: 0 }}>
          We'll analyse your responses, build your voice profile, and deliver your first content calendar within 72 hours.
        </p>

        {/* Timeline */}
        <div style={{
          background: "#0D1220", border: "1px solid #1E2A3E", borderRadius: "12px",
          padding: "24px 28px", marginBottom: "28px", textAlign: "left",
          animation: "ob-field-in 0.5s 0.25s ease both", opacity: 0,
        }}>
          <div style={{ fontSize: "10px", color: "#6366f1", letterSpacing: "2.5px", marginBottom: "14px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }}>WHAT HAPPENS NEXT</div>
          {[["24 hrs", "Voice analysis & profile completed"],["48 hrs", "Content brief sent for your review"],["72 hrs", "First 5 posts in your approval queue"]].map(([time, label], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 0", borderTop: i > 0 ? "1px solid #1E2A3E" : "none" }}>
              <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: "600", fontFamily: "'Inter', sans-serif", minWidth: "40px" }}>{time}</div>
              <div style={{ fontSize: "13px", color: "#94A3B8", fontFamily: "'Inter', sans-serif" }}>{label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={downloadJSON}
          style={{
            padding: "12px 28px",
            background: "transparent",
            border: "1px solid #1E2A3E",
            borderRadius: "8px",
            color: "#64748B",
            fontSize: "12px",
            fontWeight: "500",
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            transition: "all 0.15s",
            animation: "ob-field-in 0.5s 0.3s ease both",
            opacity: 0,
          }}
          onMouseEnter={e => { e.target.style.borderColor = "#6366f1"; e.target.style.color = "#a5b4fc"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#1E2A3E"; e.target.style.color = "#64748B"; }}
        >
          ↓ Download Brief as JSON
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function OnboardingForm({ onComplete, onSaveProgress, initialData = {} }) {
  const hasData = Object.keys(initialData).length > 0;

  const [phase, setPhase] = useState("hero"); // "hero" | "form" | "done"
  
  const initialStep = (() => {
    if (!hasData) return 0;
    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      const missing = step.fields.filter(f => f.required).some(f => {
        const v = initialData[f.id];
        if (Array.isArray(v)) return v.length === 0;
        return !v || String(v).trim() === "";
      });
      if (missing) return i;
    }
    return STEPS.length - 1;
  })();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState(initialData);
  const [direction, setDirection] = useState(1); // 1=forward -1=back
  const [animKey, setAnimKey] = useState(0);
  const containerRef = useRef(null);

  const step = STEPS[currentStep];
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const requiredFilled = step.fields
    .filter(f => f.required)
    .every(f => {
      const v = formData[f.id];
      if (Array.isArray(v)) return v.length > 0;
      return v && String(v).trim() !== "";
    });

  const updateField = (id, val) => setFormData(prev => ({ ...prev, [id]: val }));

  const navigate = useCallback((dir) => {
    if (dir === 1 && !requiredFilled) return;
    
    // Auto-save on continuing to next step
    if (dir === 1 && onSaveProgress) {
      onSaveProgress(formData).catch(err => console.error("Auto save failed:", err));
    }

    setDirection(dir);
    setAnimKey(k => k + 1);
    setCurrentStep(prev => prev + dir);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [requiredFilled, onSaveProgress, formData]);

  const handleSubmit = () => {
    if (!requiredFilled) return;
    console.log("📋 Brand Brief Submitted:", formData);
    if (onComplete) {
      onComplete(formData);
    } else {
      setPhase("done");
    }
  };

  // Keyboard: Enter = advance, Backspace on empty = back
  useEffect(() => {
    if (phase !== "form") return;
    const handler = e => {
      if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") {
        e.preventDefault();
        if (currentStep < STEPS.length - 1) navigate(1);
        else handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, currentStep, navigate, requiredFilled]);

  if (phase === "hero") return <HeroScreen onStart={() => setPhase("form")} isResuming={initialStep > 0} />;
  if (phase === "done") return <SuccessScreen formData={formData} />;

  return (
    <div className="ob-wrapper" style={{
      minHeight: "100vh",
      background: "var(--ob-bg)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Top progress bar ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(7,11,20,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E2A3E",
        padding: "0 40px",
      }}>
        {/* Gradient fill bar */}
        <div style={{ height: "2px", background: "#1E2A3E", marginBottom: "0" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            transition: "width 0.4s cubic-bezier(.22,1,.36,1)",
            boxShadow: "0 0 12px rgba(99,102,241,0.6)",
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Logo size="md" theme="dark" />
            <span style={{ width: "1px", height: "14px", background: "#1E2A3E" }} />
            <span style={{ fontSize: "12px", color: "#334155", letterSpacing: "0.5px" }}>Client Brief</span>
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => i < currentStep ? (setDirection(-1), setAnimKey(k => k+1), setCurrentStep(i)) : null}
                style={{
                  width: i === currentStep ? "22px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i < currentStep ? "#6366f1" : i === currentStep ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "#1E2A3E",
                  border: "none",
                  cursor: i < currentStep ? "pointer" : "default",
                  transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
                  padding: 0,
                }}
              />
            ))}
          </div>
          {/* Progress % */}
          <div style={{ fontSize: "11px", color: "#334155", fontWeight: "500" }}>
            <span style={{ color: "#a5b4fc", fontWeight: "600" }}>{progress}%</span> complete
          </div>
        </div>
      </div>

      {/* ── Main scrollable area ── */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", paddingTop: "80px", paddingBottom: "120px", position: "relative", zIndex: 1 }}>
        <div
          key={animKey}
          className="ob-step-enter"
          style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 24px" }}
        >
          {/* ── Step header ── */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
              <div style={{
                fontSize: "48px", fontWeight: "800", fontFamily: "'Outfit', sans-serif",
                color: "transparent",
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
                WebkitBackgroundClip: "text",
                lineHeight: "1",
                minWidth: "60px",
                userSelect: "none",
              }}>
                {step.number}
              </div>
              <div style={{ paddingTop: "4px" }}>
                <div style={{ fontSize: "11px", color: "#6366f1", letterSpacing: "2.5px", fontWeight: "600", marginBottom: "6px" }}>
                  SECTION {step.number} OF {STEPS.length.toString().padStart(2,"0")}
                </div>
                <h2 style={{
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: "700",
                  fontFamily: "'Outfit', sans-serif",
                  color: "#F1F5F9",
                  margin: "0 0 6px",
                  letterSpacing: "-0.5px",
                  lineHeight: "1.2",
                }}>
                  {step.title}
                </h2>
                <p style={{ fontSize: "14px", color: "#64748B", margin: 0, fontStyle: "italic" }}>
                  {step.subtitle}
                </p>
              </div>
            </div>
            {/* Divider */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, #6366f1 80px, #1E2A3E)", marginTop: "28px" }} />
          </div>

          {/* ── Fields ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {step.fields.map((field, idx) => (
              <div
                key={field.id}
                className="ob-field-enter"
                style={{ animationDelay: `${idx * 45}ms` }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  marginBottom: "10px",
                }}>
                  <label style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#94A3B8",
                    lineHeight: "1.4",
                    flex: 1,
                  }}>
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#6366f1", marginLeft: "4px", fontSize: "14px" }}>*</span>
                    )}
                  </label>
                  {!field.required && (
                    <span style={{ fontSize: "10px", color: "#334155", marginLeft: "8px", letterSpacing: "0.5px", flexShrink: 0 }}>OPTIONAL</span>
                  )}
                </div>
                <FieldInput field={field} value={formData[field.id]} onChange={updateField} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Nav ── */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 50,
        background: "rgba(7,11,20,0.90)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid #1E2A3E",
        padding: "16px 40px",
      }}>
        <div style={{
          maxWidth: "680px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          {/* Back & Save Progress */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => navigate(-1)}
              disabled={currentStep === 0}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: `1px solid ${currentStep === 0 ? "#1E2A3E" : "#2D3D5A"}`,
                borderRadius: "8px",
                color: currentStep === 0 ? "#1E2A3E" : "#64748B",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "'Inter', sans-serif",
                cursor: currentStep === 0 ? "default" : "pointer",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={e => { if (currentStep > 0) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#a5b4fc"; }}}
              onMouseLeave={e => { if (currentStep > 0) { e.currentTarget.style.borderColor = "#2D3D5A"; e.currentTarget.style.color = "#64748B"; }}}
            >
              ← Back
            </button>
            
            {onSaveProgress && (
              <button
                onClick={() => {
                  onSaveProgress(formData).then(() => {
                    window.location.href = '/dashboard';
                  });
                }}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "8px",
                  color: "#a5b4fc",
                  fontSize: "12px",
                  fontWeight: "500",
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                Save & Exit
              </button>
            )}
          </div>

          {/* Center: hint or nothing */}
          <div style={{ flex: 1, textAlign: "center" }}>
            {!requiredFilled ? (
              <span style={{ fontSize: "11px", color: "#334155", fontStyle: "italic" }}>
                Fill required fields to continue
              </span>
            ) : (
              <span style={{ fontSize: "10px", color: "#1E2A3E", letterSpacing: "0.5px" }}>
                Press <kbd style={{ background: "#0D1220", color: "#6366f1", border: "1px solid #1E2A3E", borderRadius: "3px", padding: "1px 5px", fontSize: "9px" }}>Enter</kbd> to advance
              </span>
            )}
          </div>

          {/* Next / Submit */}
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => navigate(1)}
              disabled={!requiredFilled}
              style={{
                padding: "12px 28px",
                background: requiredFilled ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#0D1220",
                border: `1px solid ${requiredFilled ? "transparent" : "#1E2A3E"}`,
                borderRadius: "8px",
                color: requiredFilled ? "#fff" : "#334155",
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.5px",
                cursor: requiredFilled ? "pointer" : "default",
                boxShadow: requiredFilled ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (requiredFilled) { e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { if (requiredFilled) { e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "none"; }}}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!requiredFilled}
              style={{
                padding: "12px 32px",
                background: requiredFilled ? "linear-gradient(135deg, #10b981, #059669)" : "#0D1220",
                border: `1px solid ${requiredFilled ? "transparent" : "#1E2A3E"}`,
                borderRadius: "8px",
                color: requiredFilled ? "#fff" : "#334155",
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.8px",
                cursor: requiredFilled ? "pointer" : "default",
                boxShadow: requiredFilled ? "0 4px 20px rgba(16,185,129,0.3)" : "none",
                transition: "all 0.15s",
              }}
            >
              Submit Brief ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
