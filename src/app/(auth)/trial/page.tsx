"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const TRIAL_FEATURES = [
  "Full weekly action plan",
  "3 specific this-week tasks",
  "Stage & channel tailoring",
  "Weekly recalibration",
  "Accountability check-ins",
];

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#e5a520",
    colorBackground: "#1a1a1a",
    colorText: "#fafafa",
    colorTextSecondary: "#888888",
    colorDanger: "#f87171",
    fontFamily: "DM Sans, system-ui, sans-serif",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      backgroundColor: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#fafafa",
    },
    ".Input:focus": {
      border: "1px solid #e5a520",
      boxShadow: "0 0 0 2px rgba(229,165,32,0.15)",
    },
    ".Label": {
      color: "#888888",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
  },
};

function trialEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: setupError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: "if_required",
    });

    if (setupError) {
      setError(setupError.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/stripe/activate-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodId: setupIntent?.payment_method,
      }),
    });

    if (!res.ok) {
      setError("Failed to activate your trial. Please try again.");
      setLoading(false);
      return;
    }

    track("trial_started");
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { name: "auto" } },
        }}
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!stripe || loading}
        className="w-full rounded-xl h-12 font-semibold shadow-md shadow-primary/20"
      >
        {loading ? "Activating trial…" : "Start 7-Day Free Trial"}
      </Button>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Lock className="size-3" />
          Secure payment
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3" />
          No charge until {trialEndDate()}
        </span>
      </div>
    </form>
  );
}

export default function TrialPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/setup-intent", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setFetchError(true);
      })
      .catch(() => setFetchError(true));
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Start your free trial</CardTitle>
        <CardDescription>
          $19/month after 7 days. Cancel anytime before then — no charge.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* What you get */}
        <ul className="flex flex-col gap-2 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
          {TRIAL_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="size-2.5 text-primary" />
              </div>
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        {/* Stripe form */}
        {fetchError ? (
          <p className="text-sm text-destructive text-center py-4">
            Unable to load payment form. Please refresh.
          </p>
        ) : !clientSecret ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <CheckoutForm />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}
