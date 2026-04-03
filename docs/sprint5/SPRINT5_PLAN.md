# Sprint 5 — Product Backlog
**Agent Intelligence Upgrade · Onboarding Enhancement · Platform Strategy**

**For:** Antigravity Development Team
**Date:** April 2026

---

## Sprint Overview

| Item | Detail |
|---|---|
| Sprint | 5 |
| Duration | 2 weeks |
| Total Story Points | ~28 pts |
| Status | Planning — not yet started |
| Repo | navingnaneshwar/elevox-roadmap-app |
| Live Site | roadmap-app-gamma-seven.vercel.app |
| Prerequisite | Sprint 4 fully live ✅ |

---

## Sprint Goal

> "Transform Chanakya from a framework generator into a genuine AI brand advisor — with a two-stage intelligence process, clean agent boundaries, multi-channel platform strategy, and an onboarding form rich enough to eliminate hallucination across all six agents."

---

## ⚠️ Fix First — Before Sprint 5 Starts

> This single fix caused more pipeline failures during testing than everything else combined. It must be deployed **immediately** — not at the start of Sprint 5.

### Remove `approved_for_publish` Check from Machiavelli

**Current behaviour:** Machiavelli checks `approved_for_publish = true` before scheduling. This causes the pipeline to fail because the DB write from Aristotle is not always persisting before Machiavelli runs.

**Correct behaviour:** Aristotle is the approval gate — not Machiavelli. If a `schedule_post` job exists in the queue, it means Aristotle already approved it. Machiavelli's job is **WHEN and WHERE** — not WHETHER.

- [ ] Delete lines 155-162 in `agent-machiavelli/index.ts` (the `approved_for_publish` guard block)
- [ ] Redeploy: `supabase functions deploy agent-machiavelli --no-verify-jwt`
- [ ] Verify: run a full pipeline test — Machiavelli should schedule without error

---

## Section 1 — Agent Activity Delineation

Six overlaps were identified during Sprint 4 testing where agents were doing each other's work. These must be resolved before adding new features. **Clean boundaries first.**

### Agent Ownership Matrix

| Agent | Owns | Does NOT Own |
|---|---|---|
| Chanakya | Strategy, positioning, identity, which platforms and WHY | Craft rules, news timing, scheduling |
| Analyst | Market intelligence, live signals, WHAT to post this week | Platform selection, framework building |
| Shakespeare | Content writing, hook craft, voice execution, self-check | Strategic constraints, approval decisions |
| Aristotle | Editorial quality, CX + credibility evaluation, approval gate | Scheduling, platform decisions |
| Machiavelli | WHEN and WHERE to post, slot management | Approval decisions, content quality |
| Orchestrator | Job routing, plan enforcement, batch processing | Content, strategy, scheduling logic |

---

### Overlap Fix 1 — Platform Strategy Ownership

**Problem:** Both Chanakya and Analyst could make platform recommendations as we add new features.

- Chanakya owns: WHICH platforms and WHY (strategic fit for audience + goal)
- Analyst owns: WHAT to post on those platforms THIS WEEK (tactical intelligence)
- [ ] Remove any platform recommendation logic from the Analyst entirely

---

### Overlap Fix 2 — Voice Rules Split

**Problem:** Chanakya's `ghostwriting_rules` and Shakespeare's system prompt both contain writing instructions that can conflict.

- Chanakya `ghostwriting_rules` = strategic constraints ONLY: what to own, what to never say, persona-specific angles
- Shakespeare system prompt = craft rules ONLY: sentence structure, formatting, hooks, word count
- [ ] Audit both files and move any misplaced rules to the correct agent

---

### Overlap Fix 3 — Credibility Score Naming

**Problem:** Both Shakespeare and Aristotle produce a `credibility_score` — same name, different purpose, different thresholds.

- Shakespeare score → rename to `self_credibility_score` (internal quality gate, threshold: 50)
- Aristotle score → rename to `editorial_credibility_score` (external quality gate, threshold: 75)
- [ ] Add `self_credibility_score` column to `content_drafts`
- [ ] Update all references in both agents and the audit log

---

---

### Overlap Fix 4 — Remove Approval Check from Machiavelli

> Covered in the "Fix First" section above. This is the most urgent overlap.

---

### Overlap Fix 5 — Add Pre-Chanakya Analyst Sweep

**Problem:** Chanakya builds content pillars without knowing what the market is actually talking about this week.

