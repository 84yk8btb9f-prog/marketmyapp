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

  const { data: updatedRows, error: updateError } = await supabase
    .from("weekly_actions")
    .update({
      actions,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", weeklyActionId)
    .eq("user_id", user.id)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: "Failed to update check-in" }, { status: 500 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json({ error: "Weekly action not found" }, { status: 404 });
  }

  // Increment streak atomically via DB RPC — only runs when update matched a real row.
  // NOTE: requires the increment_streak function — see SQL comment in commit/route.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: streakError } = await (supabase.rpc as any)("increment_streak", {
    p_user_id: user.id,
  });
  if (streakError) console.error("Streak increment failed:", streakError);

  return NextResponse.json({ success: true });
}
