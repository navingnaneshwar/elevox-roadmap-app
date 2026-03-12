# Elevox — Issue Log
**Maintained by:** Engineering
**Rule:** Every bug, production error, or unexpected failure MUST be logged here within 24 hours of discovery. Include RCA and fix. This is institutional memory for production operations.
**Format:** Add new rows to the top of the Active Issues table. Move to Resolved when fixed and verified.

---

## Active Issues

| ID | Date | Severity | Sprint | Component | Error Description | RCA | Fix | Status |
|---|---|---|---|---|---|---|---|---|
| ISS-008 | 2026-03-12 | P1 | S2 | `UpgradePage.jsx` | Stripe checkout not wired — "Get Started" buttons call `mailto:hello@elevox.com` instead of redirecting to Stripe Checkout | Stripe checkout was deferred in Sprint 2 due to time constraints. `create-checkout` Edge Function is complete but never called from the frontend. | Wire `handleUpgrade(planId)` in UpgradePage to call `create-checkout` Edge Function and redirect to returned URL. See TDD Section 2.1. | **Open — Sprint 3 S3-01** |
| ISS-009 | 2026-03-12 | P1 | S2 | `mentor-chat/index.ts` | No server-side plan enforcement — any authenticated user can call `mentor-chat` with any `phase_id` regardless of their subscription | Plan guard was never added to the Edge Function. Client-side lock in Dashboard was assumed sufficient. | Add PLAN_PHASE_ACCESS map and guard at start of handler. Return HTTP 403 if `phase_id` exceeds plan. See TDD Section 2.2. | **Open — Sprint 3 S3-02** |
| ISS-010 | 2026-03-12 | P2 | S2 | `GhostwriterPanel.jsx` | Draft selection does not persist to DB — clicking "Use this draft" only updates local state, no write to `content_drafts` or `content_calendar` | DB write step was omitted in Sprint 2 implementation. `saveContentDraft` and `updateCalendarEventBody` helpers were not created in supabase.js. | Add DB helpers to supabase.js, update GhostwriterPanel to write on selection, pass `calendarEventId` prop from CalendarLogistics. See TDD Section 2.3. | **Open — Sprint 3 S3-03** |
| ISS-011 | 2026-03-12 | P2 | S2 | `Roadmap.jsx` | Roadmap component cards have no click handler — clicking any phase component does nothing | Navigation was not implemented when Roadmap was fixed in Sprint 2 Task 4. Task focused on content correctness, not UX interaction. | Add `useNavigate` hook and click handler routing to `/coach/:phaseId/:componentId` for unlocked components. See TDD Section 2.4. | **Open — Sprint 3 S3-04** |
| ISS-012 | 2026-03-12 | P2 | S2 | `ApprovalWorkflow.jsx` | ESLint error severity 2 — `setSimStep(0)` called synchronously inside `useEffect` causing potential infinite re-render loop in Simulation tab | `useEffect` dependency array includes a state value that changes when `setSimStep` fires, creating a dependency cycle. React detects this as a re-render risk. | Wrap initialisation in `useRef` guard or move to empty-dependency useEffect. See TDD Section 2.5. | **Open — Sprint 3 S3-05** |
| ISS-013 | 2026-03-12 | P3 | S2 | `CalendarLogistics.jsx` | One section uses `background: '#F8FAFC'` (light grey) — inconsistent with dark platform theme | Styling inconsistency introduced during Sprint 2 calendar development. Light-theme value imported from a different project or prototype. | Replace with `#070B14` or `rgba(13,18,32,0.8)` to match design tokens. | **Open — Sprint 3 S3-06** |
| ISS-014 | 2026-03-12 | P3 | S1 | `src/App.css` | Legacy Vite boilerplate file (`App.css`) not deleted — contains CSS logo spin animation with no function in the app | CLAUDE.md Rule (delete on sight) was documented but not executed. File has remained since initial Vite scaffold. | Delete `src/App.css`. Remove `import './App.css'` from `src/App.jsx`. | **Open — Sprint 3 S3-06** |

---

## Resolved Issues

