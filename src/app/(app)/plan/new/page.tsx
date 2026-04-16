"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlanInput } from "@/types";

// ─── constants ────────────────────────────────────────────────────────────────

const STEPS = ["Your App", "Your Audience", "Your Situation", "Your Goals"];

const APP_CATEGORIES = [
  "SaaS",
  "Mobile App",
  "Chrome Extension",
  "API / Developer Tool",
  "Marketplace",
  "Other",
];

const HANG_OUT_CHANNELS = [
  "Twitter/X",
  "Reddit",
  "Indie Hackers",
  "Hacker News",
  "Product Hunt",
  "LinkedIn",
  "Discord",
  "Other",
];

const STAGES = [
  {
    value: "idea",
    label: "Idea",
    description: "Still validating",
    icon: "💡",
  },
  {
    value: "building",
    label: "Building",
    description: "In active development",
    icon: "🔨",
  },
  {
    value: "launched",
    label: "Launched",
    description: "Live but early",
    icon: "🚀",
  },
  {
    value: "growing",
    label: "Growing",
    description: "Traction achieved",
    icon: "📈",
  },
] as const;

const FOUNDER_STRENGTHS = [
  "Writing",
  "Design",
  "Video",
  "Community",
  "Technical / SEO",
  "Networking",
  "Public Speaking",
];

const BUDGET_OPTIONS = ["$0", "$1–50", "$51–200", "$201–500", "$500+"];

const TIME_OPTIONS = [
  "1–2 hours",
  "3–5 hours",
  "5–10 hours",
  "10+ hours",
];

const GOAL_OPTIONS = [
  "Get first users",
  "Increase signups",
  "Improve retention",
  "Launch on Product Hunt",
  "Build audience",
  "Generate revenue",
];

const TIMELINE_OPTIONS = ["1 month", "3 months", "6 months", "12 months"];

// ─── blank form state ──────────────────────────────────────────────────────────

const INITIAL_FORM: PlanInput = {
  app_name: "",
  app_description: "",
  app_url: "",
  app_category: "",
  target_customer: "",
  pain_point: "",
  alternatives: "",
  where_they_hang_out: "",
  stage: "idea",
  current_users: "",
  current_revenue: "",
  monthly_budget: "",
  time_available: "",
  founder_strengths: [],
  primary_goal: "",
  timeline: "",
  preferred_channels: [],
};

// ─── slide animation variants ─────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// ─── reusable form primitives ──────────────────────────────────────────────────

function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
        "text-foreground transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "dark:bg-input/30",
        !value && "text-muted-foreground"
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o} value={o} className="bg-popover text-foreground">
          {o}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm",
        "text-foreground transition-colors outline-none resize-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "dark:bg-input/30"
      )}
    />
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── step components ───────────────────────────────────────────────────────────

