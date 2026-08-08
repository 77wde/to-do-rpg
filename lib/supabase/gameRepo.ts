"use client";
// ============================================================================
// QuestLog — Supabase persistence for the game state.
//
// lib/game.ts stays untouched: it keeps producing whole GameState values.
// This module diffs consecutive states and writes only what changed, so a
// single action that touches the player, several quests and the log lands in
// one pass without a hand-written query per action.
// ============================================================================
import { todayStr } from "../game";
import type { GameState, GtdCategory, LogEntry, Player, Quest, QuestStatus } from "../types";
import { createClient } from "./client";

/** Matches the cap that pushLog() applies in lib/game.ts. */
const LOG_LIMIT = 40;

// ---- Row shapes -----------------------------------------------------------
// Hand-written for now; `supabase gen types typescript` can replace these.

interface PlayerRow {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  gold: number;
  hp: number;
  max_hp: number;
  owned: string[] | null;
  equipped_skin: string;
  equipped_title: string | null;
  last_daily_reset: string | null;
  total_completed: number;
  streak: number;
  created_at: string;
}

interface QuestRow {
  id: string;
  user_id: string;
  title: string;
  category: GtdCategory;
  estimate_min: number;
  xp_reward: number;
  gold_reward: number;
  status: QuestStatus;
  due_date: string | null;
  is_daily: boolean;
  created_at: string;
  completed_at: string | null;
}

interface LogRow {
  id: string;
  user_id: string;
  kind: LogEntry["kind"];
  text: string;
  created_at: string;
}

// ---- Mapping --------------------------------------------------------------
// Domain types carry epoch milliseconds; Postgres carries timestamptz.

function toPlayer(row: PlayerRow): Player {
  return {
    nickname: row.nickname,
    level: row.level,
    xp: row.xp,
    gold: row.gold,
    hp: row.hp,
    maxHp: row.max_hp,
    owned: row.owned ?? [],
    equippedSkin: row.equipped_skin,
    equippedTitle: row.equipped_title,
    createdAt: Date.parse(row.created_at),
    lastDailyReset: row.last_daily_reset ?? todayStr(),
    totalCompleted: row.total_completed,
    streak: row.streak,
  };
}

/** created_at is left to the column default, so it is not written here. */
function playerRow(userId: string, p: Player) {
  return {
    id: userId,
    nickname: p.nickname,
    level: p.level,
    xp: p.xp,
    gold: p.gold,
    hp: p.hp,
    max_hp: p.maxHp,
    owned: p.owned,
    equipped_skin: p.equippedSkin,
    equipped_title: p.equippedTitle,
    last_daily_reset: p.lastDailyReset,
    total_completed: p.totalCompleted,
    streak: p.streak,
  };
}

function toQuest(row: QuestRow): Quest {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    estimateMin: row.estimate_min,
    xpReward: row.xp_reward,
    goldReward: row.gold_reward,
    status: row.status,
    createdAt: Date.parse(row.created_at),
    completedAt: row.completed_at ? Date.parse(row.completed_at) : undefined,
    dueDate: row.due_date ?? undefined,
    isDaily: row.is_daily,
  };
}

function questRow(userId: string, q: Quest) {
  return {
    id: q.id,
    user_id: userId,
    title: q.title,
    category: q.category,
    estimate_min: q.estimateMin,
    xp_reward: q.xpReward,
    gold_reward: q.goldReward,
    status: q.status,
    // quests_completed_at_matches_status requires these two to agree, so the
    // timestamp is derived from status rather than copied blindly.
    completed_at:
      q.status === "done" ? new Date(q.completedAt ?? Date.now()).toISOString() : null,
    due_date: q.dueDate ?? null,
    is_daily: q.isDaily ?? false,
    created_at: new Date(q.createdAt).toISOString(),
  };
}

function toLog(row: LogRow): LogEntry {
  return { id: row.id, ts: Date.parse(row.created_at), kind: row.kind, text: row.text };
}

function logRow(userId: string, l: LogEntry) {
  return {
    id: l.id,
    user_id: userId,
    kind: l.kind,
    text: l.text,
    created_at: new Date(l.ts).toISOString(),
  };
}

// ---- Change detection -----------------------------------------------------

function sameIdList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function samePlayer(a: Player, b: Player): boolean {
  return (
    a.nickname === b.nickname &&
    a.level === b.level &&
    a.xp === b.xp &&
    a.gold === b.gold &&
    a.hp === b.hp &&
    a.maxHp === b.maxHp &&
    a.equippedSkin === b.equippedSkin &&
    a.equippedTitle === b.equippedTitle &&
    a.lastDailyReset === b.lastDailyReset &&
    a.totalCompleted === b.totalCompleted &&
    a.streak === b.streak &&
    sameIdList(a.owned, b.owned)
  );
}

function sameQuest(a: Quest, b: Quest): boolean {
  return (
    a.title === b.title &&
    a.category === b.category &&
    a.estimateMin === b.estimateMin &&
    a.xpReward === b.xpReward &&
    a.goldReward === b.goldReward &&
    a.status === b.status &&
    a.completedAt === b.completedAt &&
    a.dueDate === b.dueDate &&
    !!a.isDaily === !!b.isDaily
  );
}

// ---- Queries --------------------------------------------------------------

/** Null means the account has no save yet — the caller should ask for a nickname. */
export async function loadGameState(userId: string): Promise<GameState | null> {
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
export async function syncState(
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
