"use client";

import { motion, type Transition } from "framer-motion";
import { ClipboardList, BarChart3, Rocket } from "lucide-react";

const EASE: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const steps = [
  {
    icon: ClipboardList,
    number: "01",
    title: "Answer 3 Questions",
    description:
      "Tell us about your app, your target audience, and what you've already tried. Takes under 60 seconds.",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Get Your Score",
    description:
      "Our AI analyzes your marketing posture across 8 dimensions and gives you a clear Health Score with a breakdown.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Execute This Week's Plan",
    description:
      "Receive 3 specific, high-leverage actions tailored to your stage. No theory — just what to do Monday morning.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={EASE}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            From zero to clarity in minutes
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No lengthy onboarding. No endless settings. Just answers, a score,
            and a plan.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.76 0.17 55 / 0.25), oklch(0.76 0.17 55 / 0.25), transparent)",
            }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ ...EASE, delay: index * 0.15 }}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group overflow-hidden"
              >
                {/* Large background step number */}
                <span className="pointer-events-none select-none absolute -bottom-5 -right-2 text-[9rem] leading-none font-bold font-mono text-foreground/[0.035] group-hover:text-primary/[0.06] transition-colors">
                  {step.number}
                </span>

                {/* Step number badge */}
                <span className="absolute top-4 right-5 text-xs font-mono font-medium text-muted-foreground/40 group-hover:text-primary/40 transition-colors">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-5 group-hover:bg-primary/15 transition-colors">
                  <Icon className="size-6 text-primary" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