- [ ] Add new job type: `sweep_industry` (runs BEFORE `build_framework`)
- `sweep_industry`: no `framework_id`, just `user_id` + industry — pure market intelligence
- Output saved to new `industry_signals` table
- Chanakya reads `industry_signals` when building the framework
- **New pipeline order:** `sweep_industry` → `gather_intelligence` → `build_framework` → `run_news_sweep` → `reserve_slot` → `generate_drafts` → `review_draft` → `schedule_post`

---

### Overlap Fix 6 — Two-Stage Chanakya

**Problem:** Chanakya currently runs once and produces the full framework. It should first understand the client, then ask targeted questions, then produce the framework.

> Covered in full detail in Section 2 below.

---

## Section 2 — Two-Stage Chanakya Architecture

This is the **single highest-impact change in Sprint 5.** It transforms Chanakya from a form processor into a genuine strategic advisor.

### Current Architecture (Single Stage)

- User fills form → Chanakya reads it → produces framework

**Problem:** Chanakya asks every CxO the same questions regardless of what it finds. A good brand strategist reads what you gave them, identifies the gaps specific to YOU, and asks precisely what they need.

### New Architecture (Two Stage)

- **Stage 1 — `gather_intelligence`:** Read everything → identify gaps → ask 3-5 specific follow-up questions
- **Stage 2 — `build_framework`:** Read original profile + clarification answers → produce complete framework

### Stage 1 Output Schema

Chanakya returns a `clarification_brief` — NOT the full framework yet:

| Field | Description |
|---|---|
| `what_i_found` | 2-3 sentence summary of what Chanakya understood from the profile |
| `strongest_signal` | The single most powerful thing in the profile |
| `critical_gaps` | Array of `{gap, why_it_matters, question}` — specific to THIS person |
| `assumptions_made` | Things Chanakya assumed that the CxO should confirm or correct |
| `ready_to_proceed` | `true` \| `false` |

### New UI Required — `ClarificationPage.jsx`

A conversational page that shows the CxO what Chanakya found and asks specific follow-up questions. Not a form — more like a message from an advisor.

- Shows "Here is what I understood about you" — Chanakya's summary
- Shows "Here is what I need to know" — 3-5 targeted questions
- Simple text inputs, warm conversational tone
- On submit: stores responses in `clarification_sessions`, triggers `build_framework`

### New Database Objects

| Object | Purpose |
|---|---|
| `industry_signals` table | Pre-Chanakya market intelligence |
| `clarification_sessions` table | Stage 1 questions and user responses |
| `sweep_industry` job type | New orchestrator job |
| `gather_intelligence` job type | New orchestrator job |

---

## Section 3 — Onboarding Form Additions

18 new fields across 8 steps. These directly fix the hallucination problem by giving Shakespeare verified, specific career facts to anchor content with. Implement in `useProfile.js` FIELD_MAP and `profiles` table.

### Step 01 — Identity & Profile (3 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `roleTenure` | How long in current role? | select | Established vs new — affects positioning strategy |
| `boardRoles` | Current board or advisory positions? | textarea | Already board-level changes entire positioning |
| `companyStage` | Company stage | select | PE-backed vs public vs startup changes audience targeting |

### Step 02 — Career Narrative (5 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `credibilityInventory` | 3 most specific measurable achievements (what → change → number) | textarea (tall) | **CRITICAL:** fixes hallucination — Shakespeare uses these as the ONLY verified stats |
| `builtFromScratch` | What have you built from zero? | textarea | Shakespeare's highest-value anchor material |
| `firstOfAKind` | What are you the first to do? | textarea | Uniqueness signal for positioning |
| `recognition` | Awards, media, publications, panels? | textarea | Credibility signals Shakespeare can reference |
| `originMoment` | Single career moment that changed how you think | textarea | The story only this CxO can tell |

### Step 03 — Brand Goals (4 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `targetPersona` | The single most important person to impress (specific role + company type) | textarea | Replaces vague `target_audience` — drives platform and community strategy |
| `desiredAction` | What do you want them to do after 3 months of content? | select | Calibrates content aggressiveness and CTA style |
| `audienceOnline` | Where does your target audience find thought leaders? | textarea | Direct input into platform selection |
| `warmRelationships` | Existing relationships who could introduce you to your target? | textarea | Network leverage often faster than content alone |

### Step 04 — Voice & Tone (3 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `vulnerabilityComfort` | Willing to share a professional failure publicly? | select | Vulnerability posts are highest-performing — Chanakya needs to know if available |
| `nervousTopics` | Topics you have opinions on but feel nervous to say? | textarea | Often the most powerful angles — Chanakya surfaces them safely |
| `instantDeleteTriggers` | What would make you immediately delete a post? | textarea | Beyond content taboos — emotional guardrails for Shakespeare |

