# Sprint 3 Plan
## Elevox Platform
**Sprint Duration:** 2 weeks
**Start Date:** March 2026
**Status:** Planning
**Velocity:** Based on Sprint 2 completion rate

---

## Sprint Goal

> **"Production-ready monetisation, server-enforced plan access, and a live end-to-end content pipeline from AI ghostwriting to calendar approval."**

---

## Sprint 3 Capacity

| Role | Allocation |
|---|---|
| Frontend Engineer | Full sprint |
| Backend (Edge Functions) | Part sprint (2–3 days) |
| QA | Last 3 days |
| Product Review | End of sprint |

---

## User Stories & Acceptance Criteria

---

### S3-01 — Stripe Checkout Live
**Priority:** P0 — Blocker
**Estimate:** 3 points
**Linked FRS:** FR-01
**Linked TDD:** Section 2.1

**As a** CxO who wants to upgrade,
**I want** clicking "Get Started" on any plan to take me to Stripe's checkout,
**So that** I can pay and immediately access my coaching phases.

**Acceptance Criteria:**
- [ ] AC1: Clicking "Get Started" on Foundation plan redirects to Stripe Checkout for `starter` price
- [ ] AC2: Clicking "Get Started" on Authority plan redirects to Stripe Checkout for `authority` price
- [ ] AC3: Clicking "Get Started" on Legacy plan redirects to Stripe Checkout for `legacy` price
- [ ] AC4: Button shows loading state while API call is in flight
- [ ] AC5: Completing checkout with test card `4242 4242 4242 4242` updates `profiles.plan` in DB
- [ ] AC6: After checkout, user is redirected to `/dashboard?welcome=1`
- [ ] AC7: Dashboard shows newly unlocked phases after successful checkout
- [ ] AC8: Cancelling at Stripe checkout returns user to `/upgrade`
- [ ] AC9: If the Edge Function returns an error, an inline error message appears (no `alert()`)
- [ ] AC10: Currently subscribed users see "Manage Subscription" linking to Stripe Portal

**Definition of Done:** Stripe test card flow completes end-to-end, `profiles.plan` updated in DB, correct phases unlocked in dashboard.

---

### S3-02 — Server-Side Plan Enforcement
**Priority:** P0 — Security
**Estimate:** 2 points
**Linked FRS:** FR-02
**Linked TDD:** Section 2.2

**As a** platform operator,
**I want** the mentor-chat Edge Function to verify the user's plan before responding,
**So that** paid content cannot be accessed by free or expired accounts.

**Acceptance Criteria:**
- [ ] AC1: `starter` user calling `mentor-chat` with `phase_id: 3` receives HTTP 403 with `{ error: 'plan_required', required_plan: 'authority' }`
- [ ] AC2: `authority` user calling with `phase_id: 5` receives HTTP 403 with `{ error: 'plan_required', required_plan: 'legacy' }`
- [ ] AC3: `legacy` user calling with any phase_id receives HTTP 200
- [ ] AC4: User with `plan_status: 'past_due'` receives HTTP 403 with `{ error: 'payment_required' }`
- [ ] AC5: CoachingSessionPage displays an upgrade CTA (not an error crash) when receiving 403
- [ ] AC6: Upgrade CTA links to `/upgrade`
- [ ] AC7: Client-side lock in Dashboard.jsx still prevents navigation to locked phases (defence in depth)

**Definition of Done:** `starter` user cannot receive AI coaching responses for Phase 3+ regardless of direct API calls.

---

### S3-03 — Ghostwriter → Calendar Pipeline
**Priority:** P1 — Core Feature
**Estimate:** 5 points
**Linked FRS:** FR-03
**Linked TDD:** Section 2.3

**As an** EA managing content for a CxO,
**I want** to click "AI Draft" on any calendar row, select a generated draft, and have it saved to that content slot,
**So that** the AI-generated content flows directly into the approval pipeline.

**Acceptance Criteria:**
- [ ] AC1: Every row in the Schedule tab shows a "✦ AI Draft" button
- [ ] AC2: Clicking "AI Draft" opens GhostwriterPanel with the correct `calendar_event_id`
- [ ] AC3: GhostwriterPanel generates 3 drafts via `ghostwrite-post` Edge Function
- [ ] AC4: Clicking "Use this draft" on a panel opened from a calendar row inserts a row in `content_drafts` table
- [ ] AC5: `content_calendar` row updates: `content_body` = draft text, `status` = 'draft', `ai_generated` = true
- [ ] AC6: Calendar row preview updates inline after selection (no page reload)
- [ ] AC7: If GhostwriterPanel opened standalone (no calendar row), "Use this draft" copies to clipboard
- [ ] AC8: Toast confirmation appears after clipboard copy

**Definition of Done:** Full flow — calendar row → AI Draft panel → 3 variants → select → verify in Supabase Table Editor that `content_drafts` and `content_calendar` both updated.

---

### S3-04 — Roadmap Navigation to Coach Sessions
**Priority:** P1 — UX
**Estimate:** 2 points
**Linked FRS:** FR-04
**Linked TDD:** Section 2.4

