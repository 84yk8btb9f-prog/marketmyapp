import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";
import { ADMIN_EMAIL } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1">
          <ShieldCheck className="size-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Admin
          </span>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          MarketMyApp
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to app
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
