import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionItem } from "@/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let weeklyActionId: string;
  let actions: ActionItem[];
  try {
    ({ weeklyActionId, actions } = (await req.json()) as {
      weeklyActionId: string;
      actions: ActionItem[];
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!weeklyActionId || !Array.isArray(actions)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
    .maybeSingle();

  const newStreak = (profile?.current_streak ?? 0) + 1;
  const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0);

  const { error: streakError } = await supabase
    .from("mma_profiles")
    .update({ current_streak: newStreak, longest_streak: newLongest })
    .eq("id", user.id);

  if (streakError) console.error("[check-in] streak update failed:", streakError);

  return NextResponse.json({ success: true });
}
