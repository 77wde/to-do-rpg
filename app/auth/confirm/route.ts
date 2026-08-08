// ============================================================================
// Email confirmation — turns the token from the signup mail into a session.
// ============================================================================
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Only same-origin absolute paths are allowed through. A bare startsWith("/")
 * check would still let "//evil.com" past, which the browser reads as a
 * protocol-relative URL — an open redirect.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/play";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/play";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
