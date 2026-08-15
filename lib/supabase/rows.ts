// ============================================================================
// TO DO BUG RPG — the Postgres ↔ domain boundary.
//
// Row shapes, the mapping in both directions, and the equality checks the sync
// pass uses to decide what actually changed. Hand-written for now;
// `supabase gen types typescript` can replace the interfaces.
// ============================================================================
import { todayStr } from "../dates";
import type { GtdCategory, LogEntry, Player, Quest, QuestStatus } from "../types";

// ---- Row shapes -----------------------------------------------------------

export interface PlayerRow {
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

export interface QuestRow {
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

export interface LogRow {
  id: string;
  user_id: string;
  kind: LogEntry["kind"];
  text: string;
  created_at: string;
}

// ---- Mapping --------------------------------------------------------------
// Domain types carry epoch milliseconds; Postgres carries timestamptz.

export function toPlayer(row: PlayerRow): Player {
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
export function playerRow(userId: string, p: Player) {
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

export function toQuest(row: QuestRow): Quest {
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

export function questRow(userId: string, q: Quest) {
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

export function toLog(row: LogRow): LogEntry {
  return { id: row.id, ts: Date.parse(row.created_at), kind: row.kind, text: row.text };
}

export function logRow(userId: string, l: LogEntry) {
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

export function samePlayer(a: Player, b: Player): boolean {
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

export function sameQuest(a: Quest, b: Quest): boolean {
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
