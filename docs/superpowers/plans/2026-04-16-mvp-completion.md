# MarketMyApp MVP Completion + Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the MarketMyApp MVP by wiring real data throughout the app, implementing the commitment/check-in retention loop, switching AI generation to open-source models (Groq), adding the trial email sequence, and shipping Phase 2 features (shareable health score OG cards and PDF export).

**Architecture:** Next.js 16 App Router SaaS. Auth + DB on Supabase (`mma_profiles`, `plans`, `weekly_actions`). Stripe for payments. Resend for email. Plan pages and dashboard currently show hardcoded mock data — every task wires a real data source. AI generation switches from Anthropic Claude to Groq API (OpenAI-compatible, free tier) with Claude as fallback. Cron jobs run on Vercel's cron infrastructure.

**Tech Stack:** Next.js 16.2.2 (App Router), TypeScript, Supabase SSR, Tailwind CSS v4, Framer Motion 12, Shadcn/UI, Groq API (OpenAI-compatible), Resend 6, `@react-pdf/renderer` (already installed), `next/og` for OG images, Vercel Cron

---

## File Structure

**Files to create:**
- `src/lib/groq.ts` — Groq API client (fetch-based, model fallback chain)
- `src/app/api/plans/[id]/commit/route.ts` — POST: save weekly commitment, update streak
- `src/app/api/check-in/route.ts` — POST: mark check-in reviewed, update action statuses
- `src/app/api/cron/trial-emails/route.ts` — Vercel daily cron: Day 3/5/7 emails
- `src/app/api/og/route.tsx` — Edge route: shareable health score OG image
- `src/app/api/plans/[id]/pdf/route.tsx` — GET: generate and stream PDF (pro only)
- `src/components/pdf/plan-document.tsx` — React PDF document component
- `src/app/(app)/check-in/page.tsx` — Weekly check-in UI
- `vercel.json` — Cron schedule configuration

**Files to modify:**
- `src/app/api/generate-plan/route.ts` — Switch to Groq; Claude as fallback
- `src/app/(app)/plan/[id]/page.tsx` — Replace MOCK_PLAN_CONTENT; add Commit section
- `src/app/(app)/dashboard/page.tsx` — Replace all hardcoded data with real DB queries

---

## Task 1: Groq AI Client + Switch Plan Generation to Open-Source Models

**Context:** `generate-plan/route.ts` currently calls `anthropic.messages.create()`. We're switching to Groq's OpenAI-compatible API (free, fast). Model priority from project rules: `moonshotai/kimi-k2-instruct` → `openai/gpt-oss-120b` → `qwen/qwen3-32b`. Claude stays as fallback. Env var needed: `GROQ_API_KEY`.

**Files:**
- Create: `src/lib/groq.ts`
- Modify: `src/app/api/generate-plan/route.ts`

- [ ] **Step 1: Create the Groq client**

Create `src/lib/groq.ts`:

```typescript
const GROQ_BASE = "https://api.groq.com/openai/v1";

// Priority: best reasoning → versatile → fallback
const GROQ_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
];

export async function groqComplete(
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.status.toString());
        console.warn(`[groq] ${model} → ${res.status}: ${errText}`);
        continue;
      }

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      return data.choices[0].message.content;
    } catch (err) {
      console.warn(`[groq] ${model} threw:`, err);
      continue;
    }
  }

  throw new Error("All Groq models failed");
}
```

- [ ] **Step 2: Verify the file was created**

Run: `ls src/lib/groq.ts`
Expected: file listed

- [ ] **Step 3: Update generate-plan route to use Groq with Claude fallback**

In `src/app/api/generate-plan/route.ts`:

Add import at top (after existing imports):
```typescript
import { groqComplete } from "@/lib/groq";
```

Replace the existing AI generation block (the `try { const message = await anthropic.messages.create(...)` section) with:
```typescript
  // Generate — try Groq first, fall back to Claude
  let rawText: string;
  try {
    rawText = await groqComplete(prompt, 8192);
  } catch (groqErr) {
    console.warn("[generate-plan] Groq failed, falling back to Claude:", groqErr);
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected content type");
      rawText = block.text;
    } catch (claudeErr) {
      const msg = claudeErr instanceof Error ? claudeErr.message : "AI generation failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }
```

- [ ] **Step 4: Add GROQ_API_KEY to .env.local**

Add to `.env.local`:
```
GROQ_API_KEY=<copy from ~/.config/groq/.env>
```

Run: `grep GROQ_API_KEY ~/.config/groq/.env`
This prints the key. Add it to `.env.local`.

- [ ] **Step 5: Type-check**

