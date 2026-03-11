# Elevox — Sprint 1 Implementation Guide
### For: Antigravity Development Team

---

## What's In This Package

This is the complete Sprint 1 backend integration layer for the Elevox platform.
It converts the existing React prototype into a real, multi-user, data-persistent application.

```
elevox-sprint1/
├── src/
│   ├── App.jsx                        ← REPLACE your existing App.jsx
│   ├── context/
│   │   └── AuthContext.jsx            ← NEW — auth state management
│   ├── lib/
│   │   └── supabase.js                ← NEW — Supabase client + DB helpers
│   ├── hooks/
│   │   └── useProfile.js              ← NEW — saves onboarding to DB
│   ├── components/
│   │   ├── ProtectedRoute.jsx         ← NEW — route auth guard
│   │   └── ContentFormats.jsx         ← NEW — completes missing tab
│   └── pages/
│       ├── LoginPage.jsx              ← NEW — email + LinkedIn login
│       ├── SignupPage.jsx             ← NEW — email signup
│       ├── AuthCallbackPage.jsx       ← NEW — OAuth redirect handler
│       ├── UpgradePage.jsx            ← NEW — plan selection
│       ├── DashboardPage.jsx          ← NEW — wires Dashboard to auth
│       ├── OnboardingPage.jsx         ← NEW — wires OnboardingForm to DB
│       └── ProfilePage.jsx            ← NEW — wires ProfileView to auth
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql    ← Run this first
│   └── functions/
│       ├── ghostwrite-post/           ← AI ghostwriter (Anthropic)
│       ├── generate-brief/            ← Brand Brief AI generation
│       ├── create-checkout/           ← Stripe checkout session
│       └── stripe-webhook/            ← Stripe subscription events
└── .env.example                       ← Copy to .env, fill in values
```

---

## Step 1: Supabase Project Setup (30 min)

### 1.1 Create the project
1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `elevox-production`
3. Save the password securely
4. Wait ~2 minutes for it to provision

### 1.2 Run the database migration
1. In Supabase Dashboard → SQL Editor
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**
4. You should see: "Success. No rows returned."

### 1.3 Get your API keys
Go to Supabase Dashboard → Settings → API:
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon / public key** → `VITE_SUPABASE_ANON_KEY`
- Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only — never in browser)

