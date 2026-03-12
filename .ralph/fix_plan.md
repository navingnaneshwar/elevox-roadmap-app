# Elevox Fix Plan — Sprint 2

## High Priority

- [ ] Task 1 — Wire Stripe checkout in `src/pages/UpgradePage.jsx`
      Replace `alert()` on plan buttons with real `create-checkout` Edge Function call
      and redirect to returned URL. Test card: 4242 4242 4242 4242.

- [ ] Task 2 — Brand Brief display page (`src/pages/BrandBriefPage.jsx`)
      Button triggers `generate-brief` Edge Function → loading state → renders 8 brief
      sections in cards. Add `/brand-brief` route (protected, no plan gate) to App.jsx.

- [ ] Task 3 — AI Ghostwriter UI in `src/components/CalendarLogistics.jsx`
      Add "Draft with AI" button per content row in Schedule tab. Opens panel: topic input
      → calls `ghostwrite-post` → shows 3 draft cards (angle, body, word count, "Use this
      draft" button). Selecting a draft updates the content_calendar row.

- [ ] Task 4 — Fix `src/components/Roadmap.jsx`
      Replace agency ops tool content with the 6-phase CxO coaching journey matching
      the PHASES array from Dashboard.jsx. Show phase cards, components per phase, and
      lock states based on `profile.plan`. Do NOT touch Dashboard.jsx.

- [ ] Task 5 — Welcome email on onboarding complete
      After `finishOnboarding()` succeeds in `src/pages/OnboardingPage.jsx`, call new
      `send-notification` Edge Function. Create `supabase/functions/send-notification/index.ts`
      with Resend welcome email template (name, plan, dashboard link).

## Medium Priority

- [ ] Fix session continuity — returning to mentor chat resumes instead of starts fresh
      `upsertMentorSession()` in supabase.js is ready; chat component needs to call it.

- [ ] Add server-side plan check to phase chat route — currently only client-side guard.

## Completed

- [x] Project initialisation and Ralph setup
- [x] Sprint 1 complete — auth, onboarding, dashboard, calendar, content formats,
      events, approval workflow, coaching sessions all implemented.

## Notes
- Sprint 3+ items (LinkedIn API, analytics, admin, settings, PDF export) are out of scope
- All AI calls must route through Supabase Edge Functions — never call Anthropic directly
- Design tokens live in `src/index.css` — never introduce new hex values
- PHASES array in Dashboard.jsx is the source of truth for coaching phases
