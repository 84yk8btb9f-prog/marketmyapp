import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkInLimiter, checkRateLimit } from "@/lib/ratelimit";
import type { ActionItem } from "@/types";

const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  time_estimate: z.string(),
  priority: z.enum(["MUST DO", "SHOULD DO", "CAN WAIT"]),
  status: z.enum(["pending", "done", "skipped", "in_progress"]),
  why_now: z.string(),
  expected_outcome: z.string(),
});

const CheckInSchema = z.object({
  weeklyActionId: z.string().uuid(),
  actions: z.array(ActionItemSchema).min(1).max(10),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit(checkInLimiter, `check-in:${user.id}`);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const { weeklyActionId, actions } = parsed.data as { weeklyActionId: string; actions: ActionItem[] };

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