**As a** CxO,
**I want** to click on any coaching component in the Roadmap and be taken directly to that session,
**So that** I can navigate my coaching journey from a single visual overview.

**Acceptance Criteria:**
- [ ] AC1: Clicking an unlocked component navigates to `/coach/:phaseId/:componentId`
- [ ] AC2: Cursor is `pointer` on unlocked components
- [ ] AC3: Clicking a locked component does NOT navigate — shows inline "Upgrade to unlock" message
- [ ] AC4: Locked component cursor is `not-allowed`
- [ ] AC5: Upgrade tooltip includes "View Plans →" link to `/upgrade`
- [ ] AC6: Phase 1 components are always clickable for any authenticated user
- [ ] AC7: Unlocked components show `→` arrow indicator on hover

**Definition of Done:** Clicking Phase 1 Component 0 on the Roadmap navigates to `/coach/1/0` and opens the coaching session.

---

### S3-05 — ApprovalWorkflow Stability Fix
**Priority:** P1 — Bug Fix
**Estimate:** 1 point
**Linked FRS:** FR-05
**Linked TDD:** Section 2.5

**As a** developer,
**I want** the ApprovalWorkflow component to have no React hook errors,
**So that** the platform passes ESLint and doesn't degrade in production.

**Acceptance Criteria:**
- [ ] AC1: `npm run lint` exits with code 0
- [ ] AC2: Opening the Simulation tab does not produce "Too many re-renders" error in browser console
- [ ] AC3: Simulation steps advance on button click
- [ ] AC4: Simulation resets correctly

**Definition of Done:** `npm run lint` clean, no console errors on Simulation tab.

---

### S3-06 — CalendarLogistics Dark Theme & App.css Cleanup
**Priority:** P2 — Code Quality
**Estimate:** 1 point
**Linked FRS:** FR-06, FR-07

**As a** user,
**I want** the Calendar page to match the dark theme of the rest of the platform,
**And as** a developer, I want legacy Vite boilerplate removed.

**Acceptance Criteria:**
- [ ] AC1: No `#F8FAFC` or light-theme background colours in CalendarLogistics.jsx
- [ ] AC2: `src/App.css` is deleted
- [ ] AC3: `src/App.jsx` has no `import './App.css'` line
- [ ] AC4: `npm run build` succeeds after App.css removal

**Definition of Done:** Build passes, Calendar renders with dark background.

---

### S3-07 — Issue Log Setup & Documentation
**Priority:** P1 — Process
**Estimate:** 1 point
**Linked FRS:** FR-08

**As a** team,
**I want** a persistent issue log that captures all errors with RCA and fix notes,
**So that** we have institutional memory for production incidents.

**Acceptance Criteria:**
- [ ] AC1: `docs/ISSUE_LOG.md` exists and is formatted as a table
- [ ] AC2: All known issues from Sprints 1 and 2 are logged
- [ ] AC3: CLAUDE.md contains Rule 7 mandating issue log updates
- [ ] AC4: All new bugs found in Sprint 3 development are added before sprint close

**Definition of Done:** Issue log exists, CLAUDE.md updated, all Sprint 1–2 issues documented.

---

## Sprint 3 Backlog (Lower Priority — If Capacity Allows)

| Item | Points | Notes |
|---|---|---|
| Rate limiting on Edge Functions | 2 | Add `rate_limit` header checks |
| Input sanitisation on mentor-chat | 1 | Validate `message` length < 4000 chars |
| Dashboard welcome toast for `?welcome=1` | 1 | After Stripe checkout success |
| Stripe webhook `payment_failed` email | 2 | Verify send-notification is called on failure |
| Session cleanup cron | 3 | Archive sessions older than 90 days |

---

## Sprint 3 Velocity Summary

| Story | Points | Priority |
|---|---|---|
| S3-01 Stripe Checkout | 3 | P0 |
| S3-02 Server Plan Enforcement | 2 | P0 |
| S3-03 Ghostwriter Pipeline | 5 | P1 |
| S3-04 Roadmap Navigation | 2 | P1 |
| S3-05 ApprovalWorkflow Fix | 1 | P1 |
| S3-06 Theme + Cleanup | 1 | P2 |
| S3-07 Issue Log | 1 | P1 |
| **Total** | **15 pts** | |

---

## Sprint 3 Definition of Done (Global)

A story is only "Done" when ALL of the following are true:
- [ ] Code implemented per TDD specification
- [ ] All acceptance criteria pass
- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] Relevant Edge Functions redeployed via `supabase functions deploy`
- [ ] Manual smoke test on production URL passes
- [ ] Issue log updated with any bugs found
- [ ] `.ralph/fix_plan.md` task marked `[x]`
- [ ] Code committed with conventional commit message and pushed to remote

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Stripe Checkout redirect loop | Test cancel_url / success_url with Stripe CLI before deploy |
| Plan enforcement breaking existing sessions | Test all 3 plans in staging before deploying mentor-chat |
| CalendarLogistics rewrite introducing regressions | Read component fully before editing; test all 4 tabs |
| ApprovalWorkflow fix breaking simulation | Write manual test steps before and after fix |

---

*Sprint owner: Engineering*
*Sign-off required from: Product before sprint start*