| ID | Date Found | Date Fixed | Severity | Sprint | Component | Error Description | RCA | Fix Applied |
|---|---|---|---|---|---|---|---|---|
| ISS-001 | 2026-03-10 | 2026-03-10 | P1 | S1 | `App.jsx` | Blank page on submit — fast-refresh module circularity caused React component tree to unmount unexpectedly on form submission | Named export + default export conflict between `OnboardingForm` and `App.jsx` caused Vite HMR to trigger a full reload mid-submit, resetting state and showing a blank page | Resolved circular import by restructuring component exports. Commit: `fix: resolve blank page on submit due to fast-refresh module circularities` (`70c8bda`) |
| ISS-002 | 2026-03-10 | 2026-03-10 | P1 | S1 | `OnboardingPage.jsx` | Onboarding redirect not firing — after `finishOnboarding()` success, user remained on `/onboarding` | `navigate('/dashboard')` called before async Supabase write completed. `await` was missing. | Added `await` before `finishOnboarding()` and placed `navigate` in the `.then()` chain. Commit: `fix: resolve lint errors and onboarding redirect` (`1dc2bae`) |
| ISS-003 | 2026-03-10 | 2026-03-10 | P2 | S1 | `OnboardingForm.jsx` | Syntax error — missing closing `</div>` tag in OnboardingForm caused entire component tree to fail to parse | Manual JSX editing introduced unclosed tag; no JSX linting caught it at save time | Restored missing div closer. Commit: `fix: restore missing div closer in OnboardingForm, fix syntax error in Roadmap.jsx` (`3b4ef32`) |
| ISS-004 | 2026-03-10 | 2026-03-10 | P2 | S1 | `ContentFormats.jsx` | Duplicate import causing build failure — `ContentFormats` was imported twice in `CalendarLogistics.jsx` | Copy-paste error during Sprint 1 integration step for the Formats tab | Removed duplicate import line. Commit: `fix: remove duplicate ContentFormats import causing build failure` (`b74c4d1`) |
| ISS-005 | 2026-03-11 | 2026-03-11 | P1 | S2 | `CoachingSessionPage.jsx` | 401 Unauthorized from `mentor-chat` Edge Function — JWT not passed correctly in Authorization header | Edge Function was originally calling a different function path; session token was fetched but passed as `token` instead of `access_token` from the session object | Switched to correct `session.access_token` and verified JWT format accepted by Supabase Edge Function validator. Commit: `fix: switch coaching session to mentor-chat edge function — fixes 401 JWT error` (`25a99f0`) |
| ISS-006 | 2026-03-11 | 2026-03-11 | P2 | S2 | `CoachingSessionPage.jsx` | Raw 401/400 error codes displayed to user when billing check fails — instead of a friendly message | Billing guard in `mentor-chat` returned raw HTTP error object which the frontend displayed directly without checking the response status code | Added response status check in `CoachingSessionPage`: if status is 401/400/402, display user-friendly "Upgrade your plan" message. Commit: `fix: friendly billing error message in mentor-chat` (`39a840c`) |
| ISS-007 | 2026-03-11 | 2026-03-12 | P1 | S2 | All routes | Vercel 404 on direct URL load — navigating to `/dashboard` or `/coach/1/0` directly returned Vercel 404 because SPA routes were not configured | React Router handles routing client-side, but Vercel treats non-root paths as file requests. No `vercel.json` rewrite rules were present. | Added `vercel.json` with SPA rewrite rules: all paths → `index.html`. Commit: `fix: add vercel.json SPA rewrites so all routes load correctly` (`fabaaed`) |

---

## Issue Log Rules (from CLAUDE.md Rule 7)

1. **Every bug gets an ID** — format `ISS-NNN`, sequential
2. **Log within 24 hours** of discovery — not after the fix
3. **All fields required** — no partial entries
4. **RCA must explain WHY** — not just what happened
5. **Fix must be specific** — include file, approach, and commit hash when available
6. **Status options:** `Open`, `In Progress`, `Open — Sprint X SX-YY`, `Resolved`
7. **Never delete rows** — resolved issues stay in the Resolved table for reference
8. **Production incidents** get severity P0 and must be logged immediately

### Severity Guide

| Severity | Definition | Example |
|---|---|---|
| P0 | Production outage or data loss | Supabase DB unreachable, auth broken |
| P1 | Feature completely non-functional | Stripe checkout broken, AI chat failing |
| P2 | Feature degraded or incomplete | Draft not saving to DB, wrong styling |
| P3 | Cosmetic or minor code quality | Wrong background colour, unused file |
| P4 | Technical debt / non-urgent | Missing type annotations, verbose code |

---

*Last updated: 2026-03-12*
*Issue count: 14 total (7 active, 7 resolved)*
