# Elevox Fix Plan — Sprint 2 Status

## Sprint 2 — COMPLETED ✅

- [x] Task 1 — Stripe checkout in UpgradePage
      NOTE: Replaced with email CTA (payments deferred to Sprint 3).
      `create-checkout` and `create-portal-session` Edge Functions are built and ready.
      `BillingPage.jsx` — current plan, status, Stripe portal access, upgrade paths.

- [x] Task 2 — Brand Brief display page (`src/pages/BrandBriefPage.jsx`)
      Triggers `generate-brief` Edge Function → loading state → renders 8 brief
      sections in cards. Route `/brand-brief` added to App.jsx (protected, no plan gate).

- [x] Task 3 — AI Ghostwriter UI (`src/components/GhostwriterPanel.jsx`)
      Wired into CalendarLogistics Schedule tab via "DRAFT A POST WITH AI" toggle button.
      Shows 3 draft cards (angle, body, word count, "Use this draft"). Selected draft
      previewed inline. Calls `ghostwrite-post` Edge Function.

- [x] Task 4 — Fix `src/components/Roadmap.jsx`
      Replaced agency ops content with 6-phase CxO coaching journey matching PHASES array.
      Phase cards, components per phase, lock states based on `profile.plan`.

- [x] Task 5 — Welcome email (`supabase/functions/send-notification/index.ts`)
      Supports: `welcome` · `brief_ready` · `payment_confirmed` · `session_summary`
      Called from `OnboardingPage.jsx` after `finishOnboarding()` succeeds.

- [x] AI Mentor Chat (`src/pages/CoachingSessionPage.jsx`)
      AI chat for all 24 phase components via `mentor-chat` Edge Function.
      Routes: `/phase/:phaseId/session/:componentId` (plan-gated via ProtectedRoute).

- [x] Persistent onboarding with auto-save
      OnboardingForm auto-saves progress on every step. "Save & Exit" in top nav.
      Onboarding state preserved across sessions.

- [x] Billing page (`src/pages/BillingPage.jsx`)
      Current plan display, Stripe Customer Portal link, upgrade paths, payment status.

## Sprint 3 — Backlog

- [ ] Wire Stripe checkout properly (currently email CTA — payments not live)
      `create-checkout` Edge Function ready; `UpgradePage` needs real redirect.
      Stripe test card: 4242 4242 4242 4242.

- [ ] Session continuity — mentor chat resumes existing session vs starting fresh
      `upsertMentorSession()` in supabase.js is built; chat component needs to call it
      on load to restore previous `messages` JSONB array.

- [ ] Server-side plan gate on phase chat routes
      Currently only client-side guard in Dashboard.jsx / ProtectedRoute.
      Add plan verification in the `mentor-chat` Edge Function or middleware.

- [ ] LinkedIn / social posting API integration
- [ ] Analytics dashboard with real social data
- [ ] WhatsApp / Slack approval notifications
- [ ] Admin dashboard
- [ ] Settings page (password change, billing management)
- [ ] Progress PDF export
- [ ] Phase interconnection (Phase 01 insights → Phase 02 prompts)

## Notes
- All AI calls route through Supabase Edge Functions — never from the browser
- Design tokens in `src/index.css` — no new hex values
- PHASES array in `Dashboard.jsx` is the source of truth
- All 10 DB tables have RLS: `auth.uid() = user_id`
- `fix-onboarding` branch merged in (persistent onboarding, ghostwriter UI fixes)
