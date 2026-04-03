# Elevox — Traceability Matrix
**Last updated:** March 2026 | **Sprint:** S3 in progress

> Traces every feature from business requirement → FRS → sprint story → TDD → code → DB → Edge Function → known issues.

---

## Matrix Legend

| Column | Description |
|---|---|
| **BRD Ref** | Business requirement from `docs/sprint3/BRD.md` |
| **FRS Ref** | Functional requirement from `docs/sprint3/FRS.md` |
| **Sprint Story** | Story ID (Sn-nn) and sprint |
| **TDD Ref** | Technical design section from `docs/sprint3/TDD.md` |
| **Frontend Files** | Pages / components that implement the feature |
| **Edge Functions** | Supabase Edge Functions called by the feature |
| **DB Tables** | Supabase tables read or written |
| **Issues** | Linked ISS-NNN from `docs/ISSUE_LOG.md` |
| **Status** | ✅ Complete · 🔄 In Progress · ❌ Open · 🔒 Deferred |

---

## 1. Authentication & Onboarding

| ID | Feature | BRD Ref | FRS Ref | Sprint Story | TDD Ref | Frontend Files | Edge Functions | DB Tables | Issues | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | Email sign-up | BR-01 | FR-AUTH-01 | S1 | — | `SignupPage.jsx` | — | `profiles` | ISS-001, ISS-002 | ✅ |
| T-002 | Email log-in | BR-01 | FR-AUTH-02 | S1 | — | `LoginPage.jsx` | — | `profiles` | — | ✅ |
| T-003 | LinkedIn OAuth | BR-01 | FR-AUTH-03 | S1 | — | `LoginPage.jsx`, `AuthCallbackPage.jsx` | — | `profiles` | ISS-016 | ✅ |
| T-004 | Forgot password | BR-01 | FR-AUTH-04 | S1 | — | `LoginPage.jsx` | — | `profiles` | — | ✅ |
| T-005 | 8-step onboarding form | BR-02 | FR-ONB-01 | S1 | — | `OnboardingForm.jsx`, `OnboardingPage.jsx` | — | `profiles` | ISS-001, ISS-002, ISS-003, ISS-017 | ✅ |
| T-006 | Resume PDF parse | BR-02 | FR-ONB-02 | S3 | § 2.6 | `OnboardingForm.jsx` | `parse-resume` | `profiles` | ISS-018, ISS-019, ISS-020, ISS-021 | ✅ |
| T-007 | Profile view | BR-02 | FR-ONB-03 | S1 | — | `ProfileView.jsx`, `ProfilePage.jsx` | — | `profiles` | — | ✅ |
| T-008 | Welcome email after onboarding | BR-02 | FR-ONB-04 | S2 (Task 5) | — | `OnboardingPage.jsx` | `send-notification` | `profiles` | — | ✅ |
| T-009 | ProtectedRoute auth guard | BR-01 | FR-AUTH-05 | S1 | — | `ProtectedRoute.jsx`, `App.jsx` | — | — | ISS-007 | ✅ |

---

## 2. Brand Brief & AI Strategy

| ID | Feature | BRD Ref | FRS Ref | Sprint Story | TDD Ref | Frontend Files | Edge Functions | DB Tables | Issues | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| T-010 | Generate Brand Brief (AI) | BR-03 | FR-BRIEF-01 | S2 (Task 2) | — | `BrandBriefPage.jsx` | `generate-brief` | `brand_briefs` | — | ✅ |
| T-011 | Display Brand Brief sections | BR-03 | FR-BRIEF-02 | S2 (Task 2) | — | `BrandBriefPage.jsx` | — | `brand_briefs` | — | ✅ |
| T-012 | Brand Brief versioning | BR-03 | FR-BRIEF-03 | S2 | — | `BrandBriefPage.jsx` | `generate-brief` | `brand_briefs` | — | ✅ |

---

## 3. Coaching Phases & AI Mentor

