import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from app pages
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/plan") ||
      pathname.startsWith("/plans") ||
      pathname.startsWith("/settings"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Gate plan creation behind trial/pro subscription
  if (user && pathname === "/plan/new") {
    const { data: profile } = await supabase
      .from("mma_profiles")
      .select("plan_tier")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plan_tier === "free") {
      const url = request.nextUrl.clone();
      url.pathname = "/trial";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
