"use client";
// ============================================================================
// Supabase — email/password auth helpers for the browser.
//
// Every helper is a no-op (or a clear error) when Supabase is not configured,
// so the app keeps working in local-only mode until a project is wired up.
// ============================================================================
import { createClient } from "./client";

/** Supabase rejects anything shorter; check here so the user hears it sooner. */
export const MIN_PASSWORD_LENGTH = 6;

export interface AuthResult {
  /** Human-readable failure, or null on success. */
  error: string | null;
  /**
   * True when the account was created but still needs the emailed link.
   * Sign-in never sets this.
   */
  needsEmailConfirmation?: boolean;
}

const NOT_CONFIGURED = "Supabase is not configured yet.";

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm?next=/play`,
    },
  });
  if (error) return { error: error.message };

  // When the address is already taken, Supabase returns a user with an empty
  // identities array rather than an error — deliberately, so the response
  // cannot be used to probe which emails are registered. Treating it the same
  // as a fresh sign-up keeps that property intact.
  const session = data.session;
  if (!session) return { error: null, needsEmailConfirmation: true };

  // Confirmation is switched off on the project — the user is already in.
  return { error: null, needsEmailConfirmation: false };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Hands off to GitHub. On success Supabase sends the browser back to the same
 * confirm route the email links use, with a `?code=` to exchange — and unlike
 * a mailed link, an OAuth round trip always ends in the browser that started
 * it, so the PKCE verifier is guaranteed to be there.
 *
 * Returns only on failure: the success path is a full-page redirect.
 */
export async function signInWithGitHub(): Promise<AuthResult> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/confirm?next=/play`,
    },
  });
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Sends the "reset your password" mail. The link lands on the same confirm
 * route as sign-up — it exchanges the token for a session — and then continues
 * to the page that takes the new password.
 *
 * The result never says whether the address exists: answering that would turn
 * this form into a way to enumerate registered users.
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/auth/new-password`,
  });
  if (!error) return { error: null };

  // A per-address verdict is exactly what an enumeration attempt is fishing
  // for, so 401/403/404 are swallowed and the screen looks the same whether or
  // not the account exists. Everything else — a bad address, the hourly mail
  // cap, the service being down — says nothing about this address and is
  // worth telling the user about.
  const status = error.status ?? 0;
  const identifiesTheUser = status === 401 || status === 403 || status === 404;
  return { error: identifiesTheUser ? null : error.message };
}

/** Sets a new password for the session the recovery link established. */
export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut() {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Resolves to the signed-in user's id, or null. */
export async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type SessionCheck =
  | { status: "signed-in"; userId: string }
  | { status: "signed-out" }
  /** The auth server could not be reached — this is not "no session". */
  | { status: "unknown" };

/**
 * Like getUserId, but keeps "nobody is signed in" apart from "we could not
 * ask". A screen that treats a dropped connection as a missing session tells
 * the user their link expired when it did not.
 */
export async function checkSession(): Promise<SessionCheck> {
  const supabase = createClient();
  if (!supabase) return { status: "signed-out" };

  const { data, error } = await supabase.auth.getUser();
  if (data.user) return { status: "signed-in", userId: data.user.id };
  // A missing session is reported as an error too, so the status separates
  // them: 4xx means the answer is "no session", anything else means we failed
  // to get an answer at all.
  const status = error?.status ?? 0;
  if (error && (status === 0 || status >= 500)) return { status: "unknown" };
  return { status: "signed-out" };
}
