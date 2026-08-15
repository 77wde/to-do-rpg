import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need a
     * session refresh and would only add latency.
     *
     * /auth/confirm is excluded too, and not for latency: it *establishes* a
     * session rather than refreshing one. Running updateSession first makes
     * auth-js read the stored session, and a stale or rejected one is torn
     * down — which also clears the PKCE verifier cookie the route is about to
     * redeem. The people clicking a reset link are exactly the ones whose
     * session already went bad, so that path would fail for them. The route
     * writes its own cookies.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|woff2?)$).*)",
  ],
};
