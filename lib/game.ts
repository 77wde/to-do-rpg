// ============================================================================
// QuestLog — pure game logic (no React, easy to reason about/test)
// ============================================================================
import {
  COLLECTIBLES,
  FOCUS_FAIL_HP,
  PENALTY_HP,
  PENALTY_XP,
  START_HP,
  maxHpForLevel,
  xpToNext,
} from "./constants";
import type { GameState, LogEntry, Player, Quest } from "./types";

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newPlayer(nickname: string): Player {
  return {
    nickname,
    level: 1,
    xp: 0,
    gold: 30,
    hp: START_HP,
    maxHp: maxHpForLevel(1),
    owned: ["skin-knight"],
    equippedSkin: "skin-knight",
    equippedTitle: "title-starter",
    createdAt: Date.now(),
    lastDailyReset: todayStr(),
    totalCompleted: 0,
    streak: 0,
  };
}

export function newGame(nickname: string): GameState {
  return {
    player: newPlayer(nickname),
    quests: seedQuests(),
    log: [mkLog("reward", `${nickname}, your adventure begins! Try completing your first quest.`)],
    version: 1,
  };
}

function seedQuests(): Quest[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "Read 30 pages of a book",
      category: "next-action",
      estimateMin: 25,
      xpReward: 40,
      goldReward: 22,
      status: "todo",
      createdAt: now,
    },
    {
      id: uid(),
      title: "Drink water and stretch",
      category: "next-action",
      estimateMin: 10,
      xpReward: 16,
      goldReward: 9,
      status: "todo",
      createdAt: now,
      isDaily: true,
    },
    {
      id: uid(),
      title: "Plan this week's trip",
      category: "someday-maybe",
      estimateMin: 20,
      xpReward: 32,
      goldReward: 18,
      status: "todo",
      createdAt: now,
    },
    {
      id: uid(),
      title: "Wait for a reply from a friend",
      category: "waiting-for",
      estimateMin: 5,
      xpReward: 10,
      goldReward: 5,
      status: "todo",
      createdAt: now,
    },
  ];
}

export function mkLog(kind: LogEntry["kind"], text: string): LogEntry {
  return { id: uid(), ts: Date.now(), kind, text };
}

export function pushLog(state: GameState, kind: LogEntry["kind"], text: string): GameState {
  const log = [mkLog(kind, text), ...state.log].slice(0, 40);
  return { ...state, log };
}

/** Apply XP; cascade level-ups. Returns new player + list of level-up events. */
export function applyXp(player: Player, deltaXp: number): { player: Player; levelsGained: number } {
  let { level, xp } = player;
  let maxHp = player.maxHp;
  let hp = player.hp;
  xp += deltaXp;
  let levelsGained = 0;

  if (deltaXp >= 0) {
    while (xp >= xpToNext(level)) {
      xp -= xpToNext(level);
      level += 1;
      levelsGained += 1;
      const newMax = maxHpForLevel(level);
      hp += newMax - maxHp; // heal the delta on level up
      maxHp = newMax;
    }
  } else {
    // negative xp cannot drop below 0 or de-level
    if (xp < 0) xp = 0;
  }

  return { player: { ...player, level, xp, maxHp, hp: Math.min(hp, maxHp) }, levelsGained };
}

/** Collectibles unlocked at or below the player's level. */
export function unlockedCollectibles(level: number) {
  return COLLECTIBLES.filter((c) => c.unlockLevel <= level);
}

/** Newly-unlocked collectibles between oldLevel (exclusive) and newLevel (inclusive). */
export function newlyUnlocked(oldLevel: number, newLevel: number) {
  return COLLECTIBLES.filter((c) => c.unlockLevel > oldLevel && c.unlockLevel <= newLevel);
}

/** Complete a quest → grant rewards, level up, log, unlock collectibles. */
export function completeQuest(state: GameState, questId: string, goldMultiplier = 1): GameState {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.status === "done") return state;

  const oldLevel = state.player.level;
  const gold = Math.round(quest.goldReward * goldMultiplier);
  const { player: leveled, levelsGained } = applyXp(state.player, quest.xpReward);
  const player: Player = {
    ...leveled,
    gold: leveled.gold + gold,
    totalCompleted: leveled.totalCompleted + 1,
  };

  const quests = state.quests.map((q) =>
    q.id === questId ? { ...q, status: "done" as const, completedAt: Date.now() } : q,
  );

  let next: GameState = { ...state, player, quests };
  next = pushLog(next, "complete", `'${quest.title}' complete! +${quest.xpReward} XP · +${gold} G`);

  if (levelsGained > 0) {
    next = pushLog(next, "levelup", `Level up! You are now Lv.${player.level}. Max HP increased.`);
    for (const c of newlyUnlocked(oldLevel, player.level)) {
      next = pushLog(next, "unlock", `Collectible unlocked: ${c.glyph} ${c.name}`);
    }
  }

  // Surprise event: finishing a next-action may pull an inbox / someday task in
  next = maybeSurprise(next, quest);

  return next;
}

