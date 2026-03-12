# Payment Gateway Decision
## Elevox Platform
**Status:** Deferred to Final Sprint
**Decision date:** March 2026
**Owner:** Product + Engineering

---

## Why Stripe Was Removed

Stripe has significant restrictions for businesses incorporated in India:

- **International card acceptance** requires a registered US/EU/UK entity, or a Stripe Atlas entity
- **Subscription billing** from India has limited currency support for INR-billed subscriptions
- **Payout restrictions** — Indian accounts can only receive INR, not USD/GBP/EUR directly
- **RBI compliance** — Stripe's India operations do not support all recurring mandate formats required by RBI
- **Merchant category restrictions** — coaching/SaaS products require additional verification

The `create-checkout` and `create-portal-session` Edge Functions built for Stripe are preserved in `supabase/functions/` for reference but are **not called from the frontend**.

---

## Recommended Replacement: Razorpay

**Razorpay** is the primary recommendation for Elevox's payment integration.

| Factor | Razorpay |
|---|---|
| India-incorporated businesses | ✅ Full support |
| International cards | ✅ Visa, Mastercard, Amex, Diners |
| UPI / UPI AutoPay | ✅ Recurring UPI mandates |
| Subscription billing | ✅ Native subscription engine with dunning |
| Settlement currency | INR (USD via LRS/FEMA with additional setup) |
| Domestic transaction fee | 2% (standard) |
| International card fee | 3% |
| Setup time | 1–2 business days (digital KYC) |
| Webhook support | ✅ Matches Stripe webhook patterns |
| Dashboard | ✅ Rich analytics, invoice management |
| PCI DSS | ✅ Level 1 compliant |

### Razorpay Subscription Plans Required
Razorpay uses "Plans" and "Subscriptions":
```
Razorpay Plan ID → Elevox Plan
  plan_starter    → starter  ($97/mo or ₹8,097/mo)
  plan_authority  → authority ($197/mo or ₹16,397/mo)
  plan_legacy     → legacy   ($497/mo or ₹41,297/mo)
```

---

## Backup Option: Cashfree Payments

If Razorpay onboarding is delayed, **Cashfree Payments** is a viable fallback:

| Factor | Cashfree |
|---|---|
| International cards | ✅ |
| Recurring billing | ✅ |
| Settlement speed | T+2 |
| Fee | 1.75% domestic / 3% international |
| Setup time | 24–72h digital KYC |

---

## Implementation Plan (Final Sprint)

### What needs to be built

1. **New Edge Function:** `supabase/functions/create-razorpay-order/index.ts`
   - Creates a Razorpay subscription order
   - Returns `{ razorpay_key_id, subscription_id, amount, currency }`

2. **New Edge Function:** `supabase/functions/razorpay-webhook/index.ts`
   - Verifies Razorpay webhook signature
   - Handles `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`
   - Updates `profiles.plan`, `profiles.plan_status`, `profiles.razorpay_subscription_id`

3. **Frontend — UpgradePage.jsx** `handleConfirm()` function
   - Load Razorpay checkout script dynamically
   - Open Razorpay checkout modal (not redirect — inline modal)
   - On `payment.success`, call backend to verify + activate plan
   - On `payment.dismissed`, restore button state

4. **DB migration** `supabase/migrations/002_razorpay_fields.sql`
   ```sql
   ALTER TABLE profiles
     ADD COLUMN razorpay_customer_id TEXT,
     ADD COLUMN razorpay_subscription_id TEXT;
   ```

### New Supabase Secrets Required
```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PLAN_STARTER=plan_...
RAZORPAY_PLAN_AUTHORITY=plan_...
RAZORPAY_PLAN_LEGACY=plan_...
RAZORPAY_WEBHOOK_SECRET=...
```

### Frontend Script Load Pattern
```jsx
// Load Razorpay checkout.js on demand
function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    document.body.appendChild(script)
  })
}

async function handleConfirm() {
  await loadRazorpay()
  const { data } = await callEdgeFunction('create-razorpay-order', { plan: selectedPlan })
  const options = {
    key: data.razorpay_key_id,
    subscription_id: data.subscription_id,
    name: 'Elevox',
    description: `${planLabel(selectedPlan)} Plan`,
    handler: async (response) => {
      // Verify on backend, activate plan
      await callEdgeFunction('verify-razorpay-payment', response)
      setSubmitted(selectedPlan)
    },
    theme: { color: '#6366f1' },
  }
  const rzp = new window.Razorpay(options)
  rzp.open()
}
```

---

## Current State (Placeholder)

Until Razorpay is wired:
- `UpgradePage.jsx` shows plan cards with "Select Plan → Confirm interest" flow
- No payment is collected
- `submitted` state shows a "team will reach out" confirmation
- `BillingPage.jsx` shows "Payment portal launching soon" for subscription management

---

## Stripe Artifacts (Preserved, Not Active)

| File | Status | Notes |
|---|---|---|
| `supabase/functions/create-checkout/index.ts` | Preserved | Stripe checkout session creation — not called |
| `supabase/functions/create-portal-session/index.ts` | Preserved | Stripe billing portal — not called |
| `supabase/functions/stripe-webhook/index.ts` | Preserved | Stripe subscription lifecycle — not called |

These can be deleted in the final sprint once Razorpay is confirmed working, or retained as reference.

---

*Last updated: 2026-03-12*
*Review at: Final Sprint kickoff*
