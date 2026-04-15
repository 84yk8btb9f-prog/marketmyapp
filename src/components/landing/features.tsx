"use client";

import { motion, type Transition } from "framer-motion";
import { X, Check } from "lucide-react";

const EASE: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const otherTools = [
  "Generic advice you've read a hundred times",
  "A 10-page strategy doc you'll never finish",
  "Broad frameworks with no clear starting point",
  "The same advice for every stage and niche",
  "One-and-done reports with no follow-up",
  "Motivation without accountability",
];

const ourTool = [
  "Your 3 highest-impact actions for this week",
  "A precise Health Score across 8 dimensions",
  "Stage-aware priorities (pre-launch vs. growth)",
  "Tailored to your audience, channel, and budget",
  "Weekly recalibration as your context changes",
  "Built-in accountability check-ins",
];

export function Features() {
  return (
    <section className="py-28 px-6 bg-muted/20">
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
            The difference
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Not another plan generator
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Most tools leave you with more to read. We leave you with less to
            think about.
          </p>
        </motion.div>

        {/* Comparison table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Other tools */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={EASE}
            className="rounded-2xl border border-border bg-card p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center">
                <X className="size-3 text-destructive" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Other tools give you&hellip;
              </h3>
            </div>
            <ul className="flex flex-col gap-3">
              {otherTools.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...EASE, delay: index * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <X className="size-3 text-destructive/70" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* MarketMyApp */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...EASE, delay: 0.1 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-8 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-20"
              style={{ background: "oklch(0.76 0.17 55)" }}
            />

            <div className="flex items-center gap-2 mb-6 relative z-10">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="size-3 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                MarketMyApp gives you&hellip;
              </h3>
            </div>
            <ul className="flex flex-col gap-3 relative z-10">
              {ourTool.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...EASE, delay: index * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check className="size-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