/**
 * Surprise event: finishing a next-action may promote one inbox / someday-maybe
 * quest into next-action automatically.
 */
export function maybeSurprise(state: GameState, justFinished: Quest): GameState {
  if (justFinished.category !== "next-action") return state;
  const pool = state.quests.filter(
    (q) => q.status === "todo" && (q.category === "inbox" || q.category === "someday-maybe"),
  );
  if (pool.length === 0) return state;
  // ~55% chance to fire
  if (Math.random() > 0.55) return state;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const quests = state.quests.map((q) =>
    q.id === pick.id ? { ...q, category: "next-action" as const } : q,
  );
  let next: GameState = { ...state, quests };
  next = pushLog(
    next,
    "surprise",
    `⚡ Surprise event! '${pick.title}' was summoned into Next Action.`,
  );
  return next;
}

export function addQuest(state: GameState, quest: Quest): GameState {
  const next = { ...state, quests: [quest, ...state.quests] };
  return pushLog(next, "reward", `New quest added: '${quest.title}'`);
}

export function deleteQuest(state: GameState, questId: string): GameState {
  return { ...state, quests: state.quests.filter((q) => q.id !== questId) };
}

export function moveQuest(state: GameState, questId: string, category: Quest["category"]): GameState {
  const quests = state.quests.map((q) => (q.id === questId ? { ...q, category } : q));
  return { ...state, quests };
}

/** Change HP within [0, maxHp]. */
export function changeHp(player: Player, delta: number): Player {
  return { ...player, hp: Math.max(0, Math.min(player.maxHp, player.hp + delta)) };
}

/** Focus session failed (gave up / spikes caught the hero). */
export function focusFailed(state: GameState, questTitle: string): GameState {
  // Shield item absorbs one failure
  if (state.player.owned.includes("item-shield")) {
    const player = { ...state.player, owned: state.player.owned.filter((id) => id !== "item-shield") };
    return pushLog({ ...state, player }, "focusFail", `🛡️ Focus Shield blocked the failure penalty for '${questTitle}'!`);
  }
  const player = changeHp(state.player, -FOCUS_FAIL_HP);
  let next = { ...state, player };
  next = pushLog(next, "focusFail", `😵 Hit the spikes! Focus on '${questTitle}' failed · HP -${FOCUS_FAIL_HP}`);
  return next;
}

/** Grant flag micro-reward while running. */
export function grantGold(state: GameState, gold: number, why: string): GameState {
  const player = { ...state.player, gold: state.player.gold + gold };
  return pushLog({ ...state, player }, "reward", why);
}

/**
 * Daily reset: called on load if the date changed. Any incomplete daily quest
 * from a previous day inflicts a penalty and is reset to todo for the new day.
 */
export function applyDailyReset(state: GameState): GameState {
  const today = todayStr();
  if (state.player.lastDailyReset === today) return state;

  let next = state;
  const missed = state.quests.filter((q) => q.isDaily && q.status === "todo");
  let totalHp = 0;
  let totalXp = 0;
  const shieldAvailable = state.player.owned.includes("item-shield");

  if (missed.length > 0 && !shieldAvailable) {
    totalHp = PENALTY_HP;
    totalXp = PENALTY_XP;
  }

  // reset completed dailies back to todo for the new day
  const quests = state.quests.map((q) =>
    q.isDaily ? { ...q, status: "todo" as const, completedAt: undefined } : q,
  );

  let player = { ...state.player, lastDailyReset: today };
  // streak: increment if no daily missed, else reset
  player.streak = missed.length === 0 ? player.streak + 1 : 0;

  if (totalHp > 0) {
    const { player: afterXp } = applyXp(player, -totalXp);
    player = changeHp(afterXp, -totalHp);
  } else if (missed.length > 0 && shieldAvailable) {
    player = { ...player, owned: player.owned.filter((id) => id !== "item-shield") };
  }

  next = { ...next, player, quests };

  if (missed.length > 0) {
    if (shieldAvailable) {
      next = pushLog(next, "focusFail", `🛡️ The shield blocked the missed-daily penalty.`);
    } else {
      next = pushLog(
        next,
        "penalty",
        `🌙 ${missed.length} daily quest(s) missed yesterday! HP -${totalHp} · XP -${totalXp}`,
      );
    }
  } else {
    next = pushLog(next, "reward", `☀️ A new day! ${player.streak}-day streak. Dailies have reset.`);
  }

  return next;
}
