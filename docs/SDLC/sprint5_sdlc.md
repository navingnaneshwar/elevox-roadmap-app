# Elevox — Sprint 5 SDLC Document
**Format:** Epic → User Story → Design Spec → Functional Spec → Test Scenario(s) → Status
**Environments:** Prod (`main`) · QA (`qa`)
**Tool:** [GitHub Projects — Elevox Sprint 5](https://github.com/users/navingnaneshwar/projects) *(see setup instructions below)*
**Last updated:** 2026-04-09
**Maintained by:** Engineering

---

## Environment Status Summary

| Environment | Branch | URL | Supabase Project |
|---|---|---|---|
| **Production** | `main` | roadmap-app-gamma-seven.vercel.app | `cgjmdxxbrahbwlmsngsu` |
| **QA** | `qa` | elevox-git-qa-navingnaneshwars-projects.vercel.app | `cgjmdxxbrahbwlmsngsu` (shared) |

> ⚠️ Both environments share the **same Supabase project** — Edge Function deploys are global.
> QA is currently **8 commits ahead** of `main` (Two-Stage Chanakya features, humanize pipeline).

---

## Sprint 5 Goal

> *"Transform Chanakya from a framework generator into a genuine AI brand advisor — with a two-stage intelligence process, clean agent boundaries, multi-channel platform strategy, and an onboarding form rich enough to eliminate hallucination across all six agents."*

---

## Epic Overview

| Epic ID | Epic Name | Prod Status | QA Status | Points |
|---|---|---|---|---|
| **E1** | Platform Auth & Onboarding | ✅ Done | ✅ Done | 6 pts |
| **E2** | Vox Coaching Platform | ✅ Done | ✅ Done | 8 pts |
| **E3** | Two-Stage Chanakya Intelligence | ❌ Not yet | ✅ In QA | 8 pts |
| **E4** | Multi-Agent Content Pipeline | 🔶 Partial | 🔶 Partial | 10 pts |
| **E5** | Subscription & Payment | ❌ Backlog | ❌ Backlog | 6 pts |

---

---

## E1 — Platform Auth & Onboarding

**Sprint Goal Contribution:** Enable reliable user intake — confirmed email, no broken reset link, no onboarding loop, accurate profile data from LinkedIn.

---

### E1-US1 · Email Signup with Confirmation

**User Story:**
> As a new user, I want to receive a confirmation email after signing up so that my account is verified before I access the platform.

**Design Spec:**
- `SignupPage.jsx`: after `signUp()` call, always show "Check Your Inbox" state with resend link
- Supabase Auth → "Confirm email" toggle must be **ON** in production dashboard
- Email template: Supabase default confirmation email

**Functional Spec:**
- `supabase.auth.signUp()` called with `{ email, password }`
- On success: display "Check your inbox" screen — do NOT redirect to app
- "Didn't receive it?" link calls `resend()` with same email
- On confirm link click: user is redirected to `/dashboard` via Supabase redirect URL
- Supabase Site URL: `https://roadmap-app-gamma-seven.vercel.app`
- Redirect URL allowlist includes `https://roadmap-app-gamma-seven.vercel.app/**`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T1.1 | Sign up with new email | "Check your inbox" screen shown | ✅ Pass |
| T1.2 | Click confirmation link | Redirected to `/dashboard` | ✅ Pass |
| T1.3 | Sign up with existing email | "User already registered" error | ✅ Pass |
| T1.4 | Click "Resend" after 30s | New confirmation email received | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-040

---

### E1-US2 · Password Reset Flow

**User Story:**
> As a user who forgot my password, I want to click "Forgot Password" and be taken to a working page to set a new one.

**Design Spec:**
- `LoginPage.jsx`: "Forgot Password?" link → triggers `resetPasswordForEmail()`
- `ResetPasswordPage.jsx`: full-screen dark form (consistent with app theme), shows "Set New Password" input
- Error state: if token expired → "This link has expired" with link back to login

**Functional Spec:**
- `resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- `ResetPasswordPage` detects recovery session in this priority order:
  1. Parse URL hash synchronously at mount for `type=recovery`
  2. Call `supabase.auth.getSession()` for already-processed tokens
  3. Subscribe `onAuthStateChange` for `PASSWORD_RECOVERY` event as fallback
- On valid session: show password input + confirm input + "Update Password" button
- On `updateUser({ password })`: navigate to `/dashboard`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T2.1 | Request reset for valid email | Success toast + email sent | ✅ Pass |
| T2.2 | Click reset link from email | `/reset-password` form shown | ✅ Pass |
| T2.3 | Submit new password | Password updated, redirect to `/dashboard` | ✅ Pass |
| T2.4 | Click expired reset link | "Link expired" message, not `auth_failed` 404 | ✅ Pass |
| T2.5 | Try reset for non-existent email | Supabase returns success (security: no enumeration) | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-042, ISS-044

---

### E1-US3 · Onboarding Form (18 fields, no loop)

**User Story:**
> As a new user, I want to complete the onboarding form once and never see it again, with my data properly saved and accessible to all agents.

**Design Spec:**
- `OnboardingPage.jsx`: 8-section multi-step form
- Progress bar across top
- "Back" / "Next" / "Finish" navigation
- `ProtectedRoute.jsx`: guards `/dashboard`, `/coach/*` etc. — redirects to `/onboarding` if `onboarding_complete = false`

**Functional Spec:**
- 18 profile fields written to `profiles` table via `upsertProfile()`
- `upsertProfile` uses `.upsert({ id: userId, ...fields }, { onConflict: 'id' })` — NOT `.update()`
- On last section submit: `completeOnboarding()` sets `onboarding_complete = true`
- `completeOnboarding()` then triggers `gather_intelligence` agent job
- `ProtectedRoute` reads `profile.onboarding_complete` — if `false`, redirect to `/onboarding`
- Google/LinkedIn OAuth users: profile row created by DB trigger — upsert still safe (no duplicate)

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T3.1 | New email signup: complete onboarding | Form saves all 18 fields, redirects to `/dashboard` | ✅ Pass |
| T3.2 | Refresh browser mid-onboarding | Form resumes at last saved state | ✅ Pass |
| T3.3 | Log out and log back in after completing onboarding | Goes to `/dashboard`, NOT `/onboarding` | ✅ Pass |
| T3.4 | Open in Safari (fresh session) | No onboarding loop, data persists | ✅ Pass |
| T3.5 | Submit LinkedIn URL only (no PDF) | Profile data extracted via Tavily, no JSON crash | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-041, ISS-043, ISS-045

---

### E1-US4 · LinkedIn / Resume Intelligence Parsing

**User Story:**
> As a user, I want to submit my LinkedIn URL (with or without a resume PDF) and have the system automatically enrich my profile using that data.

**Design Spec:**
- `HeroScreen.jsx` (onboarding step): input for LinkedIn URL + optional PDF upload
- Loading state while `parse-resume` Edge Function processes

**Functional Spec:**
- `parse-resume` Edge Function:
  - If LinkedIn URL provided: call Tavily `/extract` to scrape profile content
  - Merge scraped content with any uploaded PDF text
  - Pass combined context to Claude with structured JSON output schema
  - Safe `try/catch` around `JSON.parse` — fallback to empty object on failure
  - Returns: `{ name, title, summary, achievements, ... }` fields

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T4.1 | Submit PDF + LinkedIn URL | Both sources merged, profile fields populated | ✅ Pass |
| T4.2 | Submit LinkedIn URL only | Tavily extracts content, Claude parses it | ✅ Pass |
| T4.3 | Submit neither (skip) | Form advances without crash | ✅ Pass |
| T4.4 | Submit invalid/private LinkedIn URL | Tavily returns empty, Claude responds gracefully | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-041

---

---

## E2 — Vox Coaching Platform

**Sprint Goal Contribution:** Deliver the Phase 1 coaching experience — Vox interviews the executive, builds a macro-strategy, and hands off to the Chanakya agent pipeline.

---

### E2-US1 · Executive Brand Audit Session (Phase 1, Session 1)

**User Story:**
> As an executive, I want to have a focused coaching conversation with Vox about my brand strategy so that I end the session with a clear, validated direction.

**Design Spec:**
- `CoachingSessionPage.jsx`: dark full-height chat interface
- Vox avatar (animated orb): idle / thinking / speaking states
- User bubble: right-aligned with "ME" label
- Vox bubble: left-aligned with "VOX · YOUR BRAND STRATEGIST" label
- Typing indicator (3 animated dots) while Vox processes
- Empathy banner after 4.5m / 7m / 10m active session

**Functional Spec:**
- Route: `/coach/:phaseId/:componentId`
- On mount: load existing session from `mentor_sessions` table OR call `sendFirstMessage().__start__`
- `callMentorAPI()`: POST to `mentor-chat` Edge Function with:
  - `session_prompt`: phase-specific system prompt
  - `history`: last 10 messages from DB
  - `message`: user's text (`__start__` for opener)
  - `phase_id`: integer (plan enforcement)
- AbortController: 90-second client-side timeout → user-friendly retry message
- Session auto-saved to `mentor_sessions` on every message pair
- `[STAGE_COMPLETE]` token in reply → marks session `completed`, queues `build_framework` job

**`mentor-chat` Edge Function:**
- Authenticates via `Authorization` bearer token
- Plan enforcement: `starter → [1,2]`, `authority → [1-4]`, `legacy → [1-6]`
- System prompt: full executive dossier (18 profile fields) + Vox persona rules
- Tool: `search_web` → Tavily search for live digital footprint
- `MAX_TOOL_ROUNDS = 1`: one search, then Anthropic called with `withTools=false`
- Conclusion guidance (quality-based, no hard turn limit): Vox concludes when clarity achieved on 4 strategic areas
- Model: `claude-sonnet-4-5`, `max_tokens: 800`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T5.1 | Navigate to `/coach/1/0` | Welcome message generated, session saved to DB | ✅ Pass |
| T5.2 | Send first user message | Vox responds in 15-30s (Tavily search + Claude) | ✅ Pass |
| T5.3 | Refresh page mid-session | History loads from DB, session continues | ✅ Pass |
| T5.4 | Vox reaches strategic clarity | Summary + validation question sent | ✅ Pass |
| T5.5 | User confirms strategy | Chanakya handoff message + `[STAGE_COMPLETE]` triggers | ✅ Pass |
| T5.6 | Session exceeds 90s waiting | Timeout message shown, user can retry | ✅ Pass |
| T5.7 | Switch between sessions (Prev/Next nav) | Correct session loads, no cross-contamination | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-047, ISS-048, ISS-049

---

### E2-US2 · Session Recap & Completion

**User Story:**
> As an executive, after completing a coaching session I want to see a structured summary of what was decided so I can review my strategy before proceeding.

**Design Spec:**
- `SessionRecap.jsx`: full-width tabbed dashboard (Summary / Brand Framework / Profile Read)
- No vertical scrolling — all content fits above fold
- Minimum 12px font — readable for executives 40-70yo
- "Request Follow-Up" button for returning to an active state

**Functional Spec:**
- When `sessionStatus === 'completed'`: `SessionRecap` replaces chat window
- Summary tab: AI-generated recap from conversation history
- Brand Framework tab: `brand_frameworks` table data (populated by `agent-strategist`)
- Profile Read tab: interpretation of the user's brand positioning from Vox's perspective
- "Request Follow-Up": sets status back to `active`, calls `callMentorAPI` with `continuation_flag=true`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T6.1 | Session auto-completes via `[STAGE_COMPLETE]` | Recap screen shown immediately | ✅ Pass |
| T6.2 | Click "Mark as Complete" manually | Recap screen shown | ✅ Pass |
| T6.3 | Reload after completion | Recap screen shown (not chat) | ✅ Pass |
| T6.4 | Click "Request Follow-Up" | Chat reopens, Vox provides session summary | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done

---

### E2-US3 · Brand Brief Gate (Coaching-First Access)

**User Story:**
> As a user, I should not be able to see the Brand Brief until I have completed at least one coaching session (Phase 1, Brand Audit) so that the brief reflects real strategic work, not onboarding guesses.

**Design Spec:**
- `BrandBriefPage.jsx`: locked state — blurred section previews + 🔒 banner + "Start Brand Audit" CTA
- Unlocked state: full brief viewer + "Generate / Regenerate" button

**Functional Spec:**
- On mount: query `mentor_sessions` for row with `user_id = current`, `phase_id = 1`, `status = 'completed'`
- `auditDone = sessions.length > 0`
- If `auditDone = false`: render locked UI, hide all content
- If `auditDone = true`: render brief with generate option

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T7.1 | Visit `/brand-brief` before any coaching | Locked state with 🔒 banner | ✅ Pass |
| T7.2 | Complete Phase 1 audit, then visit brand brief | Full brief UI shown | ✅ Pass |
| T7.3 | Pre-existing test brief in DB (from dev) | Locked until audit completed — old data NOT shown | ✅ Pass |

**Prod:** ✅ Done · **QA:** ✅ Done · **Issue refs:** ISS-046

---

---

## E3 — Two-Stage Chanakya Intelligence Pipeline

**Sprint Goal Contribution:** Replace single-shot Chanakya with a dialogue-based two-stage process — Stage 1 reads the profile and asks targeted questions; Stage 2 builds the full framework with those answers included.

> ⚠️ **QA only — not yet in Prod.** Code ready on `qa` branch, pending final validation before merge.

---

### E3-US1 · Industry Signals Sweep (pre-Chanakya)

**User Story:**
> As an executive, I want the platform to scan my industry for live market signals before Chanakya builds my framework, so that my content pillars are grounded in what the market is actually discussing.

**Design Spec:**
- No user-facing UI — background job
- `ClarificationPage.jsx`: shows "Vox is analysing your industry…" polling state while sweep runs

**Functional Spec:**
- New job type: `sweep_industry`
- Payload: `{ user_id, industry }`
- `agent-analyst` handles: calls Tavily for top industry news + trending topics
- Output: written to `industry_signals` table `{ user_id, industry, signals: jsonb }`
- `agent-strategist` (Chanakya): reads `industry_signals` WHERE `user_id = current` before building framework
- Pipeline order: `sweep_industry` → `gather_intelligence` → `build_framework`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T8.1 | Complete onboarding with `industry` filled | `sweep_industry` job created and processed | 🔶 QA Testing |
| T8.2 | `industry_signals` row written post-sweep | Row exists in DB with populated `signals` JSON | 🔶 QA Testing |
| T8.3 | Chanakya reads industry_signals | Framework content references market context | 🔶 QA Testing |

**Prod:** ❌ Not deployed · **QA:** 🔶 In Testing

---

### E3-US2 · Chanakya Stage 1 — Profile Read + Clarification Questions

**User Story:**
> As an executive, after completing onboarding I want Chanakya to read my profile, share its initial read, and ask me 3–5 targeted follow-up questions so the framework it builds is truly personalised.

**Design Spec:**
- `ClarificationPage.jsx`: advisor-to-executive tone
  - Header: "Chanakya has reviewed your profile"
  - Body: Chanakya's initial read (2-3 sentences)
  - Strongest signal Chanakya identified
  - 3-5 targeted questions, each with label + textarea

**Functional Spec:**
- `gather_intelligence` job → `agent-strategist` Stage 1 run:
  - Reads full onboarding profile (18 fields)
  - Reads `industry_signals` (if available)
  - Outputs: `chanakya_summary`, `strongest_signal`, `questions[]`, `assumptions_made`
  - Written to `clarification_sessions` table
- `ClarificationPage` polls `clarification_sessions` WHERE `user_id = current` AND `status = 'pending'`
- When `status != pending`: displays questions with textarea inputs
- On submit: writes answers to `clarification_sessions.user_responses`; sets `status = 'answered'`
- `answered` → triggers `build_framework` job (Stage 2)

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T9.1 | Complete onboarding → navigate to `/clarification` | Polling state shown while Chanakya processes | 🔶 QA Testing |
| T9.2 | `gather_intelligence` completes | Chanakya summary + 3-5 questions displayed | 🔶 QA Testing |
| T9.3 | Answer all questions and submit | `clarification_sessions` updated, `build_framework` triggered | 🔶 QA Testing |
| T9.4 | Refresh during polling | Polling resumes correctly | 🔶 QA Testing |
| T9.5 | Chanakya has full profile data | Questions are specific to THIS executive (no generic placeholders) | 🔶 QA Testing |

**Prod:** ❌ Not deployed · **QA:** 🔶 In Testing

---

### E3-US3 · Chanakya Stage 2 — Framework Build with Answers

**User Story:**
> As an executive, after answering Chanakya's questions I want the platform to automatically generate my complete Brand Framework (positioning, pillars, voice, roadmap) using both my profile and my answers.

**Design Spec:**
- No new UI — `build_framework` runs in background
- Dashboard shows "Framework building…" state until complete
- `BrandBriefPage` unlocks when framework ready

**Functional Spec:**
- `build_framework` job → `agent-strategist` Stage 2 run:
  - Inputs: full profile + `clarification_sessions.user_responses`
  - Output: full `brand_frameworks` row (positioning, pillars, voice, roadmap JSON)
- `agent-strategist` boundaries: builds framework ONLY — does NOT write content drafts, does NOT run news sweeps
- Output written to `brand_frameworks` table

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T10.1 | `build_framework` job triggered after answers | Framework written to `brand_frameworks` | 🔶 QA Testing |
| T10.2 | Framework references user's clarification answers | Specific answers reflected in pillars/positioning | 🔶 QA Testing |
| T10.3 | Dashboard reflects framework completion | "Framework ready" state shown | 🔶 QA Testing |

**Prod:** ❌ Not deployed · **QA:** 🔶 In Testing

---

---

## E4 — Multi-Agent Content Pipeline

**Sprint Goal Contribution:** Clean agent boundaries so content is produced consistently, each agent owns exactly its domain, and the end-to-end pipeline runs without manual intervention.

---

### E4-US1 · Agent Boundary Cleanup (6-Agent Matrix)

**User Story:**
> As an engineer, I want each agent to own exactly one domain so that prompts don't conflict, credibility scores don't clash, and the pipeline is predictable.

**Functional Spec (6-Agent Ownership Matrix):**

| Agent | Owns | Does NOT Own |
|---|---|---|
| Chanakya (Strategist) | Strategy, positioning, identity, which platforms and WHY | Craft rules, news timing, scheduling |
| Analyst | Market intelligence, live signals, WHAT to post this week | Platform selection, framework building |
| Shakespeare | Content writing, hook craft, voice execution, self-check | Strategic constraints, approval decisions |
| Aristotle | Editorial quality, CX + credibility evaluation, approval gate | Scheduling, platform decisions |
| Machiavelli | WHEN and WHERE to post, slot management | Approval decisions, content quality |
| Orchestrator | Job routing, plan enforcement, batch processing | Content, strategy, scheduling logic |

**Changes shipped:**
- `content_drafts` table: added `self_credibility_score` (Shakespeare), `editorial_credibility_score` (Aristotle)
- `agent-machiavelli`: removed `approved_for_publish` guard — Aristotle is the gate, not Machiavelli
- Analyst: removed platform recommendation logic

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T11.1 | End-to-end pipeline run | Each agent's output type is distinct, no overlaps | 🔶 QA Testing |
| T11.2 | Shakespeare scores a draft | `self_credibility_score` populated in `content_drafts` | 🔶 QA Testing |
| T11.3 | Aristotle reviews a draft | `editorial_credibility_score` populated | 🔶 QA Testing |
| T11.4 | Machiavelli schedules a post | Does NOT check `approved_for_publish`, schedules if job exists | ✅ Pass (prod fix) |

**Prod:** 🔶 Partial · **QA:** 🔶 In Testing

---

### E4-US2 · Content Generation (Shakespeare)

**User Story:**
> As a user, I want LinkedIn posts drafted in my exact voice — matching my tone, humor level, and content pillars — without me writing anything myself.

**Functional Spec:**
- `agent-shakespeare`: receives `generate_drafts` job
- Inputs: brand framework, post topic, voice guidelines from Chanakya
- Self-check: scores own draft (threshold: 50) before passing to Aristotle
- Output: `content_drafts` row with `draft_body`, `draft_hook`, `self_credibility_score`

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T12.1 | `generate_drafts` job triggered | Draft created in `content_drafts` | 🔶 QA Testing |
| T12.2 | Draft voice matches profile fields | Humor level, communication style reflected | 🔶 QA Testing |
| T12.3 | Low-quality draft (score < 50) | Draft flagged, not passed to Aristotle | 🔶 QA Testing |

**Prod:** 🔶 Partial · **QA:** 🔶 In Testing

---

### E4-US3 · Editorial Review (Aristotle)

**User Story:**
> As a user, I want all AI-drafted content reviewed for credibility and brand alignment before it reaches me — so I never see a post that could damage my reputation.

**Functional Spec:**
- `agent-aristotle`: receives `review_draft` job
- Evaluates: credibility, factual claims, audience appropriateness, brand tone
- `editorial_credibility_score` threshold: 75
- Below threshold: `status = 'rejected'`, reason written to `audit_log`
- Above threshold: `status = 'approved'`, triggers `schedule_post` job

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T13.1 | High-quality draft submitted | `approved` status, `schedule_post` triggered | 🔶 QA Testing |
| T13.2 | Draft with factual error | `rejected`, reason in audit log | 🔶 QA Testing |

**Prod:** 🔶 Partial · **QA:** 🔶 In Testing

---

### E4-US4 · Content Scheduling (Machiavelli)

**User Story:**
> As a user, I want approved posts auto-scheduled to the best time slots for my audience — without me having to manually pick dates and times.

**Functional Spec:**
- `agent-machiavelli`: receives `schedule_post` job
- Reads: user's `content_calendar` reserved slots, platform, audience timezone
- Assigns: best available `reserved` slot → updates to `scheduled`
- Does NOT re-check `approved_for_publish` — approval is Aristotle's job

**Test Scenarios:**
| # | Scenario | Expected | Status |
|---|---|---|---|
| T14.1 | `schedule_post` job for approved draft | Slot assigned, calendar updated to `scheduled` | 🔶 QA Testing |
| T14.2 | No reserved slots available | Job waits / fails gracefully | 🔶 QA Testing |

**Prod:** 🔶 Partial · **QA:** 🔶 In Testing · **Open issue:** ISS-038 (slot status stays `reserved`)

---

---

## E5 — Subscription & Payment

> ❌ **Backlog — Sprint 6.** Not started in either environment.

### E5-US1 · Razorpay Integration (India-first)

**User Story:**
> As an Indian executive user, I want to pay for my Elevox subscription via a payment method that works in India (UPI, rupee billing).

**Functional Spec:**
- Replace current Stripe integration with Razorpay
- Maintain same 3-tier plan structure: Starter / Authority / Legacy
- `create-checkout` Edge Function: generate Razorpay order
- `stripe-webhook` → `razorpay-webhook` Edge Function: update `profiles.plan_status`
- Beta override: all users default to `authority` plan until commercial launch

**Status:** ❌ Backlog · **Issue ref:** ISS-015

---

---

## GitHub Projects Setup Instructions

> Use [GitHub Projects (Beta)](https://github.com/navingnaneshwar/elevox-roadmap-app/projects) — free, zero external accounts, linked directly to this repo.

### One-time Setup (5 min)
1. Go to `https://github.com/navingnaneshwar/elevox-roadmap-app` → **Projects** tab → **New Project**
2. Choose **"Board"** layout
3. Name: `Elevox Sprint 5`
4. Add custom fields:
   - `Epic` (single-select): E1 Auth/Onboarding · E2 Vox Coaching · E3 Chanakya · E4 Multi-Agent · E5 Payment
   - `Environment` (single-select): Prod · QA · Both · Backlog
   - `Story Points` (number)
   - `SDLC Link` (text): link to section in this file
5. Add columns: **Backlog** · **In Progress** · **QA Testing** · **Prod Ready** · **Done**

### Creating Issues from This Document
Each User Story (E1-US1 through E5-US1) maps to one GitHub Issue. Label scheme:
- `epic:auth` `epic:vox` `epic:chanakya` `epic:pipeline` `epic:payment`
- `env:prod` `env:qa` `env:both`
- `status:done` `status:qa` `status:backlog`

---

---

## Traceability Matrix

See `docs/TRACEABILITY_MATRIX.md` for the full requirements ↔ code ↔ test mapping.

---

*Elevox Sprint 5 SDLC · Engineering · Last updated 2026-04-09*
