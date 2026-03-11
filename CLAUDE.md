# CLAUDE.md — Elevox Codebase Context
# Read this before touching any file. Every rule here exists because
# someone already made the mistake it prevents.

---

## What Elevox Is

An AI-powered executive thought leadership coaching platform for CxOs.
Users complete an 8-step onboarding form, get a personalised Brand Brief,
then work through 6 coaching phases via AI mentor chat sessions.
The AI ghostwrites LinkedIn content. The approval workflow manages the
EA → Executive → Publish pipeline.

**Live repo:** https://github.com/navingnaneshwar/elevox-roadmap-app
**Live site:** https://roadmap-app-gamma-seven.vercel.app

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, React Router v6 |
| Auth | Supabase Auth (email + LinkedIn OAuth) |
| Database | Supabase PostgreSQL (10 tables) |
| Server logic | Supabase Edge Functions (Deno/TypeScript) |
| AI | Anthropic Claude Sonnet via Edge Functions ONLY |
| Payments | Stripe (Checkout + Webhooks) |
| Email | Resend (not yet wired — Sprint 2) |
| Hosting | Vercel (frontend) + Supabase (backend) |

---

## Directory Structure

```
src/
├── App.jsx                    ← React Router root. All routes defined here.
├── main.jsx                   ← Entry point. Do not add providers here.
├── index.css                  ← Design tokens + global styles. Source of truth.
├── App.css                    ← Legacy Vite boilerplate. DO NOT USE. Delete on sight.
│
├── context/
│   └── AuthContext.jsx        ← Global auth state. THE auth source of truth.
│
├── lib/
│   └── supabase.js            ← Supabase client + all DB helper functions.
│                                 Import helpers from here. Never write raw queries inline.
│
├── hooks/
│   └── useProfile.js          ← Onboarding form → DB field mapper + save functions.
│
├── components/                ← Reusable components and full-page feature components.
│   ├── Logo.jsx               ← Elevox SVG wordmark. Use everywhere.
│   ├── ProtectedRoute.jsx     ← Auth guard. Wrap all protected <Route> elements.
│   ├── Dashboard.jsx          ← Main dashboard. Contains PHASES array (source of truth).
│   ├── OnboardingForm.jsx     ← 8-step CxO intake form. Do not restructure.
│   ├── ProfileView.jsx        ← Read-only profile display.
│   ├── CalendarLogistics.jsx  ← Content calendar. Has Schedule/Events/Approval/Formats tabs.
│   ├── ContentFormats.jsx     ← The Formats tab. 8 content format cards with settings.
│   ├── EventsAnchors.jsx      ← Anchor events manager. Timeline/grid/list views.
│   ├── ApprovalWorkflow.jsx   ← 4-tab approval system. Config/Flow/Simulation/SLA.
│   └── Roadmap.jsx            ← ⚠️ BROKEN. Currently shows agency ops tool. See Sprint 2.
│
├── pages/                     ← Thin wrappers that connect auth context to components.
│   ├── LoginPage.jsx          ← Email + LinkedIn OAuth + forgot password.
│   ├── SignupPage.jsx         ← Email signup with confirmation.
│   ├── AuthCallbackPage.jsx   ← OAuth redirect handler. Do not modify.
│   ├── UpgradePage.jsx        ← Plan selection. Stripe buttons need wiring (Sprint 2).
│   ├── DashboardPage.jsx      ← Passes real profile from auth to Dashboard.
│   ├── OnboardingPage.jsx     ← Saves OnboardingForm data to Supabase on submit.
│   └── ProfilePage.jsx        ← Reads profile from Supabase, passes to ProfileView.
│
supabase/
├── migrations/
│   └── 001_initial_schema.sql ← All 10 tables + RLS policies. Run once in Supabase SQL Editor.
│
└── functions/
    ├── ghostwrite-post/       ← AI ghostwriter. Returns 3 draft variants per topic.
    ├── generate-brief/        ← Brand Brief AI generation from full profile.
    ├── create-checkout/       ← Creates Stripe Checkout session. Returns {url}.
    └── stripe-webhook/        ← Handles subscription lifecycle. Do not call from frontend.
```

---

## NON-NEGOTIABLE RULES

### Rule 1 — NEVER call Anthropic from the frontend
The Anthropic API key lives in Supabase Edge Function secrets only.
Any component that calls `api.anthropic.com` directly is a security
vulnerability. It will expose the API key to every user in their browser.

