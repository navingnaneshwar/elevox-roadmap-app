# Elevox — Requirements Traceability Matrix (RTM)
**Sprint 5 · April 2026**
**Last updated:** 2026-04-09
**Format:** Requirement ID → User Story → Source File(s) → Edge Function(s) → DB Table(s) → Test Scenario → Status

---

## How to Read This Matrix

| Column | Meaning |
|---|---|
| **Req ID** | Unique requirement identifier (Epic-Story-Req) |
| **User Story** | SDLC doc reference |
| **Source File** | React component or JS lib implementing this |
| **Edge Function** | Supabase Edge Function involved |
| **DB Table** | Primary table(s) read/written |
| **Test ID** | Test scenario from SDLC doc |
| **Prod** | Status in `main` / production |
| **QA** | Status in `qa` branch |
| **Issue** | Linked issue log entry |

---

## E1 — Auth & Onboarding

| Req ID | Requirement | Source File | Edge Function | DB Table | Test | Prod | QA | Issue |
|---|---|---|---|---|---|---|---|---|
| E1.1.1 | Email signup triggers confirmation email | `SignupPage.jsx` | — (Supabase Auth) | `auth.users` | T1.1, T1.2 | ✅ | ✅ | ISS-040 |
| E1.1.2 | "Didn't receive it?" resend works | `SignupPage.jsx` | — | — | T1.3 | ✅ | ✅ | ISS-040 |
| E1.2.1 | `resetPasswordForEmail` sends email | `LoginPage.jsx` | — | — | T2.1 | ✅ | ✅ | ISS-042 |
| E1.2.2 | `/reset-password` route exists and renders form | `ResetPasswordPage.jsx`, `App.jsx` | — | — | T2.2 | ✅ | ✅ | ISS-042 |
| E1.2.3 | Recovery token parsed synchronously on mount | `ResetPasswordPage.jsx` | — | `auth.users` | T2.3, T2.4 | ✅ | ✅ | ISS-044 |
| E1.3.1 | `upsertProfile` uses `.upsert()` not `.update()` | `supabase.js` | — | `profiles` | T3.1, T3.4 | ✅ | ✅ | ISS-043 |
| E1.3.2 | `onboarding_complete` persists on final step | `supabase.js` → `completeOnboarding()` | `agent-orchestrator` | `profiles`, `agent_jobs` | T3.2, T3.3 | ✅ | ✅ | ISS-043 |
| E1.3.3 | `ProtectedRoute` reads `onboarding_complete` | `ProtectedRoute.jsx` | — | `profiles` | T3.4, T3.5 | ✅ | ✅ | ISS-043 |
| E1.4.1 | LinkedIn URL → Tavily Extract → Claude parse | `parse-resume/index.ts` | `parse-resume` | — | T4.2 | ✅ | ✅ | ISS-041 |
| E1.4.2 | PDF + LinkedIn merged before Claude call | `parse-resume/index.ts` | `parse-resume` | — | T4.1 | ✅ | ✅ | ISS-041 |
| E1.4.3 | `JSON.parse` wrapped in `try/catch`, safe fallback | `parse-resume/index.ts` | `parse-resume` | — | T4.3, T4.4 | ✅ | ✅ | ISS-041 |

---

## E2 — Vox Coaching Platform

