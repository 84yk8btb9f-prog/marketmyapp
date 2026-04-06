"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How is this different from ChatGPT?",
    answer:
      "ChatGPT gives you generic advice based on whatever you type. MarketMyApp uses a structured assessment framework trained specifically on indie hacker marketing patterns. We assess your specific stage, audience, and current activity, then surface only the actions most likely to move the needle for you — not for some hypothetical startup.",
  },
  {
    question: "What if I'm pre-launch?",
    answer:
      "Pre-launch is one of the most common stages we work with. Your plan will focus on audience validation, waitlist building, and distribution channels you can prime before launch day. You'll get actions that build momentum now so you're not starting from zero on day one.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no lock-in. Cancel from your dashboard with one click. If you cancel mid-billing cycle, you keep access until the end of the period. We don't do dark patterns.",
  },
  {
    question: "How does the weekly system work?",
    answer:
      "Every week, MarketMyApp recalibrates your plan based on what changed: new channels you tried, growth signals, user feedback, and your evolving priorities. You get a fresh set of 3 high-leverage actions every Monday — ranked by expected impact for your specific situation.",
  },
  {
    question: "What kind of apps does this work for?",
    answer:
      "SaaS, mobile apps, browser extensions, developer tools, consumer apps — anything with a target audience you're trying to reach. The assessment adapts to your product type, pricing model, and distribution channel, so the output is always relevant.",
  },
  {
    question: "How long does the assessment take?",
    answer:
      "Under 60 seconds for the free Health Score. The full onboarding for Pro users takes 3–5 minutes. We ask only what we need — no long-form essays, no open-ended journaling prompts.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "text-sm sm:text-base font-medium transition-colors",
            isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {question}
        </span>
        <span className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
          {isOpen ? (
            <Minus className="size-3 text-primary" />
          ) : (
            <Plus className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted-foreground leading-relaxed pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 px-6 bg-muted/20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Questions we get a lot
          </h2>
          <p className="text-muted-foreground text-lg">
            If yours isn&apos;t here, ping us — we reply fast.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-card px-6 sm:px-8"
        >
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
