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
export const FOCUS_FAIL_HP = 10; // hp lost when giving up a focus session

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
  desc: string;
  /** grid cell on the 5-region map */
  cell: { x: number; y: number };
  /** whether items here are considered "active/urgent" region on the map */
  urgentByDefault: boolean;
}

export const GTD: Record<GtdCategory, GtdMeta> = {
  inbox: {
    key: "inbox",
    label: "인박스",
    short: "IN",
    color: "var(--tl-thinking)",
    desc: "아직 분류 안 된 새 할 일",
    cell: { x: 0, y: 0 },
    urgentByDefault: false,
  },
  "next-action": {
    key: "next-action",
    label: "다음 행동",
    short: "NEXT",
    color: "var(--tl-grep)",
    desc: "지금 당장 할 수 있는 일",
    cell: { x: 1, y: 0 },
    urgentByDefault: true,
  },
  calendar: {
    key: "calendar",
    label: "캘린더",
    short: "CAL",
    color: "var(--tl-read)",
    desc: "특정 날짜에 해야 하는 일",
    cell: { x: 2, y: 0 },
    urgentByDefault: true,
  },
  "someday-maybe": {
    key: "someday-maybe",
    label: "언젠가",
    short: "SDM",
    color: "var(--tl-edit)",
    desc: "나중에 할지도 모르는 일",
    cell: { x: 0, y: 1 },
    urgentByDefault: false,
  },
  "waiting-for": {
    key: "waiting-for",
    label: "대기 중",
    short: "WAIT",
    color: "var(--tl-done)",
    desc: "남을 기다려야 하는 일",
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
  { id: "skin-knight", name: "기사", desc: "기본기가 탄탄한 용사", price: 0, kind: "skin", glyph: "🧑‍🚀" },
  { id: "skin-mage", name: "마법사", desc: "지혜의 로브를 걸친 자", price: 120, kind: "skin", glyph: "🧙" },
  { id: "skin-ninja", name: "닌자", desc: "그림자처럼 빠르게", price: 200, kind: "skin", glyph: "🥷" },
  { id: "skin-hero", name: "슈퍼히어로", desc: "미룰 시간이 없다", price: 320, kind: "skin", glyph: "🦸" },
  { id: "skin-vampire", name: "뱀파이어", desc: "밤에 강해지는 집중가", price: 300, kind: "skin", glyph: "🧛", reqLevel: 4 },
  { id: "item-potion", name: "회복 물약", desc: "즉시 HP +30", price: 40, kind: "item", glyph: "🧪" },
  { id: "item-shield", name: "집중 방패", desc: "다음 실패 패널티 1회 방어", price: 80, kind: "item", glyph: "🛡️" },
  { id: "comp-cat", name: "고양이 동료", desc: "옆에서 응원해주는 친구", price: 150, kind: "companion", glyph: "🐈" },
  { id: "comp-dragon", name: "새끼 드래곤", desc: "골드 획득 +10%", price: 400, kind: "companion", glyph: "🐉", reqLevel: 5 },
];

/** Items that are consumables (used up, can be repurchased). */
export const CONSUMABLE_IDS = new Set(["item-potion", "item-shield"]);

// ---- Collection (level-locked) --------------------------------------------

export const COLLECTIBLES: Collectible[] = [
  { id: "title-starter", name: "첫 발걸음", desc: "여정을 시작한 자", glyph: "🌱", unlockLevel: 1, kind: "title" },
  { id: "title-focused", name: "집중의 대가", desc: "산만함을 이겨낸 자", glyph: "🎯", unlockLevel: 3, kind: "title" },
  { id: "trophy-crown", name: "황금 왕관", desc: "상점에서 살 수 없는 전설의 왕관", glyph: "👑", unlockLevel: 5, kind: "trophy" },
  { id: "title-unstoppable", name: "멈출 수 없는", desc: "회피를 정복한 자", glyph: "⚡", unlockLevel: 7, kind: "title" },
  { id: "trophy-phoenix", name: "불사조의 깃털", desc: "몇 번이고 다시 일어선 증표", glyph: "🪶", unlockLevel: 10, kind: "trophy" },
];

// ---- Reward suggestion helper --------------------------------------------

/** Suggested XP/Gold given an estimate in minutes. */
export function suggestReward(estimateMin: number) {
  const xp = Math.max(10, Math.round(estimateMin * 1.6));
  const gold = Math.max(5, Math.round(estimateMin * 0.9));
  return { xp, gold };
}
