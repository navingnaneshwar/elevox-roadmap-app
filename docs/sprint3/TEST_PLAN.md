# Test Plan
## Elevox — Sprint 3
**Version:** 1.0
**Date:** March 2026
**Type:** Manual QA + Automated Lint
**Linked Sprint Plan:** docs/sprint3/SPRINT3_PLAN.md

---

## 1. Scope

This test plan covers all Sprint 3 user stories. Testing is primarily **manual end-to-end** for the current phase. A future sprint will introduce automated E2E testing (Playwright).

**In scope:** S3-01 through S3-07
**Out of scope:** Performance load testing, accessibility audit, mobile native apps

---

## 2. Test Environment

| Environment | URL | Purpose |
|---|---|---|
| Local dev | `http://localhost:5173` | Development testing |
| Production | `https://roadmap-app-gamma-seven.vercel.app` | Pre-release smoke test |
| Supabase | Dashboard Table Editor | DB state verification |
| Stripe | Test mode dashboard | Payment verification |

### Test Accounts Required

| Account | Plan | Purpose |
|---|---|---|
| `test-starter@elevox.com` | starter | Test plan restriction |
| `test-authority@elevox.com` | authority | Test mid-tier access |
| `test-legacy@elevox.com` | legacy | Test full access |
| `test-new@elevox.com` | null | Test upgrade flow |

### Stripe Test Cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined card |
| `4000 0000 0000 9995` | Insufficient funds |

---

## 3. Test Cases

---

### TC-S3-01 — Stripe Checkout

**Preconditions:** Logged in as `test-new@elevox.com` (no plan), Stripe test mode active

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-01-01 | Foundation plan checkout | 1. Go to `/upgrade` 2. Click "Get Started" on Foundation | Button shows "Processing…", redirects to Stripe Checkout page showing $97/mo | ⬜ |
| TC-01-02 | Authority plan checkout | Click "Get Started" on Authority | Redirects to Stripe with $197/mo price | ⬜ |
| TC-01-03 | Legacy plan checkout | Click "Get Started" on Legacy | Redirects to Stripe with $497/mo price | ⬜ |
| TC-01-04 | Successful payment | Complete checkout with card `4242 4242 4242 4242` | Redirected to `/dashboard?welcome=1`; Supabase `profiles.plan = 'starter'`, `plan_status = 'active'` | ⬜ |
| TC-01-05 | Plan unlocked post-payment | After TC-01-04, check dashboard | Phase 1 and 2 cards are unlocked; Phase 3+ remain locked | ⬜ |
| TC-01-06 | Cancel checkout | At Stripe checkout, click back/cancel | Returned to `/upgrade`, no plan change in DB | ⬜ |
| TC-01-07 | Declined card | Use card `4000 0000 0000 0002` | Stripe shows decline message; user remains on Stripe checkout page | ⬜ |
| TC-01-08 | Network error handling | Block network call to Edge Function, click upgrade | Inline error message appears below button; no `alert()` dialog | ⬜ |
| TC-01-09 | Loading state | Click upgrade button | Button disabled while API call in flight | ⬜ |
| TC-01-10 | Already subscribed UX | Log in as `test-starter@elevox.com`, go to `/upgrade` | Button shows "Manage Subscription" linking to Stripe Portal | ⬜ |

---

### TC-S3-02 — Server-Side Plan Enforcement

**Preconditions:** Test accounts with known plans set in `profiles` table

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-02-01 | Starter blocked from Phase 3 | Log in as starter, navigate to `/coach/3/0` | CoachingSessionPage shows upgrade CTA (not AI chat) | ⬜ |
| TC-02-02 | Starter blocked from Phase 5 | Navigate to `/coach/5/0` | Upgrade CTA shown | ⬜ |
| TC-02-03 | Starter allowed Phase 1 | Navigate to `/coach/1/0`, send a message | AI responds normally | ⬜ |
| TC-02-04 | Authority blocked from Phase 5 | Log in as authority, navigate to `/coach/5/0` | Upgrade CTA referencing Legacy plan | ⬜ |
| TC-02-05 | Authority allowed Phase 4 | Navigate to `/coach/4/3`, send message | AI responds normally | ⬜ |
| TC-02-06 | Legacy full access | Log in as legacy, navigate to `/coach/6/3` | AI responds normally | ⬜ |
| TC-02-07 | Direct API call — bypass client guard | Use curl/Postman: POST to `mentor-chat` with starter JWT, `phase_id: 3` | HTTP 403, body: `{ error: 'plan_required', required_plan: 'authority' }` | ⬜ |
| TC-02-08 | past_due account | Set `plan_status = 'past_due'` for test account, send message | HTTP 403, body: `{ error: 'payment_required' }` | ⬜ |
| TC-02-09 | Upgrade CTA link | See TC-02-01 upgrade CTA | CTA contains link to `/upgrade` | ⬜ |
| TC-02-10 | Client-side guard still present | Inspect Dashboard for starter plan | Phase 3+ cards show lock icon and are not clickable | ⬜ |

---

### TC-S3-03 — Ghostwriter → Calendar Pipeline

