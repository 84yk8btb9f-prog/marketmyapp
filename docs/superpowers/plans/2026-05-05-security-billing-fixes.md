# Security & Billing Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical/high/medium security, billing, and data-integrity issues found in the full code review of marketmyapp.

**Architecture:** Four parallel fix teams — Auth/Security, Stripe/Billing, Backend Data Integrity, Frontend UI. Teams are assigned non-overlapping files so they can execute concurrently. All changes are committed per team.

**Tech Stack:** Next.js 14 App Router, Supabase (server + service client), Stripe Node SDK, Zod, TypeScript, Resend

---

## Team 1 — Auth & Security

**Covers:** C-1, C-2, H-1, H-4, H-5

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/lib/admin.ts`
- Modify: `src/lib/ratelimit.ts`
- Modify: `next.config.ts`
- Modify: `src/lib/prompts/plan-generation.ts`
- Modify: `src/lib/prompts/health-score.ts`

---

### Task 1.1: Wire up the missing Next.js middleware [C-2]

`src/lib/supabase/middleware.ts` exists with full `updateSession` logic but `src/middleware.ts` — the Next.js entry-point that calls it — is missing. All `/(app)/` routes (dashboard, settings, plans, check-in) are reachable by unauthenticated users.

- [ ] **Create `src/middleware.ts`**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Verify redirect fires for unauthenticated request**

Start dev server (`npm run dev`) and open `http://localhost:3000/dashboard` in an incognito window with no session. Expected: redirect to `/login`.

- [ ] **Commit**

```bash
git add src/middleware.ts
git commit -m "fix: wire up Next.js middleware — all (app)/ routes were publicly accessible"
```

---

### Task 1.2: Move admin email to env var [C-1]

`src/lib/admin.ts:1` hardcodes `nikolas.sapalidis@gmail.com`. Anyone reading source code knows the exact email that bypasses all admin gates.

- [ ] **Update `src/lib/admin.ts`**

Replace the entire file content:

```ts
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL env var is not set");
}
```

- [ ] **Add to `.env.local`** (do not commit)

```
ADMIN_EMAIL=nikolas.sapalidis@gmail.com
```

- [ ] **Add to Vercel env vars** via dashboard or CLI:

```bash
vercel env add ADMIN_EMAIL production
```

- [ ] **Commit**

```bash
git add src/lib/admin.ts
git commit -m "fix: move admin email out of source into ADMIN_EMAIL env var"
```

---

### Task 1.3: Fix X-Forwarded-For spoofing in rate limiter [H-1]

`src/lib/ratelimit.ts:58` takes `x-forwarded-for[0]` which is the client-supplied value. On Vercel, the real IP is in `x-vercel-forwarded-for` or the rightmost entry in `x-forwarded-for`.

- [ ] **Update `src/lib/ratelimit.ts`** — replace the `getClientIp` function:

Read the file first to find the exact function, then replace it with:

```ts
function getClientIp(request: NextRequest): string {
  // On Vercel, x-vercel-forwarded-for is the trusted real client IP
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  // Fallback: rightmost entry in x-forwarded-for is appended by the trusted proxy
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim();
  }

  return "unknown";
}
```

- [ ] **Commit**

```bash
git add src/lib/ratelimit.ts
git commit -m "fix: use rightmost x-forwarded-for entry to prevent IP spoofing on rate limiter"
```

---

### Task 1.4: Validate and sanitize `app_url` to prevent prompt injection [H-4]

`app_url` from user input is interpolated directly into AI prompts at `src/lib/prompts/plan-generation.ts:14` with no format validation. A user can inject `\n\nIgnore all instructions...` here.

- [ ] **Update Zod schema in `src/app/api/generate-plan/route.ts`**

Find the Zod schema (around line 10–20) and change `app_url`:

```ts
app_url: z.string().url("Must be a valid URL").max(500).optional().or(z.literal("")),
```

- [ ] **Add sanitizer helper in `src/lib/prompts/plan-generation.ts`** — add before the main function:

```ts
function sanitizeForPrompt(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 200);
}
```

- [ ] **Wrap all user-supplied string interpolations in `sanitizeForPrompt`** in `src/lib/prompts/plan-generation.ts` and `src/lib/prompts/health-score.ts`:

```ts
- URL: ${sanitizeForPrompt(input.app_url ?? "")}
```

Apply the same wrapper to all other interpolated user fields: `app_name`, `app_description`, `target_customer`, `current_traction`.

- [ ] **Commit**