| Req ID | Requirement | Source File | Edge Function | DB Table | Test | Prod | QA | Issue |
|---|---|---|---|---|---|---|---|---|
| E2.1.1 | `/coach/:phaseId/:componentId` route registered | `App.jsx`, `CoachingSessionPage.jsx` | — | — | T5.1 | ✅ | ✅ | — |
| E2.1.2 | Session loads from DB on mount, no duplicate `sendFirstMessage` | `CoachingSessionPage.jsx` | — | `mentor_sessions` | T5.3 | ✅ | ✅ | — |
| E2.1.3 | `callMentorAPI` has 90-second AbortController timeout | `CoachingSessionPage.jsx` | — | — | T5.6 | ✅ | ✅ | ISS-047 |
| E2.1.4 | `mentor-chat` deployed with `--no-verify-jwt` | — | `mentor-chat` | — | T5.2 | ✅ | ✅ | ISS-047 |
| E2.1.5 | `MAX_TOOL_ROUNDS = 1`, final call `withTools=false` | `mentor-chat/index.ts` | `mentor-chat` | — | T5.2 | ✅ | ✅ | ISS-047 |
| E2.1.6 | Tavily search has 8-second AbortController timeout | `mentor-chat/index.ts` | `mentor-chat` | — | T5.2 | ✅ | ✅ | ISS-047 |
| E2.1.7 | Plan enforcement gate (phase vs plan tier) | `mentor-chat/index.ts` | `mentor-chat` | `profiles` | T5.2 | ✅ | ✅ | — |
| E2.1.8 | Quality-based conclusion (no hard turn limit) | `mentor-chat/index.ts` | `mentor-chat` | — | T5.4, T5.5 | ✅ | ✅ | ISS-049 |
| E2.1.9 | Vox opener call skips tools (`useTools = !isOpener`) | `mentor-chat/index.ts` | `mentor-chat` | — | T5.1 | ✅ | ✅ | — |
| E2.1.10 | `[STAGE_COMPLETE]` sets session complete + queues `build_framework` job | `CoachingSessionPage.jsx` | — | `mentor_sessions`, `agent_jobs` | T5.5 | ✅ | ✅ | — |
| E2.1.11 | Mute button hidden when TTS unavailable | `CoachingSessionPage.jsx` | `generate-speech` | — | — | ✅ | ✅ | ISS-048 |
| E2.2.1 | SessionRecap shown when `status = completed` | `SessionRecap.jsx`, `CoachingSessionPage.jsx` | — | `mentor_sessions` | T6.1, T6.2, T6.3 | ✅ | ✅ | — |
| E2.2.2 | "Request Follow-Up" reopens session with `continuation_flag=true` | `CoachingSessionPage.jsx` | `mentor-chat` | `mentor_sessions` | T6.4 | ✅ | ✅ | — |
| E2.3.1 | Brand Brief locked until Phase 1 `mentor_sessions` row is `completed` | `BrandBriefPage.jsx` | — | `mentor_sessions` | T7.1, T7.3 | ✅ | ✅ | ISS-046 |
| E2.3.2 | Brief unlocked and generate button shown after coaching | `BrandBriefPage.jsx` | `generate-brief` | `brand_briefs` | T7.2 | ✅ | ✅ | ISS-046 |

---

## E3 — Two-Stage Chanakya Intelligence

| Req ID | Requirement | Source File | Edge Function | DB Table | Test | Prod | QA | Issue |
|---|---|---|---|---|---|---|---|---|
| E3.1.1 | `sweep_industry` job type in orchestrator | `agent-orchestrator/index.ts` | `agent-orchestrator` | `agent_jobs` | T8.1 | ❌ | 🔶 | — |
| E3.1.2 | `agent-analyst` handles `sweep_industry` job | `agent-analyst/index.ts` | `agent-analyst` | `industry_signals` | T8.2 | ❌ | 🔶 | — |
| E3.1.3 | `agent-strategist` reads `industry_signals` before building | `agent-strategist/index.ts` | `agent-strategist` | `industry_signals` | T8.3 | ❌ | 🔶 | — |
| E3.2.1 | `gather_intelligence` job triggers Stage 1 Chanakya | `agent-orchestrator/index.ts` | `agent-orchestrator`, `agent-strategist` | `agent_jobs`, `clarification_sessions` | T9.1, T9.2 | ❌ | 🔶 | — |
| E3.2.2 | `clarification_sessions` table with RLS | `20260407_sprint5_two_stage_chanakya.sql` | — | `clarification_sessions` | T9.3 | ❌ | 🔶 | — |
| E3.2.3 | `ClarificationPage` polls until session status changes | `ClarificationPage.jsx` | — | `clarification_sessions` | T9.1, T9.4 | ❌ | 🔶 | — |
| E3.2.4 | User answers written to `user_responses`, status → `answered` | `ClarificationPage.jsx` | — | `clarification_sessions` | T9.3 | ❌ | 🔶 | — |
| E3.2.5 | `answered` status triggers `build_framework` job | `supabase.js` / `agents.js` | `agent-orchestrator` | `agent_jobs` | T9.3 | ❌ | 🔶 | — |
| E3.3.1 | Stage 2 reads `user_responses` when building framework | `agent-strategist/index.ts` | `agent-strategist` | `clarification_sessions`, `brand_frameworks` | T10.1, T10.2 | ❌ | 🔶 | — |
| E3.3.2 | `brand_frameworks` row written on Stage 2 completion | `agent-strategist/index.ts` | `agent-strategist` | `brand_frameworks` | T10.1 | ❌ | 🔶 | — |

