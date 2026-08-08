"use client";
// ============================================================================
// QuestLog — Supabase persistence for the game state.
//
// lib/game.ts stays untouched: it keeps producing whole GameState values.
// This module diffs consecutive states and writes only what changed, so a
// single action that touches the player, several quests and the log lands in
// one pass without a hand-written query per action.
// ============================================================================
import type { GameState } from "../types";
import { createClient } from "./client";
import {
  logRow,
  playerRow,
  questRow,
  samePlayer,
  sameQuest,
  toLog,
  toPlayer,
  toQuest,
  type LogRow,
  type PlayerRow,
  type QuestRow,
} from "./rows";

/** Matches the cap that pushLog() applies in lib/game.ts. */
const LOG_LIMIT = 40;

// ---- Transient failures ---------------------------------------------------

/**
 * Right after sign-in the access token is only seconds old. If the PostgREST
 * node's clock trails the auth server's by even a moment, it reads the token's
 * `iat` as being in the future and rejects it with PGRST303 — which looks to
 * the user like "login did nothing". Waiting briefly makes the token old
 * enough to pass, so these are worth retrying rather than surfacing.
 */
function isTransient(err: unknown): boolean {
  const e = err as { code?: string; status?: number; message?: string } | null;
  if (!e) return false;
  if (e.code === "PGRST303" || e.code === "PGRST301") return true;
  if (typeof e.status === "number" && e.status >= 500) return true;
  return typeof e.message === "string" && /fetch|network/i.test(e.message);
}

async function withRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (err) {
      lastError = err;
      if (!isTransient(err) || attempt === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

// ---- Queries --------------------------------------------------------------

/** Null means the account has no save yet — the caller should ask for a nickname. */
export function loadGameState(userId: string): Promise<GameState | null> {
  return withRetry(() => loadGameStateOnce(userId));
}

async function loadGameStateOnce(userId: string): Promise<GameState | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const [playerRes, questRes, logRes] = await Promise.all([
    supabase.from("players").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("quests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LOG_LIMIT),
  ]);

  if (playerRes.error) throw playerRes.error;
  if (!playerRes.data) return null;
  if (questRes.error) throw questRes.error;
  if (logRes.error) throw logRes.error;

  return {
    player: toPlayer(playerRes.data as PlayerRow),
    quests: ((questRes.data ?? []) as QuestRow[]).map(toQuest),
    log: ((logRes.data ?? []) as LogRow[]).map(toLog),
    version: 1,
  };
}

/** Writes a brand-new save. Fails loudly if the player row already exists. */
export async function createGame(userId: string, state: GameState): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error: playerErr } = await supabase
    .from("players")
    .insert(playerRow(userId, state.player));
  if (playerErr) throw playerErr;

  if (state.quests.length > 0) {
    const { error } = await supabase
      .from("quests")
      .insert(state.quests.map((q) => questRow(userId, q)));
    if (error) throw error;
  }

  if (state.log.length > 0) {
    const { error } = await supabase
      .from("activity_log")
      .insert(state.log.map((l) => logRow(userId, l)));
    if (error) throw error;
  }
}

/**
 * Persists whatever differs between two consecutive states.
 *
 * Log entries are only ever inserted: lib/game.ts trims its in-memory list to
 * the newest 40, and dropping older rows server-side would throw away history
 * for no gain.
 */
export function syncState(userId: string, prev: GameState, next: GameState): Promise<void> {
  // Retried like the load: a write is just as exposed to the post-sign-in clock
  // skew, and losing an edit to it is worse than waiting half a second.
  return withRetry(() => syncStateOnce(userId, prev, next));
}

async function syncStateOnce(
  userId: string,
  prev: GameState,
  next: GameState,
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const ops: PromiseLike<{ error: unknown }>[] = [];

  if (!samePlayer(prev.player, next.player)) {
    ops.push(
      supabase.from("players").update(playerRow(userId, next.player)).eq("id", userId),
    );
  }

  const before = new Map(prev.quests.map((q) => [q.id, q]));
  const touched = next.quests.filter((q) => {
    const old = before.get(q.id);
    return !old || !sameQuest(old, q);
  });
  if (touched.length > 0) {
    ops.push(supabase.from("quests").upsert(touched.map((q) => questRow(userId, q))));
  }

  const stillPresent = new Set(next.quests.map((q) => q.id));
  const removed = prev.quests.filter((q) => !stillPresent.has(q.id)).map((q) => q.id);
  if (removed.length > 0) {
    ops.push(supabase.from("quests").delete().in("id", removed));
  }

  const knownLogs = new Set(prev.log.map((l) => l.id));
  const freshLogs = next.log.filter((l) => !knownLogs.has(l.id));
  if (freshLogs.length > 0) {
    ops.push(
      supabase.from("activity_log").insert(freshLogs.map((l) => logRow(userId, l))),
    );
  }

  if (ops.length === 0) return;

  const results = await Promise.all(ops);
  const failure = results.find((r) => r.error);
  if (failure?.error) throw failure.error;
}

/** Wipes the account's save. Used by "start over". */
export async function deleteGame(userId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  // quests and activity_log hang off auth.users, not players, so removing the
  // player row would leave them behind. Delete all three explicitly.
  const results = await Promise.all([
    supabase.from("activity_log").delete().eq("user_id", userId),
    supabase.from("quests").delete().eq("user_id", userId),
  ]);
  const childFailure = results.find((r) => r.error);
  if (childFailure?.error) throw childFailure.error;

  const { error } = await supabase.from("players").delete().eq("id", userId);
  if (error) throw error;
}
