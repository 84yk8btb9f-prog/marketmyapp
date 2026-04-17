"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, CreditCard, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const EASE = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

interface Profile {
  email: string;
  plan_tier: string;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

function planLabel(tier: string, trialEndsAt: string | null): string {
  if (tier === "trial") {
    const end = trialEndsAt
      ? new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
      : "soon";
    return `Free Trial — ends ${end}`;
  }
  if (tier === "pro") return "Pro — $19/month";
  return "Free";
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("mma_profiles")
        .select("email, plan_tier, trial_ends_at, stripe_subscription_id")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You'll lose access at the end of your billing period.")) return;
    setCancelling(true);
    setCancelError(null);
    const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
    if (!res.ok) {
      setCancelError("Failed to cancel. Please try again or contact support.");
    } else {
      setCancelled(true);
      setProfile((p) => p ? { ...p, plan_tier: "free", stripe_subscription_id: null } : p);
    }
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={EASE}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-8">Settings</h1>

        {/* Account */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">{profile?.email}</span>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="size-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Subscription</h2>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border mb-4 text-sm">
            <span className="text-muted-foreground">Current plan</span>
            <span className="text-foreground font-medium">
              {planLabel(profile?.plan_tier ?? "free", profile?.trial_ends_at ?? null)}
            </span>
          </div>

          {cancelled && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3 mb-4">
              Your subscription has been cancelled. Access continues until the billing period ends.
            </p>
          )}

          {cancelError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4">
              {cancelError}
            </p>
          )}

          {profile?.plan_tier === "free" && !cancelled && (
            <Button render={<Link href="/trial" />} className="w-full">
              Start Free Trial
            </Button>
          )}

          {(profile?.plan_tier === "trial" || profile?.plan_tier === "pro") && !cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="size-3.5" />
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
