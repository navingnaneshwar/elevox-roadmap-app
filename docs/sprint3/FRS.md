# Functional Requirements Specification (FRS)
## Elevox — Sprint 3
**Version:** 1.0
**Date:** March 2026
**Status:** Approved for Development
**Linked BRD:** docs/sprint3/BRD.md

---

## 1. Overview

This document specifies the exact functional behaviour for every feature in Sprint 3. Each requirement maps to a BRD business requirement. Acceptance criteria are written as testable conditions.

---

## 2. FR-01 — Stripe Checkout Integration
**Maps to:** BR-01
**Files:** `src/pages/UpgradePage.jsx`, `supabase/functions/create-checkout/index.ts`

### 2.1 Current State
`UpgradePage.jsx` renders three plan cards. Each "Get Started" button currently opens `mailto:hello@elevox.com`. The `create-checkout` Edge Function is fully built and returns a Stripe Checkout URL.

### 2.2 Required Behaviour

**On plan button click:**
1. Button enters loading state (disabled, spinner or "Processing…" label)
2. Frontend calls `create-checkout` Edge Function with `{ plan: 'starter' | 'authority' | 'legacy' }`
3. Edge Function returns `{ url: string }` — a Stripe-hosted Checkout URL
4. Frontend redirects user to `url` via `window.location.href = url`
5. On successful payment, Stripe calls the `stripe-webhook` Edge Function
6. Webhook updates `profiles.plan` and `profiles.plan_status = 'active'`
7. User is redirected back to `/dashboard` (Stripe success URL, configured in create-checkout)
8. Dashboard reflects new plan — previously locked phases are now accessible

**Error handling:**
- If Edge Function returns `{ error }`, display inline error message on button (not alert())
- If network request fails, show "Something went wrong. Please try again." with retry button
- Loading state clears on error

**Stripe cancel URL:** redirect back to `/upgrade` (user can try again)
**Stripe success URL:** redirect to `/dashboard?welcome=1` (dashboard shows upgrade confirmation)

### 2.3 Acceptance Criteria
- [ ] Clicking any plan button disables it and shows loading state
- [ ] Stripe Checkout page opens for test card `4242 4242 4242 4242`
- [ ] Completing checkout updates `profiles.plan` in DB within 5 seconds
- [ ] Dashboard unlocks correct phases after checkout completes
- [ ] Pressing back from Stripe returns user to `/upgrade`
- [ ] Error state displays if Edge Function call fails

---

## 3. FR-02 — Server-Side Plan Enforcement
**Maps to:** BR-02
**Files:** `supabase/functions/mentor-chat/index.ts`

### 3.1 Current State
The `mentor-chat` Edge Function accepts any `phase_id` without checking if the user's plan grants access to that phase.

### 3.2 Plan-to-Phase Map

| Plan | Allowed Phase IDs |
|---|---|
| `starter` | `1`, `2` |
| `authority` | `1`, `2`, `3`, `4` |
| `legacy` | `1`, `2`, `3`, `4`, `5`, `6` |
| `null` / unset | None (0 phases) |

### 3.3 Required Behaviour

At the start of `mentor-chat` handler:
1. Decode JWT to get `user_id`
2. Query `profiles` table: `SELECT plan, plan_status FROM profiles WHERE id = user_id`
3. Check `plan_status = 'active'` (or `'trialing'`)
4. Look up allowed phases from the map above
5. If requested `phase_id` is not in allowed list → return `HTTP 403` with body `{ error: 'plan_required', required_plan: 'authority', current_plan: 'starter' }`
6. Frontend `CoachingSessionPage` must handle 403 response: display upgrade prompt with link to `/upgrade`

### 3.4 Acceptance Criteria
- [ ] `starter` plan user calling phase 3 component → 403 response
- [ ] `authority` plan user calling phase 5 component → 403 response
- [ ] `legacy` plan user calling any phase → 200 response
- [ ] User with `plan_status = 'past_due'` → 403 with message "Payment required"
- [ ] CoachingSessionPage shows upgrade CTA when receiving 403
- [ ] Client-side guard in Dashboard still present (performance, not security)

---

## 4. FR-03 — Ghostwriter → Calendar Pipeline
**Maps to:** BR-03
**Files:** `src/components/GhostwriterPanel.jsx`, `src/components/CalendarLogistics.jsx`, `src/lib/supabase.js`

### 4.1 Current State
`GhostwriterPanel` calls `ghostwrite-post`, displays 3 draft cards, user can click "Use this draft". The selection updates local UI state only — no DB write happens.

### 4.2 Required Behaviour

**When user clicks "Use this draft":**
1. If a `calendar_event_id` was passed as prop to `GhostwriterPanel` (i.e., user opened panel from a calendar row):
   - Insert row into `content_drafts` table: `{ calendar_event_id, user_id, body, version: 1, ai_model: 'claude-sonnet', selected: true }`
   - Update `content_calendar` row: `{ content_body: body, ai_generated: true, status: 'draft' }`
   - Call `onDraftSelected(body)` callback to update parent UI
2. If no `calendar_event_id` (standalone usage):
   - Copy draft to clipboard
   - Show toast: "Draft copied to clipboard"
   - Still call `onDraftSelected(body)` callback

**Schedule tab integration:**
- Each content row in the Schedule tab must show a "✦ AI Draft" button
- Clicking the button opens `GhostwriterPanel` with `calendar_event_id` bound to that row
- After selection, the row's content preview updates inline without page reload

