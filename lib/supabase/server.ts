import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Profile } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: the middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

function userIdFromToken(accessToken: string): string | null {
  try {
    const claims = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")) as { sub?: string };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

// Fast session lookup for pages: reads the user id from the session cookie WITHOUT a network
// round trip to Supabase Auth, which keeps navigation quick.
//
// The id is not verified here, and that is safe for reading pages because every query still
// carries the same token to Postgres, where Supabase verifies it and Row Level Security applies:
// a forged cookie can only produce an empty page. Anything that uses the service-role key or
// spends money must call supabase.auth.getUser() instead (see the route handlers).
export const getAuth = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const id = session ? userIdFromToken(session.access_token) : null;
  return { supabase, user: id ? { id } : null };
});

// The signed-in user's id and profile row, or nulls. The profile comes back only when Postgres
// accepts the token, so a non-null profile also proves the session is genuine.
export const getSessionProfile = cache(async () => {
  const { supabase, user } = await getAuth();
  if (!user) return { supabase, user: null, profile: null };

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: (data as Profile | null) ?? null };
});
