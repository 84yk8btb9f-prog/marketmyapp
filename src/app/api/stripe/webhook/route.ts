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

    let plan_tier: "free" | "trial" | "pro" = "free";
    if (event.type === "customer.subscription.updated") {
      if (subscription.status === "trialing") plan_tier = "trial";
      else if (subscription.status === "active") plan_tier = "pro";
    }

    await supabase
      .from("mma_profiles")
      .update({ plan_tier, stripe_subscription_id: subscription.id })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
