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
      // S5-06 additions
      { id: "roleTenure",   label: "How long have you been in your current role?", type: "select", options: ["Less than 6 months","6–12 months","1–2 years","2–5 years","5+ years"], required: false },
      { id: "companyStage", label: "Company Stage",                type: "select", options: ["Pre-seed / Seed","Series A–B","Series C+","PE-backed","Public (listed)","Bootstrapped / Profitable","Division of large enterprise"], required: false },
      { id: "boardRoles",   label: "Current board or advisory positions (if any)", type: "textarea", placeholder: "e.g. Independent Director at XYZ Corp, Advisor at ABC Fund.", required: false },
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
      { id: "careerSummary",        label: "Career Arc in 3–5 sentences",                          type: "textarea", placeholder: "Walk us through your journey — where you started, the pivotal moves, where you are now.", required: true, tall: true },
      { id: "biggestWin",           label: "The career achievement you're most proud of",           type: "textarea", placeholder: "Not the most impressive on paper — the one that genuinely matters to you.", required: true },
      // S5-06 additions — critical for hallucination prevention
      { id: "credibilityInventory", label: "Your 3 most specific measurable achievements (what → change → number)", type: "textarea", placeholder: "e.g. Led migration of 2.4M customer accounts to new platform — zero downtime, 40% infra cost reduction. This is the ONLY place we source verified stats from.", required: false, tall: true },
      { id: "builtFromScratch",     label: "What have you built from zero?",                        type: "textarea", placeholder: "Products, teams, business units, markets. The 'I started with nothing and...' story.", required: false },
      { id: "firstOfAKind",         label: "What are you the first to do in your space?",           type: "textarea", placeholder: "First to introduce, first to scale, first to abandon. What are you genuinely ahead on?", required: false },
      { id: "recognition",          label: "Awards, media, publications, panels (specific)",        type: "textarea", placeholder: "e.g. Forbes 30 Under 30 (2021), speaker at Davos WEF, quoted in FT, 3x CIO of the Year.", required: false },
      { id: "originMoment",         label: "The single career moment that changed how you think",   type: "textarea", placeholder: "The story only you can tell. The CEO who gave you a chance, the failure that reoriented everything.", required: false },
      { id: "pivotMoment",          label: "A defining professional pivot or failure",               type: "textarea", placeholder: "The moment that changed your thinking. Vulnerability builds trust.", required: false },
      { id: "unusualBackground",    label: "What's unusual or unexpected about your path?",         type: "textarea", placeholder: "Non-linear career, unconventional education, industry crossover…", required: false },
      { id: "currentFocus",         label: "What are you most focused on building or solving?",     type: "textarea", placeholder: "The challenge, transformation, or mission that consumes your thinking right now.", required: true },
    ],
  },
  {
    id: "goals", number: "03", title: "Brand Goals", subtitle: "What success looks like in 90 days and beyond", icon: "◉",
    banner: "Chanakya uses your goals to decide which platforms to prioritise, how aggressive your content schedule should be, and which opportunities to position you for first. Be specific — vague goals produce generic strategy.",
    fields: [
      { id: "primaryGoal",       label: "Primary goal for building your personal brand",            type: "multiselect", options: ["Attract board seat opportunities","Raise capital / attract investors","Attract & retain top talent","Win enterprise clients / partnerships","Establish thought leadership","Secure speaking invitations (paid)","Build pipeline for consulting/advisory","Support company's PR","Post-exit relevance","Become known beyond my current role"], required: true,  hint: "Chanakya maps your entire platform strategy around this. Choose the one that would justify the next 90 days of effort." },
      { id: "dreamOutcome",      label: "The single outcome that would make this worth it",         type: "textarea",    placeholder: "Be specific. 'A board seat at a Series C fintech' beats 'more visibility'.", required: true,  hint: "This becomes the north star for every content decision. Shakespeare will write toward this outcome." },
      { id: "targetPersona",     label: "The ONE person you most need to impress (specific role + company type)", type: "textarea", placeholder: "e.g. Managing Partner at a mid-market PE fund targeting B2B SaaS.", required: false, hint: "Replaces vague 'target audience' with a real human. Chanakya builds your platform and community strategy around where this person spends time." },
      { id: "desiredAction",     label: "What do you want them to do after 3 months of your content?", type: "select", options: ["Reach out to me directly","Invite me to speak at an event","Offer a board opportunity","Refer me to their network","Hire me / my firm","Follow and trust my POV publicly"], required: false, hint: "Calibrates how direct and action-oriented your CTAs should be. 'Reach out' requires different content than 'follow my POV'." },
      { id: "audienceOnline",    label: "Where does your target audience find thought leaders?",   type: "textarea",    placeholder: "e.g. LinkedIn newsletters, specific Slack communities, podcasts, industry conferences, certain publications.", required: false, hint: "Direct input into Chanakya's platform selection. We go where your audience already is — not where everyone else is." },
      { id: "warmRelationships", label: "Existing relationships who could introduce you to your target?", type: "textarea", placeholder: "People already in your network who have access to your ideal audience.", required: false, hint: "Network leverage is often faster than content alone. Chanakya factors this into your 30-day quick-win plan." },
      { id: "targetAudience",    label: "Other audiences you're trying to reach",                  type: "textarea",    placeholder: "e.g. PE partners at mid-market funds, CTOs at Fortune 500 retailers…", required: true,  hint: "Secondary audiences Chanakya will consider when building content pillars and distribution strategy." },
      { id: "keyPeople",         label: "5 specific people or organisations you want to reach",    type: "textarea",    placeholder: "Names, companies, or roles. Be bold — these become targeting signals.", required: false, hint: "Shakespeare uses these to calibrate references, angles, and hooks that land with exactly the people you name." },
      { id: "geographicScope",   label: "Geographic ambition",                                     type: "select",      options: ["Local / national only","Regional (e.g. APAC, EMEA)","Global from day one","US-focused","India-focused","India + Global"], required: true,  hint: "Affects timing, platform weighting, and which publications Chanakya targets for amplification." },
      { id: "timeline",          label: "When do you need results by?",                            type: "select",      options: ["30 days — there's an event / announcement coming","60–90 days — building momentum","6 months — playing the long game","12+ months — legacy building"], required: true, hint: "A hard deadline changes the entire sprint structure. Machiavelli front-loads high-impact content when time is short." },
    ],
  },
  {
    id: "voice", number: "04", title: "Voice & Tone", subtitle: "How you speak when you're at your best", icon: "⬡",
    banner: "Shakespeare uses your voice profile as a hard constraint — every draft is written to match these parameters before it reaches you. The more specific you are here, the less editing you'll do.",
    fields: [
      { id: "threeWords",            label: "Three words that describe how you communicate",          type: "text",        placeholder: "e.g. Direct, Empathetic, Provocative", required: true,  hint: "Becomes the voice brief header Shakespeare references on every single draft." },
      { id: "communicationStyle",    label: "Your natural communication style",                       type: "multiselect", options: ["Data-driven and analytical","Storytelling and narrative","Contrarian and provocative","Empathetic and people-first","Visionary and big-picture","Tactical and practical","Academic and rigorous","Conversational and approachable","Authoritative and definitive","Humble and collaborative"], required: true,  hint: "Select all that feel true. Shakespeare blends these — your primary style leads, secondary styles surface contextually." },
      { id: "neverSoundLike",        label: "What you NEVER want to sound like",                      type: "textarea",    placeholder: "e.g. Corporate buzzword-heavy, overly promotional, preachy. Hard constraints only.", required: true,  hint: "Aristotle checks every draft against this before approving it. Be specific — 'no buzzwords' is better than 'professional'." },
      { id: "humorLevel",            label: "Your relationship with humour",                          type: "select",      options: ["Zero — strictly professional","Dry wit occasionally","Warm and human — I laugh at myself","Sharp and sardonic","Openly funny — it's part of my brand"], required: true,  hint: "Humour is the fastest trust-builder when used correctly. If you select 'zero', Aristotle will flag any warmth as off-brand." },
      { id: "opinionStrength",       label: "How strong are your public opinions?",                   type: "select",      options: ["I prefer to present multiple sides","I have views but state them carefully","I take clear positions and defend them","I'm known for controversial takes","I enjoy provoking constructive debate"], required: true,  hint: "Determines how direct Shakespeare writes your hooks and positions. High opinion strength = faster audience growth, more risk." },
      { id: "vulnerabilityComfort",  label: "Willing to share a professional failure publicly?",      type: "select",      options: ["Yes — vulnerability is part of my brand","Yes, with right framing — outcome focused","Rarely — only profound lessons","No — I prefer to project strength","Ask me case by case"], required: false, hint: "Vulnerability posts are consistently highest-performing on LinkedIn. Chanakya will only include them in the plan if you say yes." },
      { id: "nervousTopics",         label: "Topics you have opinions on but feel nervous to say?",  type: "textarea",    placeholder: "Often your most powerful angles. Chanakya will surface them carefully. Be honest.", required: false, hint: "The things you argue at dinner but never say publicly. These are often your most differentiated angles — Chanakya handles them carefully." },
      { id: "instantDeleteTriggers", label: "What would make you immediately delete a post?",          type: "textarea",    placeholder: "Beyond content taboos — tone, framing, or wording that would make you uncomfortable regardless of topic.", required: false, hint: "Emotional guardrails beyond content rules. Shakespeare will avoid these framings even when the topic is safe." },
      { id: "existingContent",       label: "Links to your 5 best existing posts or articles",        type: "textarea",    placeholder: "Paste URLs or describe them. These teach us your actual voice best.", required: false, tall: true, hint: "The fastest way to calibrate Shakespeare. Real examples beat written descriptions every time." },
      { id: "contentYouAdmire",      label: "3 public figures whose content you admire — and why",   type: "textarea",    placeholder: "Not who you want to copy — who you aspire to feel like.", required: false, hint: "Chanakya uses these to understand the register you're aiming for — not the content, the feeling." },
    ],
  },
  {
    id: "expertise", number: "05", title: "Topics & Expertise", subtitle: "The territory you own — and want to own", icon: "◎",
    banner: "Your expertise map is what Chanakya uses to build your content pillars and competitive whitespace analysis. Specificity here is what separates 'AI expert' from 'the person who predicted the LLM commoditisation wave in 2022'.",
    fields: [
      { id: "topicsOwned",       label: "Topics you already have deep expertise in",                     type: "textarea", placeholder: "List 5–10. Be specific: 'AI governance in regulated industries' beats 'AI'.", required: true,  tall: true, hint: "These become your primary content pillars. The more specific, the better Chanakya can position you as the definitive voice — not 'one of many'." },
      { id: "topicsAspire",      label: "Topics you want to be known for but aren't there yet",          type: "textarea", placeholder: "Your adjacency moves — topics you're building conviction on.", required: false, hint: "Chanakya builds a credibility bridge from where you are to where you want to be — these topics get seeded early, not led with." },
      { id: "strongOpinions",    label: "Your 3 most strongly held opinions most people get wrong",       type: "textarea", placeholder: "The takes you argue at dinner. These become your signature content.", required: true,  tall: true, hint: "Shakespeare builds your highest-engagement content around these. Unpopular truths from credible people are LinkedIn's most-shared format." },
      { id: "contrarianThesis",  label: "The ONE thing everyone in your industry gets wrong",            type: "textarea", placeholder: "Your cornerstone contrarian belief. The thing you'd stake your reputation on. 'Everyone talks about X but the real issue is Y.'", required: false, hint: "Your cornerstone differentiator. Chanakya positions your entire brand around this gap — it becomes the angle nobody else in your space is taking." },
      { id: "industryTrends",    label: "2–3 industry trends you think are overhyped",                   type: "textarea", placeholder: "Everyone's talking about X but they're missing Y.", required: false, hint: "Contrarian trend takes are high-signal content. They attract peer debate and press — two things that accelerate reach faster than agreement posts." },
      { id: "secretWeapon",      label: "The knowledge or experience nobody else in your field has",     type: "textarea", placeholder: "Cross-industry experience, unusual vantage point, built something no one else has.", required: false, hint: "The unfair advantage in your content. Shakespeare uses this to write posts only you could credibly make." },
      { id: "contentTaboos",     label: "Topics you will NEVER discuss publicly",                         type: "textarea", placeholder: "Political views, competitor criticism, legal matters. Hard stops only.", required: true,  hint: "Hard stops. Aristotle checks every draft against this list — anything touching these topics is flagged before it reaches you." },
    ],
  },
  {
    id: "calendar", number: "06", title: "Calendar & Logistics", subtitle: "Where your brand intersects with real events", icon: "◉",
    fields: [
      { id: "upcomingEvents",       label: "Upcoming events or announcements in the next 90 days",    type: "textarea",    placeholder: "Conference appearances, company announcements, product launches, awards…", required: false, tall: true, hint: "Machiavelli front-loads content around real moments. An event 6 weeks away becomes a 3-post content arc — announcement, build-up, recap." },
      { id: "weeklyTime",           label: "Time you can give per week",                              type: "select",      options: ["5 minutes — async approvals only","15 minutes — approvals + brief voice notes","30 minutes — one weekly sync call","1 hour — engaged collaboration","More — I want to be deeply involved"], required: true,  hint: "Machiavelli calibrates the approval pipeline SLA around this. '5 minutes' means the system handles more autonomously; '1 hour' unlocks collaborative refinement." },
      { id: "platformPreferences",  label: "Platforms you are comfortable being active on",           type: "multiselect", options: ["LinkedIn","X / Twitter","Instagram","YouTube","Podcast / Audio","Newsletter / Substack","TikTok","Threads"], required: false, hint: "Your comfort level is the override. Even if Chanakya recommends Instagram for your industry, it won't be in your plan if it's not here." },
      { id: "platformsToAvoid",     label: "Platforms you will absolutely not use",                   type: "textarea",    placeholder: "Hard constraints. e.g. 'No TikTok — not appropriate for my audience'.", required: false, hint: "Hard stops. Chanakya's platform strategy matrix ignores these completely — they will not appear in your plan." },
      { id: "videoComfort",         label: "Comfort with appearing on video",                         type: "select",      options: ["Yes — camera-ready, do it regularly","Yes with prep — I need a brief","Occasionally — major events only","Audio only (podcast) preferred","No video — strictly written content"], required: false, hint: "Determines whether YouTube, Reels, and video-first strategies are viable channels for your plan." },
      { id: "writingStyle",         label: "When you write, you tend to write...",                    type: "select",      options: ["Short punchy sentences. One idea per line.","Longer analytical paragraphs with structure","Question-led — I open loops and close them","Narrative storytelling arc","Data and evidence first, then interpretation","Mixed — depends on the topic"], required: false, hint: "Shakespeare mirrors your natural structure — not just your tone. A paragraph-thinker's LinkedIn posts look very different from a bullet-thinker's." },
      { id: "approvalChannel",      label: "Preferred content approval channel",                      type: "select",      options: ["WhatsApp — fast, familiar","Slack — already using it","Email — keep it professional","Notion — I'll review in the tool","Delegate to EA — I'll review final only"], required: true,  hint: "Where Machiavelli sends your approval requests. Fast approvals = faster publishing cadence." },
      { id: "approvalTimeframe",    label: "How quickly can you typically approve content?",          type: "select",      options: ["Within 2 hours (same day)","Within 24 hours","Within 48 hours","Weekly batch review","EA reviews first, I do final check"], required: true,  hint: "Sets your SLA. Aristotle flags SLA breaches — content waiting more than this window gets escalated automatically." },
      { id: "postingFrequency",     label: "Target posting frequency on LinkedIn",                   type: "select",      options: ["1–2x per week — quality over quantity","3–4x per week — consistent presence","Daily — maximum visibility","Start slow (2x) and ramp up"], required: true,  hint: "Machiavelli reserves this many slots per week in your calendar. Quality always beats frequency — don't select daily if you'll want to edit everything." },
      { id: "contentFormats",       label: "Content formats you're comfortable with",                 type: "multiselect", options: ["Text posts (no image)","Text + image","Carousel / document posts","Video (recorded)","Live video","Newsletter / long-form articles","Podcast appearances","Quoted in media / press"], required: true,  hint: "Shakespeare only generates formats you've said yes to. Carousels and newsletters require more production effort — be honest about what you'll actually publish." },
      { id: "ghostwritingComfort",  label: "Comfort level with AI-assisted ghostwriting",             type: "select",      options: ["Full trust — I approve, it publishes","High — I'll tweak 10–20%","Medium — I want to rewrite at least 50%","Low — use AI for research, I write final","Collaborative — I dictate, you polish"], required: true,  hint: "Sets how much autonomy Shakespeare has. 'Full trust' unlocks the fastest publishing pipeline." },
    ],
  },
  {
    id: "competitive", number: "07", title: "Competitive Landscape", subtitle: "Your peer set and positioning", icon: "⬡",
    fields: [
      { id: "peerCxOs",              label: "5 CxOs whose LinkedIn presence you respect or envy",      type: "textarea",    placeholder: "Names and LinkedIn URLs. We'll analyse their strategy to position you distinctly.", required: false, tall: true, hint: "Chanakya analyses these profiles to find the gaps they leave — your whitespace is built from what they're not doing." },
      { id: "differentiator",        label: "What makes you fundamentally different from your peers?", type: "textarea",    placeholder: "Not better — different. Background, lens, philosophy. What makes your perspective irreplaceable.", required: true,  hint: "The core of your positioning statement. 'Different' compounds faster than 'better' — Chanakya builds the entire brand framework around this." },
      { id: "reputationNow",         label: "What is your reputation right now?",                      type: "textarea",    placeholder: "Be honest. What do people say when your name comes up? Gap between perception and goal?", required: false, hint: "The delta between this and your goal drives the entire strategy. Be honest — Chanakya can only close gaps it knows about." },
      { id: "brandGaps",             label: "The biggest gap in your current online presence",         type: "multiselect", options: ["No presence at all — starting from zero","Profile exists but outdated","Posting inconsistently or stopped","No clear point of view or niche","Content is too corporate / not personal","Not reaching the right people","High reach but low engagement","Known locally but not globally"], required: true,  hint: "Chanakya prioritises its recommendations based on the most urgent gap. Select everything that's true." },
      { id: "competitiveWhitespace", label: "Angle nobody in your space is taking that you could own", type: "textarea",    placeholder: "The gap in your industry's content landscape. What's missing? What do peers not say that you could?", required: false, hint: "Your most powerful direct input to Chanakya's positioning analysis. If you can name the gap, Chanakya can build a content strategy to own it." },
      { id: "contentDislike",        label: "Content from peers you find shallow or overdone",         type: "textarea",    placeholder: "The LinkedIn clichés and content patterns that make you cringe.", required: false, hint: "Tells Chanakya what to actively avoid. The patterns you hate are often the exact gaps your audience is tired of too." },
      { id: "associations",          label: "Brands or communities you want to be associated with",    type: "textarea",    placeholder: "e.g. World Economic Forum, YPO, specific accelerators, prestigious publications…", required: false, hint: "Chanakya uses these as amplification targets — the communities and publications whose endorsement moves the needle fastest for your goal." },
    ],
  },
  {
    id: "success", number: "08", title: "Success Metrics", subtitle: "How we'll know it's working", icon: "◉",
    fields: [
      { id: "successIn30",      label: "What does success look like in 30 days?",              type: "textarea", placeholder: "Be specific and measurable. 'A DM from a PE partner I didn't know' or '500 new relevant followers'.", required: true,  hint: "Machiavelli uses this to front-load high-reach content in week 1–2. A specific milestone unlocks a sprint structure; a vague one gets a generic plan." },
      { id: "successIn90",      label: "What does success look like in 90 days?",              type: "textarea", placeholder: "The milestone that justifies this investment continuing.", required: true,  hint: "The entire 90-day content arc is built toward this. Chanakya works backwards from here to set content pillars, cadence, and platform priority." },
      { id: "earlySignal",      label: "What would tell you in week 2 this is working?",      type: "textarea", placeholder: "The leading indicator. 'An inbound from someone I've never met' or 'A comment from a competitor's follower'.", required: false, hint: "Your leading indicator. Machiavelli uses this to calibrate week 1–2 content before the 30-day milestone is reachable." },
      { id: "linkedinFollowing",label: "Current LinkedIn following size",                     type: "select",   options: ["Under 500","500–2,000","2,000–5,000","5,000–10,000","10,000–25,000","25,000+"], required: false, hint: "Sets the distribution baseline. An audience under 2,000 needs a different amplification strategy than one over 10,000." },
      { id: "currentEngagement",label: "Typical engagement on your LinkedIn posts",           type: "select",   options: ["0–5 likes per post","5–20 likes per post","20–100 likes per post","100–500 likes per post","500+ likes — significant reach already","I don't post currently"], required: false, hint: "Shakespeare calibrates hook intensity based on this. Low engagement usually means hooks need to be more provocative — not that the audience is wrong." },
      { id: "dealbreakers",     label: "What would make you stop this engagement?",            type: "textarea", placeholder: "Honest answer only. Help us know what to protect against.", required: true,  hint: "Helps Aristotle understand your risk threshold. Content that crosses these lines — even excellent content — will be flagged before it reaches you." },
      { id: "previousAttempts", label: "Have you tried building your personal brand before?", type: "textarea", placeholder: "Ghostwriter that didn't capture your voice, started and stopped. What failed and why?", required: false, hint: "The most valuable input we receive. Knowing what failed means Chanakya doesn't repeat the same mistake under a different name." },
      { id: "budget",           label: "Your Elevox plan",                                    type: "plancard", required: true,  hint: "Your plan determines which coaching phases and agents are active. You can upgrade at any time." },
      { id: "additionalContext",label: "Anything else we should know before we start?",        type: "textarea", placeholder: "Context that doesn't fit anywhere above. The more you share, the more we can tailor this.", required: false, tall: true, hint: "Open field. If something important doesn't fit anywhere above, put it here — Chanakya reads everything." },
    ],
  },
];

