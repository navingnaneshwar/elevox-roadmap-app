# Technical Design Document (TDD)
## Elevox — Sprint 3
**Version:** 1.0
**Date:** March 2026
**Status:** Approved for Development
**Linked FRS:** docs/sprint3/FRS.md

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 VERCEL (Frontend)                │
│  React 19 + Vite + React Router v6              │
│                                                  │
│  /upgrade ──────────────────────────┐           │
│  /dashboard ────────────────────┐   │           │
│  /coach/:phase/:component ──┐   │   │           │
│  /calendar ─────────────┐   │   │   │           │
└────────────────────────────────────────────────-┘
         │JWT          │JWT   │JWT   │JWT
         ▼             ▼      ▼      ▼
┌─────────────────────────────────────────────────┐
│           SUPABASE EDGE FUNCTIONS (Deno)         │
│                                                  │
│  mentor-chat ─────── + plan check (NEW S3)      │
│  create-checkout ─── wired in UpgradePage (S3)  │
│  ghostwrite-post ─── draft save to DB (S3)      │
│  stripe-webhook ──── subscription lifecycle      │
│  generate-brief ──── brand brief AI generation   │
│  create-portal-session ── billing management    │
│  send-notification ── Resend email delivery     │
└──────────────┬──────────────────────────────────┘
               │ SQL (RLS enforced)
               ▼
┌─────────────────────────────────────────────────┐
│           SUPABASE POSTGRESQL                    │
│                                                  │
│  profiles          content_calendar             │
│  brand_briefs      content_drafts   (NEW use S3)│
│  mentor_sessions   calendar_settings             │
│  deliverables      approvals                    │
│  anchor_events     analytics_snapshots          │
└─────────────────────────────────────────────────┘
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
Anthropic    Stripe     Resend
Claude API  Payments    Email
```

---

## 2. Technical Designs per Feature

---

### 2.1 FR-01 — Stripe Checkout (UpgradePage)

**No new files required.** Changes to `src/pages/UpgradePage.jsx` only.

#### State additions
```jsx
const [loadingPlan, setLoadingPlan] = useState(null) // 'starter'|'authority'|'legacy'|null
const [checkoutError, setCheckoutError] = useState(null)
```

#### Handler
```jsx
async function handleUpgrade(planId) {
  setLoadingPlan(planId)
  setCheckoutError(null)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login'); return }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      }
    )
    const { url, error } = await res.json()
    if (error) throw new Error(error)
    window.location.href = url
  } catch (err) {
    setCheckoutError(err.message || 'Something went wrong. Please try again.')
  } finally {
    setLoadingPlan(null)
  }
}
```

#### Button render
```jsx
<button
  onClick={() => handleUpgrade('starter')}
  disabled={loadingPlan !== null}
>
  {loadingPlan === 'starter' ? 'Processing…' : 'Get Started'}
</button>
{checkoutError && <p style={{ color: '#ef4444' }}>{checkoutError}</p>}
```

#### Stripe URLs (configure in `create-checkout/index.ts`)
```ts
success_url: `${origin}/dashboard?welcome=1`
cancel_url:  `${origin}/upgrade`
```

---

### 2.2 FR-02 — Server-Side Plan Enforcement (mentor-chat)

**File:** `supabase/functions/mentor-chat/index.ts`

#### Plan map constant (add at top of file)
```ts
const PLAN_PHASE_ACCESS: Record<string, number[]> = {
  starter:   [1, 2],
  authority: [1, 2, 3, 4],
  legacy:    [1, 2, 3, 4, 5, 6],
}
```

#### Guard (insert after JWT verification, before AI call)
```ts
// Fetch user plan
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('plan, plan_status')
  .eq('id', user.id)
  .single()

if (profileError || !profile) {
  return new Response(JSON.stringify({ error: 'profile_not_found' }), { status: 403 })
}

const allowedStatus = ['active', 'trialing']
if (!allowedStatus.includes(profile.plan_status)) {
  return new Response(
    JSON.stringify({ error: 'payment_required', current_status: profile.plan_status }),
    { status: 403 }
  )
}

