import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  const subscriptionId = profile?.stripe_subscription_id as string | null;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.cancel(subscriptionId);

    await supabase
      .from("mma_profiles")
      .update({ plan_tier: "free", stripe_subscription_id: null })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[cancel-subscription] Stripe error:", message);
    return NextResponse.json({ error: "Failed to cancel subscription. Please try again." }, { status: 502 });
  }
}
