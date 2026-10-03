import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/api/health", "/manifest.webmanifest"];

// Optimistic check only: refreshes the Supabase session cookie and bounces signed-out visitors to /login.
// Pages and API routes still verify the user and the email allowlist themselves (src/lib/auth.ts).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!user && !isPublic) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // `flags/`, `logos/` and `maps/` are the committed pictures in public/. They are left out for two reasons: the
  // /dev preview routes are signed out and could not show them otherwise, and an auth check per picture means a
  // Supabase round trip for every flag, logo and map on screen. Nothing about the learner is in them, so there is
  // nothing to protect.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|apple-icon|dev/|flags/|logos/|maps/).*)"],
};
