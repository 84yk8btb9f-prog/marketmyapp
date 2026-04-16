import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("plans")
    .select("app_name, health_score")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Marketing Plan | MarketMyApp" };
  }

  const score = (data.health_score as number) ?? 0;
  const appName = data.app_name as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketmyapp.vercel.app";
  const ogUrl = `${baseUrl}/api/og?score=${score}&app=${encodeURIComponent(appName)}`;

  return {
    title: `${appName} Marketing Plan | MarketMyApp`,
    openGraph: {
      title: `${appName} — Marketing Health Score: ${score}/100`,
      description: "See what's broken in your marketing before your launch does.",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${appName} — Marketing Health Score: ${score}/100`,
      images: [ogUrl],
    },
  };
}

export default function PlanLayout({ children }: Props) {
  return <>{children}</>;
}
