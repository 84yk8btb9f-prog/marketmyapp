"use client";

import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const AVATARS = [
  { initials: "AK", hue: "285" },
  { initials: "MJ", hue: "220" },
  { initials: "SR", hue: "160" },
  { initials: "TL", hue: "340" },
  { initials: "DW", hue: "40" },
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

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.58 0.22 264) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
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
                  "linear-gradient(135deg, oklch(0.72 0.18 264) 0%, oklch(0.58 0.22 264) 100%)",
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
          <div className="flex flex-col items-center gap-3">
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
          </div>
        </FadeUp>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
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
