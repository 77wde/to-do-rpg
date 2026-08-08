// ============================================================================
// Supabase — session refresh for middleware.
//
// Runs on every matched request and rotates the auth cookies. Without it,
// server-side reads see stale tokens once the access token expires.
// ============================================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  // Not configured yet — pass the request through untouched.
  if (!url || !publishableKey) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims() verifies the JWT signature against the published keys.
  // Do not swap this for getSession() — that one is not revalidated and is
  // unsafe for anything server-side.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
