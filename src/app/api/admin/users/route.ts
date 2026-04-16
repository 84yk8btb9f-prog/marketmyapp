import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ADMIN_EMAIL = "nikolas.sapalidis@gmail.com";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

export async function GET() {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("mma_profiles")
    .select(
      "id, email, full_name, plan_tier, health_score, current_streak, longest_streak, plans_generated, trial_ends_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function PATCH(request: Request) {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, plan_tier } = body as { userId: string; plan_tier: string };

  const VALID_TIERS = ["free", "trial", "pro"];
  if (!userId || !VALID_TIERS.includes(plan_tier)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("mma_profiles")
    .update({ plan_tier })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
