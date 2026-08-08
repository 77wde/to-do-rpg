// ============================================================================
// QuestLog — game constants & catalogs
// ============================================================================
import type { Collectible, GtdCategory, ShopItem } from "./types";

export const STORAGE_KEY = "questlog:v1";

/** XP required to advance FROM the given level to the next. */
export function xpToNext(level: number): number {
  return 60 + (level - 1) * 40; // L1:60, L2:100, L3:140, ...
}

/** Max HP scales gently with level. */
export function maxHpForLevel(level: number): number {
  return 100 + (level - 1) * 10;
}

export const START_HP = 100;
export const PENALTY_HP = 12; // hp lost when a daily quest is missed / focus fails
export const PENALTY_XP = 15; // xp lost on missed daily
export const FOCUS_FAIL_HP = 10; // hp lost when the spikes catch you mid-session

/** Flag checkpoints (in minutes) inside the idle runner. */
export const FLAG_MINUTES = [10, 20, 25];
/** Micro gold reward earned when passing each flag. */
export const FLAG_GOLD = 5;

// ---- GTD metadata ---------------------------------------------------------

export interface GtdMeta {
  key: GtdCategory;
  label: string;
  short: string;
  color: string; // css var
  /** Emoji that stands for this category everywhere it appears in the UI. */
  glyph: string;
  desc: string;
  /** grid cell on the 5-region map */
  cell: { x: number; y: number };
  /** whether items here are considered "active/urgent" region on the map */
  urgentByDefault: boolean;
}

export const GTD: Record<GtdCategory, GtdMeta> = {
  inbox: {
    key: "inbox",
    label: "Inbox",
    short: "IN",
    color: "var(--tl-thinking)",
    glyph: "📥",
    desc: "Uncategorized new tasks",
    cell: { x: 0, y: 0 },
    urgentByDefault: false,
  },
  "next-action": {
    key: "next-action",
    label: "Next Action",
    short: "NEXT",
    color: "var(--tl-grep)",
    glyph: "⚔️",
    desc: "Things you can do right now",
    cell: { x: 1, y: 0 },
    urgentByDefault: true,
  },
  calendar: {
    key: "calendar",
    label: "Calendar",
    short: "CAL",
    color: "var(--tl-read)",
    glyph: "🏰",
    desc: "Tasks tied to a specific date",
    cell: { x: 2, y: 0 },
    urgentByDefault: true,
  },
  "someday-maybe": {
    key: "someday-maybe",
    label: "Someday",
    short: "SDM",
    color: "var(--tl-edit)",
    glyph: "🌫️",
    desc: "Things you might do later",
    cell: { x: 0, y: 1 },
    urgentByDefault: false,
  },
  "waiting-for": {
    key: "waiting-for",
    label: "Waiting",
    short: "WAIT",
    color: "var(--tl-done)",
    glyph: "⏳",
    desc: "Waiting on someone else",
    cell: { x: 1, y: 1 },
    urgentByDefault: false,
  },
};

export const GTD_ORDER: GtdCategory[] = [
  "inbox",
  "next-action",
  "calendar",
  "someday-maybe",
  "waiting-for",
];

// ---- Shop -----------------------------------------------------------------

export const SHOP: ShopItem[] = [
  { id: "skin-knight", name: "Knight", desc: "A well-rounded hero", price: 0, kind: "skin", glyph: "🧑‍🚀" },
  { id: "skin-mage", name: "Mage", desc: "Cloaked in robes of wisdom", price: 120, kind: "skin", glyph: "🧙" },
  { id: "skin-ninja", name: "Ninja", desc: "Fast as a shadow", price: 200, kind: "skin", glyph: "🥷" },
  { id: "skin-hero", name: "Superhero", desc: "No time to procrastinate", price: 320, kind: "skin", glyph: "🦸" },
  { id: "skin-vampire", name: "Vampire", desc: "Focus that grows at night", price: 300, kind: "skin", glyph: "🧛", reqLevel: 4 },
  { id: "item-potion", name: "Health Potion", desc: "Instantly restore HP +30", price: 40, kind: "item", glyph: "🧪" },
  { id: "item-shield", name: "Focus Shield", desc: "Blocks the next failure penalty once", price: 80, kind: "item", glyph: "🛡️" },
  { id: "comp-cat", name: "Cat Companion", desc: "A friend cheering you on", price: 150, kind: "companion", glyph: "🐈" },
  { id: "comp-dragon", name: "Baby Dragon", desc: "Gold gain +10%", price: 400, kind: "companion", glyph: "🐉", reqLevel: 5 },
];

/** Items that are consumables (used up, can be repurchased). */
export const CONSUMABLE_IDS = new Set(["item-potion", "item-shield"]);

// ---- Collection (level-locked) --------------------------------------------

export const COLLECTIBLES: Collectible[] = [
  { id: "title-starter", name: "First Steps", desc: "One who began the journey", glyph: "🌱", unlockLevel: 1, kind: "title" },
  { id: "title-focused", name: "Focus Master", desc: "One who conquered distraction", glyph: "🎯", unlockLevel: 3, kind: "title" },
  { id: "trophy-crown", name: "Golden Crown", desc: "A legendary crown no shop can sell", glyph: "👑", unlockLevel: 5, kind: "trophy" },
  { id: "title-unstoppable", name: "Unstoppable", desc: "One who conquered avoidance", glyph: "⚡", unlockLevel: 7, kind: "title" },
  { id: "trophy-phoenix", name: "Phoenix Feather", desc: "A token of rising again and again", glyph: "🪶", unlockLevel: 10, kind: "trophy" },
];

// ---- Reward suggestion helper --------------------------------------------

/** Suggested XP/Gold given an estimate in minutes. */
export function suggestReward(estimateMin: number) {
  const xp = Math.max(10, Math.round(estimateMin * 1.6));
  const gold = Math.max(5, Math.round(estimateMin * 0.9));
  return { xp, gold };
}