| ID | Feature | BRD Ref | FRS Ref | Sprint Story | TDD Ref | Frontend Files | Edge Functions | DB Tables | Issues | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| T-013 | Phase dashboard overview | BR-04 | FR-COACH-01 | S1 | — | `Dashboard.jsx`, `DashboardPage.jsx` | — | `profiles` | — | ✅ |
| T-014 | Phase 1–2 access (Starter plan) | BR-04 | FR-COACH-02 | S1 | — | `Dashboard.jsx`, `ProtectedRoute.jsx` | — | `profiles` | — | ✅ |
| T-015 | Phase 1–4 access (Authority plan) | BR-04 | FR-COACH-03 | S1 | — | `Dashboard.jsx`, `ProtectedRoute.jsx` | — | `profiles` | — | ✅ |
| T-016 | Phase 1–6 access (Legacy plan) | BR-04 | FR-COACH-04 | S1 | — | `Dashboard.jsx`, `ProtectedRoute.jsx` | — | `profiles` | — | ✅ |
| T-017 | AI mentor chat session | BR-04 | FR-COACH-05 | S2 | — | `CoachingSessionPage.jsx` | `mentor-chat` | `mentor_sessions` | ISS-005, ISS-006, ISS-022, ISS-023, ISS-024, ISS-025, ISS-026 | ✅ |
| T-018 | Deliverables extraction from sessions | BR-04 | FR-COACH-06 | S2 | — | `CoachingSessionPage.jsx` | `mentor-chat` | `deliverables` | — | ✅ |
| T-019 | **Server-side plan enforcement (mentor-chat)** | BR-04 | FR-02 | **S3-02** | § 2.2 | `CoachingSessionPage.jsx` | `mentor-chat` | `profiles` | **ISS-009** | 🔄 |
| T-020 | Upgrade CTA on 403 response | BR-04 | FR-02 | S3-02 | § 2.2 | `CoachingSessionPage.jsx` | — | — | ISS-009 | 🔄 |
| T-021 | Roadmap phase overview | BR-04 | FR-04 | S2 (Task 4) | — | `Roadmap.jsx` | — | `profiles` | — | ✅ |
| T-022 | **Roadmap click → coach navigation** | BR-04 | FR-04 | **S3-04** | § 2.4 | `Roadmap.jsx` | — | — | **ISS-011** | ❌ |
| T-023 | Lock indicator + upgrade tooltip on roadmap | BR-04 | FR-04 | S3-04 | § 2.4 | `Roadmap.jsx` | — | — | ISS-011 | ❌ |

---

## 4. Content Calendar & Ghostwriter Pipeline

| ID | Feature | BRD Ref | FRS Ref | Sprint Story | TDD Ref | Frontend Files | Edge Functions | DB Tables | Issues | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| T-024 | Calendar view (Schedule/Events/Approval/Formats tabs) | BR-05 | FR-CAL-01 | S2 (Task 3) | — | `CalendarLogistics.jsx`, `ContentCalendar.jsx` | — | `content_calendar` | ISS-013 | ✅ |
| T-025 | Anchor events management | BR-05 | FR-CAL-02 | S2 | — | `EventsAnchors.jsx` | — | `anchor_events` | — | ✅ |
| T-026 | Content formats configuration | BR-05 | FR-CAL-03 | S2 | — | `ContentFormats.jsx` | — | `calendar_settings` | ISS-004 | ✅ |
| T-027 | Approval workflow (4-tab: Config/Flow/Simulation/SLA) | BR-05 | FR-CAL-04 | S2 | — | `ApprovalWorkflow.jsx` | — | `approvals` | ISS-012 | ✅ |
| T-028 | AI ghostwrite 3 variants | BR-05 | FR-03 | S2 (Task 3) | — | `GhostwriterPanel.jsx`, `CalendarLogistics.jsx` | `ghostwrite-post` | `content_drafts` | — | ✅ |
| T-029 | **Ghostwriter → calendar DB persistence** | BR-05 | FR-03 | **S3-03** | § 2.3 | `GhostwriterPanel.jsx`, `CalendarLogistics.jsx` | `ghostwrite-post` | `content_drafts`, `content_calendar` | **ISS-010** | ❌ |
| T-030 | Calendar row inline preview after draft selection | BR-05 | FR-03 | S3-03 | § 2.3 | `CalendarLogistics.jsx` | — | `content_calendar` | ISS-010 | ❌ |
| T-031 | **ApprovalWorkflow re-render bug fix** | BR-05 | FR-05 | **S3-05** | § 2.5 | `ApprovalWorkflow.jsx` | — | — | **ISS-012** | ❌ |
| T-032 | **CalendarLogistics dark theme fix** | BR-05 | FR-06 | **S3-06** | — | `CalendarLogistics.jsx` | — | — | **ISS-013** | ❌ |

