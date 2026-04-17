import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let paymentMethodId: string;
  try {
    const body = await req.json();
    if (!body?.paymentMethodId || typeof body.paymentMethodId !== "string") {
      return NextResponse.json({ error: "Missing paymentMethodId" }, { status: 400 });
    }
    paymentMethodId = body.paymentMethodId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("mma_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID! }],
      trial_period_days: 7,
      default_payment_method: paymentMethodId,
    });

    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

    await supabase
      .from("mma_profiles")
      .update({
        stripe_subscription_id: subscription.id,
        plan_tier: "trial",
        trial_ends_at: trialEnd,
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[activate-trial] Stripe error:", message);
    return NextResponse.json({ error: "Failed to activate trial. Please try again." }, { status: 502 });
  }
}