/* ─── FieldHint ─────────────────────────────────────────────── */
function FieldHint({ text }) {
  if (!text) return null;
  return (
    <p style={{
      margin: "7px 0 0",
      fontSize: "12px",
      color: "#475569",
      fontStyle: "italic",
      lineHeight: "1.5",
      fontFamily: "'Inter', sans-serif",
    }}>
      {text}
    </p>
  );
}

/* ─── SectionBanner ─────────────────────────────────────────── */
function SectionBanner({ text }) {
  if (!text) return null;
  return (
    <div style={{
      margin: "0 0 36px",
      padding: "14px 18px",
      background: "rgba(99,102,241,0.07)",
      border: "1px solid rgba(99,102,241,0.18)",
      borderLeft: "3px solid #6366f1",
      borderRadius: "8px",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
    }}>
      <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>💡</span>
      <p style={{
        margin: 0,
        fontSize: "13px",
        color: "#94A3B8",
        lineHeight: "1.65",
        fontFamily: "'Inter', sans-serif",
      }}>
        {text}
      </p>
    </div>
  );
}

/* ─── PlanCard ───────────────────────────────────────────────── */
const PLAN_TIERS = [
  {
    id: "starter",
    value: "$1,500–3,000/mo (Starter)",
    name: "Foundation",
    price: "$1,500–3,000",
    period: "/mo",
    color: "#4A9E7A",
    colorAlpha: "rgba(74,158,122,0.12)",
    colorBorder: "rgba(74,158,122,0.3)",
    phases: "Phases 1–2",
    tagline: "Brand strategy & platform architecture",
    features: ["Executive Brand Audit", "LinkedIn Profile Overhaul", "Chanakya Framework", "Content Calendar", "Shakespeare Ghostwriter"],
  },
  {
    id: "authority",
    value: "$6,000–12,000/mo (Authority)",
    name: "Authority",
    price: "$6,000–12,000",
    period: "/mo",
    color: "#C8A96E",
    colorAlpha: "rgba(200,169,110,0.12)",
    colorBorder: "rgba(200,169,110,0.3)",
    phases: "Phases 1–4",
    tagline: "Full content engine + visibility campaigns",
    badge: "Most popular",
    features: ["Everything in Foundation", "Content Engine (Phase 3)", "Media & Speaking Strategy", "Podcast Guest Pipeline", "Full Agent Pipeline"],
  },
  {
    id: "legacy",
    value: "$12,000–25,000/mo (Legacy)",
    name: "Legacy",
    price: "$12,000–25,000",
    period: "/mo",
    color: "#8C2E45",
    colorAlpha: "rgba(140,46,69,0.12)",
    colorBorder: "rgba(140,46,69,0.3)",
    phases: "Phases 1–6",
    tagline: "Full platform + community + 3-year vision",
    features: ["Everything in Authority", "Community & Network (Phase 5)", "KPI Dashboard & Brand Reviews", "Book & IP Packaging", "Legacy & 3-Year Vision"],
  },
];