### Step 05 — Topics & Expertise (1 addition)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `contrarianThesis` | The one thing everyone in your industry gets wrong | textarea | **CRITICAL:** cornerstone of competitive whitespace analysis and brand differentiation |

### Step 06 — Calendar & Logistics (4 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `platformPreferences` | Platforms you are comfortable being active on | multiselect | Direct input — CxO knows their own comfort level |
| `platformsToAvoid` | Platforms you will absolutely not use | textarea | Hard constraints for Chanakya platform strategy |
| `videoComfort` | Comfort with appearing on video | select | Determines if YouTube and Reels are viable channels |
| `writingStyle` | When you write, you tend to write... | select | Informs Shakespeare's structural approach |

### Step 07 — Competitive Landscape (2 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `competitiveWhitespace` | Angle nobody in your space is taking that you could own | textarea | Direct whitespace signal — Chanakya positions around this |
| `contentDislike` | Content from peers you find shallow or overdone | textarea | Tells Chanakya what to avoid and what gap exists |

### Step 08 — Success Metrics (3 additions)

| Field ID | Label | Type | Why Chanakya Needs It |
|---|---|---|---|
| `earlySignal` | What would tell you in week 2 this is working? | textarea | Leading indicator — calibrates early content strategy |
| `linkedinFollowing` | Current LinkedIn following size | select | Calibrates growth expectations and distribution strategy |
| `currentEngagement` | Current engagement on LinkedIn posts | select | Baseline for Machiavelli timing and Shakespeare tone |

---

## Section 4 — Chanakya Output Schema Upgrades

9 targeted additions to `agent-strategist/index.ts`. Do **not** rewrite the whole file — make targeted additions to the system prompt and JSON schema.

### New JSON Output Fields

| Field | Type | Purpose | Priority |
|---|---|---|---|
| `verified_career_anchors` | jsonb array | Specific verified facts Shakespeare is ONLY allowed to use — fixes hallucination permanently | P0 |
| `audience_personas` | jsonb array | Structured personas with why they matter, what they read, content angle — replaces string labels | P0 |
| `platform_strategy` | jsonb array | Which platforms + why + content mix + timing + skip reasoning — industry and goal derived | P0 |
| `community_map` | jsonb object | 4 components: LinkedIn groups, people to engage, content communities, niche forums | P1 |
| `gap_analysis` | jsonb object | Already in JSON output but not being saved to DB — fix the insert block | P1 |

### System Prompt Additions

- **`verified_career_anchors` instruction:** Extract every specific quantified fact. These are the ONLY statistics Shakespeare is permitted to use. If a fact is not in this list, Shakespeare must not invent it.
- **Voice traits expansion:** Minimum 5 traits. Each must have: trait name, behaviour description, never-do instruction. Change JSON schema from string array to object array.
- **Uncomfortable truth quality gate:** Must name a specific missed opportunity with a named example. "Post more consistently" fails. Re-prompt if generic.
- **Mentor memo requirement:** Opening sentence MUST name the single most powerful specific achievement by name. Not "your AI work" — name the product, the number, the outcome.
- **Platform selection matrix:** Industry + goal derived. Full matrix covering pharma, fintech, retail, tech, consulting, education, manufacturing, media. Goal overrides (board seat, capital raise, speaking) always applied.
- **Community map instructions:** 4 components derived from industry + target client — not hardcoded. LinkedIn groups, people to engage (4 types always), content communities, niche forums.

### Database Migration Required

**Run in Supabase SQL Editor:**

### Database Migration Required

**Run in Supabase SQL Editor:**

