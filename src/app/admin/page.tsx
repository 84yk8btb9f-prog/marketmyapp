"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Crown,
  Activity,
  Flame,
  FileText,
  RefreshCw,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: string;
  health_score: number | null;
  current_streak: number;
  longest_streak: number;
  plans_generated: number;
  trial_ends_at: string | null;
  created_at: string;
}

type PlanTier = "free" | "trial" | "pro";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  PlanTier,
  { label: string; className: string; icon: React.ReactNode }
> = {
  free: {
    label: "Free",
    className: "border-border bg-muted/40 text-muted-foreground",
    icon: <Zap className="size-3" />,
  },
  trial: {
    label: "Trial",
    className: "border-primary/40 bg-primary/10 text-primary",
    icon: <Activity className="size-3" />,
  },
  pro: {
    label: "Pro",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    icon: <Crown className="size-3" />,
  },
};

const TIERS: PlanTier[] = ["free", "trial", "pro"];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn("size-7 flex items-center justify-center rounded-lg", className)}>
          {icon}
        </div>
      </div>
      <span className="text-3xl font-bold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

// ─── Tier badge / inline selector ─────────────────────────────────────────────

function TierSelector({
  userId,
  currentTier,
  onUpdate,
}: {
  userId: string;
  currentTier: string;
  onUpdate: (userId: string, tier: PlanTier) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tier = (TIER_CONFIG[currentTier as PlanTier]
    ? (currentTier as PlanTier)
    : "free") as PlanTier;
  const config = TIER_CONFIG[tier];

  async function selectTier(newTier: PlanTier) {
    if (newTier === tier) {
      setOpen(false);
      return;
    }
    setOpen(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan_tier: newTier }),
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdate(userId, newTier);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // silent — badge just won't change
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
          config.className,
          saving && "opacity-50 cursor-wait",
          "hover:opacity-80"
        )}
      >
        {saved ? (
          <Check className="size-3 text-green-400" />
        ) : (
          config.icon
        )}
        {config.label}
        <ChevronDown className="size-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] rounded-xl border border-border bg-popover shadow-xl shadow-black/30 overflow-hidden">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => selectTier(t)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted",
                t === tier && "bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md border px-1.5 py-0.5",
                  TIER_CONFIG[t].className
                )}
              >
                {TIER_CONFIG[t].icon}
                {TIER_CONFIG[t].label}
              </span>
              {t === tier && <Check className="size-3 ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setUsers(json.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleTierUpdate(userId: string, newTier: PlanTier) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan_tier: newTier } : u))
    );
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const total = users.length;
  const trialCount = users.filter((u) => u.plan_tier === "trial").length;
  const proCount = users.filter((u) => u.plan_tier === "pro").length;
  const freeCount = users.filter((u) => u.plan_tier === "free").length;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => fetchUsers()}
          className="text-xs text-primary underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total · manage plans and view activity
          </p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:border-primary/40",
            refreshing && "opacity-50 cursor-wait"
          )}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8"
      >
        <StatCard
          label="Total Users"
          value={total}
          icon={<Users className="size-4 text-muted-foreground" />}
          className="bg-muted/50"
        />
        <StatCard
          label="Free"
          value={freeCount}
          icon={<Zap className="size-4 text-muted-foreground" />}
          className="bg-muted/50"
        />
        <StatCard
          label="Trial"
          value={trialCount}
          icon={<Activity className="size-4 text-primary" />}
          className="bg-primary/10"
        />
        <StatCard
          label="Pro"
          value={proCount}
          icon={<Crown className="size-4 text-amber-400" />}
          className="bg-amber-500/10"
        />
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className={cn(
            "w-full max-w-sm rounded-xl border border-input bg-input/30 pl-9 pr-4 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          )}
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="rounded-xl border border-border bg-card"
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_80px_70px_80px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/30 rounded-t-xl">
          {["User", "Plan", "Score", "Streak", "Plans", "Joined"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {search ? "No users match your search." : "No users yet."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((user, i) => {
              const initials = (user.full_name ?? user.email)
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const joined = new Date(user.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "2-digit",
              });

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="grid grid-cols-[1fr_120px_80px_70px_80px_100px] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Plan tier */}
                  <div>
                    <TierSelector
                      userId={user.id}
                      currentTier={user.plan_tier}
                      onUpdate={handleTierUpdate}
                    />
                  </div>

                  {/* Health score */}
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-3 text-muted-foreground shrink-0" />
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        user.health_score === null
                          ? "text-muted-foreground"
                          : user.health_score >= 70
                          ? "text-green-400"
                          : user.health_score >= 40
                          ? "text-primary"
                          : "text-amber-400"
                      )}
                    >
                      {user.health_score ?? "—"}
                    </span>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-1.5">
                    <Flame
                      className={cn(
                        "size-3 shrink-0",
                        user.current_streak > 0 ? "text-orange-400" : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {user.current_streak}
                    </span>
                  </div>

                  {/* Plans generated */}
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {user.plans_generated}
                    </span>
                  </div>

                  {/* Joined */}
                  <span className="text-xs text-muted-foreground tabular-nums">{joined}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <p className="mt-4 text-[11px] text-muted-foreground/60 text-center">
        Showing {filtered.length} of {total} users · Admin only
      </p>
    </div>
  );
}