---

## 5. Subscription Plans & Billing

| ID | Feature | BRD Ref | FRS Ref | Sprint Story | TDD Ref | Frontend Files | Edge Functions | DB Tables | Issues | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| T-033 | Plan display (Foundation / Authority / Legacy) | BR-06 | FR-PLAN-01 | S1 | — | `BillingPage.jsx` | — | `profiles` | — | ✅ |
| T-034 | Interest-capture confirm flow (no payment) | BR-06 | FR-01 | **S3-01** | § 2.1 | `BillingPage.jsx` | — | `profiles` | ISS-008, ISS-015 | 🔄 |
| T-035 | "INTEREST REGISTERED" badge + disabled state | BR-06 | FR-01 | S3-01 | § 2.1 | `BillingPage.jsx` | — | — | ISS-015 | 🔄 |
| T-036 | Razorpay live payment (India) | BR-06 | FR-PAY-01 | **Final Sprint** | — | `BillingPage.jsx` | `create-razorpay-order` | `profiles` | ISS-015 | 🔒 |
| T-037 | Stripe Edge Functions (preserved, inactive) | BR-06 | — | — | — | — | `create-checkout`, `stripe-webhook`, `create-portal-session` | — | ISS-008, ISS-015 | 🔒 |
| T-038 | Billing portal (Stripe — inactive) | BR-06 | — | — | — | `BillingPage.jsx` | `create-portal-session` | — | ISS-015 | 🔒 |
| T-039 | **Orchestrator plan enforcement (LangGraph jobs)** | BR-06 | FR-02 | S3 | — | — | `agent-orchestrator` | `agent_jobs`, `profiles` | — | ✅ |

---

## 6. AI Agent Pipeline (LangGraph / Deno)

