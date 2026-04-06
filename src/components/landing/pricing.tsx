"use client";

import { motion, type Transition } from "framer-motion";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Understand where you stand before you commit.",
    cta: "Get Free Score",
    ctaHref: "/assess",
    highlight: false,
    features: [
      "Marketing Health Score",
      "Score breakdown across 8 dimensions",
      "Top 3 priority areas identified",
      "One-time assessment",
    ],
  },
  {
    name: "Trial",
    price: "Free",
    period: "7 days",
    description: "Experience the full co-pilot before paying a cent.",
    cta: "Start Free Trial",
    ctaHref: "/assess",
    highlight: false,
    badge: "7-Day Trial",
    features: [
      "Everything in Free",
      "Full weekly action plan",
      "3 specific this-week tasks",
      "Stage & channel tailoring",
      "Email delivery of your plan",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "Your AI marketing co-pilot, every single week.",
    cta: "Get Started",
    ctaHref: "/assess",
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Trial",
      "Weekly plan recalibration",
      "Accountability check-ins",
      "Progress tracking over time",
      "Slack / email notifications",
      "Priority support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
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
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Start free. Grow with confidence.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Try the full product for free. Upgrade only when it&apos;s working
            for you.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ ...EASE, delay: index * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-all",
                plan.highlight
                  ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                    plan.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground border border-border"
                  )}
                >
                  {plan.highlight && <Zap className="size-3" />}
                  {plan.badge}
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span
                    className={cn(
                      "text-4xl font-bold tracking-tight",
                      plan.highlight ? "text-primary" : "text-foreground"
                    )}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* CTA */}
              <Button
                variant={plan.highlight ? "default" : "outline"}
                size="lg"
                className={cn(
                  "w-full rounded-xl mb-8 font-semibold",
                  plan.highlight && "shadow-md shadow-primary/20"
                )}
                render={<Link href={plan.ctaHref}>{plan.cta}</Link>}
              />

              {/* Divider */}
              <div className="border-t border-border mb-6" />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                        plan.highlight ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Check
                        className={cn(
                          "size-2.5",
                          plan.highlight ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        plan.highlight ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          No credit card required to start. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
