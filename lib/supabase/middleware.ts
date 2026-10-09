import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Without env vars only the auth pages are reachable (they show a setup hint).
  if (!url || !anonKey) {
    if (isAuthRoute) return NextResponse.next({ request });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getSession() reads the cookie and only contacts Supabase when the token needs refreshing,
  // so it adds no network round trip to ordinary navigations. It is used here purely to decide
  // on redirects; pages and route handlers still verify the user with getUser(), and all data
  // access is protected by Row Level Security.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const signedIn = Boolean(session);

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Keep any refreshed session cookies on the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // The landing page ("/") is public; every other page requires a session.
  const isPublic = isAuthRoute || pathname === "/" || pathname.startsWith("/api");
  if (!signedIn && !isPublic) return redirectTo("/login");
  if (signedIn && isAuthRoute) return redirectTo("/");

  return response;
}
