## Business Context (auto-loaded from vault)

@~/MyVault/01-Areas/_context/brand-voice.md
@~/MyVault/01-Areas/_context/icp.md
@~/MyVault/01-Areas/_context/positioning.md
@~/MyVault/01-Areas/_context/products.md

---

@AGENTS.md

---

# MarketMyApp — Project Context

## What this is
AI-powered marketing plan generator for indie founders. Users fill a 4-step form → Claude/Groq generates a structured `PlanContent` JSON → stored in Supabase → rendered as a tabbed plan page.

## Tech Stack
- **Framework:** Next.js App Router (TypeScript)
- **Database:** Supabase — tables: `mma_profiles`, `plans`, `weekly_actions`
- **AI:** Groq (primary, fast/free) + Anthropic Claude (fallback) — `src/lib/groq.ts` / `src/lib/anthropic.ts`
- **Billing:** Stripe — tiers: `free` | `trial` | `pro`
- **Email:** Resend (`src/lib/resend.ts`)
- **Deploy:** Vercel

## Route Structure
```
(auth)/    → login, signup, trial, callback
(app)/     → dashboard, plan/[id], plan/new, check-in, settings  [authenticated]
(shared)/  → plan/[id]  [public — no auth required]
admin/     → admin panel
assess/    → quick assessment page
api/       → generate-plan, plans/[id], check-in, health-score, stripe/*, cron/*, og/
```

## Key Files
| File | Purpose |
|---|---|
| `src/types/index.ts` | All types: `PlanContent`, `PlanInput`, `ActionItem`, `Profile`, `Plan` |
| `src/lib/prompts/plan-generation.ts` | `buildPlanPrompt(input)` — AI prompt producing `PlanContent` JSON |
| `src/lib/prompts/health-score.ts` | Health score recalculation prompt |
| `src/app/api/generate-plan/route.ts` | Plan generation endpoint — calls AI, saves to Supabase |
| `src/app/(shared)/plan/[id]/page.tsx` | Public plan view — tabbed UI (Overview/Strategy/Roadmap/Resources) |
| `src/app/(app)/dashboard/page.tsx` | Auth dashboard — weekly actions, health score, plan history |
| `src/app/(app)/plan/new/page.tsx` | 4-step plan creation form |
| `src/components/landing/` | Landing page sections (hero, pricing, features, etc.) |

## PlanContent Schema (JSONB in `plans.plan_content`)
```ts
{
  health_score: { score, breakdown{positioning,audience,channels,content,metrics}, top_priorities[], encouragement }
  this_weeks_top_3: ActionItem[]
  what_to_skip: { action, reason }[]
  positioning: { tagline, value_prop, elevator_pitch }
  channel_strategy: { channel, roi_rank, why, first_action }[]
  sprint_30_day: { week, tasks: ActionItem[] }[]
  expansion_60_day: string[]
  growth_90_day: string[]
  content_ideas: { title, format, channel, description }[]
  launch_checklist: string[] | null   // only for idea/building stage
  tools_and_budget: { tool, cost, purpose }[]
  metrics_to_track: { metric, target, why }[]
}
```

## ActionItem shape
```ts
{ title, description, time_estimate, priority: "MUST DO"|"SHOULD DO"|"CAN WAIT",
  status: "pending"|"done"|"skipped"|"in_progress", why_now, expected_outcome }
```

## Plan Tiers
- `free` — generate plans, no PDF export
- `trial` — time-limited pro access
- `pro` — PDF export enabled

## Important Gotchas
- **Old plans break the new UI** — plans generated before the current `PlanContent` schema was finalized are missing fields (e.g. `health_score`, `channel_strategy`). The plan page will silently fail. Must regenerate.
- Public plan route lives in `(shared)/plan/[id]`. The `(app)/plan/[id]` dir is currently empty — authenticated users hit the shared route.
- Plan generation calls Groq first (fast + free). Falls back to Anthropic if Groq fails.
- `weekly_actions` table tracks committed actions per plan/week. Dashboard reads from this.

## Dev Commands
```bash
npm run dev    # localhost:3000
npm run build
npm run lint
```

## Supabase Helpers
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — RSC / API routes
- `src/lib/supabase/service.ts` — admin / service role
- `src/lib/supabase/middleware.ts` — auth middleware