Run: `npm run build 2>&1 | head -40`
Expected: No TypeScript errors in the modified files (build may fail for other reasons — that's OK here).

- [ ] **Step 6: Commit**

```bash
git add src/lib/groq.ts src/app/api/generate-plan/route.ts .env.local
git commit -m "feat: switch plan generation to Groq open-source models (Claude fallback)"
```

---

## Task 2: Wire Plan Page to Real DB Data

**Context:** `src/app/(app)/plan/[id]/page.tsx` uses `MOCK_PLAN_CONTENT` and `MOCK_APP_NAME` everywhere. It's a `"use client"` component that already uses `use(params)` from React. We need to add a `useEffect` to fetch the plan from Supabase and replace the mocks with real data. Show a loading spinner while fetching; show a not-found state for bad IDs.

**Files:**
- Modify: `src/app/(app)/plan/[id]/page.tsx`

- [ ] **Step 1: Add imports and state to PlanPage**

At the top of the file, `createClient` is not currently imported. Add it:
```typescript
import { createClient } from "@/lib/supabase/client";
```

In the `PlanPage` component body, after `const { id } = use(params);`, replace the two mock constants:
```typescript
// DELETE these two lines:
// const plan = MOCK_PLAN_CONTENT;
// const appName = MOCK_APP_NAME;

// ADD this block:
const [plan, setPlan] = useState<PlanContent | null>(null);
const [appName, setAppName] = useState("");
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);

useEffect(() => {
  const supabase = createClient();
  supabase
    .from("plans")
    .select("plan_content, app_name")
    .eq("id", id)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setPlan(data.plan_content as PlanContent);
        setAppName(data.app_name as string);
      }
      setLoading(false);
    });
}, [id]);
```

Make sure `useState` and `useEffect` are in the existing React import line. The existing import is:
```typescript
import { use, useEffect, useRef, useState } from "react";
```
`useEffect` and `useState` are already imported — just verify they're there.

- [ ] **Step 2: Add early returns for loading and not-found**

After the state/effect block, add early returns before the existing `return (...)`:
```typescript
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-foreground">Plan not found</p>
        <Button render={<Link href="/dashboard" />} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }
```

- [ ] **Step 3: Delete the MOCK_PLAN_CONTENT and MOCK_APP_NAME constants**

These are the two large `const MOCK_PLAN_CONTENT: PlanContent = { ... }` and `const MOCK_APP_NAME = "LaunchKit"` blocks near the top of the file (before SECTIONS). Delete them entirely.

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep "plan/\[id\]"`
Expected: No output (no errors in this file).

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/plan/\[id\]/page.tsx
git commit -m "feat: wire plan page to real Supabase data"
```

---

## Task 3: Commitment API Route

**Context:** After a plan is generated, users commit to their top 3 actions for the week. This route saves the commitment to the `weekly_actions` table and increments the streak in `mma_profiles`. Route: `POST /api/plans/[id]/commit`. Body: `{ selectedIndices: number[] }` — indices into `this_weeks_top_3`.

**Files:**
- Create: `src/app/api/plans/[id]/commit/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionItem } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { selectedIndices: number[] };
  const { selectedIndices } = body;

  if (!Array.isArray(selectedIndices) || selectedIndices.length === 0) {
    return NextResponse.json({ error: "No actions selected" }, { status: 400 });
  }

  // Fetch the plan
  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("plan_content")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (planError || !planRow) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const allActions = (planRow.plan_content as { this_weeks_top_3: ActionItem[] })
    .this_weeks_top_3;

  const committedActions: ActionItem[] = selectedIndices
    .filter((i) => i >= 0 && i < allActions.length)
    .map((i) => ({ ...allActions[i], status: "pending" as const }));

  // Idempotency: check if already committed for week 1 of this plan
  const { data: existing } = await supabase
    .from("weekly_actions")
    .select("id")
    .eq("plan_id", planId)
    .eq("user_id", user.id)
    .eq("week_number", 1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ id: existing.id, alreadyCommitted: true });
  }

  // Save commitment
  const { data: weeklyAction, error: waError } = await supabase
    .from("weekly_actions")
    .insert({
      plan_id: planId,
      user_id: user.id,
      week_number: 1,
      actions: committedActions,
      committed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (waError || !weeklyAction) {
    return NextResponse.json({ error: "Failed to save commitment" }, { status: 500 });
  }

  // Update streak: increment by 1 and update longest if needed
  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("current_streak, longest_streak")
    .eq("id", user.id)
    .single();

  const newStreak = (profile?.current_streak ?? 0) + 1;
  const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0);

  await supabase
    .from("mma_profiles")
    .update({ current_streak: newStreak, longest_streak: newLongest })
    .eq("id", user.id);

  return NextResponse.json({ id: weeklyAction.id });
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep "commit/route"`
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/plans/\[id\]/commit/route.ts
git commit -m "feat: add commitment API - save weekly actions + update streak"
```

---

## Task 4: Commitment UI on Plan Page

**Context:** Add a "Commit to Your Top 3" section on the plan page, rendered just before the "This Week's Top 3" section in `<main>`. Shows checkboxes for each of the 3 top actions. On submit, calls `POST /api/plans/[id]/commit`. Once committed, shows a green "committed" banner instead. Also check on load if commitment already exists (for returning visits).

**Files:**
- Modify: `src/app/(app)/plan/[id]/page.tsx`

- [ ] **Step 1: Add commitment state variables in PlanPage**

Inside `PlanPage`, after the existing data-fetch state variables, add:

```typescript
const [committed, setCommitted] = useState(false);
const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2]);
const [committing, setCommitting] = useState(false);
```

- [ ] **Step 2: Check for existing commitment on load**

Add a second `useEffect` below the plan-fetch effect:

```typescript
useEffect(() => {
  if (!id) return;
  const supabase = createClient();
  supabase
    .from("weekly_actions")
    .select("id")
    .eq("plan_id", id)
    .limit(1)
    .then(({ data }) => {
      if (data && data.length > 0) setCommitted(true);
    });
}, [id]);
```

- [ ] **Step 3: Add the handleCommit function**

Inside `PlanPage`, before the `return` statement:

```typescript
async function handleCommit() {
  if (selectedIndices.length === 0 || committing) return;
  setCommitting(true);
  try {
    const res = await fetch(`/api/plans/${id}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIndices }),
    });
    if (res.ok) {
      setCommitted(true);
    }
  } finally {
    setCommitting(false);
  }
}
```

- [ ] **Step 4: Add CommitSection JSX in the main content**

In the `<main>` element, just before the `{/* This Week's Top 3 */}` section comment, add:

```tsx
          {/* Commitment Section */}
          <section>
            {!committed ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-2">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Target className="size-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    Commit to Your Top 3
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Select the actions you commit to completing this week. They'll appear on your dashboard.
                </p>
                <div className="space-y-2 mb-5">
                  {plan.this_weeks_top_3.map((action, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                        selectedIndices.includes(i)
                          ? "border-primary/40 bg-primary/10"
                          : "border-border hover:border-primary/20 hover:bg-muted/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndices.includes(i)}
                        onChange={() =>
                          setSelectedIndices((prev) =>
                            prev.includes(i)
                              ? prev.filter((x) => x !== i)
                              : [...prev, i]
                          )
                        }
                        className="mt-0.5 size-4 accent-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {action.time_estimate}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  onClick={handleCommit}
                  disabled={selectedIndices.length === 0 || committing}
                  className="gap-2"
                >
                  {committing
                    ? "Saving…"
                    : `Commit to ${selectedIndices.length} action${selectedIndices.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 mb-2">
                <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                <p className="text-sm font-medium text-foreground flex-1">
                  You&apos;ve committed to this week&apos;s actions.
                </p>
                <Button
                  render={<Link href="/dashboard" />}
                  variant="link"
                  size="sm"
                  className="text-primary shrink-0 h-auto p-0 text-xs"
                >
                  View on dashboard →
                </Button>
              </div>
            )}
          </section>
```

`Target`, `CheckCircle2`, `Link`, `Button`, and `cn` are all already imported in this file — verify they are.

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "plan/\[id\]"`
Expected: No output.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/plan/\[id\]/page.tsx
git commit -m "feat: add commitment UI on plan page"
```

---

## Task 5: Wire Dashboard to Real DB Data

**Context:** The dashboard uses three hardcoded constants that need replacing with real data: `INITIAL_ACTIONS` (hardcoded actions), `PAST_PLANS` (hardcoded plan history), and `STREAK = 5` (hardcoded streak). We'll add a `useDashboardData` hook that fetches from Supabase and pass data as props to each section component. Section components that currently close over the constants need to accept props instead.

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

Add to the import section:
```typescript
import { createClient } from "@/lib/supabase/client";
import type { ActionItem as DBActionItem } from "@/types";
```

- [ ] **Step 2: Add the useDashboardData hook**

Add this hook above the component definitions (before `PriorityBadge`):

```typescript
interface DashboardState {
  weeklyActions: DBActionItem[];
  weeklyActionId: string | null;
  plans: PastPlan[];
  streak: number;
  overallScore: number;
  scoreDimensions: ScoreDimension[];
  checkInPlanId: string | null;
}

function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    weeklyActions: [],
    weeklyActionId: null,
    plans: [],
    streak: 0,
    overallScore: 0,
    scoreDimensions: [],
    checkInPlanId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      // Latest uncommitted (committed but not reviewed) weekly actions
      supabase
        .from("weekly_actions")
        .select("id, actions, plan_id")
        .not("committed_at", "is", null)
        .is("reviewed_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
      // Last 3 plans
      supabase
        .from("plans")
        .select("id, app_name, health_score, created_at, plan_content")
        .order("created_at", { ascending: false })
        .limit(3),
      // Profile
      supabase
        .from("mma_profiles")
        .select("current_streak, health_score")
        .single(),
    ]).then(([waRes, plansRes, profileRes]) => {
      const waRow = waRes.data?.[0];
      const plansRows = plansRes.data ?? [];
      const profile = profileRes.data;
      const latestPlan = plansRows[0];

      // Build score dimensions from latest plan's breakdown
      const breakdown = latestPlan
        ? (latestPlan.plan_content as { health_score?: { breakdown?: Record<string, number> } })
            ?.health_score?.breakdown ?? {}
        : {};
      const dimensionIcons: Record<string, React.ReactNode> = {
        channels: <Share2 className="size-3.5" />,
        positioning: <Target className="size-3.5" />,
        audience: <Users className="size-3.5" />,
        content: <Search className="size-3.5" />,
        metrics: <TrendingUp className="size-3.5" />,
      };
      const scoreDimensions: ScoreDimension[] = Object.entries(breakdown).map(
        ([key, val]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          score: val as number,
          icon: dimensionIcons[key] ?? <BarChart2 className="size-3.5" />,
        })
      );

      setState({
        weeklyActions: (waRow?.actions as DBActionItem[]) ?? [],
        weeklyActionId: waRow?.id ?? null,
        checkInPlanId: waRow?.plan_id ?? plansRows[0]?.id ?? null,
        plans: plansRows.map((p) => ({
          id: p.id,
          name: p.app_name,
          score: p.health_score ?? 0,
          date: new Date(p.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          topAction: (
            p.plan_content as { this_weeks_top_3?: { title: string }[] }
          )?.this_weeks_top_3?.[0]?.title ?? "",
        })),
        streak: profile?.current_streak ?? 0,
        overallScore: profile?.health_score ?? 0,
        scoreDimensions,
      });
      setLoading(false);
    });
  }, []);

  return { state, loading };
}
```

- [ ] **Step 3: Update WeeklyFocusSection to accept props**

Change its signature from `function WeeklyFocusSection()` to:
```typescript
function WeeklyFocusSection({
  initialActions,
  weeklyActionId,
}: {
  initialActions: DBActionItem[];
  weeklyActionId: string | null;
}) {
```

Change the internal initial state from `INITIAL_ACTIONS` to `initialActions`:
```typescript
const [actions, setActions] = useState<ActionItem[]>(
  initialActions.map((a, i) => ({ ...a, id: String(i) }))
);
```

Note: the local `ActionItem` type in this file has `id: string` and `done: boolean` which the DB type doesn't have. Map accordingly.

Also, when `initialActions` is empty (no committed week), show an empty state CTA:
```typescript
if (initialActions.length === 0) {
  return (
    <Card>
      <CardContent className="pt-6 pb-6 text-center">
        <Calendar className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No actions committed yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Generate a plan and commit to your top 3 to see them here.
        </p>
        <Button render={<Link href="/plan/new" />} variant="outline" className="gap-2 text-sm rounded-xl">
          <Plus className="size-3.5" />
          Generate a plan
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Update StreakSection to accept streak prop**

Change signature:
```typescript
function StreakSection({ streak }: { streak: number }) {
```

Replace `{STREAK}` in the JSX with `{streak}`. Replace `i < STREAK` in the dots map with `i < streak`.

- [ ] **Step 5: Update HealthScoreSection to accept data props**

Change signature:
```typescript
function HealthScoreSection({
  overallScore,
  scoreDimensions,
}: {
  overallScore: number;
  scoreDimensions: ScoreDimension[];
}) {
```

Remove the internal `overallScore` computation (was computed from `SCORE_DIMENSIONS`). Use the passed-in `overallScore` and `scoreDimensions` directly. If `scoreDimensions` is empty, show the gauge with the score but hide the breakdown list.

Remove the reference to `SCORE_DIMENSIONS` constant.

- [ ] **Step 6: Update PlanHistorySection to accept plans prop**

Change signature:
```typescript
function PlanHistorySection({ plans }: { plans: PastPlan[] }) {
```

Remove the reference to `PAST_PLANS`.

- [ ] **Step 7: Delete the three hardcoded constants**

Delete these three constants from the file:
- `const INITIAL_ACTIONS: ActionItem[] = [...]`
- `const SCORE_DIMENSIONS: ScoreDimension[] = [...]`
- `const PAST_PLANS: PastPlan[] = [...]`

Leave `STREAK` deleted too (it was `const STREAK = 5`).

- [ ] **Step 8: Update DashboardPage to use the hook and pass props**

Replace the `DashboardPage` component body with:

```typescript
export default function DashboardPage() {
  const { state, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your marketing command centre — what to do, and why.
        </p>
        {/* Check-in prompt */}
        {state.weeklyActionId && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Calendar className="size-4 text-primary shrink-0" />
            <p className="text-sm text-foreground flex-1">
              Time to check in on last week&apos;s commitments.
            </p>
            <Button
              render={<Link href={`/check-in?id=${state.weeklyActionId}`} />}
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
            >
              Check in →
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <WeeklyFocusSection
            initialActions={state.weeklyActions}
            weeklyActionId={state.weeklyActionId}
          />
          <PlanHistorySection plans={state.plans} />
        </div>
        <div className="space-y-5">
          <StreakSection streak={state.streak} />
          <HealthScoreSection
            overallScore={state.overallScore}
            scoreDimensions={state.scoreDimensions}
          />
          <QuoteSection />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "dashboard"`
Expected: No output (fix any errors inline before proceeding).

- [ ] **Step 10: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: wire dashboard to real DB data (plans, streak, weekly actions)"
```

---

## Task 6: Weekly Check-In Page + API

**Context:** The check-in flow lets users report whether they completed each committed action. Dashboard shows a "Check in →" button linking to `/check-in?id=<weeklyActionId>`. The page shows each action with Done/In Progress/Skipped buttons. Submitting calls `POST /api/check-in` which sets `reviewed_at` and updates action statuses.

**Files:**
- Create: `src/app/(app)/check-in/page.tsx`
- Create: `src/app/api/check-in/route.ts`

- [ ] **Step 1: Create the check-in API route**

Create `src/app/api/check-in/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionItem } from "@/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weeklyActionId, actions } = (await req.json()) as {
    weeklyActionId: string;
    actions: ActionItem[];
  };

  const { error } = await supabase
    .from("weekly_actions")
    .update({
      actions,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", weeklyActionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Increment streak for completing a check-in
  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("current_streak, longest_streak")
    .eq("id", user.id)
    .single();

  const newStreak = (profile?.current_streak ?? 0) + 1;
  const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0);

  await supabase
    .from("mma_profiles")
    .update({ current_streak: newStreak, longest_streak: newLongest })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create the check-in page**

Create `src/app/(app)/check-in/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, SkipForward, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";

type CheckStatus = "done" | "in_progress" | "skipped";

const STATUS_OPTIONS: { value: CheckStatus; label: string; icon: React.ReactNode; style: string }[] = [
  {
    value: "done",
    label: "Done",
    icon: <CheckCircle2 className="size-4" />,
    style: "border-green-500/40 bg-green-500/10 text-green-400",
  },
  {
    value: "in_progress",
    label: "In progress",
    icon: <Loader2 className="size-4" />,
    style: "border-primary/40 bg-primary/10 text-primary",
  },
  {
    value: "skipped",
    label: "Skipped",
    icon: <SkipForward className="size-4" />,
    style: "border-border bg-muted/40 text-muted-foreground",
  },
];

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weeklyActionId = searchParams.get("id");

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [statuses, setStatuses] = useState<CheckStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!weeklyActionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("weekly_actions")
      .select("actions")
      .eq("id", weeklyActionId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          const acts = data.actions as ActionItem[];
          setActions(acts);
          setStatuses(acts.map(() => "in_progress" as CheckStatus));
        }
        setLoading(false);
      });
  }, [weeklyActionId]);

  async function handleSubmit() {
    if (!weeklyActionId || submitting) return;
    setSubmitting(true);

    const updatedActions: ActionItem[] = actions.map((a, i) => ({
      ...a,
      status: statuses[i],
    }));

    await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyActionId, actions: updatedActions }),
    });

    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Check-in not found</p>
        <Button render={<Link href="/dashboard" />} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const doneCount = statuses.filter((s) => s === "done").length;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="size-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="size-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Weekly Check-In
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-3">
          How did last week go?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark each action you committed to. Your next week&apos;s priorities will adapt.
        </p>
      </motion.div>

      {/* Action cards */}
      <div className="space-y-4 mb-8">
        {actions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold leading-snug">
                  {action.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <Clock className="size-3" />
                  {action.time_estimate}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setStatuses((prev) => {
                          const next = [...prev];
                          next[i] = opt.value;
                          return next;
                        })
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                        statuses[i] === opt.value
                          ? opt.style
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary + submit */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {doneCount} of {actions.length} completed
        </p>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Submit Check-In"
          )}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "check-in"`
Expected: No output.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/check-in/page.tsx src/app/api/check-in/route.ts
git commit -m "feat: weekly check-in page and API"
```

---

## Task 7: Trial Email Cron (Day 3 / Day 5 / Day 7)

**Context:** Vercel Cron Jobs call a protected API route daily at 9 AM UTC. The route finds trial users at each day milestone and sends appropriate emails. On Day 7 (expired), also downgrades them to "free". Auth is via `CRON_SECRET` env var that Vercel auto-sends.

**Files:**
- Create: `src/app/api/cron/trial-emails/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

Create `vercel.json` at project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 2: Create the cron route**

Create `src/app/api/cron/trial-emails/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resend } from "@/lib/resend";

export async function GET(req: Request) {
  // Vercel sends the CRON_SECRET in the Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketmyapp.vercel.app";

  // Day 3: trial_ends_at is 3.5–4.5 days from now
  const day3Lo = new Date(now.getTime() + 3.5 * 86_400_000).toISOString();
  const day3Hi = new Date(now.getTime() + 4.5 * 86_400_000).toISOString();

  // Day 5: trial_ends_at is 1.5–2.5 days from now
  const day5Lo = new Date(now.getTime() + 1.5 * 86_400_000).toISOString();
  const day5Hi = new Date(now.getTime() + 2.5 * 86_400_000).toISOString();

  // Day 7 (expired): trial_ends_at is in the past 24h
  const day7Lo = new Date(now.getTime() - 86_400_000).toISOString();

  const [day3Res, day5Res, day7Res] = await Promise.all([
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day3Lo)
      .lte("trial_ends_at", day3Hi),
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day5Lo)
      .lte("trial_ends_at", day5Hi),
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day7Lo)
      .lt("trial_ends_at", now.toISOString()),
  ]);

  const sends: Promise<void>[] = [];

  for (const u of day3Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day3", APP_URL));
  }
  for (const u of day5Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day5", APP_URL));
  }
  for (const u of day7Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day7", APP_URL));
    // Downgrade expired trial accounts
    supabase
      .from("mma_profiles")
      .update({ plan_tier: "free" })
      .eq("id", u.id)
      .then(() => {});
  }

  await Promise.allSettled(sends);

  return NextResponse.json({
    sent: {
      day3: day3Res.data?.length ?? 0,
      day5: day5Res.data?.length ?? 0,
      day7: day7Res.data?.length ?? 0,
    },
  });
}

async function sendEmail(
  email: string,
  name: string | null,
  day: "day3" | "day5" | "day7",
  appUrl: string
) {
  const hi = name ?? "there";

  const content: Record<string, { subject: string; headline: string; body: string; cta: string }> =
    {
      day3: {
        subject: "How's your first plan going?",
        headline: "You're 3 days in",
        body: `Hey ${hi}, you still have 4 days left on your trial. Have you committed to your top 3 actions yet? Most founders who act in week 1 see real momentum by day 14.`,
        cta: "View My Dashboard",
      },
      day5: {
        subject: "2 days left on your trial",
        headline: "Your trial ends in 2 days",
        body: `Hey ${hi}, your trial ends in 2 days. After that, you'll lose access to full plan generation, weekly action items, and commitment tracking. At $19/month, that's less than one coffee a week.`,
        cta: "Keep My Access — $19/mo",
      },
      day7: {
        subject: "Your trial has ended",
        headline: "Your trial just ended",
        body: `Hey ${hi}, your 7-day trial has ended and your account has moved to the free tier. You still have access to Marketing Health Scores. Upgrade to Pro to unlock full plans and weekly priorities.`,
        cta: "Upgrade to Pro",
      },
    };

  const c = content[day];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#fafafa;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <p style="color:#e5a520;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 28px;">
        MarketMyApp
      </p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#fafafa;">${c.headline}</h1>
      <p style="color:#888;font-size:14px;line-height:1.65;margin:0 0 32px;">${c.body}</p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#e5a520;color:#0a0a0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        ${c.cta}
      </a>
      <p style="margin-top:40px;font-size:11px;color:#444;">
        You received this because you started a trial on MarketMyApp.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "MarketMyApp <plans@updates.marketmyapp.com>",
    to: email,
    subject: c.subject,
    html,
  });
}
```

- [ ] **Step 3: Add CRON_SECRET to .env.local**

Add to `.env.local`:
```
CRON_SECRET=<generate with: openssl rand -hex 32>
```

Run: `openssl rand -hex 32`
Copy the output and add it as `CRON_SECRET` in `.env.local`. Also add it as a Vercel env var.

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "cron"`
Expected: No output.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/trial-emails/route.ts vercel.json .env.local
git commit -m "feat: trial email cron (Day 3/5/7) + Vercel cron job config"
```

---

## Task 8: Shareable Health Score OG Card

**Context:** The Share button on the plan page currently does nothing useful. We'll wire it to copy a link to the plan, and create an OG image endpoint at `/api/og` that renders a health score card (used as `og:image` on the plan page). The OG image shows the score, app name, and MarketMyApp branding.

**Files:**
- Create: `src/app/api/og/route.tsx`
- Modify: `src/app/(app)/plan/[id]/page.tsx` (Share button + meta tags)

- [ ] **Step 1: Create the OG image route**

Create `src/app/api/og/route.tsx`:

```typescript
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = Math.min(100, Math.max(0, Number(searchParams.get("score") ?? 0)));
  const app = (searchParams.get("app") ?? "My App").slice(0, 40);

  const color =
    score >= 70 ? "#4ade80" : score >= 50 ? "#e5a520" : "#f87171";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          gap: 0,
        }}
      >
        {/* Top label */}
        <div
          style={{
            color: "#e5a520",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 48,
          }}
        >
          MARKETMYAPP
        </div>

        {/* Score */}
        <div
          style={{
            color,
            fontSize: 180,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {score}
        </div>
        <div
          style={{
            color: "#888",
            fontSize: 28,
            marginBottom: 32,
          }}
        >
          / 100 Marketing Health Score
        </div>

        {/* App name */}
        <div
          style={{
            color: "#fafafa",
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          {app}
        </div>

        {/* CTA */}
        <div
          style={{
            color: "#555",
            fontSize: 20,
          }}
        >
          marketmyapp.vercel.app — What&apos;s your score?
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 2: Update the Share button on the plan page**

In `src/app/(app)/plan/[id]/page.tsx`, find the Share button in the `<header>`. It currently renders `<Share2>` with no action. Replace the button with a functional one:

First, add a `handleShare` function inside `PlanPage` (before the `return`):
```typescript
async function handleShare() {
  const url = `${window.location.origin}/plan/${id}`;
  await navigator.clipboard.writeText(url);
  // Brief visual feedback — swap icon or show a toast
  // For simplicity, just use the browser's clipboard API
}
```

Then update the Share button in the header:
```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1.5 text-xs"
  onClick={handleShare}
>
  <Share2 className="size-3.5" />
  <span className="hidden sm:inline">Share</span>
</Button>
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "og/route\|plan/\[id\]"`
Expected: No output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/og/route.tsx src/app/(app)/plan/\[id\]/page.tsx
git commit -m "feat: shareable health score OG card + functional share button"
```

---

## Task 9: PDF Export (Pro Only)

**Context:** The Export PDF button on the plan page is disabled with a "Pro" badge. We'll implement a real PDF using the already-installed `@react-pdf/renderer`. The route at `GET /api/plans/[id]/pdf` checks that the user is `pro`, fetches the plan, renders it to a buffer, and returns it as a PDF download. Wire the button on the plan page to call this route.

**Files:**
- Create: `src/components/pdf/plan-document.tsx`
- Create: `src/app/api/plans/[id]/pdf/route.tsx`
- Modify: `src/app/(app)/plan/[id]/page.tsx` (Export PDF button)

- [ ] **Step 1: Create the PDF document component**

Create `src/components/pdf/plan-document.tsx`:

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { PlanContent } from "@/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Helvetica",
    padding: 48,
    fontSize: 11,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 16,
  },
  brand: {
    fontSize: 9,
    color: "#e5a520",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#e5a520",
    marginTop: 24,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  scoreLabel: {
    width: 100,
    fontSize: 10,
    color: "#888",
    textTransform: "capitalize",
  },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: 4,
    backgroundColor: "#e5a520",
    borderRadius: 2,
  },
  scoreValue: {
    width: 28,
    fontSize: 10,
    color: "#fafafa",
    textAlign: "right",
  },
  actionCard: {
    backgroundColor: "#111",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  actionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fafafa",
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  actionMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaText: {
    fontSize: 9,
    color: "#e5a520",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: "#e5a520",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#888",
    lineHeight: 1.5,
  },
  skipCard: {
    backgroundColor: "#1a0a0a",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#3a1a1a",
  },
  skipAction: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#f87171",
    marginBottom: 3,
  },
  skipReason: {
    fontSize: 10,
    color: "#888",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#555",
  },
});

