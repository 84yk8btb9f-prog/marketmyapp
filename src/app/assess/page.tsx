"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "idea" | "building" | "launched" | "growing";

interface AssessmentData {
  appName: string;
  stage: Stage;
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { value: Stage; label: string; description: string }[] = [
  { value: "idea", label: "Idea", description: "Still planning & validating" },
  { value: "building", label: "Building", description: "Actively in development" },
  { value: "launched", label: "Launched", description: "Live and collecting feedback" },
  { value: "growing", label: "Growing", description: "Scaling with paying users" },
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
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-all duration-500",
            i < current
              ? "bg-primary w-8"
              : i === current
              ? "bg-primary w-12"
              : "bg-border w-8"
          )}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        {current + 1} / {total}
      </span>
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
    stage: "building",
    struggle: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: data.appName,
          stage: data.stage,
          biggest_struggle: data.struggle,
        }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const json = await res.json();

      // Normalise the response — the API may return priorities as strings or objects
      const rawPriorities: unknown[] = json.top_priorities ?? json.priorities ?? [];
      const priorities: Priority[] = rawPriorities.map(
        (p: unknown, i: number) => {
          if (typeof p === "string") {
            return { title: p, description: "", icon: PRIORITY_ICONS[i] ?? PRIORITY_ICONS[0] };
          }
          const obj = p as Record<string, unknown>;
          return {
            title: (obj.title as string) ?? String(p),
            description: (obj.description as string) ?? "",
            icon: PRIORITY_ICONS[i] ?? PRIORITY_ICONS[0],
          };
        }
      );

      setResult({ score: json.score ?? 0, priorities });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function canAdvance() {
    if (step === 0) return data.appName.trim().length > 0;
    if (step === 2) return data.struggle.trim().length > 0;
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

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(ellipse at center, ${scoreColor} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 w-full max-w-lg">
          {/* Confetti */}
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

          {/* Encouragement message */}
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
            {isHigh
              ? "You're well-positioned. Now let's sharpen the edges and scale what's working."
              : isLow
              ? "Every expert was once a beginner. Here's your personalised roadmap to level up."
              : "Solid progress. A few targeted actions will move the needle fast."}
          </motion.p>

          {/* Top 3 priorities */}
          {result.priorities.length > 0 && (
            <motion.div
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="mb-8 space-y-3"
            >
              <h2 className="text-sm font-semibold text-foreground mb-4 text-center uppercase tracking-widest text-muted-foreground">
                Your Top 3 Priorities
              </h2>
              {result.priorities.slice(0, 3).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.12, duration: 0.4, ease: "easeOut" }}
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="size-12 rounded-full border-2 border-border border-t-primary"
          />
          <p className="text-base font-medium text-foreground flex items-center gap-2">
            Analyzing your marketing <AnimatedDots />
          </p>
          <p className="text-sm text-muted-foreground">
            Running your app through 5 marketing dimensions
          </p>
        </motion.div>
      </main>
    );
  }

  // ── Assessment steps ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Ambient glow */}
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
            60-second marketing assessment
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            Get your Marketing Health Score
          </h1>
        </motion.div>

        <StepIndicator current={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          {/* Step 1 — App name */}
          {step === 0 && (
            <motion.div
              key="step-0"
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
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
                placeholder="e.g. LaunchPad, Notion clone, SaaS analytics tool..."
                className="h-12 rounded-xl text-base px-4 mb-6"
                autoFocus
              />
            </motion.div>
          )}

          {/* Step 2 — Stage */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
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

          {/* Step 3 — Struggle */}
          {step === 2 && (
            <motion.div
              key="step-2"
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <label className="block text-lg font-semibold text-foreground mb-2">
                What&apos;s your biggest marketing struggle?
              </label>
              <p className="text-sm text-muted-foreground mb-6">
                Be specific — the more context you give, the more actionable your plan.
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