```bash
git add src/app/api/generate-plan/route.ts src/lib/prompts/plan-generation.ts src/lib/prompts/health-score.ts
git commit -m "fix: validate app_url as URL and sanitize prompt inputs against injection"
```

---

### Task 1.5: Add CSP and HSTS security headers [H-5]

`next.config.ts` is missing `Content-Security-Policy` and `Strict-Transport-Security`. The app handles Stripe Elements and auth tokens.

- [ ] **Update `next.config.ts`** — find the `headers()` function and add to the headers array:

```ts
{
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
},
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "frame-src https://js.stripe.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
  ].join("; "),
},
```

- [ ] **Verify headers in dev** — start dev server and run:

```bash
curl -I http://localhost:3000 | grep -i "strict-transport\|content-security"
```

Expected: both headers present.

- [ ] **Commit**

```bash
git add next.config.ts
git commit -m "fix: add CSP and HSTS security headers"
```

---

## Team 2 — Stripe & Billing

**Covers:** C-3, C-4, C-5, C-6, H-2, H-6, H-7, M-6

**Files:**
- Modify: `src/app/api/stripe/activate-trial/route.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`
- Modify: `src/app/api/stripe/cancel-subscription/route.ts`
- Modify: `src/app/api/stripe/setup-intent/route.ts`

---

### Task 2.1: Add duplicate subscription guard to activate-trial [C-3]

If a user double-clicks or retries, `stripe.subscriptions.create()` is called twice on the same customer, creating two active subscriptions.

- [ ] **Update `src/app/api/stripe/activate-trial/route.ts`**

After reading the profile, add a guard before the subscription create call:

```ts
// After reading profile:
if (profile.stripe_subscription_id) {
  return NextResponse.json(
    { error: "A subscription already exists for this account" },
    { status: 409 }
  );
}
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/activate-trial/route.ts
git commit -m "fix: guard against duplicate Stripe subscription creation on activate-trial"
```

---

### Task 2.2: Remove optimistic tier write from activate-trial [C-4]

`activate-trial` writes `plan_tier: "trial"` to the DB immediately. The webhook also writes it independently. Webhook is the sole authority for subscription state.

- [ ] **Update `src/app/api/stripe/activate-trial/route.ts`**

Remove the DB `.update({ plan_tier: "trial", ... })` call (and any `stripe_subscription_id` write) from this route. The route's only job is to create the Stripe subscription and return success. Leave a comment:

```ts
// Do not write plan_tier here — the Stripe webhook is the sole authority.
// When Stripe fires customer.subscription.updated with status "trialing",
// the webhook handler will set plan_tier: "trial".
```

- [ ] **Verify** the route still creates the subscription and returns 200 without DB writes.

- [ ] **Commit**

```bash
git add src/app/api/stripe/activate-trial/route.ts
git commit -m "fix: remove optimistic plan_tier write from activate-trial — webhook is sole authority"
```

---

### Task 2.3: Validate paymentMethodId ownership before attaching [H-2]

The endpoint accepts any `pm_*` string from the client without verifying it belongs to this user's Stripe customer.

- [ ] **Update `src/app/api/stripe/activate-trial/route.ts`** — add before `stripe.paymentMethods.attach()`:

```ts
// Validate format
const pmRegex = /^pm_[a-zA-Z0-9_]+$/;
if (!pmRegex.test(paymentMethodId)) {
  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}

// Verify ownership — retrieve from Stripe and check it's not attached to a different customer
const existingPm = await stripe.paymentMethods.retrieve(paymentMethodId);
if (existingPm.customer && existingPm.customer !== customerId) {
  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/activate-trial/route.ts
git commit -m "fix: verify paymentMethodId ownership before attaching to Stripe customer"
```

---

### Task 2.4: Fix webhook — null out deleted subscription ID + handle all statuses [C-5, H-7]

Two bugs in `src/app/api/stripe/webhook/route.ts`:
1. When `customer.subscription.deleted` fires, `stripe_subscription_id` is still written (should be `null`)
2. `past_due`, `unpaid`, `incomplete` statuses are not mapped — users keep `pro` after payment failure

- [ ] **Update `src/app/api/stripe/webhook/route.ts`**

Replace the tier-mapping and update logic:

```ts
// Map subscription status to plan tier
let plan_tier: "trial" | "pro" | "free";
if (subscription.status === "trialing") {
  plan_tier = "trial";
} else if (subscription.status === "active") {
  plan_tier = "pro";
} else {
  plan_tier = "free"; // covers: past_due, unpaid, incomplete, paused, canceled
}

// For deleted subscriptions, also clear the subscription ID
const isDeleted = event.type === "customer.subscription.deleted";

await supabase
  .from("mma_profiles")
  .update({
    plan_tier,
    stripe_subscription_id: isDeleted ? null : subscription.id,
  })
  .eq("stripe_customer_id", customerId);
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "fix: null out stripe_subscription_id on delete; downgrade tier for past_due/unpaid/incomplete"
```

