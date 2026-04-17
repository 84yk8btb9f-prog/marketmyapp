"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "idea" | "building" | "launched" | "growing";

interface AssessmentData {
  appName: string;
  appDescription: string;
  targetCustomer: string;
  stage: Stage;
  currentTraction: string;
  channelsTried: string[];
  struggle: string;
}

interface Priority {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface HealthScoreResult {
  score: number;
  priorities: Priority[];
  encouragement?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { value: Stage; label: string; description: string }[] = [
  { value: "idea", label: "Idea", description: "Still planning & validating" },
  { value: "building", label: "Building", description: "Actively in development" },
  { value: "launched", label: "Launched", description: "Live and collecting feedback" },
  { value: "growing", label: "Growing", description: "Scaling with paying users" },
];

const TRACTION_OPTIONS = [
  "No users yet",
  "A few beta users (< 10)",
  "10–100 users",
  "100–1,000 users",
  "1,000+ users",
  "Some paying customers",
  "Profitable / growing MRR",
];

const CHANNEL_OPTIONS = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "TikTok",
  "Reddit",
  "Hacker News",
  "Product Hunt",
  "SEO / blog",
  "Cold email / outreach",
  "Paid ads",
  "Communities / Discord",
  "Word of mouth",
  "None yet",
];

const ANALYSIS_MESSAGES = [
  { text: "Reading your positioning...", sub: "How clearly does your product communicate its value?" },
  { text: "Mapping your audience...", sub: "Do you know exactly who you're building for?" },
  { text: "Evaluating your channels...", sub: "Are you fishing where the fish are?" },
  { text: "Checking content signals...", sub: "Is your organic engine running?" },
  { text: "Running the numbers...", sub: "Are you measuring what actually matters?" },
  { text: "Writing your score...", sub: "Putting it all together — almost there." },
];

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const PRIORITY_ICONS = [
  <Target key="target" className="size-4" />,
  <TrendingUp key="trending" className="size-4" />,
  <Zap key="zap" className="size-4" />,
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1.5 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= current ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground font-medium">
        Step {current + 1} of {total}
      </p>
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-primary inline-block"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function CountingNumber({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{display}</>;
}

function ConfettiParticle({ delay }: { delay: number }) {
  const hues = [285, 300, 260, 180, 40, 340];
  const hue = hues[Math.floor(Math.random() * hues.length)];
  const x = (Math.random() - 0.5) * 400;
  const rotate = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 size-2 rounded-sm pointer-events-none"
      style={{ background: `oklch(0.65 0.25 ${hue})` }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x,
        y: [0, -120 - Math.random() * 80, 200 + Math.random() * 100],
        opacity: [1, 1, 0],
        rotate,
        scale: [1, 1, 0.5],
      }}
      transition={{ duration: 1.8, delay, ease: "easeOut" }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AssessPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AssessmentData>({
    appName: "",
    appDescription: "",
    targetCustomer: "",
    stage: "building",
    currentTraction: "",
    channelsTried: [],
    struggle: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) { setLoadingMsgIdx(0); return; }
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % ANALYSIS_MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, [loading]);

  const totalSteps = 5;

  function toggleChannel(channel: string) {
    setData((d) => {
      const already = d.channelsTried.includes(channel);
      if (channel === "None yet") {
        return { ...d, channelsTried: already ? [] : ["None yet"] };
      }
      const without = d.channelsTried.filter((c) => c !== "None yet");
      return {
        ...d,
        channelsTried: already
          ? without.filter((c) => c !== channel)
          : [...without, channel],
      };
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: data.appName,
          app_description: data.appDescription,
          target_customer: data.targetCustomer,
          stage: data.stage,
          current_traction: data.currentTraction,
          channels_tried: data.channelsTried,
          biggest_struggle: data.struggle,
        }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const json = await res.json();

      const rawPriorities: unknown[] = json.top_priorities ?? json.priorities ?? [];
      const priorities: Priority[] = rawPriorities.map((p: unknown, i: number) => {
        if (typeof p === "string") {
          return { title: p, description: "", icon: PRIORITY_ICONS[i] ?? PRIORITY_ICONS[0] };
        }
        const obj = p as Record<string, unknown>;
        return {
          title: (obj.title as string) ?? String(p),
          description: (obj.description as string) ?? "",
          icon: PRIORITY_ICONS[i] ?? PRIORITY_ICONS[0],
        };
      });

      setResult({
        score: json.score ?? 0,
        priorities,
        encouragement: json.encouragement as string | undefined,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function canAdvance() {
    if (step === 0) return data.appName.trim().length > 0;
    if (step === 1) return data.appDescription.trim().length > 0 && data.targetCustomer.trim().length > 0;
    if (step === 3) return data.currentTraction.length > 0;
    if (step === 4) return data.struggle.trim().length > 0;
    return true;
  }

  function advance() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  // ── Result view ──────────────────────────────────────────────────────────────
  if (result) {
    const isHigh = result.score > 70;
    const isLow = result.score < 40;
    const confettiCount = isHigh ? 24 : 0;
    const scoreColor =
      result.score >= 70
        ? "oklch(0.65 0.2 160)"
        : result.score >= 40
        ? "oklch(0.65 0.25 285)"
        : "oklch(0.65 0.2 40)";

    const encouragementText =
      result.encouragement ??
      (isHigh
        ? "You're well-positioned. Now let's sharpen the edges and scale what's working."
        : isLow
        ? "Every expert was once a beginner. Here's your personalised roadmap to level up."
        : "Solid progress. A few targeted actions will move the needle fast.");

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(ellipse at center, ${scoreColor} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 w-full max-w-lg">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.04} />
          ))}

          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="text-center mb-10"
          >
            {isHigh && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6"
              >
                <Sparkles className="size-3.5" />
                Strong marketing foundation!
              </motion.div>
            )}
            {isLow && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-6"
              >
                <Zap className="size-3.5" />
                Room to grow — let&apos;s fix that
              </motion.div>
            )}

            <h1 className="text-2xl font-bold text-foreground mb-2">
              {data.appName}&apos;s Marketing Health Score
            </h1>
            <p className="text-muted-foreground text-sm">
              Based on your answers, here&apos;s where you stand.
            </p>
          </motion.div>

          {/* Score circle */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <div className="relative flex items-center justify-center">
              <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                className="-rotate-90"
                aria-hidden
              >
                <circle cx="90" cy="90" r="72" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                <motion.circle
                  cx="90"
                  cy="90"
                  r="72"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 72}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - result.score / 100) }}
                  transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold tabular-nums" style={{ color: scoreColor }}>
                  <CountingNumber target={result.score} />
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">out of 100</span>
              </div>
            </div>
          </motion.div>

          {/* Encouragement from AI */}
          <motion.p
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
            className={cn(
              "text-center text-sm mb-8 px-4",
              isHigh ? "text-green-400" : isLow ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {encouragementText}
          </motion.p>

          {/* Congrats callout */}
          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.9 }}
            className="mb-8 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center"
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              By the way — just by being here, you&apos;re already ahead of{" "}
              <span className="font-semibold text-foreground">99% of founders</span>.
              Most never think seriously about marketing. You did. That&apos;s the real win.
            </p>
          </motion.div>

          {/* Top 3 priorities */}
          {result.priorities.length > 0 && (
            <motion.div
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1.1 }}
              className="mb-8 space-y-3"
            >
              <h2 className="text-sm font-semibold text-center uppercase tracking-widest text-muted-foreground mb-4">
                Your Top 3 Priorities
              </h2>
              {result.priorities.slice(0, 3).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.12, duration: 0.4, ease: "easeOut" }}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card px-4 py-3.5 ring-1 ring-foreground/5"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {PRIORITY_ICONS[i]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{p.title}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums mt-0.5">
                    #{i + 1}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.2 }}
            className="flex flex-col gap-3"
          >
            <Button
              render={<Link href="/signup" />}
              className="h-11 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/20 w-full"
            >
              Want the full plan? Start your free trial
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/plan/new" />}
              variant="outline"
              className="h-11 rounded-xl text-sm font-medium w-full"
            >
              Generate full plan
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Loading view ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-7 text-center max-w-xs"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="size-11 rounded-full border-2 border-border border-t-primary"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingMsgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-2"
            >
              <p className="text-base font-semibold text-foreground">
                {ANALYSIS_MESSAGES[loadingMsgIdx].text}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ANALYSIS_MESSAGES[loadingMsgIdx].sub}
              </p>
            </motion.div>
          </AnimatePresence>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {ANALYSIS_MESSAGES.map((_, i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full bg-border"
                animate={{
                  width: i === loadingMsgIdx ? 20 : 6,
                  backgroundColor: i <= loadingMsgIdx ? "oklch(0.65 0.25 285)" : undefined,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Assessment steps ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.25 285) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <Sparkles className="size-3" />
            2-minute marketing assessment
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            Get your Marketing Health Score
          </h1>
        </motion.div>

        <StepIndicator current={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          {/* Step 0 — App name */}
          {step === 0 && (
            <motion.div key="step-0" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <label className="block text-lg font-semibold text-foreground mb-2">
                What&apos;s your app called?
              </label>
              <p className="text-sm text-muted-foreground mb-6">
                We&apos;ll personalise your score and action plan around your product.
              </p>
              <Input
                type="text"
                value={data.appName}
                onChange={(e) => setData((d) => ({ ...d, appName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && canAdvance() && advance()}
                placeholder="e.g. Notion clone, SaaS analytics tool..."
                className="h-12 rounded-xl text-base px-4 mb-6"
                autoFocus
              />
            </motion.div>
          )}

          {/* Step 1 — Description + Target customer */}
          {step === 1 && (
            <motion.div key="step-1" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <label className="block text-lg font-semibold text-foreground mb-2">
                Tell us about your app
              </label>
              <p className="text-sm text-muted-foreground mb-5">
                Be specific — this is how we score your positioning and audience clarity.
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    What does it do?
                  </label>
                  <textarea
                    value={data.appDescription}
                    onChange={(e) => setData((d) => ({ ...d, appDescription: e.target.value }))}
                    placeholder="e.g. A Kanban tool for remote dev teams that integrates with GitHub — shows what your team is actually working on, not just what they say they are."
                    rows={3}
                    className={cn(
                      "w-full rounded-xl border border-input bg-input/30 px-4 py-3 text-sm text-foreground",
                      "placeholder:text-muted-foreground transition-colors outline-none resize-none",
                      "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    )}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Who is it for?
                  </label>
                  <Input
                    type="text"
                    value={data.targetCustomer}
                    onChange={(e) => setData((d) => ({ ...d, targetCustomer: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && advance()}
                    placeholder="e.g. Freelance designers charging $5k+ projects, B2B SaaS founders at pre-seed..."
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Stage */}
          {step === 2 && (
            <motion.div key="step-2" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <label className="block text-lg font-semibold text-foreground mb-2">
                What stage are you at?
              </label>
              <p className="text-sm text-muted-foreground mb-6">
                Your marketing strategy should match where you actually are.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {STAGES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setData((d) => ({ ...d, stage: s.value }))}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      data.stage === s.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm font-semibold text-foreground">{s.label}</span>
                    <span className="text-xs text-muted-foreground leading-snug">{s.description}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 — Traction + Channels */}
          {step === 3 && (
            <motion.div key="step-3" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <label className="block text-lg font-semibold text-foreground mb-2">
                Where are you right now?
              </label>
              <p className="text-sm text-muted-foreground mb-5">
                Honest answers give honest scores.
              </p>
              <div className="space-y-5 mb-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Current traction
                  </label>
                  <div className="flex flex-col gap-2">
                    {TRACTION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setData((d) => ({ ...d, currentTraction: opt }))}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm text-left transition-all duration-200",
                          data.currentTraction === opt
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {opt}
                        {data.currentTraction === opt && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Channels tried <span className="normal-case font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((ch) => {
                      const selected = data.channelsTried.includes(ch);
                      return (
                        <button
                          key={ch}
                          onClick={() => toggleChannel(ch)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                            selected
                              ? "border-primary/50 bg-primary/15 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Biggest struggle */}
          {step === 4 && (
            <motion.div key="step-4" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <label className="block text-lg font-semibold text-foreground mb-2">
                What&apos;s your biggest marketing struggle?
              </label>
              <p className="text-sm text-muted-foreground mb-6">
                Be specific — the more honest you are, the more actionable your plan.
              </p>
              <textarea
                value={data.struggle}
                onChange={(e) => setData((d) => ({ ...d, struggle: e.target.value }))}
                placeholder="e.g. I can't find my first 100 users, I don't know which channel to focus on, I've tried Twitter but get no traction..."
                rows={4}
                className={cn(
                  "w-full rounded-xl border border-input bg-input/30 px-4 py-3 text-sm text-foreground",
                  "placeholder:text-muted-foreground transition-colors outline-none resize-none",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 mb-6"
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive mb-4 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="h-11 rounded-xl px-5"
            >
              Back
            </Button>
          )}
          <Button
            onClick={advance}
            disabled={!canAdvance()}
            className={cn(
              "h-11 rounded-xl flex-1 text-sm font-semibold gap-2 shadow-md shadow-primary/20 transition-all",
              !canAdvance() && "opacity-40 cursor-not-allowed shadow-none"
            )}
          >
            {step < totalSteps - 1 ? (
              <>Continue <ArrowRight className="size-4" /></>
            ) : (
              <>Get my score <Sparkles className="size-4" /></>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
