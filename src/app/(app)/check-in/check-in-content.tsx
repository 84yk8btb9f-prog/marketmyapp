"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, SkipForward, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";

type CheckStatus = "done" | "in_progress" | "skipped";

const STATUS_OPTIONS: {
  value: CheckStatus;
  label: string;
  icon: React.ReactNode;
  style: string;
}[] = [
  {
    value: "done",
    label: "Done",
    icon: <CheckCircle2 className="size-4" />,
    style: "border-green-500/40 bg-green-500/10 text-green-400",
  },
  {
    value: "in_progress",
    label: "In progress",
    icon: <Loader2 className="size-4" />,
    style: "border-primary/40 bg-primary/10 text-primary",
  },
  {
    value: "skipped",
    label: "Skipped",
    icon: <SkipForward className="size-4" />,
    style: "border-border bg-muted/40 text-muted-foreground",
  },
];

export function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weeklyActionId = searchParams.get("id");

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [statuses, setStatuses] = useState<CheckStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!weeklyActionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("weekly_actions")
      .select("actions")
      .eq("id", weeklyActionId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          const acts = data.actions as ActionItem[];
          setActions(acts);
          setStatuses(acts.map(() => "in_progress" as CheckStatus));
        }
        setLoading(false);
      });
  }, [weeklyActionId]);

  async function handleSubmit() {
    if (!weeklyActionId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const updatedActions: ActionItem[] = actions.map((a, i) => ({
      ...a,
      status: statuses[i],
    }));

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyActionId, actions: updatedActions }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError((body as { error?: string }).error ?? "Something went wrong. Try again.");
        return;
      }
      track("check_in_completed");
      router.push("/dashboard");
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Check-in not found</p>
        <Button render={<Link href="/dashboard" />} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const doneCount = statuses.filter((s) => s === "done").length;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="size-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="size-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Weekly Check-In
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-3">
          How did last week go?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark each action you committed to. Your next week&apos;s priorities will adapt.
        </p>
      </motion.div>

      {/* Action cards */}
      <div className="space-y-4 mb-8">
        {actions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold leading-snug">
                  {action.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <Clock className="size-3" />
                  {action.time_estimate}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setStatuses((prev) => {
                          const next = [...prev];
                          next[i] = opt.value;
                          return next;
                        })
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                        statuses[i] === opt.value
                          ? opt.style
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary + submit */}
      {submitError && (
        <p className="text-sm text-destructive mb-3">{submitError}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {doneCount} of {actions.length} completed
        </p>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Submit Check-In"
          )}
        </Button>
      </div>
    </div>
  );
}