---

### Task 2.5: Switch cancel to end-of-period [C-6]

`stripe.subscriptions.cancel()` is an immediate cancel. Users lose access mid-period. Local DB update also races with the webhook.

- [ ] **Update `src/app/api/stripe/cancel-subscription/route.ts`**

Replace `stripe.subscriptions.cancel(subscriptionId)` with:

```ts
await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
```

Remove the subsequent `supabase.from("mma_profiles").update({ plan_tier: "free", ... })` call entirely — the webhook handles downgrade when `customer.subscription.deleted` fires at period end. Leave a comment:

```ts
// plan_tier is NOT updated here — the webhook's customer.subscription.deleted
// event handles the downgrade when the period ends.
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/cancel-subscription/route.ts
git commit -m "fix: cancel at period end instead of immediately; remove racing DB write"
```

---

### Task 2.6: Add Stripe-side ownership check before cancel [M-6]

`cancel-subscription` reads `stripe_subscription_id` from the DB and calls cancel without verifying it still belongs to this user's Stripe customer.

- [ ] **Update `src/app/api/stripe/cancel-subscription/route.ts`** — after reading the profile, add:

```ts
// Verify the subscription belongs to this customer before canceling
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
if (subscription.customer !== profile.stripe_customer_id) {
  return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
}
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/cancel-subscription/route.ts
git commit -m "fix: verify Stripe subscription ownership before canceling"
```

---

### Task 2.7: Add idempotency key to Stripe customer creation [H-6]

Two concurrent requests to `setup-intent` both see `stripe_customer_id: null` and each create a Stripe customer, leaving one orphaned.

- [ ] **Update `src/app/api/stripe/setup-intent/route.ts`** — find the `stripe.customers.create()` call and add idempotency key:

```ts
const customer = await stripe.customers.create(
  {
    email: user.email,
    metadata: { supabase_user_id: user.id },
  },
  {
    idempotencyKey: `customer-create-${user.id}`,
  }
);
```

- [ ] **Commit**

```bash
git add src/app/api/stripe/setup-intent/route.ts
git commit -m "fix: add idempotency key to Stripe customer creation to prevent duplicates"
```

---

## Team 3 — Backend Data Integrity

**Covers:** C-7, C-8, H-3, M-1, M-4, M-5

**Files:**
- Modify: `src/app/api/cron/trial-emails/route.ts`
- Modify: `src/app/api/plans/[id]/commit/route.ts`
- Modify: `src/app/api/check-in/route.ts`
- Modify: `src/app/api/generate-plan/route.ts`

---

### Task 3.1: Add email deduplication to trial cron [C-7, H-3]

The cron runs every hour. Every user in the 24-hour window receives up to 24 emails per day. Also `CRON_SECRET` is likely unset.

**3.1a — Add tracking columns** (requires DB migration via Supabase dashboard or migration file)

Add these nullable timestamp columns to `mma_profiles`:
```sql
ALTER TABLE mma_profiles
  ADD COLUMN IF NOT EXISTS trial_email_day3_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_email_day5_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_email_day7_sent_at timestamptz;
```

Run this in the Supabase SQL editor or create a migration file.

**3.1b — Update `src/app/api/cron/trial-emails/route.ts`**

For each day window, add `.is("trial_email_day3_sent_at", null)` to the query filter, and after sending the email, update the sent-at column:

```ts
// Day 3 example — apply same pattern to day 5 and day 7
const { data: day3Users } = await supabase
  .from("mma_profiles")
  .select("id, email, name")
  .eq("plan_tier", "trial")
  .is("trial_email_day3_sent_at", null)
  .gte("trial_started_at", day3Start.toISOString())
  .lt("trial_started_at", day3End.toISOString());

for (const user of day3Users ?? []) {
  await sendTrialEmail(user, "day3");
  await supabase
    .from("mma_profiles")
    .update({ trial_email_day3_sent_at: new Date().toISOString() })
    .eq("id", user.id);
}
```

**3.1c — Verify CRON_SECRET is set**

```bash
vercel env ls | grep CRON_SECRET
```

If missing:
```bash
vercel env add CRON_SECRET production
```

- [ ] **Commit**

```bash
git add src/app/api/cron/trial-emails/route.ts
git commit -m "fix: deduplicate trial emails using sent_at tracking columns; guard CRON_SECRET"
```

