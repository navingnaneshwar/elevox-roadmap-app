import { useState } from "react";

const WEEKS = [
  {
    id: 1,
    week: "W1–2",
    title: "Foundation & Tooling",
    subtitle: "Build the skeleton before the muscle",
    status: "critical",
    budget: 280,
    effort: "40 hrs",
    color: "#E8C547",
    tasks: [
      {
        name: "Client Onboarding System",
        priority: "P0",
        tool: "Notion + Typeform",
        cost: "$0 (free tiers)",
        hours: 8,
        desc: "Create intake form capturing: bio, past content, goals, tone preferences, 10 LinkedIn posts for voice analysis, upcoming calendar events.",
        output: "Structured client brief template",
        why: "Without this, every client starts chaotically. This is your operating system.",
        diy: true
      },
      {
        name: "Content CMS & Calendar",
        priority: "P0",
        tool: "Notion + Airtable",
        cost: "$20/mo",
        hours: 6,
        desc: "Single database tracking every content piece per client: status, draft, approved, scheduled, published. Linked to content calendar view.",
        output: "Live content pipeline per client",
        why: "At 5+ clients you will lose track without a system. Build it on day 1.",
        diy: true
      },
      {
        name: "LinkedIn Scheduling Tool",
        priority: "P0",
        tool: "Buffer or Taplio",
        cost: "$45/mo (Taplio)",
        hours: 3,
        desc: "Connect client LinkedIn accounts (via granted access). Schedule posts at optimal engagement windows. Track post-level analytics.",
        output: "Automated publishing pipeline",
        why: "Taplio is built specifically for LinkedIn thought leadership. Prefer it over Buffer.",
        diy: true
      },
      {
        name: "Client Communication Hub",
        priority: "P0",
        tool: "Slack (free) + WhatsApp",
        cost: "$0",
        hours: 2,
        desc: "One Slack channel per client for async content approvals. WhatsApp as backup for executives who won't use Slack.",
        output: "< 2hr approval turnaround SLA",
        why: "Executives won't log into portals. Meet them where they already are.",
        diy: true
      },
      {
        name: "Basic Analytics Dashboard",
        priority: "P1",
        tool: "Google Sheets + LinkedIn Analytics",
        cost: "$0",
        hours: 6,
        desc: "Weekly export of LinkedIn metrics per client: impressions, followers, engagement rate, top posts. Compiled into branded report.",
        output: "Weekly 1-page brand performance report",
        why: "You need proof of ROI within 30 days or clients will doubt the investment.",
        diy: true
      },
      {
        name: "Domain + Basic Web Presence",
        priority: "P1",
        tool: "Framer or Webflow",
        cost: "$15/mo + $12 domain",
        hours: 8,
        desc: "1-page landing site: what you do, who you serve, social proof placeholder, contact form. Not your main GTM — just credibility when prospects Google you.",
        output: "Professional web presence",
        why: "Fortune 500 CxOs will Google you before taking a call.",
        diy: true
      },
      {
        name: "Invoice & Contract System",
        priority: "P1",
        tool: "Stripe + HelloSign",
        cost: "$0 + 2.9% per transaction",
        hours: 3,
        desc: "Simple service agreement template (1-page, not 20). Stripe for recurring monthly billing. Set up before your first paid client.",
        output: "Professional billing pipeline",
        why: "Get paid reliably. Chasing invoices kills momentum.",
        diy: true
      }
    ]
  },
  {
    id: 2,
    week: "W3–4",
    title: "AI Content Engine (MVP)",
    subtitle: "Your first unfair advantage",
    status: "high",
    budget: 420,
    effort: "50 hrs",
    color: "#47B8E8",
    tasks: [
      {
        name: "Voice Analysis Prompt System",
        priority: "P0",
        tool: "Claude API / ChatGPT",
        cost: "$20/mo (API usage)",
        hours: 12,
        desc: "Build a master prompt template that ingests 10–15 of the client's past posts and extracts: vocabulary patterns, sentence length preference, opinion vs data balance, humor level, topics owned. Store as 'Voice Profile' in Notion.",
        output: "Reusable voice profile per client",
        why: "This is your Phase 1 substitute for the fine-tuned model. Surprisingly effective.",
        diy: true
      },
      {
        name: "Content Generation Workflow",
        priority: "P0",
        tool: "Claude API + Make.com (Integromat)",
        cost: "$9/mo (Make) + API",
        hours: 14,
        desc: "Automated pipeline: topic input → voice profile + topic → Claude generates 3 post variants → auto-sent to Notion draft board → notifies client via Slack for approval.",
        output: "3 post variants per topic in < 2 min",
        why: "This is where you go from 4 hrs/client/week to 45 min. The leverage is massive.",
        diy: true
      },
      {
        name: "Topic Research Automation",
        priority: "P0",
        tool: "Feedly + Make.com + Claude",
        cost: "$6/mo (Feedly Pro)",
        hours: 8,
        desc: "Set up Feedly RSS feeds per client's industry. Make.com automation extracts top 10 articles daily → Claude summarises + suggests 3 content angles per article → drops into client's Notion topic queue.",
        output: "Daily 10-topic queue per client, auto-populated",
        why: "The hardest part of content is knowing what to say. This solves it permanently.",
        diy: true
      },
      {
        name: "Repurposing Pipeline",
        priority: "P1",
        tool: "Otter.ai + Claude",
        cost: "$17/mo (Otter Pro)",
        hours: 8,
        desc: "Client records a 10-min voice note or sends podcast link → Otter transcribes → Claude extracts 5–8 post ideas with full drafts → delivered to approval queue.",
        output: "8 posts from 1 voice note. 10x content leverage.",
        why: "Busy CxOs can talk. They can't write. Turn their words into content gold.",
        diy: true
      },
      {
        name: "LinkedIn Profile Audit Tool",
        priority: "P1",
        tool: "Claude + custom prompt",
        cost: "$0 (API usage)",
        hours: 8,
        desc: "Build a structured prompt that audits any LinkedIn profile against 15 criteria: headline clarity, about section strength, featured content, posting frequency, engagement rate, keyword density. Generates scored PDF report.",
        output: "15-point LinkedIn Audit Report — your sales weapon",
        why: "Use this on every discovery call. Do a live audit. It's your demo and your close.",
        diy: true
      }
    ]
  },
  {
    id: 3,
    week: "W5–6",
    title: "Client Delivery System",
    subtitle: "Scale from 2 clients to 8 without burning out",
    status: "high",
    budget: 190,
    effort: "35 hrs",
    color: "#7ED98A",
    tasks: [
      {
        name: "Client Onboarding Playbook",
        priority: "P0",
        tool: "Notion + Loom",
        cost: "$0",
        hours: 8,
        desc: "Document step-by-step onboarding: intake form → voice analysis → first content calendar → approval workflow setup → first post live. Record Loom walkthroughs for each step. Clients can self-serve onboarding.",
        output: "Repeatable onboarding in < 5 hrs per client",
        why: "Without this, each new client is a custom project. With it, it's a process.",
        diy: true
      },
      {
        name: "Weekly Client Reporting Template",
        priority: "P0",
        tool: "Google Slides + Sheets",
        cost: "$0",
        hours: 6,
        desc: "Branded 5-slide weekly report: posts published, impressions, followers gained, top performing post, next week preview. Automated data pull from LinkedIn via Sheets.",
        output: "Client report in < 20 min per client per week",
        why: "Reporting is retention. Clients who see numbers stay. Clients who don't churn.",
        diy: true
      },
      {
        name: "Content Approval Workflow",
        priority: "P0",
        tool: "Notion + Slack bot",
        cost: "$0",
        hours: 8,
        desc: "Notion page per client with draft posts. Slack integration that pings client: 'Here are 3 posts for your review — approve, edit or request revision.' One-click approval triggers scheduling in Taplio.",
        output: "Zero email, async approval in < 2 hrs",
        why: "Executives hate email threads. Slack approvals with context feel like a concierge.",
        diy: true
      },
      {
        name: "SOPs for Content Team",
        priority: "P1",
        tool: "Notion",
        cost: "$0",
        hours: 8,
        desc: "Document every process: how to do a voice analysis, how to generate content, how to research topics, how to handle revisions, what to do when client goes quiet. This enables your first hire.",
        output: "Full ops manual. Hire-ready by month 3.",
        why: "Your Phase 2 depends on hiring. SOPs are what you hand the first employee on day 1.",
        diy: true
      },
      {
        name: "Case Study Template",
        priority: "P1",
        tool: "Canva Pro",
        cost: "$13/mo",
        hours: 5,
        desc: "Branded 1-page case study format: client type (anonymised), problem, what you built, results at 30/60/90 days. Fill one per client. Use in sales calls and content.",
        output: "Sales asset that closes warm leads",
        why: "Nothing sells like proof. Your first 3 case studies are your entire marketing strategy.",
        diy: true
      }
    ]
  },
  {
    id: 4,
    week: "W7–9",
    title: "Analytics & ROI Layer",
    subtitle: "Make the value undeniable",
    status: "medium",
    budget: 150,
    effort: "30 hrs",
    color: "#E87C7C",
    tasks: [
      {
        name: "Brand Score Calculator",
        priority: "P0",
        tool: "Google Sheets (custom formula)",
        cost: "$0",
        hours: 10,
        desc: "Build a composite 'ExecBrand Score' (0–100) combining: posting frequency (20%), engagement rate (25%), follower growth (20%), profile completeness (15%), content variety (10%), response rate (10%). Auto-updates weekly from LinkedIn data.",
        output: "Proprietary brand health metric clients obsess over",
        why: "Giving clients a number to improve is addictive. It drives retention like nothing else.",
        diy: true
      },
      {
        name: "Opportunity Tracker",
        priority: "P0",
        tool: "Airtable",
        cost: "$20/mo",
        hours: 6,
        desc: "Simple CRM for each client tracking inbound opportunities generated by their brand: speaking invites, board inquiries, media mentions, LinkedIn DMs from investors/partners. Client logs them. You track attribution.",
        output: "Live ROI dashboard: brand → real business outcomes",
        why: "When a client logs 'got invited to speak at Davos', they renew forever.",
        diy: true
      },
      {
        name: "Competitor Benchmarking Report",
        priority: "P1",
        tool: "LinkedIn + Claude + Google Sheets",
        cost: "$0",
        hours: 8,
        desc: "Monthly: manually pull key metrics from 5 named peer CxOs in client's industry. Build comparison table: follower count, posting frequency, engagement rate, topic ownership. Deliver as 1-page PDF.",
        output: "Monthly peer benchmarking — highly motivating for type-A executives",
        why: "CxOs are competitive. Showing them a peer with 10x more reach lights a fire.",
        diy: true
      },
      {
        name: "Monthly ROI Narrative Report",
        priority: "P1",
        tool: "Notion + Canva",
        cost: "$0",
        hours: 6,
        desc: "Beyond the numbers: a 3-page narrative monthly report that tells the story of the month — best performing content, why it resonated, what it says about the executive's brand trajectory, what to double down on next month.",
        output: "Premium-feel deliverable that justifies $5K+/mo pricing",
        why: "Data without narrative is noise. Narrative + data = perceived value.",
        diy: true
      }
    ]
  },
  {
    id: 5,
    week: "W10–12",
    title: "Growth Infrastructure",
    subtitle: "Build the engine that sells for you",
    status: "medium",
    budget: 120,
    effort: "25 hrs",
    color: "#C07CE8",
    tasks: [
      {
        name: "Referral System",
        priority: "P0",
        tool: "Notion + manual",
        cost: "$0",
        hours: 4,
        desc: "Formalise referral asks: email template, timing (day 30 after first win), incentive structure (1 month free for a closed referral). Track referred prospects in Airtable.",
        output: "Systematic referral pipeline",
        why: "Your first 10 clients come from referrals, not ads. Make it a process not an afterthought.",
        diy: true
      },
      {
        name: "Your Own LinkedIn System",
        priority: "P0",
        tool: "Taplio (same as clients)",
        cost: "$0 (already subscribed)",
        hours: 8,
        desc: "Dogfood your own product. Post 5x/week about CxO branding, tech, what you're learning building this company. Your LinkedIn IS your top-of-funnel. Treat it like a client account.",
        output: "500+ targeted followers per month, inbound prospect DMs",
        why: "Every client you sign from inbound LinkedIn is proof your product works. Use it as a case study.",
        diy: true
      },
      {
        name: "Discovery Call Automation",
        priority: "P1",
        tool: "Calendly + Loom",
        cost: "$12/mo",
        hours: 4,
        desc: "Calendly booking link in your LinkedIn bio and outreach DMs. Pre-call: automated Loom video explaining your process (5 min). Post-call: automated follow-up with proposal template.",
        output: "Frictionless prospect → call → proposal flow",
        why: "Every extra step in booking a call loses 30% of prospects. Remove all friction.",
        diy: true
      },
      {
        name: "Proposal Template",
        priority: "P1",
        tool: "Notion or Pitch.com",
        cost: "$0",
        hours: 6,
        desc: "Reusable proposal: live LinkedIn audit, 90-day transformation plan, pricing tiers, ROI projection, social proof. Personalised in < 30 min per prospect with audit findings.",
        output: "Conversion-optimised sales asset",
        why: "A tailored proposal with a live audit closes 3x better than a generic deck.",
        diy: true
      },
      {
        name: "Hire Readiness Package",
        priority: "P2",
        tool: "Notion",
        cost: "$0",
        hours: 3,
        desc: "Prepare JD for first hire: 'Content Strategist / Ghostwriter — CxO Personal Branding'. Document what they'll own, how they'll be trained, success metrics. Post on LinkedIn when you hit 6 clients.",
        output: "First hire within 90 days of launch",
        why: "At 6 clients you will be at capacity solo. Your first hire enables $10K+ MRR.",
        diy: true
      }
    ]
  }
];