function Step1({
  form,
  update,
}: {
  form: PlanInput;
  update: (k: keyof PlanInput, v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="App name">
        <Input
          placeholder="e.g. LaunchKit"
          value={form.app_name}
          onChange={(e) => update("app_name", e.target.value)}
        />
      </FormField>

      <FormField label="App description">
        <Textarea
          value={form.app_description}
          onChange={(v) => update("app_description", v)}
          placeholder="What does your app do and who is it for?"
          rows={3}
        />
      </FormField>

      <FormField label="App URL" optional>
        <Input
          placeholder="https://yourapp.com"
          value={form.app_url}
          onChange={(e) => update("app_url", e.target.value)}
        />
      </FormField>

      <FormField label="App category">
        <SelectField
          value={form.app_category}
          onChange={(v) => update("app_category", v)}
          options={APP_CATEGORIES}
          placeholder="Select a category..."
        />
      </FormField>
    </div>
  );
}

function Step2({
  form,
  update,
}: {
  form: PlanInput;
  update: (k: keyof PlanInput, v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Target customer">
        <Input
          placeholder="Solo indie hackers building AI tools"
          value={form.target_customer}
          onChange={(e) => update("target_customer", e.target.value)}
        />
      </FormField>

      <FormField label="Pain point they have">
        <Textarea
          value={form.pain_point}
          onChange={(v) => update("pain_point", v)}
          placeholder="What problem are you solving for them?"
          rows={3}
        />
      </FormField>

      <FormField label="Current alternatives">
        <Input
          placeholder="e.g. Notion + spreadsheets, or competitor X"
          value={form.alternatives}
          onChange={(e) => update("alternatives", e.target.value)}
        />
      </FormField>

      <FormField label="Where they hang out">
        <CheckboxGroup
          options={HANG_OUT_CHANNELS}
          selected={
            form.where_they_hang_out
              ? form.where_they_hang_out.split(",").map((s) => s.trim())
              : []
          }
          onChange={(vals) =>
            update("where_they_hang_out", vals.join(", "))
          }
        />
      </FormField>
    </div>
  );
}

function Step3({
  form,
  update,
}: {
  form: PlanInput;
  update: (k: keyof PlanInput, v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Current stage">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STAGES.map((s) => {
            const active = form.stage === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => update("stage", s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs opacity-70">{s.description}</span>
              </button>
            );
          })}
        </div>
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Current users">
          <Input
            placeholder="e.g. 0, 50, 1,200"
            value={form.current_users}
            onChange={(e) => update("current_users", e.target.value)}
          />
        </FormField>

        <FormField label="Current revenue">
          <Input
            placeholder="e.g. $0, $200/mo"
            value={form.current_revenue}
            onChange={(e) => update("current_revenue", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Monthly marketing budget">
          <SelectField
            value={form.monthly_budget}
            onChange={(v) => update("monthly_budget", v)}
            options={BUDGET_OPTIONS}
            placeholder="Select budget..."
          />
        </FormField>

        <FormField label="Time available per week">
          <SelectField
            value={form.time_available}
            onChange={(v) => update("time_available", v)}
            options={TIME_OPTIONS}
            placeholder="Select time..."
          />
        </FormField>
      </div>

      <FormField label="Founder strengths">
        <CheckboxGroup
          options={FOUNDER_STRENGTHS}
          selected={form.founder_strengths}
          onChange={(vals) => update("founder_strengths", vals)}
        />
      </FormField>
    </div>
  );
}

function Step4({
  form,
  update,
}: {
  form: PlanInput;
  update: (k: keyof PlanInput, v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Primary goal">
        <SelectField
          value={form.primary_goal}
          onChange={(v) => update("primary_goal", v)}
          options={GOAL_OPTIONS}
          placeholder="Select your main goal..."
        />
      </FormField>

      <FormField label="Timeline">
        <SelectField
          value={form.timeline}
          onChange={(v) => update("timeline", v)}
          options={TIMELINE_OPTIONS}
          placeholder="Select a timeline..."
        />
      </FormField>

      <FormField label="Preferred channels">
        <CheckboxGroup
          options={HANG_OUT_CHANNELS}
          selected={form.preferred_channels}
          onChange={(vals) => update("preferred_channels", vals)}
        />
      </FormField>
    </div>
  );
}

// ─── validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, form: PlanInput): string | null {
  if (step === 0) {
    if (!form.app_name.trim()) return "App name is required.";
    if (!form.app_description.trim()) return "App description is required.";
    if (!form.app_category) return "Please select a category.";
  }
  if (step === 1) {
    if (!form.target_customer.trim()) return "Target customer is required.";
    if (!form.pain_point.trim()) return "Pain point is required.";
    if (!form.where_they_hang_out)
      return "Select at least one channel where your audience hangs out.";
  }
  if (step === 2) {
    if (!form.monthly_budget) return "Please select a budget.";
    if (!form.time_available) return "Please select time availability.";
  }
  if (step === 3) {
    if (!form.primary_goal) return "Please select a primary goal.";
    if (!form.timeline) return "Please select a timeline.";
    if (!form.preferred_channels.length)
      return "Select at least one preferred channel.";
  }
  return null;
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function NewPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<PlanInput>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof PlanInput, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function goNext() {
    const err = validateStep(step, form);
    if (err) {
      setError(err);
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
    setError(null);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
    setError(null);
  }

  async function handleSubmit() {
    const err = validateStep(step, form);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to generate plan.");
      const data = await res.json();
      track("plan_generated", { app_name: form.app_name as string });
      router.push(`/plan/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="size-3.5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            MarketMyApp
          </span>
        </Link>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted w-full">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex-1 min-w-max px-4 py-3 text-center text-xs font-medium transition-colors",
              i === step
                ? "text-primary border-b-2 border-primary"
                : i < step
                ? "text-muted-foreground"
                : "text-muted-foreground/50"
            )}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center size-5 rounded-full text-xs mr-1.5 font-semibold",
                i < step
                  ? "bg-primary/20 text-primary"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>

      {/* Form body */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          {/* Step heading */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {STEPS[step]}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {step === 0 && "Tell us about the app you're marketing."}
                  {step === 1 && "Help us understand who you're building for."}
                  {step === 2 && "Give us context on where you are today."}
                  {step === 3 &&
                    "Define what success looks like for you."}
                </p>
              </div>

              <Card className="shadow-lg">
                <CardContent className="pt-6 pb-6">
                  {step === 0 && <Step1 form={form} update={update} />}
                  {step === 1 && <Step2 form={form} update={update} />}
                  {step === 2 && <Step3 form={form} update={update} />}
                  {step === 3 && <Step4 form={form} update={update} />}
                </CardContent>
              </Card>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div
            className={cn(
              "mt-6 flex",
              step === 0 ? "justify-end" : "justify-between"
            )}
          >
            {step > 0 && (
              <Button variant="ghost" onClick={goBack} disabled={submitting}>
                <ChevronLeft className="mr-1 size-4" />
                Back
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} size="lg">
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="min-w-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 size-4 fill-current" />
                    Generate My Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
