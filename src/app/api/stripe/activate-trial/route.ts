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

  const { paymentMethodId } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

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

  const trialEnd = new Date(subscription.trial_end! * 1000).toISOString();

  await supabase
    .from("profiles")
    .update({
      stripe_subscription_id: subscription.id,
      plan_tier: "trial",
      trial_ends_at: trialEnd,
    })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
