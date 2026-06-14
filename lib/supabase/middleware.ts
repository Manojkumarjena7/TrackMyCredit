import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types";


console.log(
  "SUPABASE_URL:",
  !!process.env.NEXT_PUBLIC_SUPABASE_URL
);

console.log(
  "SUPABASE_KEY:",
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: any;
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isDashboard = url.pathname.startsWith("/dashboard");
  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/auth");

  if (!user && isDashboard) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute && !url.pathname.startsWith("/auth/callback")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}