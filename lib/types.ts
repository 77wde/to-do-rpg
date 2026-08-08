// ============================================================================
// QuestLog — domain types
// ============================================================================

/** GTD category. Drives map placement and category color. */
export type GtdCategory =
  | "inbox"
  | "next-action"
  | "calendar"
  | "someday-maybe"
  | "waiting-for";

export type QuestStatus = "todo" | "done";

export interface Quest {
  id: string;
  title: string;
  category: GtdCategory;
  /** Estimated focus minutes — also the pomodoro length. */
  estimateMin: number;
  xpReward: number;
  goldReward: number;
  status: QuestStatus;
  createdAt: number;
  completedAt?: number;
  /** ISO date (yyyy-mm-dd) for calendar quests. */
  dueDate?: string;
  /** Daily quest — resets each day and penalizes if missed. */
  isDaily?: boolean;
}

export type ShopItemKind = "skin" | "item" | "companion";

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  kind: ShopItemKind;
  /** Emoji glyph used to render the item / character. */
  glyph: string;
  /** Optional minimum level required to purchase. */
  reqLevel?: number;
}

export interface Collectible {
  id: string;
  name: string;
  desc: string;
  glyph: string;
  /** Level at which this unlocks. */
  unlockLevel: number;
  /** "title" collectibles can be equipped as a display title. */
  kind: "title" | "trophy";
}

export interface Player {
  nickname: string;
  level: number;
  xp: number;
  gold: number;
  hp: number;
  maxHp: number;
  /** owned shop item ids */
  owned: string[];
  /** currently equipped skin/companion id (or 'default') */
  equippedSkin: string;
  equippedTitle: string | null;
  createdAt: number;
  /** yyyy-mm-dd of last daily reset applied */
  lastDailyReset: string;
  /** total quests completed — lifetime stat */
  totalCompleted: number;
  streak: number;
}

export interface GameState {
  player: Player;
  quests: Quest[];
  /** log of recent events for the activity feed */
  log: LogEntry[];
  /** ids of surprise-event quests already fired this session-day */
  version: number;
}

export interface LogEntry {
  id: string;
  ts: number;
  kind: "complete" | "levelup" | "penalty" | "reward" | "surprise" | "buy" | "unlock" | "focusFail";
  text: string;
}

export type Tab = "map" | "story" | "shop" | "collection";
