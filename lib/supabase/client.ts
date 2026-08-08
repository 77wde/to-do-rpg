// ============================================================================
// Supabase — browser client.
//
// Env vars are inlined by Next at build time, so they must be referenced as
// full literals (no destructuring, no dynamic keys).
//
// Until a project is wired up, the env vars are absent and every helper here
// reports "not configured" so the app can fall back to local-only play.
// ============================================================================
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True once both env vars are present — gates every Supabase code path. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/** Returns null when Supabase is not configured, so callers can degrade. */
export function createClient() {
  if (!url || !publishableKey) return null;
  return createBrowserClient(url, publishableKey);
}
