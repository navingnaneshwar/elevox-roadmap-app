# Agent Build Instructions — Elevox

## Project Setup
```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env
```

## Running the Dev Server
```bash
npm run dev
# Runs on http://localhost:5173
```

## Building for Production
```bash
npm run build
npm run preview
```

## Linting
```bash
npm run lint
```

## Deployment

**Frontend (Vercel):**
Auto-deploys on push to `main`. New env vars must be added in Vercel Dashboard.

**Edge Functions (Supabase CLI):**
```bash
supabase functions deploy ghostwrite-post
supabase functions deploy generate-brief
supabase functions deploy create-checkout
supabase functions deploy send-notification
```

**Database migrations:**
Write new file `supabase/migrations/002_your_change.sql` and run in Supabase SQL Editor.
Never edit `001_initial_schema.sql` directly.

## Environment Variables

**Frontend (.env):**
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

## Key Architecture Patterns

### Calling an Edge Function from a component
```js
const { data: { session } } = await supabase.auth.getSession()
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
```

### Adding a new protected route
```jsx
// In src/App.jsx
<Route path="/new-page" element={
  <ProtectedRoute><NewPage /></ProtectedRoute>
} />
```

### Adding a new DB helper
```js
// In src/lib/supabase.js
export async function getMyNewData(userId) {
  return supabase
    .from('my_table')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}
```

## Key Learnings
- All Anthropic AI calls must go through Supabase Edge Functions — never from the browser
- `useAuth()` from `context/AuthContext.jsx` is the only source of auth state
- `src/lib/supabase.js` contains all DB helpers — use them, don't write raw queries
- `src/hooks/useProfile.js` handles all onboarding form field mapping (camelCase → snake_case)
- Design tokens are in `src/index.css` — no new hex values
- `Dashboard.jsx` PHASES array is the single source of truth for coaching phases
- All tables have RLS enabled: `auth.uid() = user_id` policy