### 1.4 Enable LinkedIn OAuth
Go to Supabase Dashboard → Authentication → Providers → LinkedIn (OIDC):
1. Enable it
2. Create a LinkedIn OAuth app at [developer.linkedin.com](https://developer.linkedin.com)
3. Required scopes: `openid`, `profile`, `email`
4. Redirect URL (copy from Supabase): `https://your-project.supabase.co/auth/v1/callback`
5. Paste Client ID + Secret into Supabase

### 1.5 Configure email (Supabase built-in for now)
Go to Authentication → Email Templates → customise the confirmation email with Elevox branding.

---

## Step 2: Install Dependencies (5 min)

```bash
# In the root of your existing elevox repo:
npm install @supabase/supabase-js react-router-dom
```

---

## Step 3: Copy Files (10 min)

### 3.1 New files — copy as-is
Copy these files into your project (create the folders if they don't exist):
```
src/context/AuthContext.jsx
src/lib/supabase.js
src/hooks/useProfile.js
src/components/ProtectedRoute.jsx
src/components/ContentFormats.jsx
src/pages/LoginPage.jsx
src/pages/SignupPage.jsx
src/pages/AuthCallbackPage.jsx
src/pages/UpgradePage.jsx
src/pages/DashboardPage.jsx
src/pages/OnboardingPage.jsx
src/pages/ProfilePage.jsx
```

### 3.2 Replace App.jsx
**Back up your existing `src/App.jsx` first**, then replace it with the new one.

The new App.jsx:
- Removes the `useState` navigation
- Adds React Router with proper URLs
- Wraps everything in `<AuthProvider>`

### 3.3 Update main.jsx
Your existing `main.jsx` is fine — no changes needed.
The `AuthProvider` is now inside `App.jsx` so it wraps the router automatically.

---

## Step 4: Wire ContentFormats into CalendarLogistics (5 min)

Open `src/components/CalendarLogistics.jsx` and make these changes:

### 4.1 Add the import at the top
```jsx
import ContentFormats from './ContentFormats'
```

### 4.2 Replace the placeholder
Find this block (around line 379-381):
```jsx
{activeTab === "formats" && (
  <div style={{ padding: "40px 48px" }}>
     <p style={{ fontSize: "14px", color: "#A8E6FF" }}>Content Formats view is under construction.</p>
  </div>
)}
```

Replace with:
```jsx
{activeTab === "formats" && (
  <ContentFormats />
)}
```

Done. The full Content Formats tab is now live.

---

## Step 5: Wire OnboardingForm to save to Supabase (15 min)

Open `src/components/OnboardingForm.jsx` and update the submit handler.

### 5.1 Find the `handleSubmit` function
It currently calls `onComplete(formData)`. This still works because `OnboardingPage.jsx` intercepts it and saves to Supabase before navigating.

**No changes needed in OnboardingForm.jsx** — the new `OnboardingPage.jsx` wrapper handles the save transparently.

### 5.2 Optional: Add per-step auto-save
If you want to save progress after each step (so users don't lose data if they close the browser), add this to the `navigate` function in OnboardingForm.jsx:

```jsx
// In the navigate(dir) function, before setCurrentStep:
if (props.onStepComplete) {
  props.onStepComplete(formData) // OnboardingPage will save to DB
}
```

Then in `OnboardingPage.jsx`, add:
```jsx
const { saveStep } = useProfile()
// ...
<OnboardingForm
  onComplete={handleComplete}
  onStepComplete={(data) => saveStep(data)}  // ← add this
  initialData={initialData}
/>
```

---

## Step 6: Set Up Environment Variables (5 min)

```bash
# Copy the example file
cp .env.example .env

# Fill in at minimum:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Vercel deployment:
1. Go to Vercel Dashboard → your project → Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Redeploy

---

## Step 7: Deploy Edge Functions (20 min)

### 7.1 Install Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

### 7.2 Set Edge Function secrets
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_STARTER=price_...
supabase secrets set STRIPE_PRICE_AUTHORITY=price_...
supabase secrets set STRIPE_PRICE_LEGACY=price_...
supabase secrets set RESEND_API_KEY=re_...
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
```

### 7.3 Deploy the functions
```bash
supabase functions deploy ghostwrite-post
supabase functions deploy generate-brief
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

### 7.4 Register Stripe webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

---

## Step 8: Test the Flow (15 min)

Run through this checklist before handing back:

```
[ ] npm run dev starts without errors
[ ] /signup creates a new user in Supabase Auth
[ ] Verification email is received
[ ] /login with email + password works
[ ] LinkedIn OAuth redirects and logs in
[ ] Completing OnboardingForm saves data to profiles table
    (verify in Supabase Table Editor → profiles)
[ ] Dashboard shows the user's name from the profile row
[ ] ProfileView shows all onboarding answers
[ ] Content Formats tab loads (not "under construction")
[ ] /login redirect works — protected routes send to /login
[ ] /dashboard redirect works after login
[ ] Refreshing the page keeps the user logged in
```

---

## Calling Edge Functions from the Frontend

Use this pattern anywhere in your React components:

```jsx
import { supabase } from '../lib/supabase'

async function generateBrief() {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-brief`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  )
  const { brief, error } = await res.json()
  if (error) console.error(error)
  return brief
}
```

For the ghostwriter:
```jsx
const res = await fetch(`${SUPABASE_URL}/functions/v1/ghostwrite-post`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'Why most CxOs are invisible online',
    content_type: 'text',
  }),
})
const { drafts } = await res.json()
// drafts = [{ angle, body, word_count }, ...]
```

---

## What's NOT in Sprint 1 (Sprint 2+)

These are deliberately excluded — build in order:

| Feature | Sprint |
|---|---|
| Stripe Checkout UI in UpgradePage | Sprint 2 |
| AI Ghostwriter UI component | Sprint 2 |
| Brand Brief display page | Sprint 2 |
| Anchor event → content variants | Sprint 2 |
| LinkedIn OAuth for posting | Sprint 3 |
| Slack approval notifications | Sprint 3 |
| WhatsApp SLA alerts | Sprint 3 |
| Social analytics pull | Sprint 3 |
| Resend email system | Sprint 2 |
| Admin dashboard | Sprint 4 |

---

## Common Issues

**"Missing Supabase env vars" error on startup**
→ Check `.env` exists and has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**LinkedIn OAuth shows error after redirect**
→ Check the redirect URL in your LinkedIn app settings matches exactly what Supabase shows

**OnboardingForm onComplete is not a function**
→ You're rendering OnboardingForm directly instead of going through OnboardingPage. Use the React Router route.

**Edge function returns 401**
→ The JWT is missing or expired. Make sure you're passing `session.access_token` in the Authorization header.

**profiles table shows no data after onboarding**
→ Check browser console for errors. Most likely the Supabase RLS policy is blocking the insert — verify `auth.uid() = id` matches.

---

*Elevox Sprint 1 — March 2026*
*Questions: route through the product team before changing any RLS policies*