interface Props {
  appName: string;
  plan: PlanContent;
}

export function PlanDocument({ appName, plan }: Props) {
  const score = plan.health_score.score;
  const breakdown = plan.health_score.breakdown;

  return (
    <Document>
      {/* Page 1: Header + Health Score + This Week's Top 3 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>MarketMyApp</Text>
          <Text style={styles.appName}>{appName} — Marketing Plan</Text>
          <Text style={styles.subtitle}>
            Marketing Health Score: {score}/100
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Marketing Health Score</Text>
        {Object.entries(breakdown).map(([dim, val]) => (
          <View key={dim} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{dim}</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${val}%` }]} />
            </View>
            <Text style={styles.scoreValue}>{val}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 9, color: "#888", marginTop: 6 }}>
          {plan.health_score.encouragement}
        </Text>

        <Text style={styles.sectionTitle}>This Week&apos;s Top 3</Text>
        {plan.this_weeks_top_3.map((action, i) => (
          <View key={i} style={styles.actionCard}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
            <View style={styles.actionMeta}>
              <Text style={styles.metaText}>{action.time_estimate}</Text>
              <Text style={[styles.metaText, { color: "#888" }]}>
                {action.priority}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>What to Skip</Text>
        {plan.what_to_skip.map((s, i) => (
          <View key={i} style={styles.skipCard}>
            <Text style={styles.skipAction}>✕ {s.action}</Text>
            <Text style={styles.skipReason}>{s.reason}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Positioning + Channel Strategy + 30-Day Sprint */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Positioning & Messaging</Text>
        <View style={styles.actionCard}>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Tagline</Text>
          <Text style={styles.actionDesc}>{plan.positioning.tagline}</Text>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Value Proposition</Text>
          <Text style={styles.actionDesc}>{plan.positioning.value_prop}</Text>
          <Text style={[styles.actionTitle, { marginBottom: 2 }]}>Elevator Pitch</Text>
          <Text style={styles.actionDesc}>{plan.positioning.elevator_pitch}</Text>
        </View>

        <Text style={styles.sectionTitle}>Channel Strategy</Text>
        {plan.channel_strategy.map((c, i) => (
          <View key={i} style={styles.actionCard}>
            <Text style={styles.actionTitle}>
              #{c.roi_rank} {c.channel}
            </Text>
            <Text style={styles.actionDesc}>{c.why}</Text>
            <Text style={[styles.metaText, { color: "#e5a520" }]}>
              First action: {c.first_action}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>30-Day Sprint</Text>
        {plan.sprint_30_day.map((week) => (
          <View key={week.week}>
            <Text style={{ fontSize: 10, color: "#e5a520", marginBottom: 6, marginTop: 8 }}>
              Week {week.week}
            </Text>
            {week.tasks.map((task, i) => (
              <View key={i} style={styles.actionCard}>
                <Text style={styles.actionTitle}>{task.title}</Text>
                <Text style={styles.actionDesc}>{task.description}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Content Ideas + Metrics + Tools */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Content Ideas</Text>
        {plan.content_ideas.map((idea, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {idea.title} ({idea.format} · {idea.channel})
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Metrics to Track</Text>
        {plan.metrics_to_track.map((m, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>→</Text>
            <Text style={styles.bulletText}>
              {m.metric}: {m.target}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Tools & Budget</Text>
        {plan.tools_and_budget.map((t, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {t.tool} ({t.cost}) — {t.purpose}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>marketmyapp.vercel.app</Text>
          <Text style={styles.footerText}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Create the PDF API route**

Create `src/app/api/plans/[id]/pdf/route.tsx`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlanDocument } from "@/components/pdf/plan-document";
import type { PlanContent } from "@/types";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check plan tier
  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.plan_tier !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Fetch plan
  const { data: planRow, error } = await supabase
    .from("plans")
    .select("plan_content, app_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !planRow) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    React.createElement(PlanDocument, {
      appName: planRow.app_name as string,
      plan: planRow.plan_content as PlanContent,
    })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${planRow.app_name}-marketing-plan.pdf"`,
    },
  });
}
```

- [ ] **Step 3: Wire the Export PDF button on the plan page**

In `src/app/(app)/plan/[id]/page.tsx`, find the Export PDF button (currently `disabled`). Replace it with a version that:
- Stays disabled for non-pro users (keep the "Pro" badge)
- For pro users: becomes a link to `/api/plans/${id}/pdf`

First, add a `planTier` state and fetch in the page:
```typescript
const [planTier, setPlanTier] = useState<string>("free");

// Add inside the plan-fetch useEffect, after the plan/appName fetch:
supabase
  .from("mma_profiles")
  .select("plan_tier")
  .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
  .single()
  .then(({ data }) => {
    if (data) setPlanTier(data.plan_tier as string);
  });
```

Actually, since getUser is async and we're inside useEffect, use this pattern instead. Add a second useEffect:
```typescript
useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    supabase
      .from("mma_profiles")
      .select("plan_tier")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setPlanTier(data.plan_tier as string);
      });
  });
}, []);
```

Then replace the Export PDF button with:
```tsx
{planTier === "pro" ? (
  <a
    href={`/api/plans/${id}/pdf`}
    download
    className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
  >
    <Download className="size-3.5" />
    <span className="hidden sm:inline">Export PDF</span>
  </a>
) : (
  <Button
    variant="outline"
    size="sm"
    disabled
    className="gap-1.5 text-xs"
    title="Pro feature"
  >
    <Download className="size-3.5" />
    <span className="hidden sm:inline">Export PDF</span>
    <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
      Pro
    </Badge>
  </Button>
)}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "pdf\|plan-document"`
Expected: No output (fix any type errors inline).

- [ ] **Step 5: Commit**

```bash
git add src/components/pdf/plan-document.tsx src/app/api/plans/\[id\]/pdf/route.tsx src/app/(app)/plan/\[id\]/page.tsx
git commit -m "feat: PDF export (pro only) with 3-page plan document"
```

---

## Self-Review

**Spec coverage check:**

| Feature | Task |
|---|---|
| Open-source models (Groq) | Task 1 ✅ |
| Plan page real data | Task 2 ✅ |
| Commitment system (commit to top 3) | Tasks 3 + 4 ✅ |
| Dashboard real data (plans, streak, weekly actions) | Task 5 ✅ |
| Weekly check-in | Task 6 ✅ |
| Streak tracking (increment on commit + check-in) | Tasks 3 + 6 ✅ |
| Trial email sequence Day 3/5/7 | Task 7 ✅ |
| Shareable health score cards (OG image) | Task 8 ✅ |
| PDF export (paid only) | Task 9 ✅ |

**Gaps found and addressed:**
- Dashboard's `HealthScoreSection` needs dimension data from latest plan's `plan_content.health_score.breakdown` — handled in Task 5 `useDashboardData` hook
- `mma_profiles` stores `health_score` (overall int) but not breakdown — the dashboard fetches breakdown from latest plan content, so no schema change needed
- `planTier` check for PDF export requires an auth call inside a useEffect — handled in Task 9 with a separate effect

**Placeholder scan:** No TBDs, no "handle edge cases" without specifics, no forward references to undefined functions.

**Type consistency:**
- `ActionItem` from `@/types` is used consistently throughout (dashboard hook maps DB actions to it, check-in API receives it)
- `PlanContent` from `@/types` is used for DB casts in Tasks 2, 3, 9
- `PastPlan` local interface in dashboard matches what the hook produces
