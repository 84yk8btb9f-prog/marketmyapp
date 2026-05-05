import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { PlanDocument } from "@/components/pdf/plan-document";
import type { PlanContent } from "@/types";
import React, { type ReactElement, type JSXElementConstructor } from "react";

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

  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.plan_tier !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { data: planRow, error } = await supabase
    .from("plans")
    .select("plan_content, app_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !planRow) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      React.createElement(PlanDocument, {
        appName: planRow.app_name as string,
        plan: planRow.plan_content as PlanContent,
      }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );
  } catch (err) {
    console.error("[pdf] renderToBuffer failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }

  // Strip all non-alphanumeric chars to prevent Content-Disposition header injection
  const safeFilename = (planRow.app_name as string)
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "marketing-plan";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}-marketing-plan.pdf"`,
    },
  });
}