const totalBudget = WEEKS.reduce((s, w) => s + w.budget, 0);

export default function Roadmap() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeTask, setActiveTask] = useState(0);
  const [view, setView] = useState("roadmap");

  const w = WEEKS[activeWeek];
  const task = w?.tasks[activeTask];

  const allTools = WEEKS.flatMap(w => w.tasks.map(t => ({
    name: t.tool,
    cost: t.cost,
    sprint: w.week,
    category: w.title,
    color: w.color
  })));

  const priorityCounts = WEEKS.flatMap(w => w.tasks).reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="roadmap-container relative" style={{
      /* 
       fontFamily: "'Courier New', 'Courier', monospace",
       background: "#F5F0E8",
       color: "#1A1A1A"
      */
     /* Removed inline styles from outer div in favor of global css rules */
    }}>
      {/* Grid background */}
      <div className="roadmap-grid-bg" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.98) 100%)",
          backdropFilter: "blur(10px)",
          color: "#F5F0E8",
          padding: "32px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "5px", color: "#C9A84C", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
              Elevox · ExecBrand™
            </div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "300", letterSpacing: "-0.5px", fontFamily: "var(--font-heading)" }}>
              12-Week Master Implementation Plan
            </h1>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "8px", fontFamily: "var(--font-mono)" }}>
              From Zero → 6 Clients · ${totalBudget.toLocaleString()} Total Budget · 180 Hrs Total Build
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {["roadmap", "tools", "budget"].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                className="view-tab-btn"
                style={{
                  padding: "10px 24px",
                  background: view === v ? "#C9A84C" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${view === v ? "#C9A84C" : "rgba(255,255,255,0.1)"}`,
                  color: view === v ? "#1A1A1A" : "#888",
                  cursor: "pointer",
                  fontSize: "11px",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                  fontWeight: view === v ? "600" : "400",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderRadius: "2px",
                  boxShadow: view === v ? "0 4px 15px rgba(201,168,76,0.3)" : "none"
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "roadmap" && (
          <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
            {/* Sprint selector */}
            <div className="sprint-sidebar" style={{ width: "280px", borderRight: "1px solid var(--border-color)", background: "rgba(237,232,222,0.6)", overflowY: "auto", backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "20px 24px 12px", fontSize: "9px", letterSpacing: "4px", color: "#888", borderBottom: "1px solid var(--border-color)", fontWeight: "600" }}>
                PHASES
              </div>
              {WEEKS.map((w, i) => (
                <div
                  key={w.id}
                  onClick={() => { setActiveWeek(i); setActiveTask(0); }}
                  className="sprint-item"
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-color)",
                    cursor: "pointer",
                    background: activeWeek === i ? "#1A1A1A" : "transparent",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderLeft: activeWeek === i ? `4px solid ${w.color}` : "4px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: activeWeek === i ? w.color : "#888", letterSpacing: "1.5px", marginBottom: "4px", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
                        {w.week}
                      </div>
                      <div style={{ fontSize: "14px", color: activeWeek === i ? "#F5F0E8" : "#1A1A1A", lineHeight: "1.4", fontFamily: "var(--font-heading)", letterSpacing: "-0.2px" }}>
                        {w.title}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <span style={{ fontSize: "11px", color: activeWeek === i ? "rgba(255,255,255,0.6)" : "#888", fontFamily: "var(--font-mono)" }}>${w.budget}</span>
                    <span style={{ fontSize: "11px", color: activeWeek === i ? "rgba(255,255,255,0.6)" : "#888", fontFamily: "var(--font-mono)" }}>{w.effort}</span>
                    <span style={{ fontSize: "11px", color: activeWeek === i ? "rgba(255,255,255,0.6)" : "#888", fontFamily: "var(--font-mono)" }}>{w.tasks.length} tasks</span>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ padding: "24px", background: "rgba(201,168,76,0.05)", borderTop: "2px solid #1A1A1A" }}>
                <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#888", marginBottom: "16px", fontWeight: "600" }}>TOTALS</div>
                {[
                  ["Total Budget", `$${totalBudget}/mo`],
                  ["Build Time", "180 hrs"],
                  ["Sprints", "5 blocks"],
                  ["Tasks", `${WEEKS.reduce((s,w) => s+w.tasks.length,0)} items`]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#888", fontFamily: "var(--font-mono)" }}>{k}</span>
                    <span style={{ fontSize: "11px", color: "#1A1A1A", fontWeight: "600", fontFamily: "var(--font-mono)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main panel */}
            <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
              {/* Sprint header */}
              <div style={{ padding: "32px 48px 24px", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{ width: "16px", height: "16px", background: w.color, borderRadius: "50%", boxShadow: `0 0 15px ${w.color}66` }} />
                  <span style={{ fontSize: "12px", color: "#666", letterSpacing: "2.5px", fontFamily: "var(--font-mono)", fontWeight: "600" }}>{w.week}</span>
                  <span style={{ fontSize: "12px", color: "#CCC" }}>|</span>
                  <span style={{ fontSize: "12px", color: "#666", fontFamily: "var(--font-mono)" }}>{w.effort}</span>
                  <span style={{ fontSize: "12px", color: "#CCC" }}>|</span>
                  <span style={{ fontSize: "12px", color: "#C9A84C", fontFamily: "var(--font-mono)", fontWeight: "600" }}>${w.budget}/mo in new tools</span>
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: "32px", fontWeight: "300", fontFamily: "var(--font-heading)", letterSpacing: "-1px", color: "#1A1A1A" }}>{w.title}</h2>
                <p style={{ margin: 0, fontSize: "16px", color: "#888", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>{w.subtitle}</p>
              </div>

              {/* Task tabs */}
              <div className="task-tabs" style={{ padding: "16px 48px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "12px", flexWrap: "wrap", background: "rgba(240,235,224,0.7)", backdropFilter: "blur(10px)" }}>
                {w.tasks.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setActiveTask(i)}
                    className="task-tab-btn"
                    style={{
                      padding: "8px 18px",
                      background: activeTask === i ? "#1A1A1A" : "white",
                      border: `1px solid ${activeTask === i ? "#1A1A1A" : "var(--border-color)"}`,
                      color: activeTask === i ? "#F5F0E8" : "#444",
                      cursor: "pointer",
                      fontSize: "11px",
                      letterSpacing: "0.5px",
                      fontFamily: "var(--font-mono)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: "4px",
                      boxShadow: activeTask === i ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span style={{ 
                      color: t.priority === "P0" ? "#E87C7C" : t.priority === "P1" ? "#C9A84C" : "#888",
                      fontWeight: "700" 
                    }}>{t.priority}</span>
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Task detail */}
              {task && (
                <div style={{ padding: "40px 48px", position: "relative" }}>
                  <div className="task-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "48px" }}>
                    <div className="task-detail-content">
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
                        <span style={{
                          padding: "4px 12px",
                          background: task.priority === "P0" ? "rgba(232,124,124,0.1)" : "rgba(201,168,76,0.1)",
                          border: `1px solid ${task.priority === "P0" ? "rgba(232,124,124,0.3)" : "rgba(201,168,76,0.3)"}`,
                          color: task.priority === "P0" ? "#E87C7C" : "#C9A84C",
                          fontSize: "11px", letterSpacing: "1.5px",
                          borderRadius: "4px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: "600"
                        }}>{task.priority}</span>
                        <span style={{ fontSize: "12px", color: "#888", fontFamily: "var(--font-mono)" }}>{task.hours} hrs to build</span>
                      </div>

                      <h3 style={{ margin: "0 0 16px", fontSize: "28px", fontWeight: "300", fontFamily: "var(--font-heading)", letterSpacing: "-0.5px", color: "#1A1A1A" }}>{task.name}</h3>
                      <p style={{ fontSize: "16px", lineHeight: "1.7", color: "#444", margin: "0 0 32px", fontWeight: "300" }}>{task.desc}</p>

                      {/* Why this matters */}
                      <div className="rationale-box" style={{
                        padding: "24px 32px",
                        background: "#1A1A1A",
                        borderLeft: `4px solid ${w.color}`,
                        marginBottom: "32px",
                        borderRadius: "0 8px 8px 0",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                      }}>
                        <div style={{ fontSize: "9px", color: w.color, letterSpacing: "4px", marginBottom: "12px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>INVESTOR RATIONALE</div>
                        <p style={{ margin: 0, fontSize: "15px", color: "#E0E0E0", lineHeight: "1.6", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
                          "{task.why}"
                        </p>
                      </div>

                      {/* Output */}
                      <div className="output-box" style={{ 
                        padding: "20px 24px", 
                        background: `rgba(${parseInt(w.color.slice(1, 3), 16)}, ${parseInt(w.color.slice(3, 5), 16)}, ${parseInt(w.color.slice(5, 7), 16)}, 0.05)`, 
                        border: `1px solid rgba(${parseInt(w.color.slice(1, 3), 16)}, ${parseInt(w.color.slice(3, 5), 16)}, ${parseInt(w.color.slice(5, 7), 16)}, 0.2)`,
                        borderRadius: "8px"
                      }}>
                        <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#888", marginBottom: "10px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>DELIVERABLE OUTPUT</div>
                        <div style={{ fontSize: "16px", color: "#1A1A1A", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: w.color }}>→</span> {task.output}
                        </div>
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className="task-detail-sidebar">
                      <div className="tool-card" style={{ 
                        padding: "28px", 
                        background: "white", 
                        border: "1px solid var(--border-color)", 
                        marginBottom: "24px",
                        borderRadius: "8px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
                      }}>
                        <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#888", marginBottom: "16px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>TOOL REQUIREMENT</div>
                        <div style={{ fontSize: "22px", fontWeight: "400", color: "#1A1A1A", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>{task.tool}</div>
                        <div style={{ fontSize: "28px", color: w.color, marginBottom: "24px", fontWeight: "300", fontFamily: "var(--font-mono)" }}>{task.cost}</div>
                        <div style={{ 
                          padding: "12px 16px", 
                          background: "#1A1A1A", 
                          display: "inline-block",
                          borderRadius: "4px"
                        }}>
                          <span style={{ 
                            fontSize: "11px", 
                            color: task.diy ? "#7ED98A" : "#E87C7C", 
                            letterSpacing: "2.5px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: "600"
                          }}>
                            {task.diy ? "✓ BUILD YOURSELF" : "⚠ NEEDS SPECIALIST"}
                          </span>
                        </div>
                      </div>

                      {/* Progress in sprint */}
                      <div className="progress-card" style={{ 
                        padding: "24px", 
                        background: "rgba(255,255,255,0.6)", 
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        backdropFilter: "blur(10px)"
                      }}>
                        <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#888", marginBottom: "16px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>SPRINT TIMELINE</div>
                        {w.tasks.map((t, i) => (
                          <div
                            key={t.name}
                            onClick={() => setActiveTask(i)}
                            className="progress-item"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 12px",
                              marginBottom: "6px",
                              background: activeTask === i ? "white" : "transparent",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: activeTask === i ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                              border: `1px solid ${activeTask === i ? "var(--border-color)" : "transparent"}`
                            }}
                          >
                            <div style={{
                              width: "8px", height: "8px",
                              background: activeTask === i ? w.color : "#D8D0C0",
                              borderRadius: "50%", flexShrink: 0,
                              boxShadow: activeTask === i ? `0 0 10px ${w.color}88` : "none"
                            }} />
                            <span style={{ fontSize: "12px", color: activeTask === i ? "#1A1A1A" : "#666", flex: 1, fontWeight: activeTask === i ? "500" : "400" }}>{t.name}</span>
                            <span style={{ fontSize: "11px", color: activeTask === i ? w.color : "#AAA", fontFamily: "var(--font-mono)", fontWeight: "600" }}>{t.hours}h</span>
                          </div>
                        ))}
                        <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "var(--font-mono)" }}>Total Sprint</span>
                          <span style={{ fontSize: "12px", color: "#1A1A1A", fontWeight: "600", fontFamily: "var(--font-mono)" }}>{w.tasks.reduce((s, t) => s + t.hours, 0)}h / ${w.budget}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "tools" && (
          <div className="view-content animate-fade-in" style={{ padding: "48px 64px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "300", marginBottom: "40px", color: "#1A1A1A", fontFamily: "var(--font-heading)", letterSpacing: "-1px" }}>
              Complete Tool Stack <span style={{ color: "#888", fontWeight: "200" }}>| Phase 1</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {WEEKS.map(w => (
                <div key={w.id} className="tool-category-card" style={{ background: "white", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "#1A1A1A", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "10px", height: "10px", background: w.color, borderRadius: "50%", boxShadow: `0 0 10px ${w.color}88` }} />
                    <span style={{ fontSize: "12px", color: "#F5F0E8", letterSpacing: "2px", fontFamily: "var(--font-mono)", fontWeight: "600" }}>{w.week} — {w.title}</span>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    {w.tasks.map(t => (
                      <div key={t.name} className="tool-item" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "14px", color: "#1A1A1A", fontWeight: "500" }}>{t.tool}</span>
                          <span style={{ fontSize: "13px", color: w.color, fontWeight: "600", fontFamily: "var(--font-mono)", background: `rgba(${parseInt(w.color.slice(1, 3), 16)}, ${parseInt(w.color.slice(3, 5), 16)}, ${parseInt(w.color.slice(5, 7), 16)}, 0.1)`, padding: "4px 8px", borderRadius: "4px" }}>{t.cost.split(" ")[0]}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.4" }}>{t.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "budget" && (
          <div className="view-content animate-fade-in" style={{ padding: "48px 64px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "300", marginBottom: "40px", fontFamily: "var(--font-heading)", letterSpacing: "-1px" }}>Budget Breakdown <span style={{ color: "#888", fontWeight: "200" }}>| Phase 1</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
              <div style={{ padding: "32px", background: "white", borderRadius: "8px", border: "1px solid var(--border-color)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
                {WEEKS.map(w => (
                  <div key={w.id} style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", color: "#1A1A1A", fontWeight: "500" }}>{w.week} <span style={{ color: "#888", fontWeight: "400" }}>— {w.title}</span></span>
                      <span style={{ fontSize: "14px", color: w.color, fontWeight: "600", fontFamily: "var(--font-mono)" }}>${w.budget}/mo</span>
                    </div>
                    <div style={{ background: "var(--border-color)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                      <div className="budget-bar" style={{ background: w.color, height: "100%", width: `${(w.budget / totalBudget) * 100}%`, borderRadius: "4px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid #1A1A1A", paddingTop: "24px", marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>Total Monthly Tooling</span>
                  <span style={{ fontSize: "32px", color: "#C9A84C", fontWeight: "300", fontFamily: "var(--font-mono)", lineHeight: "1" }}>${totalBudget} <span style={{ fontSize: "16px", color: "#888" }}>/mo</span></span>
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "12px", fontFamily: "var(--font-mono)", padding: "12px", background: "rgba(0,0,0,0.02)", borderRadius: "4px" }}>
                  = ${(totalBudget * 3).toLocaleString()} over 3 months · covered by first 2 clients
                </div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #000000 100%)", padding: "40px", color: "#F5F0E8", borderRadius: "8px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "11px", color: "#C9A84C", letterSpacing: "4px", marginBottom: "32px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>INVESTOR SNAPSHOT</div>
                {[
                  ["Monthly tooling cost", `$${totalBudget}/mo`],
                  ["Cost per client served", `~$${Math.round(totalBudget / 6)}/mo`],
                  ["Revenue at 2 clients", "$3,000–6,000/mo"],
                  ["Revenue at 6 clients", "$9,000–18,000/mo"],
                  ["Gross margin at 6 clients", "~75–80%"],
                  ["Break-even clients needed", "1 client"]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "14px", color: "#AAA" }}>{k}</span>
                    <span style={{ fontSize: "14px", color: "#F5F0E8", fontWeight: "500", fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: "40px", padding: "24px", background: "rgba(201,168,76,0.1)", borderLeft: "4px solid #C9A84C", borderRadius: "0 8px 8px 0" }}>
                  <div style={{ fontSize: "11px", color: "#C9A84C", marginBottom: "12px", letterSpacing: "2px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>VERDICT</div>
                  <div style={{ fontSize: "15px", color: "#FFF", lineHeight: "1.7", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: "300" }}>
                    "You need ONE client to cover all your tools. The economics here are absurd in your favour. This is one of the lowest-cost, highest-margin business models I've seen."
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
