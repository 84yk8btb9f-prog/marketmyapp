"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  ListChecks,
  Wrench,
  BarChart2,
  Rocket,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PlanContent, ActionItem } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ─── sidebar sections ──────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "health-score", label: "Marketing Health Score", icon: BarChart2 },
  { id: "top-3", label: "This Week's Top 3", icon: Rocket },
  { id: "skip", label: "What to Skip", icon: XCircle },
  { id: "positioning", label: "Positioning & Messaging", icon: Target },
  { id: "channels", label: "Channel Strategy", icon: TrendingUp },
  { id: "sprint-30", label: "30-Day Sprint", icon: ListChecks },
  { id: "expansion-60", label: "60-Day Expansion", icon: ChevronRight },
  { id: "growth-90", label: "90-Day Growth", icon: ChevronRight },
  { id: "content", label: "Content Ideas", icon: Lightbulb },
  { id: "launch", label: "Launch Checklist", icon: CheckCircle2 },
  { id: "tools", label: "Tools & Budget", icon: Wrench },
  { id: "metrics", label: "Metrics to Track", icon: BarChart2 },
];

// ─── sub-components ────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<ActionItem["priority"], string> = {
  "MUST DO": "bg-primary/15 text-primary border-primary/30",
  "SHOULD DO": "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
  "CAN WAIT": "bg-muted text-muted-foreground border-border",
};

function ActionCard({ item }: { item: ActionItem }) {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="pt-4 pb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-foreground text-sm leading-snug">
            {item.title}
          </p>
          <span
            className={cn(
              "shrink-0 text-xs font-semibold border rounded-full px-2 py-0.5",
              PRIORITY_STYLES[item.priority]
            )}
          >
            {item.priority}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span>{item.time_estimate}</span>
          </div>
          <div className="flex items-start gap-1.5 text-muted-foreground sm:col-span-1">
            <span className="font-medium text-foreground/70 shrink-0">
              Why now:
            </span>
            <span>{item.why_now}</span>
          </div>
          <div className="flex items-start gap-1.5 text-muted-foreground sm:col-span-1">
            <span className="font-medium text-foreground/70 shrink-0">
              Outcome:
            </span>
            <span>{item.expected_outcome}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  id,
  icon: Icon,
  title,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-primary" />
      </div>
      <h2
        id={id}
        className="text-lg font-semibold text-foreground scroll-mt-20"
      >
        {title}
      </h2>
    </div>
  );
}

// ─── health score gauge ────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  const color =
    score >= 75
      ? "stroke-green-400"
      : score >= 50
      ? "stroke-primary"
      : "stroke-yellow-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

// ─── roi badge ─────────────────────────────────────────────────────────────────