**Preconditions:** At least one content row exists in `content_calendar` for test user

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-03-01 | AI Draft button visible | Go to `/calendar`, open Schedule tab | Every content row shows "✦ AI Draft" button | ⬜ |
| TC-03-02 | Panel opens from row | Click "✦ AI Draft" on first row | GhostwriterPanel opens | ⬜ |
| TC-03-03 | Drafts generated | Enter topic, click "Generate" | 3 draft cards appear with angle, body, word count | ⬜ |
| TC-03-04 | Draft saved to DB | Click "Use this draft" on any card | Verify in Supabase: `content_drafts` table has new row with correct `calendar_event_id` | ⬜ |
| TC-03-05 | Calendar row updated | After TC-03-04 | `content_calendar` row: `content_body` = draft text, `status = 'draft'`, `ai_generated = true` | ⬜ |
| TC-03-06 | Row preview updates | After TC-03-04 | Schedule tab row shows draft preview without page reload | ⬜ |
| TC-03-07 | Standalone clipboard | Open GhostwriterPanel without row context, select draft | Toast "Draft copied to clipboard" appears; clipboard contains draft text | ⬜ |
| TC-03-08 | Panel closes on select | After TC-03-04 | GhostwriterPanel closes after draft selection | ⬜ |
| TC-03-09 | Multiple rows independent | Click "✦ AI Draft" on row 1, close. Click on row 2 | Row 2's panel is independent — not showing row 1's data | ⬜ |

---

### TC-S3-04 — Roadmap Navigation

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-04-01 | Phase 1 component navigates | Go to `/roadmap`, click first component in Phase 1 | Navigates to `/coach/1/0` | ⬜ |
| TC-04-02 | Phase 2 component navigates | Click component in Phase 2 (as starter plan user) | Navigates to `/coach/2/x` | ⬜ |
| TC-04-03 | Locked component blocked | As starter plan, click component in Phase 3 | Does NOT navigate; shows upgrade message | ⬜ |
| TC-04-04 | Locked tooltip text | Inspect upgrade message on locked component | Contains plan name and "View Plans →" link | ⬜ |
| TC-04-05 | View Plans link works | Click "View Plans →" in locked tooltip | Navigates to `/upgrade` | ⬜ |
| TC-04-06 | Cursor styles | Hover over locked vs unlocked components | Pointer cursor on unlocked, not-allowed on locked | ⬜ |
| TC-04-07 | Arrow indicator | Hover over unlocked component | `→` arrow visible | ⬜ |
| TC-04-08 | Legacy full roadmap | Log in as legacy, check all components | All 24 components clickable | ⬜ |

---

### TC-S3-05 — ApprovalWorkflow Stability

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-05-01 | Lint passes | Run `npm run lint` | Exit code 0, zero errors | ⬜ |
| TC-05-02 | No console errors | Go to `/calendar`, click Approval tab | Browser console shows no React warnings | ⬜ |
| TC-05-03 | Simulation tab loads | Click Simulation tab | Tab loads without freeze or blank screen | ⬜ |
| TC-05-04 | Steps advance | Click "Next Step" button | Simulation advances to next step | ⬜ |
| TC-05-05 | Simulation resets | Click "Restart" | Simulation returns to step 0 | ⬜ |

---

### TC-S3-06 — Theme & Cleanup

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-06-01 | Calendar dark theme | Go to `/calendar` | All sections render with dark background (#070B14 or equivalent), no light grey sections | ⬜ |
| TC-06-02 | App.css removed | Check `src/App.css` | File does not exist | ⬜ |
| TC-06-03 | Build passes | Run `npm run build` | Exits 0 | ⬜ |
| TC-06-04 | No Vite boilerplate | Check for spinning logo or default Vite styles | None visible in app | ⬜ |

---

### TC-S3-07 — Issue Log

| TC ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-07-01 | Issue log exists | Check `docs/ISSUE_LOG.md` | File exists with table format | ⬜ |
| TC-07-02 | Sprint 1–2 issues logged | Review issue log | All known bugs from Sprints 1–2 documented | ⬜ |
| TC-07-03 | CLAUDE.md Rule 7 | Check CLAUDE.md | Rule 7 — Issue Log Maintenance is present | ⬜ |

---

## 4. Regression Test Suite
*Run these after every Sprint 3 change to verify nothing is broken.*

| TC ID | Area | Test |
|---|---|---|
| REG-01 | Auth | Login with email/password works |
| REG-02 | Auth | LinkedIn OAuth redirect works |
| REG-03 | Auth | Protected routes redirect to `/login` when logged out |
| REG-04 | Onboarding | Completing 8-step form saves all data to `profiles` table |
| REG-05 | Onboarding | Auto-save triggers on each step |
| REG-06 | Dashboard | Phase grid renders with correct lock states |
| REG-07 | AI Chat | Sending a message in Phase 1 chat returns AI response |
| REG-08 | Brand Brief | "Generate my brief" button calls Edge Function and renders 8 sections |
| REG-09 | Calendar | All 4 tabs load without error (Schedule, Events, Approval, Formats) |
| REG-10 | Roadmap | Roadmap page loads, 6 phases visible |
| REG-11 | Billing | BillingPage loads and shows current plan |
| REG-12 | Profile | ProfilePage shows onboarding answers |
| REG-13 | Build | `npm run build` exits 0 |
| REG-14 | Lint | `npm run lint` exits 0 |

---

## 5. Sign-Off Criteria

Sprint 3 is **ready for production** when:

- [ ] All Sprint 3 test cases (TC-01 through TC-07) pass ⬜ count = 0
- [ ] All regression tests (REG-01 through REG-14) pass
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Stripe test card `4242 4242 4242 4242` completes checkout end-to-end
- [ ] Issue log updated with any bugs found during QA
- [ ] Product owner has reviewed and approved

---

*Test plan owner: QA / Engineering Lead*
*Test execution window: Last 3 days of Sprint 3*