---

## E4 — Multi-Agent Content Pipeline

| Req ID | Requirement | Source File | Edge Function | DB Table | Test | Prod | QA | Issue |
|---|---|---|---|---|---|---|---|---|
| E4.1.1 | `self_credibility_score` column in `content_drafts` | `20260407_sprint5_two_stage_chanakya.sql` | — | `content_drafts` | T11.2 | ❌ | 🔶 | — |
| E4.1.2 | `editorial_credibility_score` column in `content_drafts` | `20260407_sprint5_two_stage_chanakya.sql` | — | `content_drafts` | T11.3 | ❌ | 🔶 | — |
| E4.1.3 | Machiavelli does NOT check `approved_for_publish` | `agent-machiavelli/index.ts` | `agent-machiavelli` | `content_drafts` | T11.4 | ✅ | ✅ | ISS-038 |
| E4.2.1 | Shakespeare uses `ghostwriting_rules` from framework | `agent-shakespeare/index.ts` | `agent-shakespeare` | `brand_frameworks`, `content_drafts` | T12.1, T12.2 | 🔶 | 🔶 | — |
| E4.2.2 | Shakespeare self-check threshold 50 | `agent-shakespeare/index.ts` | `agent-shakespeare` | `content_drafts` | T12.3 | 🔶 | 🔶 | — |
| E4.3.1 | Aristotle editorial threshold 75 | `agent-aristotle/index.ts` | `agent-aristotle` | `content_drafts` | T13.1, T13.2 | 🔶 | 🔶 | — |
| E4.3.2 | Rejected drafts have reason in `audit_log` | `agent-aristotle/index.ts` | `agent-aristotle` | `audit_log` | T13.2 | 🔶 | 🔶 | — |
| E4.4.1 | Machiavelli assigns `reserved` slot → `scheduled` | `agent-machiavelli/index.ts` | `agent-machiavelli` | `content_calendar` | T14.1 | 🔶 | 🔶 | ISS-038 |
| E4.4.2 | Machiavelli gracefully handles no available slots | `agent-machiavelli/index.ts` | `agent-machiavelli` | `content_calendar` | T14.2 | 🔶 | 🔶 | ISS-038 |

---

## E5 — Subscription & Payment

| Req ID | Requirement | Source File | Edge Function | DB Table | Test | Prod | QA | Issue |
|---|---|---|---|---|---|---|---|---|
| E5.1.1 | Razorpay order creation | `create-checkout/index.ts` | `create-checkout` | `profiles` | — | ❌ | ❌ | ISS-015 |
| E5.1.2 | Razorpay webhook updates plan status | `razorpay-webhook/index.ts` | — | `profiles` | — | ❌ | ❌ | ISS-015 |
| E5.1.3 | Beta override: all users default `authority` plan | `mentor-chat/index.ts`, `agent-orchestrator/index.ts` | both | `profiles` | — | ✅ | ✅ | ISS-015 |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented, tested, deployed |
| 🔶 | In QA — implemented but not yet in prod |
| ❌ | Not yet implemented |
| 🚫 | Blocked |

---

## Open Issues Affecting Traceability

| Issue | Req IDs Affected | Priority | Notes |
|---|---|---|---|
| ISS-038 | E4.4.1, E4.4.2 | P2 | Machiavelli leaves slots as `reserved` instead of `scheduled` |
| ISS-015 | E5.1.1, E5.1.2 | P1 | Razorpay migration from Stripe not started |
| E3 (all) | E3.1.x – E3.3.x | P1 | Two-Stage Chanakya pending prod deployment after QA validation |

---

*Elevox RTM · Sprint 5 · Last updated 2026-04-09*
*Total requirements: 47 | Done (prod): 25 | In QA: 17 | Backlog: 5*