function RoiBadge({ rank }: { rank: number }) {
  const labels = ["#1 Best ROI", "#2 Strong", "#3 Good", "#4 Worth Testing"];
  const styles = [
    "bg-primary/20 text-primary border-primary/30",
    "bg-green-500/15 text-green-400 border-green-400/20",
    "bg-yellow-500/15 text-yellow-400 border-yellow-400/20",
    "bg-muted text-muted-foreground border-border",
  ];
  const idx = Math.min(rank - 1, 3);
  return (
    <span
      className={cn(
        "shrink-0 text-xs font-semibold border rounded-full px-2 py-0.5",
        styles[idx]
      )}
    >
      {labels[idx]}
    </span>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [plan, setPlan] = useState<PlanContent | null>(null);
  const [appName, setAppName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [committed, setCommitted] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("plans")
      .select("plan_content, app_name")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPlan(data.plan_content as PlanContent);
          setAppName(data.app_name as string);
          setSelectedIndices(
            (data.plan_content as { this_weeks_top_3: unknown[] }).this_weeks_top_3.map((_, i) => i)
          );
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase
      .from("weekly_actions")
      .select("id")
      .eq("plan_id", id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setCommitted(true);
      });
  }, [id]);

  // Scrollspy
  const [activeSection, setActiveSection] = useState("health-score");
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    SECTIONS.forEach(({ id: sectionId }) => {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [plan]);

  async function handleShare() {
    const url = `${window.location.origin}/plan/${id}`;
    await navigator.clipboard.writeText(url);
  }

  async function handleCommit() {
    if (selectedIndices.length === 0 || committing) return;
    setCommitting(true);
    setCommitError(null);
    try {
      const res = await fetch(`/api/plans/${id}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndices }),
      });
      if (res.ok) {
        setCommitted(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setCommitError((body as { error?: string }).error ?? "Something went wrong. Try again.");
      }
    } catch {
      setCommitError("Network error. Check your connection and try again.");
    } finally {
      setCommitting(false);
    }
  }

  function scrollTo(sectionId: string) {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-foreground">Plan not found</p>
        <Button render={<Link href="/dashboard" />} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="shrink-0">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="size-3.5 text-primary-foreground fill-primary-foreground" />
            </div>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-sm font-semibold text-foreground truncate">
            {appName} — Marketing Plan
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-1.5 text-xs"
            title="Pro feature"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
              Pro
            </Badge>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleShare}
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-background sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 px-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
            Sections
          </p>
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map(({ id: sectionId, label, icon: Icon }) => {
              const active = activeSection === sectionId;
              return (
                <button
                  key={sectionId}
                  onClick={() => scrollTo(sectionId)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium text-left transition-colors",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main
          ref={mainRef}
          className="flex-1 px-4 py-8 sm:px-8 max-w-3xl mx-auto w-full space-y-14"
        >
          {/* Health Score */}
          <section>
            <SectionHeader
              id="health-score"
              icon={BarChart2}
              title="Marketing Health Score"
            />
            <Card className="overflow-visible shadow-md">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <ScoreGauge score={plan.health_score.score} />
                    <p className="text-xs text-muted-foreground max-w-[120px] text-center">
                      {plan.health_score.encouragement}
                    </p>
                  </div>

                  <div className="flex-1 w-full flex flex-col gap-3">
                    {Object.entries(plan.health_score.breakdown).map(
                      ([dim, val]) => (
                        <div key={dim} className="flex items-center gap-3">
                          <span className="w-28 text-xs font-medium text-muted-foreground capitalize shrink-0">
                            {dim}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground w-8 text-right">
                            {val}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Top priorities
                  </p>
                  {plan.health_score.top_priorities.map((p) => (
                    <div
                      key={p.title}
                      className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <span className="mt-0.5 size-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="size-1.5 rounded-full bg-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.description}
                        </p>
                      </div>
                      <Badge
                        variant={p.impact === "High" ? "default" : "secondary"}
                        className="ml-auto shrink-0 text-[10px]"
                      >
                        {p.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Commitment Section */}
          <section>
            {!committed ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-2">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Target className="size-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    Commit to Your Top 3
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Select the actions you commit to completing this week. They&apos;ll appear on your dashboard.
                </p>
                <div className="space-y-2 mb-5">
                  {plan.this_weeks_top_3.map((action, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                        selectedIndices.includes(i)
                          ? "border-primary/40 bg-primary/10"
                          : "border-border hover:border-primary/20 hover:bg-muted/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndices.includes(i)}
                        onChange={() =>
                          setSelectedIndices((prev) =>
                            prev.includes(i)
                              ? prev.filter((x) => x !== i)
                              : [...prev, i]
                          )
                        }
                        className="mt-0.5 size-4 accent-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {action.time_estimate}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {commitError && (
                  <p className="text-sm text-destructive mb-3">{commitError}</p>
                )}
                <Button
                  onClick={handleCommit}
                  disabled={selectedIndices.length === 0 || committing}
                  className="gap-2"
                >
                  {committing
                    ? "Saving…"
                    : `Commit to ${selectedIndices.length} action${selectedIndices.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 mb-2">
                <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                <p className="text-sm font-medium text-foreground flex-1">
                  You&apos;ve committed to this week&apos;s actions.
                </p>
                <Button
                  render={<Link href="/dashboard" />}
                  variant="link"
                  size="sm"
                  className="text-primary shrink-0 h-auto p-0 text-xs"
                >
                  View on dashboard →
                </Button>
              </div>
            )}
          </section>

          {/* This Week's Top 3 */}
          <section>
            <SectionHeader id="top-3" icon={Rocket} title="This Week's Top 3" />
            <div className="flex flex-col gap-4">
              {plan.this_weeks_top_3.map((item) => (
                <ActionCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* What to Skip */}
          <section>
            <SectionHeader id="skip" icon={XCircle} title="What to Skip" />
            <div className="flex flex-col gap-3">
              {plan.what_to_skip.map((s) => (
                <Card
                  key={s.action}
                  className="border border-destructive/20 bg-destructive/5 shadow-sm"
                >
                  <CardContent className="pt-4 pb-4 flex items-start gap-3">
                    <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.reason}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Positioning */}
          <section>
            <SectionHeader
              id="positioning"
              icon={Target}
              title="Positioning & Messaging"
            />
            <Card className="shadow-md">
              <CardContent className="pt-6 pb-6 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tagline
                  </p>
                  <p className="text-2xl font-bold text-foreground leading-snug">
                    {plan.positioning.tagline}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Value Proposition
                  </p>
                  <p className="text-base text-foreground leading-relaxed">
                    {plan.positioning.value_prop}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Elevator Pitch
                  </p>
                  <blockquote className="border-l-2 border-primary pl-4 text-sm text-muted-foreground italic leading-relaxed">
                    {plan.positioning.elevator_pitch}
                  </blockquote>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Channel Strategy */}
          <section>
            <SectionHeader
              id="channels"
              icon={TrendingUp}
              title="Channel Strategy"
            />
            <div className="flex flex-col gap-3">
              {plan.channel_strategy.map((c) => (
                <Card key={c.channel} className="shadow-sm">
                  <CardContent className="pt-4 pb-4 flex items-start gap-4">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg font-bold text-primary">
                      {c.roi_rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {c.channel}
                        </p>
                        <RoiBadge rank={c.roi_rank} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.why}
                      </p>
                      <p className="text-xs text-primary mt-1.5 font-medium">
                        First action: {c.first_action}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 30-Day Sprint */}
          <section>
            <SectionHeader
              id="sprint-30"
              icon={ListChecks}
              title="30-Day Sprint"
            />
            <div className="flex flex-col gap-6">
              {plan.sprint_30_day.map((week) => (
                <div key={week.week}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-primary bg-primary/15 rounded-full px-2.5 py-1">
                      Week {week.week}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {week.tasks.map((task) => (
                      <ActionCard key={task.title} item={task} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 60-Day Expansion */}
          <section>
            <SectionHeader
              id="expansion-60"
              icon={ChevronRight}
              title="60-Day Expansion"
            />
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <ul className="flex flex-col gap-2.5">
                  {plan.expansion_60_day.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* 90-Day Growth */}
          <section>
            <SectionHeader
              id="growth-90"
              icon={ChevronRight}
              title="90-Day Growth"
            />
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <ul className="flex flex-col gap-2.5">
                  {plan.growth_90_day.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 size-1.5 rounded-full bg-chart-2 shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Content Ideas */}
          <section>
            <SectionHeader
              id="content"
              icon={Lightbulb}
              title="Content Ideas"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plan.content_ideas.map((idea) => (
                <Card key={idea.title} className="shadow-sm">
                  <CardContent className="pt-4 pb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {idea.format}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {idea.channel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {idea.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {idea.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Launch Checklist */}
          {plan.launch_checklist && plan.launch_checklist.length > 0 && (
            <section>
              <SectionHeader
                id="launch"
                icon={CheckCircle2}
                title="Launch Checklist"
              />
              <Card className="shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <ul className="flex flex-col gap-2.5">
                    {plan.launch_checklist.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <CheckCircle2 className="size-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tools & Budget */}
          <section>
            <SectionHeader id="tools" icon={Wrench} title="Tools & Budget" />
            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tool
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.tools_and_budget.map((t, i) => (
                      <tr
                        key={t.tool}
                        className={cn(
                          "border-b border-border last:border-0 transition-colors",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {t.tool}
                        </td>
                        <td className="px-4 py-3 text-primary font-semibold whitespace-nowrap">
                          {t.cost}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Metrics to Track */}
          <section className="pb-12">
            <SectionHeader
              id="metrics"
              icon={BarChart2}
              title="Metrics to Track"
            />
            <div className="flex flex-col gap-3">
              {plan.metrics_to_track.map((m) => (
                <Card key={m.metric} className="shadow-sm">
                  <CardContent className="pt-4 pb-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {m.metric}
                        </p>
                        <span className="text-sm font-bold text-primary">
                          {m.target}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.why}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