function PlanCard({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {PLAN_TIERS.map(tier => {
        const selected = value === tier.value;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.value)}
            style={{
              width: "100%",
              padding: "20px",
              background: selected ? tier.colorAlpha : "#0D1220",
              border: `1px solid ${selected ? tier.color : "#1E2A3E"}`,
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
              boxShadow: selected ? `0 0 0 1px ${tier.color}40, 0 4px 20px ${tier.colorAlpha}` : "none",
              position: "relative",
            }}
            onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = tier.color + "80"; e.currentTarget.style.background = tier.colorAlpha; }}}
            onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "#1E2A3E"; e.currentTarget.style.background = "#0D1220"; }}}
          >
            {tier.badge && (
              <span style={{
                position: "absolute", top: "12px", right: "12px",
                fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px",
                color: tier.color, background: tier.colorAlpha,
                border: `1px solid ${tier.colorBorder}`,
                borderRadius: "100px", padding: "2px 8px",
                fontFamily: "'Inter', sans-serif",
              }}>
                {tier.badge}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", color: tier.color }}>{tier.name}</span>
              <span style={{ fontSize: "11px", color: "#475569", fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px" }}>{tier.phases}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", color: "#F1F5F9" }}>{tier.price}</span>
              <span style={{ fontSize: "12px", color: "#64748B", fontFamily: "'Inter', sans-serif" }}>{tier.period}</span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748B", fontFamily: "'Inter', sans-serif", fontStyle: "italic" }}>{tier.tagline}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tier.features.map(f => (
                <span key={f} style={{
                  fontSize: "11px", color: selected ? tier.color : "#475569",
                  background: selected ? tier.colorAlpha : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selected ? tier.colorBorder : "#1E2A3E"}`,
                  borderRadius: "4px", padding: "2px 8px",
                  fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
                }}>
                  {f}
                </span>
              ))}
            </div>
            {selected && (
              <div style={{ position: "absolute", top: "50%", right: "20px", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: tier.color }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

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
function FieldInput({ field, value, onChange, error }) {
  const baseInput = {
    width: "100%",
    padding: "13px 16px",
    background: error ? "rgba(239, 68, 68, 0.05)" : "#0D1220",
    border: `1px solid ${error ? "#ef4444" : "#1E2A3E"}`,
    borderBottom: `2px solid ${error ? "#ef4444" : (value ? "#6366f1" : "#1E2A3E")}`,
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
    e.target.style.borderColor = error ? "#ef4444" : "#6366f1";
    e.target.style.borderBottomColor = error ? "#ef4444" : "#6366f1";
    e.target.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.12)" : "0 0 0 3px rgba(99,102,241,0.12)";
  };
  const onBlur = e => {
    e.target.style.borderColor = error ? "#ef4444" : "#1E2A3E";
    e.target.style.borderBottomColor = error ? "#ef4444" : (value ? "#6366f1" : "#1E2A3E");
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
    return (
      <div style={error ? { border: "1px solid #ef4444", padding: "8px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.05)" } : {}}>
        <MultiSelect field={field} value={value} onChange={v => onChange(field.id, v)} />
      </div>
    );
  }
  if (field.type === "plancard") {
    return <PlanCard value={value} onChange={val => onChange(field.id, val)} />;
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
function HeroScreen({ onStart, onSignOut }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = e => { if (e.key === "Enter" && !loading) handleAutoFill(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, file, url]);

  const handleAutoFill = async () => {
    if (!file && !url) {
      onStart(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { supabase } = await import('../lib/supabase');

      // Extract PDF text on the frontend using pdfjs-dist (lazy-loaded).
      // We explicitly use v3.11.174 legacy build to prevent Safari WebKit ReadableStream crashes.
      let extractedText = '';
      if (file) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js`;
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            extractedText += content.items.map(item => item.str).join(' ') + '\n';
          }
        } else {
          extractedText = await file.text();
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: extractedText, url: url || undefined }),
        }
      );
      const jsonText = await res.text();
      let json = {};
      try { json = JSON.parse(jsonText); } catch(_e) { /* non-JSON response — use raw text fallback */ }

      
      if (!res.ok) {
        throw new Error(json.error || json.message || jsonText || `Server error ${res.status}`);
      }
      const data = json;

      // Start form with auto-filled data
      onStart(data.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract profile.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ob-bg)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden",
    }}>
      {/* Sign-out ghost button — top right */}
      {onSignOut && (
        <button
          onClick={onSignOut}
          style={{
            position: "absolute", top: "20px", right: "24px", zIndex: 10,
            background: "none", border: "1px solid #1E2A3E", borderRadius: "8px",
            color: "#475569", fontSize: "12px", fontFamily: "'Inter', sans-serif",
            padding: "7px 14px", cursor: "pointer", letterSpacing: "0.4px",
            transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2A3E"; e.currentTarget.style.color = "#475569"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign out
        </button>
      )}
      <div style={{ position: "absolute", top: "15%", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: "640px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px",
          background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "100px", marginBottom: "32px", animation: "ob-hero-line 0.5s ease both",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
          <Logo size="sm" theme="dark" />
          <span style={{ fontSize: "11px", color: "#a5b4fc", letterSpacing: "2px", fontWeight: "500", fontFamily: "'Inter', sans-serif" }}>CLIENT INTELLIGENCE BRIEF</span>
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "700", fontFamily: "'Outfit', sans-serif",
          lineHeight: "1.15", letterSpacing: "-1px", margin: "0 0 20px", animation: "ob-hero-line 0.5s 0.1s ease both",
          opacity: 0, background: "linear-gradient(135deg, #F1F5F9 40%, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Let's build your<br />brand intelligence brief.
        </h1>

        <p style={{
          fontSize: "16px", color: "#64748B", lineHeight: "1.7", margin: "0 auto 40px",
          maxWidth: "480px", fontFamily: "'Inter', sans-serif", animation: "ob-hero-line 0.5s 0.2s ease both", opacity: 0,
        }}>
          8 sections. ~20 minutes. Optionally let Elevox AI auto-fill your brief by uploading your Resume or LinkedIn PDF.
        </p>

        {/* AI Auto-Fill Section */}
        <div style={{
          background: "rgba(13, 18, 32, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "16px", padding: "24px", marginBottom: "40px", backdropFilter: "blur(12px)",
          animation: "ob-hero-line 0.5s 0.3s ease both", opacity: 0, textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "18px" }}>✨</span>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#a5b4fc", letterSpacing: "0.5px", textTransform: "uppercase" }}>Elevox AI Auto-Fill</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "6px", display: "block" }}>LINKEDIN PROFILE URL</label>
              <input 
                type="url" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://linkedin.com/in/yourname" 
                style={{
                  width: "100%", padding: "12px 16px", background: "#0D1220", border: "1px solid #1E2A3E",
                  borderRadius: "8px", color: "#F1F5F9", fontSize: "13px", outline: "none", transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#1E2A3E"}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "#1E2A3E" }} />
              <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "1px" }}>AND / OR</div>
              <div style={{ flex: 1, height: "1px", background: "#1E2A3E" }} />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "6px", display: "block" }}>UPLOAD RESUME / CV (PDF)</label>
              <input 
                type="file" 
                accept=".pdf,.txt"
                onChange={e => setFile(e.target.files[0])} 
                style={{
                  width: "100%", padding: "10px", background: "rgba(99, 102, 241, 0.05)", border: "1px dashed rgba(99, 102, 241, 0.3)",
                  borderRadius: "8px", color: "#a5b4fc", fontSize: "13px", cursor: "pointer"
                }}
              />
            </div>
          </div>
          
          {error && <div style={{ marginTop: "16px", padding: "10px", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "12px", borderRadius: "6px" }}>{error}</div>}
        </div>

        {/* CTA */}
        <div style={{ animation: "ob-hero-line 0.5s 0.4s ease both", opacity: 0 }}>
          <button
            onClick={handleAutoFill}
            disabled={loading}
            style={{
              padding: "16px 40px", background: loading ? "rgba(30, 42, 62, 0.8)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: loading ? "1px solid #1E2A3E" : "none", borderRadius: "10px", color: loading ? "#94A3B8" : "#fff",
              fontSize: "14px", fontWeight: "600", fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px",
              cursor: loading ? "progress" : "pointer", boxShadow: loading ? "none" : "0 8px 32px rgba(99,102,241,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s", display: "inline-flex", alignItems: "center", gap: "10px"
            }}
            onMouseEnter={e => { if(!loading) { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(99,102,241,0.5)"; } }}
            onMouseLeave={e => { if(!loading) { e.target.style.transform = "none"; e.target.style.boxShadow = "0 8px 32px rgba(99,102,241,0.35)"; } }}
          >
            {loading ? (
               <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Auto-Filling Brief...</>
            ) : (file || url) ? "Analyze & Start Brief →" : "Start Empty Brief →"}
          </button>
          
          {!loading && <div style={{ marginTop: "14px", fontSize: "11px", color: "#334155", fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px" }}>
            Press <kbd style={{ background: "#1E2A3E", color: "#a5b4fc", border: "1px solid #2D3D5A", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>Enter</kbd> to start
          </div>}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
export default function OnboardingForm({ onComplete, initialData, onSaveProgress, onSaveAndExit, onSignOut, submitError, isCompleting }) {
  const [phase, setPhase] = useState("hero"); // "hero" | "form" | "done"
  const [isSaving, setIsSaving] = useState(false);
  
  // Guard the object keys and ensure we track our initial data cleanly
  const startData = initialData || {};
  const hasData = Object.keys(startData).length > 0;
  
  const [formData, setFormData] = useState(startData);
  const [currentStep, setCurrentStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const containerRef = useRef(null);

  const handleHeroStart = (prefilledData) => {
    if (prefilledData && Object.keys(prefilledData).length > 0) {
      // Merge prefilled data with any existing start data
      const mergedContent = { ...startData, ...prefilledData };
      setFormData(mergedContent);
      
      // Calculate leap-forward step
      let jumpTo = 0;
      for (let i = 0; i < STEPS.length; i++) {
        const missing = STEPS[i].fields.filter(f => f.required).some(f => {
          const v = mergedContent[f.id];
          if (Array.isArray(v)) return v.length === 0;
          return !v || String(v).trim() === "";
        });
        if (missing) {
          jumpTo = i;
          break;
        }
      }
      // Only jump to end if literally everything is filled perfectly, else stop at first missing
      setCurrentStep(jumpTo === 0 && !Object.keys(mergedContent).length ? 0 : jumpTo);
    } else {
       // If no data, calculate from whatever initialData provided via props
       let jumpTo = 0;
       if (hasData) {
         for (let i = 0; i < STEPS.length; i++) {
          const missing = STEPS[i].fields.filter(f => f.required).some(f => {
            const v = startData[f.id];
            if (Array.isArray(v)) return v.length === 0;
            return !v || String(v).trim() === "";
          });
          if (missing) { jumpTo = i; break; }
         }
       }
       setCurrentStep(jumpTo);
    }
    setPhase("form");
  };

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
    if (dir === 1 && !requiredFilled) {
      setShowErrors(true);
      return;
    }
    
    // Auto-save on continuing to next step
    if (dir === 1 && onSaveProgress) {
      onSaveProgress(formData).catch(err => console.error("Auto save failed:", err));
    }

    setShowErrors(false);
    setAnimKey(k => k + 1);
    setCurrentStep(prev => prev + dir);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [requiredFilled, onSaveProgress, formData]);

  const handleSubmit = useCallback(() => {
    if (!requiredFilled) {
      setShowErrors(true);
      return;
    }
    console.log("📋 Brand Brief Submitted:", formData);
    if (onComplete) {
      onComplete(formData);
    } else {
      setPhase("done");
    }
  }, [requiredFilled, formData, onComplete]);

  // Keyboard: Enter = advance, Backspace on empty = back
  useEffect(() => {
    if (phase !== "form") return;
    const handler = e => {
      if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") {
        e.preventDefault();
        if (currentStep < STEPS.length - 1) {
          navigate(1);
        } else {
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, currentStep, navigate, requiredFilled, handleSubmit]);

  if (phase === "hero") return <HeroScreen onStart={handleHeroStart} onSignOut={onSignOut} />;
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
                onClick={() => i < currentStep ? (setAnimKey(k => k+1), setCurrentStep(i)) : null}
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
          {/* Right: Progress % + Sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontSize: "11px", color: "#334155", fontWeight: "500" }}>
              <span style={{ color: "#a5b4fc", fontWeight: "600" }}>{progress}%</span> complete
            </div>
            {onSignOut && (
              <button
                id="onboarding-sign-out"
                onClick={onSignOut}
                style={{
                  background: "none", border: "1px solid #1E2A3E", borderRadius: "7px",
                  color: "#475569", fontSize: "11px", fontFamily: "'Inter', sans-serif",
                  padding: "5px 12px", cursor: "pointer", letterSpacing: "0.4px",
                  transition: "all 0.2s", display: "flex", alignItems: "center", gap: "5px",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2A3E"; e.currentTarget.style.color = "#475569"; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            )}
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

          {/* ── Section banner (Steps 03–05 only) ── */}
          <SectionBanner text={step.banner} />

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
                  marginBottom: field.hint ? "6px" : "10px",
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
                  {showErrors && field.required && (!formData[field.id] || String(formData[field.id]).trim() === "" || (Array.isArray(formData[field.id]) && formData[field.id].length === 0)) && (
                    <span style={{ fontSize: "11px", color: "#ef4444", marginLeft: "12px", letterSpacing: "0.5px", flexShrink: 0 }}>Required</span>
                  )}
                </div>
                {field.hint && <FieldHint text={field.hint} />}
                <div style={{ marginTop: field.hint ? "10px" : 0 }}>
                  <FieldInput
                    field={field}
                    value={formData[field.id]}
                    onChange={updateField}
                    error={showErrors && field.required && (!formData[field.id] || String(formData[field.id]).trim() === "" || (Array.isArray(formData[field.id]) && formData[field.id].length === 0))}
                  />
                </div>
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
          {/* Back */}
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
              letterSpacing: "0.5px",
              cursor: currentStep === 0 ? "default" : "pointer",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "6px",
            }}
            onMouseEnter={e => { if (currentStep > 0) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#a5b4fc"; }}}
            onMouseLeave={e => { if (currentStep > 0) { e.currentTarget.style.borderColor = "#2D3D5A"; e.currentTarget.style.color = "#64748B"; }}}
          >
            ← Back
          </button>

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={async () => {
                if (onSaveAndExit) {
                  setIsSaving(true);
                  await onSaveAndExit(formData);
                }
              }}
              disabled={isSaving}
              style={{
                padding: "12px 20px",
                background: "transparent",
                border: "1px solid #1E2A3E",
                borderRadius: "8px",
                color: "#64748B",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.5px",
                cursor: isSaving ? "progress" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if(!isSaving) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#a5b4fc"; } }}
              onMouseLeave={e => { if(!isSaving) { e.currentTarget.style.borderColor = "#1E2A3E"; e.currentTarget.style.color = "#64748B"; } }}
            >
              {isSaving ? "Saving..." : "Save for later"}
            </button>
            
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => navigate(1)}
                disabled={isSaving}
                style={{
                  padding: "12px 28px",
                  background: requiredFilled ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#0D1220",
                  border: `1px solid ${requiredFilled ? "transparent" : (showErrors ? "#ef4444" : "#1E2A3E")}`,
                  borderRadius: "8px",
                  color: requiredFilled ? "#fff" : "#F1F5F9",
                  fontSize: "12px",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.5px",
                  cursor: isSaving ? "progress" : "pointer",
                  boxShadow: requiredFilled ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (requiredFilled && !isSaving) { e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                onMouseLeave={e => { if (requiredFilled && !isSaving) { e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "none"; }}}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSaving || isCompleting}
                style={{
                  padding: "12px 32px",
                  background: requiredFilled ? "linear-gradient(135deg, #10b981, #059669)" : "#0D1220",
                  border: `1px solid ${requiredFilled ? "transparent" : (showErrors ? "#ef4444" : "#1E2A3E")}`,
                  borderRadius: "8px",
                  color: requiredFilled ? "#fff" : "#F1F5F9",
                  fontSize: "12px",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.8px",
                  cursor: (isSaving || isCompleting) ? "progress" : "pointer",
                  boxShadow: requiredFilled ? "0 4px 20px rgba(16,185,129,0.3)" : "none",
                  opacity: isCompleting ? 0.7 : 1,
                  transition: "all 0.15s",
                }}
              >
                {isCompleting ? "Saving…" : "Submit Brief ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Submit error banner — shown when DB save fails */}
        {submitError && (
          <div style={{
            margin: "0 32px 16px",
            padding: "12px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "13px",
            lineHeight: 1.5,
          }}>
            <strong style={{ display: "block", marginBottom: "2px", color: "#f87171" }}>Save failed</strong>
            {submitError} — please try again or refresh the page.
          </div>
        )}
      </div>
    </div>
  );
}
