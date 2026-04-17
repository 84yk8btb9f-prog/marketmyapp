# Ship Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get MarketMyApp production-ready — fix broken nav links, add subscription gating, wire up email delivery, and confirm infra is running.

**Architecture:** Five independent tasks: (1) infra/env confirmation, (2) `/plans` list page, (3) `/settings` page with cancel subscription, (4) subscription gating in middleware, (5) Resend email after plan generation.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, Stripe, Resend, Tailwind v4, Framer Motion, Lucide

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/(app)/plans/page.tsx` | Create | List all user's saved plans |
| `src/app/(app)/settings/page.tsx` | Create | Account info, subscription status, cancel |
| `src/app/api/stripe/cancel-subscription/route.ts` | Create | Cancel Stripe subscription API |
| `src/lib/resend.ts` | Create | Resend client singleton |
| `src/app/api/email/send-plan/route.ts` | Create | Send plan email via Resend |
| `src/lib/supabase/middleware.ts` | Modify | Gate `/plan/new` for free-tier users |
| `src/app/(app)/plan/new/page.tsx` | Modify | Call send-plan email API after plan saved |

---

## Task 1: Confirm Infra (Vercel env vars + Supabase migration)

**Files:** none — CLI only

- [ ] **Step 1: Check which env vars are on Vercel production**

```bash
vercel env ls production
```

Expected output: a table showing all env vars. Confirm these are present:
`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`

- [ ] **Step 2: Add any missing vars**

For each missing var, run (using `ANTHROPIC_API_KEY` as example):
```bash
printf "sk-ant-api03-..." | vercel env add ANTHROPIC_API_KEY production
```

Repeat for every missing var. Values are in `.env.local`.

- [ ] **Step 3: Confirm Supabase migration applied**

```bash
npx supabase db diff --schema public 2>/dev/null | head -40
```

If output shows `CREATE TABLE profiles` / `CREATE TABLE plans` — the migration **has not** been applied yet. Run:
```bash
npx supabase db push
```

If output is empty or shows only indexes/triggers — tables already exist, nothing to do.

---

## Task 2: Build `/plans` page

**Files:**
- Create: `src/app/(app)/plans/page.tsx`

Pattern to follow: `src/app/(app)/dashboard/page.tsx` — `"use client"`, Supabase browser client, motion animations.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, FileText, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const EASE = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

interface Plan {
  id: string;
  app_name: string;
  health_score: number | null;
  created_at: string;
  status: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("plans")
      .select("id, app_name, health_score, created_at, status")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={EASE}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">My Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your generated marketing plans
          </p>
        </div>
        <Button render={<Link href="/plan/new">New Plan</Link>} className="gap-2">
          <PlusCircle className="size-4" />
          New Plan
        </Button>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={EASE}
          className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-border text-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">No plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your first marketing plan to get started
            </p>
          </div>
          <Button render={<Link href="/plan/new">Generate your first plan</Link>} size="sm">
            Generate your first plan
          </Button>
        </motion.div>
      )}

      {/* Plan list */}
      {!loading && plans.length > 0 && (
        <div className="flex flex-col gap-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE, delay: i * 0.05 }}
            >
              <Link
                href={`/plan/${plan.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{plan.app_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(plan.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {plan.health_score != null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="size-3" />
                          Score: {plan.health_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp && npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/plans/page.tsx
git commit -m "feat: add /plans page — list user's saved plans"
```

---

## Task 3: Build `/settings` page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/app/api/stripe/cancel-subscription/route.ts`

- [ ] **Step 1: Create the cancel-subscription API route**

```ts
// src/app/api/stripe/cancel-subscription/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  const subscriptionId = profile?.stripe_subscription_id as string | null;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  await stripe.subscriptions.cancel(subscriptionId);

  await supabase
    .from("profiles")
    .update({ plan_tier: "free", stripe_subscription_id: null })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create the settings page**

```tsx
// src/app/(app)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, CreditCard, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const EASE = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

interface Profile {
  email: string;
  plan_tier: string;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

function planLabel(tier: string, trialEndsAt: string | null): string {
  if (tier === "trial") {
    const end = trialEndsAt
      ? new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
      : "soon";
    return `Free Trial — ends ${end}`;
  }
  if (tier === "pro") return "Pro — $19/month";
  return "Free";
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("email, plan_tier, trial_ends_at, stripe_subscription_id")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    });
  }, [router]);

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You'll lose access at the end of your billing period.")) return;
    setCancelling(true);
    setCancelError(null);
    const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
    if (!res.ok) {
      setCancelError("Failed to cancel. Please try again or contact support.");
    } else {
      setCancelled(true);
      setProfile((p) => p ? { ...p, plan_tier: "free", stripe_subscription_id: null } : p);
    }
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={EASE}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-8">Settings</h1>

        {/* Account */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{profile?.email}</span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="size-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Subscription</h2>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border mb-4 text-sm">
            <span className="text-muted-foreground">Current plan</span>
            <span className="text-foreground font-medium">
              {planLabel(profile?.plan_tier ?? "free", profile?.trial_ends_at ?? null)}
            </span>
          </div>

          {cancelled && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3 mb-4">
              Your subscription has been cancelled. Access continues until the billing period ends.
            </p>
          )}

          {cancelError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4">
              {cancelError}
            </p>
          )}

          {profile?.plan_tier === "free" && !cancelled && (
            <Button render={<a href="/trial">Upgrade to Pro</a>} className="w-full">
              Start Free Trial
            </Button>
          )}

          {(profile?.plan_tier === "trial" || profile?.plan_tier === "pro") && !cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="size-3.5" />
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it builds**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/settings/page.tsx src/app/api/stripe/cancel-subscription/route.ts
git commit -m "feat: add /settings page and cancel-subscription API"
```

---

## Task 4: Subscription gating

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

Free users who try to visit `/plan/new` get redirected to `/trial`. All other app pages remain accessible (dashboard, plan view, settings).

- [ ] **Step 1: Update middleware.ts**

Replace the current auth guard block (lines 33–42) with this expanded version:

```ts
// After: const { data: { user } } = await supabase.auth.getUser();

const pathname = request.nextUrl.pathname;

// Redirect unauthenticated users away from app pages
if (
  !user &&
  (pathname.startsWith("/dashboard") ||
    pathname.startsWith("/plan") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/settings"))
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// Gate plan creation behind trial/pro subscription
if (user && pathname === "/plan/new") {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.plan_tier === "free") {
    const url = request.nextUrl.clone();
    url.pathname = "/trial";
    return NextResponse.redirect(url);
  }
}
```

The full updated file becomes:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from app pages
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/plan") ||
      pathname.startsWith("/plans") ||
      pathname.startsWith("/settings"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Gate plan creation behind trial/pro subscription
  if (user && pathname === "/plan/new") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_tier")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plan_tier === "free") {
      const url = request.nextUrl.clone();
      url.pathname = "/trial";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat: gate /plan/new behind trial/pro subscription"
```

---

## Task 5: Email delivery via Resend

Send the user their plan by email immediately after it's generated.

**Files:**
- Create: `src/lib/resend.ts`
- Create: `src/app/api/email/send-plan/route.ts`
- Modify: `src/app/(app)/plan/new/page.tsx` — call send-plan after plan saved

- [ ] **Step 1: Install Resend**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp && npm install resend
```

Expected: `added 1 package` (or similar).

- [ ] **Step 2: Create Resend client**

```ts
// src/lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

- [ ] **Step 3: Create the send-plan API route**

This route accepts a plan ID, fetches the plan from Supabase, and emails a summary to the user.

```ts
// src/app/api/email/send-plan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import type { PlanContent } from "@/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await req.json();
  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("app_name, plan_content")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const content = plan.plan_content as PlanContent;

  // Build a readable plain-HTML email from the plan content
  const actionsHtml = (content.this_week_actions ?? [])
    .map(
      (a: { title: string; description: string; priority: string }) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1f1f1f;">
        <strong style="color:#fafafa;font-size:14px;">${a.title}</strong>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">${a.description}</p>
      </td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#fafafa;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <tr>
      <td>
        <p style="color:#e5a520;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 24px;">
          MarketMyApp
        </p>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#fafafa;">
          Your plan for ${plan.app_name} is ready
        </h1>
        <p style="color:#888;font-size:14px;margin:0 0 32px;">
          Here's what to focus on this week.
        </p>

        <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#e5a520;margin:0 0 12px;">
          This Week's Actions
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${actionsHtml}
        </table>

        <div style="margin-top:32px;padding:16px;background:#111;border-radius:12px;border:1px solid #1f1f1f;">
          <p style="margin:0;font-size:13px;color:#888;">
            View your full plan at<br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/plan/${planId}" style="color:#e5a520;">
              ${process.env.NEXT_PUBLIC_APP_URL}/plan/${planId}
            </a>
          </p>
        </div>

        <p style="margin-top:32px;font-size:12px;color:#555;">
          You're receiving this because you generated a plan on MarketMyApp.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "MarketMyApp <plans@updates.marketmyapp.com>",
    to: user.email!,
    subject: `Your marketing plan for ${plan.app_name}`,
    html,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Find where plan is saved in NewPlanPage and add email call**

Open `src/app/(app)/plan/new/page.tsx`. Find the `handleSubmit` function. After the plan is saved to Supabase and a `planId` is obtained, add:

```ts
// After: const planId = ... (wherever plan ID is captured)
// Fire-and-forget — don't block navigation on email success
fetch("/api/email/send-plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ planId }),
}).catch(() => {
  // email failure is non-fatal
});
```

To find the exact insertion point, search for `router.push` or `supabase.from("plans").insert` in that file.

- [ ] **Step 5: Verify it builds**

```bash
cd /Users/nikolassapalidis/Projects/marketmyapp && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Add RESEND_API_KEY to Vercel if not already there**

```bash
vercel env ls production | grep RESEND
```

If missing:
```bash
printf "re_EmdNprnv_Mt4pyJnYx4xhDyTyZDKxKYdk" | vercel env add RESEND_API_KEY production
```

- [ ] **Step 7: Commit and push**

```bash
git add src/lib/resend.ts src/app/api/email/send-plan/route.ts src/app/\(app\)/plan/new/page.tsx
git commit -m "feat: send plan email via Resend after generation"
git push
```

---

## Final Verification

After all tasks are committed and Vercel deploys:

- [ ] Visit `/plans` — shows empty state or plan list
- [ ] Visit `/settings` — shows email + plan tier
- [ ] Log in as a free-tier user, visit `/plan/new` — redirects to `/trial`
- [ ] Log in as trial user, generate a plan — check email inbox for delivery
- [ ] Click cancel subscription on settings — subscription cancelled, plan_tier → free

---

## What's intentionally NOT in this plan

- Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) — needs custom domain first; update after domain is set up
- PDF generation — not in pricing copy, deferred
- Weekly recalibration / accountability check-ins — Pro feature, deferred until users onboard