```sql
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS verified_career_anchors jsonb;
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS audience_personas jsonb;
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS platform_strategy jsonb;
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS community_map jsonb;
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS gap_analysis jsonb;

ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS self_credibility_score integer;
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS editorial_credibility_score integer;

CREATE TABLE industry_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  industry text,
  signals jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE clarification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  chanakya_summary text,
  strongest_signal text,
  questions jsonb,
  user_responses jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

---

## Section 5 — Multi-Channel Platform Intelligence Matrix

Chanakya must select platforms based on the combination of: primary goal + target audience + industry + time commitment. **Never assume LinkedIn is always primary.** This matrix must be embedded in Chanakya's system prompt.

### Platform Selection by Industry

| Industry | Primary | Secondary | Consider | Skip |
|---|---|---|---|---|
| Pharma / Healthcare / Biotech | LinkedIn | YouTube | Newsletter | Instagram, TikTok, X |
| FinTech / Finance / Banking | LinkedIn | X/Twitter | Newsletter/Substack | Instagram, TikTok |
| Enterprise Tech / SaaS / AI | LinkedIn + X/Twitter | YouTube | Newsletter, Podcast | Instagram, TikTok |
| Retail / Consumer / DTC | Instagram | LinkedIn | TikTok, YouTube | X/Twitter |
| Real Estate / Property | LinkedIn + Instagram | YouTube | TikTok | — |
| Consulting / Advisory | LinkedIn | Newsletter/Substack | Podcast, YouTube | Instagram, TikTok |
| Education / EdTech | LinkedIn + YouTube | Instagram | TikTok, Newsletter | — |
| Manufacturing / Industrial | LinkedIn | YouTube | — | Instagram, TikTok, X |
| Media / Entertainment | Instagram + LinkedIn | X/Twitter, YouTube | TikTok | — |

### Goal Overrides (Always Applied Regardless of Industry)

| Goal | Override Rule |
|---|---|
| Board seat positioning | LinkedIn is non-negotiable primary regardless of industry |
| Raise capital / attract investors | LinkedIn + X/Twitter always |
| Consumer brand building | Instagram always, even for B2B executives |
| Speaking career | LinkedIn + YouTube + Podcast |
| Consulting pipeline | LinkedIn + Newsletter always |
| Talent attraction | LinkedIn + Instagram (culture content) |
| Media presence | X/Twitter + LinkedIn always |

---

## Section 6 — Sprint 5 Story Points & Prioritisation

| Story | Description | Points | Priority | Owner |
|---|---|---|---|---|
| S5-00 (Pre-sprint) | Remove `approved_for_publish` check from Machiavelli | 1 | P0 — Deploy now | BE |
| S5-01 | Overlap Fix 1-3: Platform ownership, voice rules split, score renaming | 2 | P0 | BE + FE |
| S5-02 | Overlap Fix 5: Pre-Chanakya `sweep_industry` job type + `industry_signals` table | 3 | P0 | BE |
| S5-03 | Two-Stage Chanakya: `gather_intelligence` mode + `clarification_sessions` table | 4 | P0 | BE |
| S5-04 | `ClarificationPage.jsx`: conversational follow-up UI for Chanakya Stage 1 | 3 | P0 | FE |
| S5-05 | Chanakya output schema: `verified_career_anchors` + `audience_personas` + `platform_strategy` + `community_map` | 3 | P0 | BE |
| S5-06 | Onboarding form: 18 new fields across 8 steps + profiles table migration | 4 | P1 | FE + BE |
| S5-07 | Platform strategy matrix embedded in Chanakya system prompt (all industries) | 2 | P1 | BE |
| S5-08 | Aristotle DB write fix: confirm editorial scores always persist | 1 | P1 | BE |
| S5-09 | Shakespeare reads `verified_career_anchors` from framework (not just `career_highlights`) | 2 | P1 | BE |
| S5-10 | Orchestrator: add `sweep_industry`, `gather_intelligence` job types to routing map | 1 | P1 | BE |
| S5-11 | Smart post-login redirect + active nav state + Next Step banner on dashboard | 2 | P2 | FE |
| **TOTAL** | | **28 pts** | | |

---

## Definition of Done (Global — Sprint 5)

- [ ] Code implemented per this specification
- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] Relevant Edge Functions redeployed via `supabase functions deploy`
- [ ] Full pipeline smoke test passes end-to-end for a new user
- [ ] Chanakya output verified: all new fields present and populated
- [ ] Shakespeare produces a draft with no hallucinated statistics
- [ ] Aristotle approves on first or second pass (no credibility gap loops)
- [ ] All bugs found logged to `docs/ISSUE_LOG.md` before sprint close
- [ ] `docs/AGENT_ARCHITECTURE.md` updated with all changes

---

## Section 7 — Out of Scope (Sprint 6+)

> **If any of the following are requested during Sprint 5, note them as Sprint 6+ backlog. Do not build.**

- LinkedIn posting API — real posts going live on social platforms
- Analytics dashboard with real social data (impressions, engagement, reach)
- Admin dashboard for managing multiple users
- Settings page (password change, billing management)
- Razorpay payment wiring — deferred to final sprint
- Progress PDF export
- WhatsApp Business API direct posting
- Multi-language support
- Team collaboration features (multiple editors per CxO)

---

*EleVox Sprint 5 Backlog · April 2026 · For Antigravity Development Team*
*Questions: escalate to product before changing RLS policies, the PHASES array, or agent system prompts*

---

*Last updated: 2026-03-27*
*Source: Sprint 5 Product Backlog Word doc (April 2026)*
*Total stories: 12 (S5-00 through S5-11) | Total points: 28*
