"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { href: "/plans", label: "My Plans", icon: <ListTodo className="size-4" /> },
  { href: "/plan/new", label: "New Plan", icon: <PlusCircle className="size-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

// ─── Sidebar link ─────────────────────────────────────────────────────────────

function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-primary/15 ring-1 ring-primary/20"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <span className={cn("relative z-10", isActive && "text-primary")}>{item.icon}</span>
      <span className="relative z-10">{item.label}</span>
      {isActive && (
        <ChevronRight className="relative z-10 ml-auto size-3.5 text-primary opacity-60" />
      )}
    </Link>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    }).catch(() => {});
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-60 shrink-0 flex flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20">
            <Zap className="size-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            MarketMyApp
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              isActive={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </nav>

        {/* Footer — user info + sign out */}
        <div className="border-t border-border px-3 py-4 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 rounded-xl bg-muted/50">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                Signed in as
              </p>
              <p className="text-xs text-foreground font-medium truncate">{userEmail}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
