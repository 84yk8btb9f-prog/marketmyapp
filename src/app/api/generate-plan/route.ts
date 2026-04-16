import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { groqComplete } from "@/lib/groq";
import { buildPlanPrompt } from "@/lib/prompts/plan-generation";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import type { PlanContent, ActionItem } from "@/types";

const PlanInputSchema = z.object({
  app_name: z.string().min(1),
  app_description: z.string().min(1),
  app_url: z.string(),
  app_category: z.string().min(1),
  target_customer: z.string().min(1),
  pain_point: z.string().min(1),
  alternatives: z.string(),
  where_they_hang_out: z.string(),
  stage: z.enum(["idea", "building", "launched", "growing"]),
  current_users: z.string(),
  current_revenue: z.string(),
  monthly_budget: z.string(),
  time_available: z.string(),
  founder_strengths: z.array(z.string()),
  primary_goal: z.string().min(1),
  timeline: z.string(),
  preferred_channels: z.array(z.string()),
});

export async function POST(request: Request) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const prompt = buildPlanPrompt(input);

  // Generate — try Groq first, fall back to Claude
  let rawText: string;
  try {
    rawText = await groqComplete(prompt, 8192);
  } catch (groqErr) {
    console.warn("[generate-plan] Groq failed, falling back to Claude:", groqErr);
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });
      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected content type");
      rawText = block.text;
    } catch (claudeErr) {
      const msg = claudeErr instanceof Error ? claudeErr.message : "AI generation failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  let plan: PlanContent;
  try {
    plan = JSON.parse(rawText) as PlanContent;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse plan JSON", raw: rawText },
      { status: 502 }
    );
  }

  // Save to DB
  const { data: savedPlan, error: dbError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      app_name: input.app_name,
      input_data: input,
      plan_content: plan,
      health_score: plan.health_score?.score ?? null,
      status: "completed",
    })
    .select("id")
    .single();

  if (dbError || !savedPlan) {
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }

  // Send email — fire and forget, never block the response
  sendPlanEmail(
    user.email!,
    input.app_name,
    savedPlan.id,
    plan
  ).catch(() => {});

  return NextResponse.json({ id: savedPlan.id });
}

async function sendPlanEmail(
  email: string,
  appName: string,
  planId: string,
  plan: PlanContent
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://marketmyapp.vercel.app";
  const actions = plan.this_weeks_top_3 ?? [];

  const actionsHtml = actions
    .map(
      (a: ActionItem) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1f1f1f;">
        <strong style="color:#fafafa;font-size:14px;">${a.title}</strong>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">${a.description}</p>
        <p style="margin:4px 0 0;color:#e5a520;font-size:12px;">${a.time_estimate}</p>
      </td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#fafafa;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <p style="color:#e5a520;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 24px;">
        MarketMyApp
      </p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#fafafa;">
        Your plan for ${appName} is ready
      </h1>
      <p style="color:#888;font-size:14px;margin:0 0 32px;">
        Here's what to focus on this week.
      </p>
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#e5a520;margin:0 0 12px;">
        This Week's Top 3
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">${actionsHtml}</table>
      <div style="margin-top:32px;padding:16px;background:#111;border-radius:12px;border:1px solid #1f1f1f;">
        <p style="margin:0;font-size:13px;color:#888;">
          View your full plan at<br>
          <a href="${appUrl}/plan/${planId}" style="color:#e5a520;">${appUrl}/plan/${planId}</a>
        </p>
      </div>
      <p style="margin-top:32px;font-size:12px;color:#555;">
        You're receiving this because you generated a plan on MarketMyApp.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "MarketMyApp <plans@updates.marketmyapp.com>",
    to: email,
    subject: `Your marketing plan for ${appName}`,
    html,
  });
}