const allowed = PLAN_PHASE_ACCESS[profile.plan] ?? []
const phaseNum = parseInt(phase_id, 10)
if (!allowed.includes(phaseNum)) {
  return new Response(
    JSON.stringify({
      error: 'plan_required',
      current_plan: profile.plan,
      required_plan: phaseNum <= 4 ? 'authority' : 'legacy',
    }),
    { status: 403 }
  )
}
```

#### Frontend handler in CoachingSessionPage.jsx
```jsx
if (res.status === 403) {
  const { error, required_plan } = await res.json()
  if (error === 'plan_required') {
    setPlanError({ required: required_plan })
    return
  }
  if (error === 'payment_required') {
    setPlanError({ paymentRequired: true })
    return
  }
}
```

---

### 2.3 FR-03 — Ghostwriter → Calendar Pipeline

#### New DB Helpers (add to `src/lib/supabase.js`)
```js
export async function saveContentDraft(calendarEventId, userId, body, aiModel = 'claude-sonnet') {
  return supabase
    .from('content_drafts')
    .insert({
      calendar_event_id: calendarEventId,
      user_id: userId,
      body,
      version: 1,
      ai_model: aiModel,
      selected: true,
    })
}

export async function updateCalendarEventBody(eventId, userId, body) {
  return supabase
    .from('content_calendar')
    .update({ content_body: body, ai_generated: true, status: 'draft' })
    .eq('id', eventId)
    .eq('user_id', userId)
}
```

#### GhostwriterPanel props interface
```jsx
// New optional props
GhostwriterPanel.propTypes = {
  onSelectDraft: PropTypes.func.isRequired,   // (body) => void
  onClose: PropTypes.func.isRequired,          // () => void
  calendarEventId: PropTypes.string,           // undefined = standalone mode
}
```

#### Draft selection handler (GhostwriterPanel.jsx)
```jsx
async function handleSelectDraft(draft) {
  if (calendarEventId) {
    // Wired mode — save to DB
    await saveContentDraft(calendarEventId, user.id, draft.body)
    await updateCalendarEventBody(calendarEventId, user.id, draft.body)
  } else {
    // Standalone mode — clipboard
    navigator.clipboard.writeText(draft.body)
    setToast('Draft copied to clipboard')
  }
  onSelectDraft(draft.body)
}
```

#### CalendarLogistics — Schedule tab row change
Each content row currently has no AI button. Add after existing row actions:
```jsx
<button
  onClick={() => { setActiveGhostwriterEventId(event.id); setGhostwriterOpen(true) }}
  style={{ /* indigo outline button */ }}
>
  ✦ AI Draft
</button>

{ghostwriterOpen && activeGhostwriterEventId === event.id && (
  <GhostwriterPanel
    calendarEventId={event.id}
    onSelectDraft={(body) => handleDraftSelected(event.id, body)}
    onClose={() => setGhostwriterOpen(false)}
  />
)}
```

New state:
```jsx
const [activeGhostwriterEventId, setActiveGhostwriterEventId] = useState(null)
```

---

### 2.4 FR-04 — Roadmap → Coach Session Navigation

**File:** `src/components/Roadmap.jsx`

#### Route generation
```jsx
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()

function handleComponentClick(phaseNum, componentIndex, isLocked) {
  if (isLocked) return // tooltip handles UX
  navigate(`/coach/${phaseNum}/${componentIndex}`)
}
```

#### Component element
```jsx
<div
  onClick={() => handleComponentClick(phase.number, idx, isLocked)}
  style={{
    cursor: isLocked ? 'not-allowed' : 'pointer',
    // ... existing styles
  }}
  title={isLocked ? `Upgrade to unlock Phase ${phase.number}` : 'Start coaching session'}
>
  {/* existing component content */}
  {!isLocked && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>→</span>}
