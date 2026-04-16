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