### 4.3 New DB Helper Required
Add to `src/lib/supabase.js`:
```js
export async function saveContentDraft(calendarEventId, userId, body, aiModel) { ... }
export async function updateCalendarEventBody(eventId, userId, body) { ... }
```

### 4.4 Acceptance Criteria
- [ ] "✦ AI Draft" button appears on every Schedule tab content row
- [ ] Opening panel from a row passes `calendar_event_id` to `GhostwriterPanel`
- [ ] Selecting a draft inserts row to `content_drafts` table (verify in Supabase Table Editor)
- [ ] `content_calendar` row `content_body` and `status` update after selection
- [ ] Row content preview updates in Schedule tab after selection (no reload needed)
- [ ] Standalone ghostwriter (no row context) copies draft to clipboard

---

## 5. FR-04 — Roadmap → Coach Session Navigation
**Maps to:** BR-05
**Files:** `src/components/Roadmap.jsx`

### 5.1 Current State
Roadmap shows 6 phase cards with expandable component lists. Components show a lock icon or green indicator based on plan. No click handler navigates to the coaching session.

### 5.2 Required Behaviour

**Unlocked component click:**
- Navigate to `/coach/:phaseId/:componentId`
- `phaseId` = phase number (1–6)
- `componentId` = component index within phase (0–3) or slugified name

**Locked component click:**
- Display inline tooltip: "Upgrade to [Plan] to unlock this phase"
- Link text "View Plans →" navigates to `/upgrade`
- No navigation to coach session

**Visual distinction:**
- Unlocked: cursor pointer, hover highlight, arrow icon `→`
- Locked: cursor not-allowed, lock icon, muted text

### 5.3 Acceptance Criteria
- [ ] Clicking unlocked component navigates to correct `/coach/:phaseId/:componentId` route
- [ ] Clicking locked component shows upgrade tooltip (does not navigate)
- [ ] Link in tooltip routes to `/upgrade`
- [ ] Phase 1 components always navigable for any authenticated user

---

## 6. FR-05 — ApprovalWorkflow Stability Fix
**Maps to:** BR-06
**Files:** `src/components/ApprovalWorkflow.jsx`

### 6.1 Current State
`setSimStep(0)` is called synchronously inside a `useEffect` with a dependency that triggers on every render — causing infinite re-render loop in the Simulation tab. ESLint severity 2 error.

### 6.2 Required Behaviour
- Move `setSimStep(0)` to a separate initialisation that only fires once (empty dependency array, or a `useRef` guard)
- No infinite re-render loop
- Simulation tab runs correctly: steps advance on click, resets cleanly

### 6.3 Acceptance Criteria
- [ ] `npm run lint` exits 0 after fix
- [ ] Opening Simulation tab does not cause React "too many re-renders" error in console
- [ ] Simulation steps advance on "Next Step" button click
- [ ] Simulation resets correctly on "Restart" button click

---

## 7. FR-06 — CalendarLogistics Dark Theme Fix
**Maps to:** BR-07 (code quality)
**Files:** `src/components/CalendarLogistics.jsx`

### 7.1 Current State
CalendarLogistics uses `background: '#F8FAFC'` (light grey) on one section — inconsistent with the platform-wide `#070B14` dark theme.

### 7.2 Required Behaviour
All background colours must use design tokens from `src/index.css`. Replace `#F8FAFC` with `#070B14` or `rgba(13,18,32,0.8)` (card bg) as appropriate.

### 7.3 Acceptance Criteria
- [ ] No `#F8FAFC` or similar light-theme hex values in CalendarLogistics.jsx
- [ ] Calendar page renders consistently dark with rest of platform

---

## 8. FR-07 — App.css Removal
**Maps to:** BR-07 (code quality)
**Files:** `src/App.css`, `src/App.jsx`

### 8.1 Required Behaviour
- Delete `src/App.css`
- Remove the `import './App.css'` line from `src/App.jsx`

### 8.2 Acceptance Criteria
- [ ] `src/App.css` does not exist
- [ ] `src/App.jsx` has no reference to `App.css`
- [ ] `npm run build` succeeds after removal

---

## 9. FR-08 — Issue Log Maintenance (Process Requirement)
**Maps to:** BR-04

### 9.1 Required Behaviour
- `docs/ISSUE_LOG.md` exists and is maintained as the single source of truth for all bugs, errors, and production incidents
- Every new bug/error discovered during development or production MUST be logged within 24 hours
- Each entry must include: ID, date, severity, component, error description, root cause analysis (RCA), fix applied, status
- CLAUDE.md Rule 7 mandates this process

### 9.2 Acceptance Criteria
- [ ] `docs/ISSUE_LOG.md` exists with all known issues from Sprints 1–2 logged
- [ ] CLAUDE.md contains Rule 7 — Issue Log Maintenance
- [ ] All new bugs found in Sprint 3 development are added before closing the sprint

---

## 10. Non-Functional Requirements

| Requirement | Target | Measurement |
|---|---|---|
| Page load time | < 2s on 4G | Lighthouse performance score ≥ 80 |
| Edge Function response | < 3s (non-AI) | Supabase function logs |
| AI response time | < 15s | Acceptable for UX; show loading state |
| Uptime | 99.5% | Vercel + Supabase SLAs |
| Session persistence | Survives page refresh | Supabase Auth handles this |
| Mobile responsiveness | Usable on tablet (768px+) | Manual QA |

---

*Document owner: Engineering*
*Dependencies: BRD v1.0 approved*
