import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resend } from "@/lib/resend";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketmyapp.vercel.app";

  // Day 3: trial_ends_at is 3.5–4.5 days from now
  const day3Lo = new Date(now.getTime() + 3.5 * 86_400_000).toISOString();
  const day3Hi = new Date(now.getTime() + 4.5 * 86_400_000).toISOString();

  // Day 5: trial_ends_at is 1.5–2.5 days from now
  const day5Lo = new Date(now.getTime() + 1.5 * 86_400_000).toISOString();
  const day5Hi = new Date(now.getTime() + 2.5 * 86_400_000).toISOString();

  // Day 7 (expired): trial_ends_at is in the past 24h
  const day7Lo = new Date(now.getTime() - 86_400_000).toISOString();

  const [day3Res, day5Res, day7Res] = await Promise.all([
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day3Lo)
      .lte("trial_ends_at", day3Hi),
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day5Lo)
      .lte("trial_ends_at", day5Hi),
    supabase
      .from("mma_profiles")
      .select("id, email, full_name")
      .eq("plan_tier", "trial")
      .gte("trial_ends_at", day7Lo)
      .lt("trial_ends_at", now.toISOString()),
  ]);

  const sends: Promise<void>[] = [];

  for (const u of day3Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day3", APP_URL));
  }
  for (const u of day5Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day5", APP_URL));
  }
  for (const u of day7Res.data ?? []) {
    sends.push(sendEmail(u.email, u.full_name, "day7", APP_URL));
    // Downgrade expired trial accounts
    supabase
      .from("mma_profiles")
      .update({ plan_tier: "free" })
      .eq("id", u.id)
      .then(() => {});
  }

  await Promise.allSettled(sends);

  return NextResponse.json({
    sent: {
      day3: day3Res.data?.length ?? 0,
      day5: day5Res.data?.length ?? 0,
      day7: day7Res.data?.length ?? 0,
    },
  });
}

async function sendEmail(
  email: string,
  name: string | null,
  day: "day3" | "day5" | "day7",
  appUrl: string
) {
  const hi = name ?? "there";

  const content: Record<string, { subject: string; headline: string; body: string; cta: string }> =
    {
      day3: {
        subject: "How's your first plan going?",
        headline: "You're 3 days in",
        body: `Hey ${hi}, you still have 4 days left on your trial. Have you committed to your top 3 actions yet? Most founders who act in week 1 see real momentum by day 14.`,
        cta: "View My Dashboard",
      },
      day5: {
        subject: "2 days left on your trial",
        headline: "Your trial ends in 2 days",
        body: `Hey ${hi}, your trial ends in 2 days. After that, you'll lose access to full plan generation, weekly action items, and commitment tracking. At $19/month, that's less than one coffee a week.`,
        cta: "Keep My Access — $19/mo",
      },
      day7: {
        subject: "Your trial has ended",
        headline: "Your trial just ended",
        body: `Hey ${hi}, your 7-day trial has ended and your account has moved to the free tier. You still have access to Marketing Health Scores. Upgrade to Pro to unlock full plans and weekly priorities.`,
        cta: "Upgrade to Pro",
      },
    };

  const c = content[day];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#fafafa;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <p style="color:#e5a520;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 28px;">
        MarketMyApp
      </p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#fafafa;">${c.headline}</h1>
      <p style="color:#888;font-size:14px;line-height:1.65;margin:0 0 32px;">${c.body}</p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#e5a520;color:#0a0a0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        ${c.cta}
      </a>
      <p style="margin-top:40px;font-size:11px;color:#444;">
        You received this because you started a trial on MarketMyApp.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "MarketMyApp <plans@updates.marketmyapp.com>",
    to: email,
    subject: c.subject,
    html,
  });
}
