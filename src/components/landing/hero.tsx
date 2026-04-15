"use client";

import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import { ArrowRight, ChevronDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const AVATARS = [
  { initials: "AK", hue: "285" },
  { initials: "MJ", hue: "220" },
  { initials: "SR", hue: "160" },
  { initials: "TL", hue: "340" },
  { initials: "DW", hue: "40" },
];

const DIMENSIONS = [
  { label: "Content", score: 82 },
  { label: "SEO", score: 61 },
  { label: "Social", score: 75 },
  { label: "Email", score: 48 },
  { label: "Conversion", score: 90 },
];

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScorePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32, y: 16 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ ...EASE, delay: 0.45 }}
      className="relative w-full max-w-sm mx-auto lg:mx-0"
    >
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
        {/* Score header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Marketing Health Score
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-5xl font-bold font-mono"
                style={{ color: "oklch(0.76 0.17 55)" }}
              >
                78
              </span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <TrendingUp className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">+12 pts</span>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="flex flex-col gap-3 mb-5">
          {DIMENSIONS.map((dim, i) => (
            <div key={dim.label} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground shrink-0">{dim.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      dim.score >= 80
                        ? "oklch(0.76 0.17 55)"
                        : dim.score >= 60
                        ? "oklch(0.76 0.17 55 / 0.65)"
                        : "oklch(0.76 0.17 55 / 0.4)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ ...EASE, delay: 0.65 + i * 0.08 }}
                />
              </div>
              <span className="w-7 text-xs text-muted-foreground text-right tabular-nums font-mono">
                {dim.score}
              </span>
            </div>
          ))}
        </div>

        {/* Top action */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...EASE, delay: 1.1 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1.5">
            Top action this week
          </p>
          <p className="text-sm text-foreground leading-snug">
            Publish 2 LinkedIn posts about your core use case — your audience engagement is underutilized.
          </p>
        </motion.div>
      </div>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 w-52 h-52 rounded-full blur-3xl opacity-15"
        style={{ background: "oklch(0.76 0.17 55)" }}
      />
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Top ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[500px] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.76 0.17 55 / 0.08) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center">

          {/* Left: copy */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <FadeUp delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                AI-powered marketing for indie hackers
              </span>
            </FadeUp>

            {/* Heading */}
            <FadeUp delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-foreground mb-6">
                Stop overthinking.
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.88 0.16 68) 0%, oklch(0.76 0.17 55) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Start executing.
                </span>
              </h1>
            </FadeUp>

            {/* Subheading */}
            <FadeUp delay={0.2}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10">
                Your AI co-pilot tells you exactly what to do this week. No fluff,
                no 47-step frameworks — just this week&apos;s three highest-impact
                marketing actions.
              </p>
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Button
                  size="lg"
                  className="rounded-xl h-12 px-6 text-sm font-semibold gap-2 shadow-lg shadow-primary/25"
                  render={
                    <Link href="/assess">
                      Get Your Marketing Health Score — Free
                      <ArrowRight className="size-4" />
                    </Link>
                  }
                />
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-border bg-background/50 hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
                >
                  See how it works
                  <ChevronDown className="size-4" />
                </a>
              </div>
            </FadeUp>

            {/* Social proof */}
            <FadeUp delay={0.4}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {AVATARS.map((av, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        background: `oklch(0.55 0.2 ${av.hue})`,
                        zIndex: AVATARS.length - i,
                      }}
                      aria-label={av.initials}
                    >
                      {av.initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">500+</span>{" "}
                  indie hackers already growing
                </p>
              </div>
            </FadeUp>
          </div>

          {/* Right: score preview */}
          <ScorePreview />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-xs text-muted-foreground/60">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown className="size-4 text-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
