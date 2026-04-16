"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, FileText, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const EASE = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

interface Plan {
  id: string;
  app_name: string;
  health_score: number | null;
  created_at: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("plans")
      .select("id, app_name, health_score, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={EASE}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">My Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">All your generated marketing plans</p>
        </div>
        <Button render={<Link href="/plan/new">New Plan</Link>} className="gap-2">
          <PlusCircle className="size-4" />
          New Plan
        </Button>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={EASE}
          className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-border text-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">No plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">Generate your first marketing plan to get started</p>
          </div>
          <Button render={<Link href="/plan/new">Generate your first plan</Link>} size="sm">
            Generate your first plan
          </Button>
        </motion.div>
      )}

      {/* Plan list */}
      {!loading && plans.length > 0 && (
        <div className="flex flex-col gap-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE, delay: i * 0.05 }}
            >
              <Link
                href={`/plan/${plan.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{plan.app_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(plan.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {plan.health_score != null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="size-3" />
                          Score: {plan.health_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
