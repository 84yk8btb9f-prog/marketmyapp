"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Target,
  Zap,
  TrendingUp,
  Calendar,
  CheckCircle,
  Flame,
  Clock,
  ArrowRight,
  BarChart2,
  Share2,
  Users,
  Search,
  MessageSquare,
  Plus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ActionItem as DBActionItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  title: string;
  timeEstimate: string;
  priority: "high" | "medium" | "low";
  done: boolean;
}

interface ScoreDimension {
  label: string;
  score: number;
  icon: React.ReactNode;
}

interface PastPlan {
  id: string;
  name: string;
  score: number;
  date: string;
  topAction: string;
}

// ─── Quotes (static, not from DB) ────────────────────────────────────────────

const QUOTES = [
  { text: "The best marketing strategy is to actually start.", author: "Seth Godin" },
  { text: "Distribution is the new moat.", author: "Justin Kan" },
  { text: "Ship it before it's ready.", author: "Reid Hoffman" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
];

// ─── Data hook ────────────────────────────────────────────────────────────────

interface DashboardState {
  weeklyActions: DBActionItem[];
  weeklyActionId: string | null;
  plans: PastPlan[];
  streak: number;
  overallScore: number;
  scoreDimensions: ScoreDimension[];
  checkInPlanId: string | null;
}

function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    weeklyActions: [],
    weeklyActionId: null,
    plans: [],
    streak: 0,
    overallScore: 0,
    scoreDimensions: [],
    checkInPlanId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("weekly_actions")
        .select("id, actions, plan_id")
        .not("committed_at", "is", null)
        .is("reviewed_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("plans")
        .select("id, app_name, health_score, created_at, plan_content")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("mma_profiles")
        .select("current_streak, health_score")
        .single(),
    ]).then(([waRes, plansRes, profileRes]) => {
      const waRow = waRes.data?.[0];
      const plansRows = plansRes.data ?? [];
      const profile = profileRes.data;
      const latestPlan = plansRows[0];

      const breakdown = latestPlan
        ? (latestPlan.plan_content as { health_score?: { breakdown?: Record<string, number> } })
            ?.health_score?.breakdown ?? {}
        : {};
      const dimensionIcons: Record<string, React.ReactNode> = {
        channels: <Share2 className="size-3.5" />,
        positioning: <Target className="size-3.5" />,
        audience: <Users className="size-3.5" />,
        content: <Search className="size-3.5" />,
        metrics: <TrendingUp className="size-3.5" />,
      };
      const scoreDimensions: ScoreDimension[] = Object.entries(breakdown).map(
        ([key, val]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          score: val as number,
          icon: dimensionIcons[key] ?? <BarChart2 className="size-3.5" />,
        })
      );

      setState({
        weeklyActions: (waRow?.actions as DBActionItem[]) ?? [],
        weeklyActionId: waRow?.id ?? null,
        checkInPlanId: waRow?.plan_id ?? plansRows[0]?.id ?? null,
        plans: plansRows.map((p) => ({
          id: p.id,
          name: p.app_name,
          score: p.health_score ?? 0,
          date: new Date(p.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          topAction: (
            p.plan_content as { this_weeks_top_3?: { title: string }[] }
          )?.this_weeks_top_3?.[0]?.title ?? "",
        })),
        streak: profile?.current_streak ?? 0,
        overallScore: profile?.health_score ?? 0,
        scoreDimensions,
      });
      setLoading(false);
    });
  }, []);

  return { state, loading };
}

// ─── Utility components ───────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionItem["priority"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        priority === "high" && "bg-destructive/15 text-destructive",
        priority === "medium" && "bg-primary/15 text-primary",
        priority === "low" && "bg-muted text-muted-foreground"
      )}
    >
      {priority}
    </span>
  );
}

function ScoreBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const color =
    score >= 70
      ? "oklch(0.65 0.2 160)"
      : score >= 50
      ? "oklch(0.65 0.25 285)"
      : "oklch(0.65 0.2 40)";

  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Section: This Week's Focus ───────────────────────────────────────────────