---

### Task 3.2: Atomic streak increment in commit route [C-8]

`src/app/api/plans/[id]/commit/route.ts:92` does read-modify-write for streak without a DB lock. Two concurrent requests both read `5`, both write `6`, losing an increment.

- [ ] **Create a Supabase RPC for atomic streak increment** — run in Supabase SQL editor:

```sql
CREATE OR REPLACE FUNCTION increment_streak(p_user_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE mma_profiles
  SET
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    updated_at = now()
  WHERE id = p_user_id;
$$;
```

- [ ] **Update `src/app/api/plans/[id]/commit/route.ts`**

Replace the read-modify-write streak block with:

```ts
const { error: streakError } = await supabase.rpc("increment_streak", {
  p_user_id: user.id,
});
if (streakError) console.error("Streak increment failed:", streakError);
```

- [ ] **Commit**

```bash
git add src/app/api/plans/[id]/commit/route.ts
git commit -m "fix: use atomic DB RPC for streak increment to prevent race condition"
```

---

### Task 3.3: Check affected row count before incrementing streak in check-in [M-4]

`src/app/api/check-in/route.ts:66` increments streak even when the `weekly_actions` update no-oped (wrong `weeklyActionId`, or update silently matched zero rows).

- [ ] **Update `src/app/api/check-in/route.ts`**

Add `.select("id")` to the update to detect zero rows, then gate the streak call:

```ts
const { data: updatedRows, error: updateError } = await supabase
  .from("weekly_actions")
  .update({ actions, reviewed_at: new Date().toISOString() })
  .eq("id", weeklyActionId)
  .eq("user_id", user.id)
  .select("id");

if (updateError) {
  return NextResponse.json({ error: "Failed to update check-in" }, { status: 500 });
}

if (!updatedRows || updatedRows.length === 0) {
  return NextResponse.json({ error: "Weekly action not found" }, { status: 404 });
}

// Only increment streak if the update actually matched a row
const { error: streakError } = await supabase.rpc("increment_streak", {
  p_user_id: user.id,
});
if (streakError) console.error("Streak increment failed:", streakError);
```

Note: this reuses the `increment_streak` RPC created in Task 3.2.

- [ ] **Commit**

```bash
git add src/app/api/check-in/route.ts
git commit -m "fix: only increment streak when weekly_actions update matched a row"
```

---

### Task 3.4: Zod-validate AI response before persisting [M-1]

`src/app/api/generate-plan/route.ts:92` casts AI JSON with `as PlanContent` — no runtime validation. Malformed AI output is persisted and later crashes the plan page.

- [ ] **Add a `PlanContentSchema` in `src/types/index.ts`** — add below the `PlanContent` type:

```ts
import { z } from "zod";

export const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  effort: z.string().optional(),
  timeframe: z.string().optional(),
});

export const WeekSchema = z.object({
  week: z.number(),
  actions: z.array(ActionItemSchema),
});

export const ChannelStrategySchema = z.object({
  channel: z.string(),
  tactics: z.array(z.string()),
  rationale: z.string().optional(),
});

export const HealthScoreDimensionSchema = z.object({
  name: z.string(),
  score: z.number(),
  feedback: z.string(),
});

export const PlanContentSchema = z.object({
  health_score: z.object({
    score: z.number(),
    dimensions: z.array(HealthScoreDimensionSchema),
    summary: z.string(),
  }),
  channel_strategy: z.array(ChannelStrategySchema),
  sprint_plan: z.array(WeekSchema),
  top_3_actions: z.array(ActionItemSchema).optional(),
});
```

- [ ] **Update `src/app/api/generate-plan/route.ts`** — replace the bare `JSON.parse` cast:

```ts
const parsed = JSON.parse(cleanedText);
const validation = PlanContentSchema.safeParse(parsed);
if (!validation.success) {
  console.error("AI response failed schema validation:", validation.error.flatten());
  return NextResponse.json(
    { error: "AI returned an unexpected response format. Please try again." },
    { status: 502 }
  );
}
const plan = validation.data;
```

- [ ] **Commit**

```bash
git add src/types/index.ts src/app/api/generate-plan/route.ts
git commit -m "fix: Zod-validate AI response before persisting to prevent broken plan pages"
```

---

### Task 3.5: Escape AI-generated HTML in emails [M-5]

`src/app/api/generate-plan/route.ts:140` interpolates AI-generated `a.title` and `a.description` as raw HTML into outgoing emails.

- [ ] **Add an HTML escape helper in `src/app/api/generate-plan/route.ts`**:

