# Elevox Fix Plan — Sprint 3
**SDLC Docs:** `docs/sprint3/` (BRD, FRS, TDD, SPRINT3_PLAN, TEST_PLAN)
**Issue Log:** `docs/ISSUE_LOG.md`
**Sprint Goal:** Production-ready monetisation, server-enforced plan access, live end-to-end content pipeline.

---

## Sprint 3 — Active Tasks

- [ ] S3-01 — Wire Stripe checkout in `src/pages/UpgradePage.jsx` (ISS-008)
      Replace mailto CTA with `create-checkout` Edge Function call + redirect to URL.
      Loading state on button, inline error on failure, success → `/dashboard?welcome=1`.
      **TDD:** Section 2.1 | **Test:** TC-S3-01 | **Points:** 3

- [ ] S3-02 — Server-side plan enforcement in `supabase/functions/mentor-chat/index.ts` (ISS-009)
      Add PLAN_PHASE_ACCESS map. Query `profiles.plan` after JWT decode.
      Return HTTP 403 with `{ error, required_plan }` if phase exceeds plan.
      Frontend: show upgrade CTA on 403. Deploy: `supabase functions deploy mentor-chat`.
      **TDD:** Section 2.2 | **Test:** TC-S3-02 | **Points:** 2

- [ ] S3-03 — Ghostwriter → Calendar DB pipeline (ISS-010)
      Add `saveContentDraft()` and `updateCalendarEventBody()` to `src/lib/supabase.js`.
      Update `GhostwriterPanel.jsx` to accept `calendarEventId` prop and write to DB on select.
      Add per-row "✦ AI Draft" button to CalendarLogistics Schedule tab.
      **TDD:** Section 2.3 | **Test:** TC-S3-03 | **Points:** 5

- [ ] S3-04 — Roadmap click navigation (ISS-011)
      Add `useNavigate` + click handler to `Roadmap.jsx`. Unlocked → `/coach/:phaseId/:componentId`.
      Locked → inline tooltip with upgrade link to `/upgrade`.
      **TDD:** Section 2.4 | **Test:** TC-S3-04 | **Points:** 2

- [ ] S3-05 — Fix ApprovalWorkflow lint error (ISS-012)
      Wrap `setSimStep(0)` in `useRef` guard inside `useEffect` with empty deps.
      Verify: `npm run lint` exits 0, no console errors on Simulation tab.
      **TDD:** Section 2.5 | **Test:** TC-S3-05 | **Points:** 1

- [ ] S3-06 — Dark theme fix + App.css removal (ISS-013, ISS-014)
      Replace `#F8FAFC` in CalendarLogistics with dark token.
      Delete `src/App.css`. Remove `import './App.css'` from `src/App.jsx`.
      **TDD:** Section 2.6 | **Test:** TC-S3-06 | **Points:** 1

- [ ] S3-07 — Issue log setup & CLAUDE.md Rule 7
      `docs/ISSUE_LOG.md` created and all Sprint 1–2 issues logged.
      CLAUDE.md Rule 7 added. ✅ Already done — verify and mark complete.
      **Test:** TC-S3-07 | **Points:** 1

---

## Definition of Done (per story)

Before marking any task [x]:
- [ ] Code implemented per TDD spec
- [ ] All acceptance criteria pass (see SPRINT3_PLAN.md)
- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] Edge Functions redeployed if changed
- [ ] Issue log updated with any bugs found
- [ ] Committed with conventional commit message + pushed

---

## Sprint 3 Backlog (stretch goals)

- [ ] Dashboard welcome toast when `?welcome=1` param present (post-Stripe checkout)
- [ ] Input length validation on `mentor-chat` (max 4000 chars)
- [ ] Rate limiting on Edge Functions
- [ ] Verify `stripe-webhook` sends `send-notification` on `payment_failed`

---

## Sprint 2 — COMPLETED ✅

- [x] Brand Brief page (`BrandBriefPage.jsx`) — 8 sections, `generate-brief` Edge Function
- [x] AI Ghostwriter panel (`GhostwriterPanel.jsx`) — 3 drafts, angle/body/word count
- [x] GhostwriterPanel wired into CalendarLogistics (UI only — DB write Sprint 3)
- [x] Roadmap.jsx content replaced — 6-phase CxO coaching journey (navigation Sprint 3)
- [x] Welcome email (`send-notification` Edge Function) — Resend, 4 email types
- [x] AI Mentor Chat (`CoachingSessionPage.jsx`) — all 24 components, session persistence
- [x] Persistent onboarding — auto-save per step + Save & Exit
- [x] Billing page (`BillingPage.jsx`) + `create-portal-session` Edge Function
- [x] Stripe billing sprint — portal, billing page, payment emails, upgrade banner
- [x] fix-onboarding branch merged — blank-page fix, lint fixes, onboarding redirect

---

## Sprint 1 — COMPLETED ✅

- [x] Supabase Auth — email + LinkedIn OAuth, session persistence, protected routes
- [x] 10-table PostgreSQL schema with RLS policies
- [x] React Router v6 replacing useState navigation
- [x] All 8 pages wired (Login, Signup, Dashboard, Onboarding, Profile, Upgrade, Billing, AuthCallback)
- [x] useProfile.js — 50+ field camelCase → snake_case mapper
- [x] supabase.js — all DB helpers
- [x] ContentFormats.jsx — 8 format cards
- [x] Edge Functions: ghostwrite-post, generate-brief, create-checkout, stripe-webhook
- [x] vercel.json SPA rewrites

## Notes
- All AI calls route through Supabase Edge Functions — never from the browser
- PHASES array in `Dashboard.jsx` is the source of truth for coaching phases
- Design tokens in `src/index.css` — no new hex values
- All bugs must be logged in `docs/ISSUE_LOG.md` per CLAUDE.md Rule 7
