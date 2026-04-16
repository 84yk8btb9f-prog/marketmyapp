import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Public plan reader — no auth required.
// Uses service client to bypass RLS so anyone with the plan URL can view it.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const service = createServiceClient();
  const { data, error } = await service
    .from("plans")
    .select("plan_content, app_name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan_content: data.plan_content,
    app_name: data.app_name,
  });
}
