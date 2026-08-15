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
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  if (supabase) {
    // Two shapes arrive here. @supabase/ssr signs requests with PKCE, so a
    // link produced by signUp() or resetPasswordForEmail() comes back as
    // `?code=` and is exchanged against the verifier cookie the browser
    // stored. A mail template still using the default {{ .ConfirmationURL }}
    // instead delivers `token_hash` + `type`. Handling only one of them breaks
    // half the links.
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
