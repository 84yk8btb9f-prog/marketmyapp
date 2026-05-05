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
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const subscriptionId = profile?.stripe_subscription_id as string | null;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    // Verify the subscription belongs to this customer before modifying it
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (stripeSubscription.customer !== profile.stripe_customer_id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    // plan_tier is NOT updated here — the webhook's customer.subscription.deleted
    // event handles the downgrade when the billing period ends.

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[cancel-subscription] Stripe error:", message);
    return NextResponse.json({ error: "Failed to cancel subscription. Please try again." }, { status: 502 });
  }
}
