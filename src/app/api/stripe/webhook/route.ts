import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    // Map subscription status to plan tier
    let plan_tier: "trial" | "pro" | "free";
    if (subscription.status === "trialing") {
      plan_tier = "trial";
    } else if (subscription.status === "active") {
      plan_tier = "pro";
    } else {
      // Covers: past_due, unpaid, incomplete, incomplete_expired, paused, canceled
      plan_tier = "free";
    }

    // For deleted subscriptions, clear the subscription ID to avoid future 404s
    const isDeleted = event.type === "customer.subscription.deleted";

    await supabase
      .from("mma_profiles")
      .update({
        plan_tier,
        stripe_subscription_id: isDeleted ? null : subscription.id,
      })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
