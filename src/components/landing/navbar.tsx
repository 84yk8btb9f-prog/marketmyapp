"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "How it Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base tracking-tight">MarketMyApp</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          )}
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
          >
            Sign in
          </Link>
          <Button
            size="sm"
            className="rounded-lg font-medium"
            render={<Link href="/assess">Get Your Score</Link>}
          />
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-6 pb-5 pt-2 flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex items-center justify-between border-t border-border mt-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button
              size="sm"
              className="rounded-lg font-medium ml-auto"
              render={<Link href="/assess">Get Your Score</Link>}
            />
          </div>
        </div>
      )}
    </header>
  );
}