</div>
```

---

### 2.5 FR-05 — ApprovalWorkflow Lint Fix

**File:** `src/components/ApprovalWorkflow.jsx`

#### Current broken pattern (line ~109)
```jsx
// ❌ WRONG — setSimStep inside effect with dependency that rerenders
useEffect(() => {
  setSimStep(0)
}, [someStateValue])
```

#### Fix — initialise once with ref guard
```jsx
const simInitialised = useRef(false)

useEffect(() => {
  if (!simInitialised.current) {
    simInitialised.current = true
    setSimStep(0)
  }
}, []) // empty deps — runs once
```

---

### 2.6 FR-07 — App.css Removal

```bash
# Run once
rm src/App.css
# Then edit src/App.jsx — remove the line:
import './App.css'
```

---

## 3. Database Changes

**No new tables required for Sprint 3.**

Sprint 3 uses `content_drafts` and `content_calendar` tables already in the schema.

The only DB change is ensuring the `content_drafts.ai_model` column accepts the value `'claude-sonnet'`. Check current constraint in `001_initial_schema.sql`.

If needed, add migration `002_content_draft_ai_model.sql`:
```sql
-- Only if column has CHECK constraint that doesn't include 'claude-sonnet'
ALTER TABLE content_drafts DROP CONSTRAINT IF EXISTS content_drafts_ai_model_check;
ALTER TABLE content_drafts ADD CONSTRAINT content_drafts_ai_model_check
  CHECK (ai_model IN ('claude-sonnet', 'claude-opus', 'claude-haiku', 'manual'));
```

---

## 4. Edge Function Changes

| Function | Change | Type |
|---|---|---|
| `mentor-chat` | Add plan check guard (see 2.2) | Behaviour change |
| `create-checkout` | Add `success_url` and `cancel_url` with correct domains | Config change |
| All functions | No other changes | — |

---

## 5. Environment Variables — No Changes

All required env vars exist. Sprint 3 adds no new secrets.

Verify Stripe `success_url` origin is set correctly in `create-checkout`:
```ts
const origin = req.headers.get('origin') ?? 'https://roadmap-app-gamma-seven.vercel.app'
```

---

## 6. Deployment Sequence for Sprint 3

```
1. Fix ApprovalWorkflow lint error
2. Delete App.css + remove import
3. Wire Stripe checkout in UpgradePage
4. Add plan guard to mentor-chat Edge Function
5. Add DB helpers to supabase.js
6. Update GhostwriterPanel with DB write + props
7. Update CalendarLogistics with per-row AI Draft button
8. Update Roadmap with navigation
9. Fix CalendarLogistics dark theme
10. npm run lint → must exit 0
11. npm run build → must succeed
12. supabase functions deploy mentor-chat
13. git push → Vercel auto-deploys
14. Smoke test on production URL
```

---

## 7. File Change Summary

| File | Change Type | Sprint 3 Task |
|---|---|---|
| `src/pages/UpgradePage.jsx` | Modify | FR-01 |
| `supabase/functions/mentor-chat/index.ts` | Modify | FR-02 |
| `src/lib/supabase.js` | Modify (add helpers) | FR-03 |
| `src/components/GhostwriterPanel.jsx` | Modify | FR-03 |
| `src/components/CalendarLogistics.jsx` | Modify | FR-03, FR-06 |
| `src/components/Roadmap.jsx` | Modify | FR-04 |
| `src/components/ApprovalWorkflow.jsx` | Modify (bug fix) | FR-05 |
| `src/App.jsx` | Modify (remove import) | FR-07 |
| `src/App.css` | Delete | FR-07 |
| `docs/ISSUE_LOG.md` | Create + maintain | FR-08 |
| `docs/sprint3/BRD.md` | Create | SDLC |
| `docs/sprint3/FRS.md` | Create | SDLC |
| `docs/sprint3/TDD.md` | Create | SDLC |
| `docs/sprint3/SPRINT3_PLAN.md` | Create | SDLC |
| `docs/sprint3/TEST_PLAN.md` | Create | SDLC |
| `CLAUDE.md` | Modify (Rule 7) | FR-08 |
| `.ralph/fix_plan.md` | Update | Sprint tracking |

---

*Document owner: Engineering Lead*
*Review required before: implementation begins*
