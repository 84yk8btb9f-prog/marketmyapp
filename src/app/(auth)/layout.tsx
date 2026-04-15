import { Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="size-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              MarketMyApp
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