```ts
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Wrap all AI-generated string interpolations in email templates** with `escHtml()`:

```ts
`<strong>${escHtml(a.title)}</strong>`
`<p>${escHtml(a.description)}</p>`
```

Apply to every AI field interpolated in the email body.

- [ ] **Commit**

```bash
git add src/app/api/generate-plan/route.ts
git commit -m "fix: escape AI-generated HTML in outgoing emails"
```

---

## Team 4 — Frontend UI

**Covers:** M-2, M-3, M-7

**Files:**
- Modify: `src/app/(app)/plan/new/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(shared)/plan/[id]/page.tsx`
- Modify: `src/lib/prompts/plan-generation.ts` (impact field schema)

---

### Task 4.1: Remove duplicate LinkedIn from channel arrays [M-2]

`HANG_OUT_CHANNELS` in `src/app/(app)/plan/new/page.tsx` contains "LinkedIn" twice (indices 1 and 8). Both checkboxes are keyed by value, so they're always in sync — selecting either selects both.

- [ ] **Update `src/app/(app)/plan/new/page.tsx`** — find `HANG_OUT_CHANNELS` and remove the duplicate entry:

The array should contain exactly one "LinkedIn". Remove whichever duplicate appears later in the list.

- [ ] **Verify in browser** — navigate to the plan/new page, confirm only one LinkedIn checkbox renders in each group.

- [ ] **Commit**

```bash
git add src/app/(app)/plan/new/page.tsx
git commit -m "fix: remove duplicate LinkedIn entry in HANG_OUT_CHANNELS"
```

---

### Task 4.2: Fix health score zero being swallowed by `||` [M-3]

`src/app/(app)/dashboard/page.tsx:178` uses `||` to chain health score fallbacks. A legitimate score of `0` falls through to the next fallback.

- [ ] **Update `src/app/(app)/dashboard/page.tsx`** — find the line:

```ts
overallScore: latestPlan?.health_score || profile?.health_score || 0,
```

Replace with:

```ts
overallScore: latestPlan?.health_score ?? profile?.health_score ?? 0,
```

- [ ] **Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "fix: use nullish coalescing for health score to preserve legitimate score of 0"
```

---

### Task 4.3: Fix impact badge — constrain AI output to High/Medium/Low [M-7]

`src/app/(shared)/plan/[id]/page.tsx:553` checks `p.impact === "High"` but the AI prompt defines `impact` as a free-form sentence, so every badge renders as `"secondary"`.

**Option chosen:** constrain the AI prompt output so `impact` is one of `"High" | "Medium" | "Low"`, then use it for the badge.

- [ ] **Update `src/lib/prompts/plan-generation.ts`** — find the `impact` field description in the JSON schema block and change:

```
"impact": "<1 sentence on the concrete result>"
```

to:

```
"impact": "High | Medium | Low"
```

- [ ] **Update `src/types/index.ts`** — find the `ActionItem` type and change:

```ts
impact: string;
```

to:

```ts
impact: "High" | "Medium" | "Low";
```

- [ ] **Update `PlanContentSchema` in `src/types/index.ts`** — update the `ActionItemSchema.impact` field:

```ts
impact: z.enum(["High", "Medium", "Low"]),
```

- [ ] **Verify badge renders correctly** by visiting a plan page with a regenerated plan (old plans will fail Zod validation — that's expected and correct per Task 3.4).

- [ ] **Commit**

```bash
git add src/lib/prompts/plan-generation.ts src/types/index.ts
git commit -m "fix: constrain impact field to High/Medium/Low so plan page badge renders correctly"
```

---

## Final Step: npm audit

- [ ] **Run audit fix**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp
npm audit fix
```

- [ ] **Run build to confirm no regressions**

```bash
npm run build
```

- [ ] **Commit if any packages were updated**

```bash
git add package.json package-lock.json
git commit -m "chore: npm audit fix — patch moderate severity vulnerabilities"
```

---

## Execution Order

Teams 1–4 can run in parallel (non-overlapping files). Final audit step runs after all teams complete.

| Team | Issues Fixed | Estimated Changes |
|------|-------------|-------------------|
| Team 1 — Auth & Security | C-1, C-2, H-1, H-4, H-5 | 5 files |
| Team 2 — Stripe & Billing | C-3, C-4, C-5, C-6, H-2, H-6, H-7, M-6 | 4 files |
| Team 3 — Backend Data Integrity | C-7, C-8, H-3, M-1, M-4, M-5 | 4 files |
| Team 4 — Frontend UI | M-2, M-3, M-7 | 3 files |
| Final — npm audit | M-8 | package.json |