function WeeklyFocusSection({
  initialActions,
  weeklyActionId,
}: {
  initialActions: DBActionItem[];
  weeklyActionId: string | null;
}) {
  const [actions, setActions] = useState<ActionItem[]>(
    initialActions.map((a, i) => ({
      id: String(i),
      title: a.title,
      timeEstimate: a.time_estimate,
      priority: "medium" as const,
      done: false,
    }))
  );

  if (initialActions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <Calendar className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No actions committed yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Generate a plan and commit to your top 3 to see them here.
          </p>
          <Button render={<Link href="/plan/new" />} variant="outline" className="gap-2 text-sm rounded-xl">
            <Plus className="size-3.5" />
            Generate a plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  function toggleDone(id: string) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }

  const doneCount = actions.filter((a) => a.done).length;

  // Suppress unused variable warning — weeklyActionId reserved for future check-in link
  void weeklyActionId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
              <Calendar className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle>This Week&apos;s Focus</CardTitle>
              <CardDescription className="mt-0.5">
                {doneCount} of {actions.length} actions completed
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {Math.round((doneCount / actions.length) * 100)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(doneCount / actions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-200",
              action.done
                ? "border-border bg-muted/30 opacity-60"
                : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <button
              onClick={() => toggleDone(action.id)}
              aria-label={action.done ? "Mark incomplete" : "Mark complete"}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                action.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              )}
            >
              {action.done && <CheckCircle className="size-3.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium leading-snug",
                  action.done ? "line-through text-muted-foreground" : "text-foreground"
                )}
              >
                {action.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Clock className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{action.timeEstimate}</span>
                <PriorityBadge priority={action.priority} />
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          render={<Link href="/plan/new" />}
          variant="outline"
          className="w-full gap-2 text-sm rounded-xl"
        >
          <Plus className="size-3.5" />
          Generate new action plan
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Section: Health Score ────────────────────────────────────────────────────

function HealthScoreSection({
  overallScore,
  scoreDimensions,
}: {
  overallScore: number;
  scoreDimensions: ScoreDimension[];
}) {
  const scoreColor =
    overallScore >= 70
      ? "oklch(0.65 0.2 160)"
      : overallScore >= 50
      ? "oklch(0.65 0.25 285)"
      : "oklch(0.65 0.2 40)";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
            <BarChart2 className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle>Marketing Health Score</CardTitle>
            <CardDescription className="mt-0.5">5-dimension breakdown</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gauge */}
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="-rotate-90"
              aria-hidden
            >
              <circle
                cx="70"
                cy="70"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-border"
              />
              <motion.circle
                cx="70"
                cy="70"
                r="56"
                fill="none"
                stroke={scoreColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 56 * (1 - overallScore / 100),
                }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>
                {overallScore}
              </span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="space-y-3">
          {scoreDimensions.map((dim, i) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {dim.icon}
                  {dim.label}
                </div>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {dim.score}
                </span>
              </div>
              <ScoreBar score={dim.score} delay={0.3 + i * 0.08} />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          render={<Link href="/assess" />}
          variant="link"
          className="ml-auto text-xs gap-1 text-primary h-auto p-0"
        >
          Retake assessment <ArrowRight className="size-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Section: Streak ─────────────────────────────────────────────────────────

function StreakSection({ streak }: { streak: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl"
            aria-hidden
          >
            <Flame className="size-6 text-orange-400" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">
              {streak}{" "}
              <span className="text-base font-semibold text-orange-400">day streak</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep going — consistency beats perfection.
            </p>
          </div>
        </div>
        {/* Mini streak dots */}
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                i < streak ? "bg-orange-400" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">Last 7 days</p>
      </CardContent>
    </Card>
  );
}

// ─── Section: Plan History ────────────────────────────────────────────────────

function PlanHistorySection({ plans }: { plans: PastPlan[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <CardTitle>Plan History</CardTitle>
          </div>
          <Button
            render={<Link href="/plans" />}
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground rounded-lg"
          >
            View all <ArrowRight className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35, ease: "easeOut" }}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              <Zap className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{plan.name}</p>
                <span
                  className={cn(
                    "shrink-0 text-xs font-bold tabular-nums",
                    plan.score >= 70
                      ? "text-green-400"
                      : plan.score >= 50
                      ? "text-primary"
                      : "text-amber-400"
                  )}
                >
                  {plan.score}/100
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.topAction}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{plan.date}</p>
            </div>
          </motion.div>
        ))}
        {plans.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No plans yet.{" "}
            <Link href="/plan/new" className="text-primary underline underline-offset-4">
              Create your first one
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: Motivational Quote ─────────────────────────────────────────────

function QuoteSection() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const rotate = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
      setVisible(true);
    }, 350);
  }, []);

  useEffect(() => {
    // Rotate every 8 seconds
    const interval = setInterval(rotate, 8000);
    return () => clearInterval(interval);
  }, [rotate]);

  const quote = QUOTES[quoteIndex];

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle purple gradient bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          background: "radial-gradient(ellipse at top left, oklch(0.65 0.25 285), transparent 70%)",
        }}
      />
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <MessageSquare className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -6 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <p className="text-sm font-medium text-foreground leading-relaxed italic">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                — {quote.author}
              </p>
            </motion.div>
          </div>
          <button
            onClick={rotate}
            aria-label="Next quote"
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { state, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your marketing command centre — what to do, and why.
        </p>
        {/* Check-in prompt */}
        {state.weeklyActionId && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Calendar className="size-4 text-primary shrink-0" />
            <p className="text-sm text-foreground flex-1">
              Time to check in on last week&apos;s commitments.
            </p>
            <Button
              render={<Link href={`/check-in?id=${state.weeklyActionId}`} />}
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
            >
              Check in →
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <WeeklyFocusSection
            initialActions={state.weeklyActions}
            weeklyActionId={state.weeklyActionId}
          />
          <PlanHistorySection plans={state.plans} />
        </div>
        <div className="space-y-5">
          <StreakSection streak={state.streak} />
          <HealthScoreSection
            overallScore={state.overallScore}
            scoreDimensions={state.scoreDimensions}
          />
          <QuoteSection />
        </div>
      </div>
    </div>
  );
}
