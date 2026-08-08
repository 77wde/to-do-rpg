// ============================================================================
// Supabase — server client (Server Components, Route Handlers, Server Actions).
//
// cookies() is async in Next 15, so this factory is async too.
// ============================================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

/** Returns null when Supabase is not configured, so callers can degrade. */
export async function createClient() {
  if (!url || !publishableKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — the middleware refreshes the
          // session instead, so this is safe to swallow.
        }
      },
    },
  });
}
