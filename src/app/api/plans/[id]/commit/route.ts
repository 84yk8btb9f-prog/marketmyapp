// REQUIRED: Run this RPC in Supabase SQL editor before deploying:
// CREATE OR REPLACE FUNCTION increment_streak(p_user_id uuid)
// RETURNS void LANGUAGE sql AS $$
//   UPDATE mma_profiles
//   SET
//     current_streak = current_streak + 1,
//     longest_streak = GREATEST(longest_streak, current_streak + 1),
//     updated_at = now()
//   WHERE id = p_user_id;
// $$;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { commitLimiter, checkRateLimit } from "@/lib/ratelimit";
import type { ActionItem, PlanContent } from "@/types";

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

  const rateLimitResponse = await checkRateLimit(commitLimiter, `commit:${user.id}`);
  if (rateLimitResponse) return rateLimitResponse;

  let body: { selectedIndices: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { selectedIndices } = body as { selectedIndices: unknown };

  if (
    !Array.isArray(selectedIndices) ||
    selectedIndices.length === 0 ||
    selectedIndices.length > 10 ||
    !selectedIndices.every((i) => Number.isInteger(i) && i >= 0)
  ) {
    return NextResponse.json({ error: "Invalid selectedIndices" }, { status: 400 });
  }

  const validIndices = selectedIndices as number[];

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

  const allActions = (planRow.plan_content as PlanContent).this_weeks_top_3;

  const committedActions: ActionItem[] = validIndices
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
      // MVP: always week 1 — multi-week support added in weekly check-in flow
      week_number: 1,
      actions: committedActions,
      committed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (waError || !weeklyAction) {
    return NextResponse.json({ error: "Failed to save commitment" }, { status: 500 });
  }

  // Update streak atomically via DB RPC to avoid read-modify-write race conditions.
  // NOTE: requires the increment_streak function to be deployed — see SQL comment at top of file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: streakError } = await (supabase.rpc as any)("increment_streak", {
    p_user_id: user.id,
  });
  if (streakError) console.error("Streak increment failed:", streakError);

  return NextResponse.json({ id: weeklyAction.id });
}
