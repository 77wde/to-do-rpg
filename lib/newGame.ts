// ============================================================================
// TO DO BUG RPG — the starting save.
//
// Kept apart from the rules in lib/game.ts: this is content (what a new player
// begins with), and it changes for product reasons rather than logic ones.
// ============================================================================
import { START_HP, maxHpForLevel } from "./constants";
import { todayStr } from "./dates";
import { mkLog } from "./game";
import { uid } from "./ids";
import type { GameState, Player, Quest } from "./types";

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
    log: [
      mkLog("reward", `${nickname}, your adventure begins! Try completing your first quest.`),
    ],
    version: 1,
  };
}

/** One quest per starting category so the map is not empty on day one. */
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