✅ CORRECT — route through Edge Function:
```js
const res = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghostwrite-post`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, content_type }),
  }
)
```

❌ WRONG — never do this:
```js
const res = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': 'sk-ant-...' }  // DO NOT DO THIS
})
```

### Rule 2 — NEVER use localStorage or sessionStorage
Supabase Auth handles session persistence automatically via its own
internal storage. Using localStorage for auth data will break
multi-tab sessions and cause stale state bugs.

✅ CORRECT:
```js
const { data: { session } } = await supabase.auth.getSession()
const { user, profile } = useAuth()
```

❌ WRONG:
```js
localStorage.setItem('user', JSON.stringify(user))
const user = JSON.parse(localStorage.getItem('user'))
```

### Rule 3 — ALWAYS use useAuth() for user state
Never create local auth state in a component. Never call
`supabase.auth.getUser()` directly in a component.

✅ CORRECT:
```js
import { useAuth } from '../context/AuthContext'
const { user, profile, loading } = useAuth()
```

❌ WRONG:
```js
const [user, setUser] = useState(null)
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user))
}, [])
```

### Rule 4 — ALWAYS use helpers from supabase.js
Never write raw Supabase queries inline in components.
The helpers in `src/lib/supabase.js` handle error normalisation
and return consistent shapes.

✅ CORRECT:
```js
import { getBrandBrief, getAnchorEvents } from '../lib/supabase'
const { data: brief } = await getBrandBrief(user.id)
```

❌ WRONG:
```js
const { data } = await supabase.from('brand_briefs').select('*').eq('user_id', user.id)
```

### Rule 5 — ALWAYS go through useProfile.js for saving form data
The `useProfile.js` hook contains the canonical camelCase → snake_case
field mapping for all 50+ profile fields. Adding a new field means
adding it to the FIELD_MAP in useProfile.js — not writing a custom
save function in a component.

✅ CORRECT:
```js
import { useProfile } from '../hooks/useProfile'
const { saveStep, finishOnboarding } = useProfile()
await saveStep({ fullName: 'Alexandra', currentTitle: 'CEO' })
```

❌ WRONG:
```js
await supabase.from('profiles').update({ full_name: 'Alexandra' }).eq('id', user.id)
```

### Rule 6 — ALWAYS follow the existing design system
All colour values, font families, and spacing patterns come from
`src/index.css`. Do not introduce new hex values or Google Font imports.

**Background colours:**
- Primary bg: `#070B14` (midnight navy-black)
- Card bg: `rgba(13, 18, 32, 0.8)`
- Border: `#1E2A3E`

**Text colours:**
- Primary: `#F1F5F9`
- Secondary: `#94A3B8`
- Muted: `#64748B`
- Very muted: `#334155`

**Phase accent colours (use for their phase only):**
- Phase 01 — Gold: `#C8A96E`
- Phase 02 — Sapphire: `#5B8FA8`
- Phase 03 — Indigo: `#8B6DAA`
- Phase 04 — Claret: `#C85A5A`
- Phase 05 — Racing Green: `#4A9E7A`
- Phase 06 — Amber: `#E8935A`

**Plan colours:**
- Foundation (starter): `#4A9E7A`
- Authority (authority): `#C8A96E`
- Legacy (legacy): `#8C2E45`

**Interactive accent:** `#6366f1` (indigo) for buttons, links, focus rings
**Danger:** `#ef4444`
**Success:** `#10b981`

**Typography:**
```css
fontFamily: "'Outfit', sans-serif"    /* headings, labels, prices */
fontFamily: "'Inter', sans-serif"     /* body text, descriptions */
fontFamily: "'JetBrains Mono', monospace"  /* code, metadata, timestamps */
```

---

## Standard Patterns

### Getting the auth session to call an Edge Function
```js
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function MyComponent() {
  const { user } = useAuth()

  async function callEdgeFunction(payload) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/FUNCTION_NAME`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    const { data, error } = await res.json()
    if (error) console.error(error)
    return data
  }
}
```

### Standard loading/error state pattern
```js
const [data,    setData]    = useState(null)
const [loading, setLoading] = useState(false)
const [error,   setError]   = useState(null)

