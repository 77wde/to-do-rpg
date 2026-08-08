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
