import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  // Update streak: increment by 1 and update longest if needed
  const { data: profile, error: profileError } = await supabase
    .from("mma_profiles")
    .select("current_streak, longest_streak")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[commit] profile fetch failed:", profileError.message);
  }

  const newStreak = (profile?.current_streak ?? 0) + 1;
  const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0);

  const { error: streakError } = await supabase
    .from("mma_profiles")
    .update({ current_streak: newStreak, longest_streak: newLongest })
    .eq("id", user.id);

  if (streakError) {
    console.error("[commit] streak update failed:", streakError.message);
    // non-fatal: commitment is saved, streak will self-correct on next operation
  }

  return NextResponse.json({ id: weeklyAction.id });
}