async function load() {
  setLoading(true)
  setError(null)
  try {
    const result = await someFunction()
    setData(result)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Stripe checkout call (Sprint 2 — UpgradePage)
```js
async function handleUpgrade(planId) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: planId }), // 'starter' | 'authority' | 'legacy'
    }
  )
  const { url, error } = await res.json()
  if (error) { setError(error); return }
  window.location.href = url  // Redirect to Stripe Checkout
}
```

### Adding a new route
```jsx
// In src/App.jsx
<Route path="/new-page" element={
  <ProtectedRoute><NewPage /></ProtectedRoute>
} />

// For plan-gated routes:
<Route path="/phase/:id" element={
  <ProtectedRoute requiredPlan="authority"><PhasePage /></ProtectedRoute>
} />
// Plans: 'starter' | 'authority' | 'legacy'
```

### Adding a new DB helper
```js
// In src/lib/supabase.js — add to the bottom
export async function getMyNewData(userId) {
  return supabase
    .from('my_table')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}
```

---

## Database Tables (quick reference)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per user. All onboarding data. | `id`, `plan`, `plan_status`, `onboarding_complete` |
| `brand_briefs` | AI-generated brand brief. Versioned. | `user_id`, `brand_archetype`, `positioning_statement` |
| `mentor_sessions` | AI chat sessions per phase/component. | `user_id`, `phase_id`, `component_id`, `messages` (JSONB) |
| `deliverables` | Outputs extracted from sessions. | `user_id`, `phase_id`, `component_id`, `content` |
| `anchor_events` | Milestone events for content calendar. | `user_id`, `type`, `title`, `event_month` |
| `content_calendar` | Every piece of content in the pipeline. | `user_id`, `content_type`, `platform`, `status`, `scheduled_at` |
| `content_drafts` | AI draft variants per calendar event. | `calendar_event_id`, `body`, `version`, `selected` |
| `calendar_settings` | Per-user calendar config. | `user_id`, `posting_frequency`, `active_days`, `formats_enabled` |
| `approvals` | Approval tracking with SLA. | `calendar_event_id`, `status`, `due_at`, `sla_breached` |
| `analytics_snapshots` | Daily social platform data pulls. | `user_id`, `platform`, `snapshot_date`, `followers` |

**All tables have Row Level Security enabled.**
If a query returns empty and there's no code error,
check the RLS policies in Supabase Dashboard before debugging the code.
The policy is: `auth.uid() = user_id` on every table.

---

## The 6 Coaching Phases (source of truth: Dashboard.jsx PHASES array)

| # | Title | Colour | Components |
|---|---|---|---|
| 01 | Brand Audit & Foundation | `#C8A96E` | Executive Brand Audit, Archetype & Voice Mapping, Ideal Audience Matrix, Competitive Positioning |
| 02 | Platform Architecture | `#5B8FA8` | LinkedIn Profile Overhaul, Content Channel Selection, Personal Website & Bio Page, SEO Personal Branding |
| 03 | Content Engine | `#8B6DAA` | Signature Content Series, 90-Day Content Calendar, Repurposing Workflow, Ghost-Writing Protocol |
| 04 | Visibility & Authority | `#C85A5A` | Media Outreach Campaign, Podcast Guest Strategy, Speaking Bureau Positioning, Awards & Recognition Pipeline |
| 05 | Community & Network | `#4A9E7A` | Engagement Operating Rhythm, Peer CxO Alliance Network, Newsletter Growth System, Private Community Blueprint |
| 06 | Measure & Scale | `#E8935A` | Thought Leadership KPI Dashboard, Quarterly Brand Review, Book & IP Packaging, Legacy & 3-Year Vision |

**Phase access by plan:**
- `starter` → Phases 1–2
- `authority` → Phases 1–4
- `legacy` → Phases 1–6

---

## The 3 Subscription Plans

| ID | Display Name | Price | Phases |
|---|---|---|---|
| `starter` | Foundation | $97/mo | 1–2 |
| `authority` | Authority | $197/mo | 1–4 |
| `legacy` | Legacy | $497/mo | 1–6 |

Stripe Price IDs live in Supabase secrets:
`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_AUTHORITY`, `STRIPE_PRICE_LEGACY`

---

## Edge Functions

| Function | Method | Auth required | What it does |
|---|---|---|---|
| `ghostwrite-post` | POST | Yes (JWT) | Generates 3 AI draft variants. Body: `{ topic, content_type, anchor_event_id? }`. Returns `{ drafts: [{ angle, body, word_count }] }` |
| `generate-brief` | POST | Yes (JWT) | Reads full profile, generates Brand Brief, saves to `brand_briefs` table. No body needed. Returns `{ brief }` |
| `create-checkout` | POST | Yes (JWT) | Creates Stripe Checkout session. Body: `{ plan }`. Returns `{ url }` — redirect user to this URL. |
| `stripe-webhook` | POST | Stripe signature | Called by Stripe only. Handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. **Never call this from the frontend.** |

---

## Environment Variables

**Frontend (.env + Vercel):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Edge Functions (Supabase secrets — never in frontend):**
```
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER
STRIPE_PRICE_AUTHORITY
STRIPE_PRICE_LEGACY
RESEND_API_KEY
```

---

## Sprint 2 Task List (current sprint)

Work these in order. Each builds on the previous.

### Task 1 — Wire Stripe checkout in UpgradePage ⬅ START HERE
**File:** `src/pages/UpgradePage.jsx`
**What:** Replace the `alert()` call on each plan button with a real call
to the `create-checkout` Edge Function and redirect to the returned URL.
**Pattern:** See "Stripe checkout call" in Standard Patterns above.
**Test:** Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

### Task 2 — Brand Brief display page
**New file:** `src/pages/BrandBriefPage.jsx`
**What:** Button triggers `generate-brief` Edge Function → shows loading
state → renders the 8 brief sections (executive_summary, brand_archetype,
positioning_statement, audience_map, voice_signature, content_themes,
priority_actions, recommended_phase) in cards.
**Data shape:** See `supabase/functions/generate-brief/index.ts` for the
JSON structure returned.
**Add route in App.jsx:** `/brand-brief` protected, no plan gate.

### Task 3 — AI Ghostwriter UI in CalendarLogistics
**File:** `src/components/CalendarLogistics.jsx`
**What:** In the Schedule tab, add a "Draft with AI" button per content row.
Opens a panel: topic input → calls `ghostwrite-post` → shows 3 draft cards
with angle label, body text, word count, and a "Use this draft" button.
Selecting a draft updates the `content_calendar` row via `getCalendarEvents`.

### Task 4 — Fix Roadmap.jsx
**File:** `src/components/Roadmap.jsx`
**What:** The current content shows an internal agency operations tool
(Notion/Buffer/Taplio costs, weekly sprints). This is wrong.
Replace entirely with the 6-phase CxO coaching journey, matching the
PHASES array from Dashboard.jsx. Show phase cards, components per phase,
and lock states based on `profile.plan`. Keep the existing visual style.
**Do not touch Dashboard.jsx** — it already has the correct phase structure.

### Task 5 — Welcome email on onboarding complete
**File:** `src/pages/OnboardingPage.jsx`
**What:** After `finishOnboarding()` succeeds, call a new `send-notification`
Edge Function (create it) that sends a Resend welcome email to the user.
**New Edge Function:** `supabase/functions/send-notification/index.ts`
Template: welcome email with their name, plan, and link back to dashboard.

---

## Known Issues (do not re-introduce)

1. **App.css** contains default Vite boilerplate (logo spin animation etc).
   It does nothing useful. Delete it and remove the import in App.jsx.

2. **Roadmap.jsx** is currently an agency ops tool, not a CxO coaching roadmap.
   See Sprint 2 Task 4.

3. **UpgradePage plan buttons** call `alert()`. See Sprint 2 Task 1.

4. **Session continuity** — returning to a mentor chat starts fresh instead of
   resuming. `upsertMentorSession()` in supabase.js is built and waiting.
   The chat component just needs to call it on each message.

5. **Phase lock is only enforced client-side** in Dashboard.jsx via the
   `unlockedPhases` array. The chat route has no server-side plan check.
   Add plan verification in ProtectedRoute or the phase chat component.

---

## What NOT to build in Sprint 2

These are Sprint 3+ and should be refused if requested mid-sprint:

- LinkedIn / social posting API integration
- Analytics dashboard with real social data
- WhatsApp / Slack approval notifications
- Admin dashboard
- Settings page (password change, billing management)
- Progress PDF export
- Phase interconnection (Phase 01 insights flowing into Phase 02 prompts)

If asked to build these, note them as out-of-scope for Sprint 2 and
add them to the backlog.

---

## Deployment

**Frontend:** Vercel. Auto-deploys on push to `main`.
Every new env var needs to be added in Vercel Dashboard →
Project Settings → Environment Variables, then trigger a redeploy.

**Edge Functions:** Manual deploy via Supabase CLI:
```bash
supabase functions deploy FUNCTION_NAME
# e.g.
supabase functions deploy ghostwrite-post
supabase functions deploy send-notification
```

**Database changes:** Write a new migration file:
`supabase/migrations/002_your_change.sql`
Run it in Supabase SQL Editor. Never edit 001 directly.

---

*Last updated: March 2026 — Sprint 1 complete, Sprint 2 in progress*
*Questions: escalate to product before changing RLS policies or the PHASES array*