| ID | Agent | Role | Sprint Delivered | Edge Function | DB Tables Read | DB Tables Written | Secrets Required | Status |
|---|---|---|---|---|---|---|---|---|
| T-040 | **agent-orchestrator** | Job routing + plan enforcement | S3 | `agent-orchestrator` | `agent_jobs`, `profiles` | `agent_jobs` | `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| T-041 | **agent-strategist (Chanakya)** | Brand strategy + executive mentor | S3 | `agent-strategist` | `brand_briefs`, `profiles`, `user_edits` | `deliverables` | `ANTHROPIC_API_KEY` | ✅ |
| T-042 | **agent-analyst** | Industry news sweep + content angles | S3 | `agent-analyst` | `profiles`, `user_edits` | `content_calendar` | `ANTHROPIC_API_KEY`, `TAVILY_API_KEY` | ✅ |
| T-043 | **agent-shakespeare** | Executive ghostwriter (3-variant drafts) | S3 | `agent-shakespeare` | `brand_briefs`, `content_calendar`, `user_edits` | `content_drafts` | `ANTHROPIC_API_KEY` | ✅ |
| T-044 | **agent-aristotle** | Editor + credibility gatekeeper | S3 | `agent-aristotle` | `content_drafts` | `content_drafts`, `coaching_alerts`, `content_calendar` | `ANTHROPIC_API_KEY` | ✅ |
| T-045 | **agent-machiavelli** | Content scheduling + social distribution | S3 | `agent-machiavelli` | `content_calendar`, `content_drafts`, `approvals` | `content_calendar` | `ANTHROPIC_API_KEY` | ✅ |

---

## 7. Database Table → Feature Coverage

| DB Table | Features (T-IDs) | Migrations |
|---|---|---|
| `profiles` | T-001–T-009, T-013–T-016, T-019, T-033–T-036 | `001_initial_schema.sql`, `002_agent_jobs_user_id.sql` |
| `brand_briefs` | T-010–T-012, T-041, T-043 | `001_initial_schema.sql`, `003_brand_brief_mentor_fields.sql` |
| `mentor_sessions` | T-017, T-018 | `001_initial_schema.sql` |
| `deliverables` | T-018, T-041 | `001_initial_schema.sql` |
| `anchor_events` | T-025 | `001_initial_schema.sql` |
| `content_calendar` | T-024, T-028–T-030, T-042, T-045 | `001_initial_schema.sql`, `005_shakespeare_content_drafts.sql` |
| `content_drafts` | T-028–T-030, T-043, T-044 | `005_shakespeare_content_drafts.sql`, `006_aristotle_evaluation_columns.sql` |
| `calendar_settings` | T-026 | `001_initial_schema.sql` |
| `approvals` | T-027, T-045 | `001_initial_schema.sql` |
| `analytics_snapshots` | — | `001_initial_schema.sql` |
| `agent_jobs` | T-039, T-040 | `002_agent_jobs_user_id.sql` |
| `user_edits` | T-041–T-044 | `004_user_edits.sql` |
| `coaching_alerts` | T-044 | `006_aristotle_evaluation_columns.sql` |

---

## 8. Edge Function → Feature Coverage

| Edge Function | Features (T-IDs) | Auth Required | Status |
|---|---|---|---|
| `generate-brief` | T-010, T-011, T-012 | JWT | ✅ Active |
| `ghostwrite-post` | T-028, T-029, T-030 | JWT | ✅ Active |
| `mentor-chat` | T-017, T-018, T-019, T-020 | JWT | ✅ Active |
| `send-notification` | T-008 | JWT | ✅ Active |
| `parse-resume` | T-006 | Bypassed (`--no-verify-jwt`) | ✅ Active |
| `generate-speech` | — | JWT | ✅ Active |
| `agent-orchestrator` | T-039, T-040 | JWT | ✅ Active |
| `agent-strategist` | T-041 | JWT | ✅ Active |
| `agent-analyst` | T-042 | JWT | ✅ Active |
| `agent-shakespeare` | T-043 | JWT | ✅ Active |
| `agent-aristotle` | T-044 | JWT | ✅ Active |
| `agent-machiavelli` | T-045 | JWT | ✅ Active |
| `create-checkout` | T-037 | JWT | 🔒 Inactive (Stripe) |
| `stripe-webhook` | T-037 | Stripe Sig | 🔒 Inactive (Stripe) |
| `create-portal-session` | T-038 | JWT | 🔒 Inactive (Stripe) |

---

## 9. Issue → Feature Traceability

| Issue | Severity | Sprint | Feature (T-ID) | Status |
|---|---|---|---|---|
| ISS-001 | P1 | S1 | T-005 (Onboarding form blank page) | ✅ Resolved |
| ISS-002 | P1 | S1 | T-005 (Onboarding redirect not firing) | ✅ Resolved |
| ISS-003 | P2 | S1 | T-005 (Missing closing div in OnboardingForm) | ✅ Resolved |
| ISS-004 | P2 | S1 | T-026 (Duplicate ContentFormats import) | ✅ Resolved |
| ISS-005 | P1 | S2 | T-017 (401 from mentor-chat — wrong token key) | ✅ Resolved |
| ISS-006 | P2 | S2 | T-017 (Raw 401 shown to user instead of friendly message) | ✅ Resolved |
| ISS-007 | P1 | S2 | T-009 (Vercel 404 on direct URL — missing SPA rewrites) | ✅ Resolved |
| ISS-008 | P1 | S2 | T-034 (Stripe checkout not wired; superseded by ISS-015) | ✅ Resolved |
| ISS-009 | P1 | S2→S3 | **T-019** (No server-side plan enforcement on mentor-chat) | ❌ Open — S3-02 |
| ISS-010 | P2 | S2→S3 | **T-029** (Draft selection not persisted to DB) | ❌ Open — S3-03 |
| ISS-011 | P2 | S2→S3 | **T-022** (Roadmap has no click navigation) | ❌ Open — S3-04 |
| ISS-012 | P2 | S2→S3 | **T-031** (ApprovalWorkflow setSimStep re-render loop) | ❌ Open — S3-05 |
| ISS-013 | P3 | S2→S3 | **T-032** (CalendarLogistics light theme section) | ❌ Open — S3-06 |
| ISS-014 | P3 | S1→S3 | App.css not deleted | ❌ Open — S3-06 |
| ISS-015 | P1 | S3 | T-036/T-037 (Stripe unusable in India — Razorpay deferred) | 🔒 Open — Final Sprint |
| ISS-016 | P2 | S3 | T-003 (OAuth redirect URL mismatch) | ✅ Resolved |
| ISS-017 | P1 | S3 | T-005 (Git conflict markers in OnboardingForm) | ✅ Resolved |
| ISS-018 | P1 | S3 | T-006 (parse-resume 500/400 — pdf-parse crashed Deno) | ✅ Resolved |
| ISS-019 | P1 | S3 | T-006 (Safari crash in pdfjs-dist v4) | ✅ Resolved |
| ISS-020 | P1 | S3 | T-006 (Stripe key pasted over Supabase Anon key) | ✅ Resolved |
| ISS-021 | P1 | S3 | T-006 (parse-resume Invalid JWT from Kong) | ✅ Resolved |
| ISS-022 | P1 | S3 | T-017 (429 from OpenAI — wrong tier for gpt-4o) | ✅ Resolved |
| ISS-023 | P1 | S3 | T-017 (body stream read twice on 403 error) | ✅ Resolved |
| ISS-024 | P1 | S3 | T-017 (plan_status null → all new users blocked) | ✅ Resolved |
| ISS-025 | P1 | S3 | T-017 (OpenAI secret name mismatch in Supabase) | ✅ Resolved |
| ISS-026 | P1 | S3 | T-017 (React render crash from duplicate div in CoachingSessionPage) | ✅ Resolved |

---

## 10. Sprint Story → Acceptance Criteria Status

| Story | Points | Priority | ACs | Status |
|---|---|---|---|---|
| **S3-01** Payment Interest Capture | 2 | P1 | AC3–AC9 open | 🔄 In Progress |
| **S3-02** Server-Side Plan Enforcement | 2 | P0 | AC1–AC7 open | 🔄 In Progress |
| **S3-03** Ghostwriter → Calendar Pipeline | 5 | P1 | AC1–AC8 open | ❌ Not Started |
| **S3-04** Roadmap Navigation | 2 | P1 | AC1–AC7 open | ❌ Not Started |
| **S3-05** ApprovalWorkflow Stability Fix | 1 | P1 | AC1–AC4 open | ❌ Not Started |
| **S3-06** Dark Theme + App.css Cleanup | 1 | P2 | AC1–AC4 open | ❌ Not Started |
| **S3-07** Issue Log Setup | 1 | P1 | AC1–AC4 ✅ | ✅ Complete |

---

## 11. Subscription Plan → Feature Access Map

| Plan | Phases | Features Unlocked | Gate Enforced At |
|---|---|---|---|
| **Starter** (`starter`) | 1–2 | Onboarding, Brand Brief, Phases 1–2 coaching | `Dashboard.jsx` (client) + `mentor-chat` (server, S3-02) |
| **Authority** (`authority`) | 1–4 | All Starter + Phases 3–4, Ghostwriter pipeline | Same as above |
| **Legacy** (`legacy`) | 1–6 | All features, all 6 phases | Same as above |

**Agent pipeline gate (orchestrator):**
| Job Type | Minimum Plan |
|---|---|
| `build_framework` | `starter` |
| All content jobs | `authority` |

---

*Matrix covers Sprint 1 → Sprint 3. Final Sprint items are marked 🔒 (Razorpay, Stripe inactive functions).*
*Source files: `CLAUDE.md`, `docs/ISSUE_LOG.md`, `docs/AGENT_ARCHITECTURE.md`, `docs/sprint3/SPRINT3_PLAN.md`, `docs/sprint3/TDD.md`, `docs/sprint3/FRS.md`*
