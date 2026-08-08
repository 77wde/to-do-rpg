"use client";
// ============================================================================
// QuestLog — client store: React context over the pure game logic,
// persisted to localStorage. Also raises transient "toast" reward popups.
// ============================================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { CONSUMABLE_IDS, SHOP, STORAGE_KEY } from "./constants";
import {
  addQuest,
  applyDailyReset,
  changeHp,
  completeQuest,
  deleteQuest,
  focusFailed,
  grantGold,
  moveQuest,
  newGame,
  pushLog,
} from "./game";
import type { GameState, GtdCategory, Quest, ShopItem } from "./types";

// ---- Actions --------------------------------------------------------------

type Action =
  | { type: "hydrate"; state: GameState }
  | { type: "start"; nickname: string }
  | { type: "reset" }
  | { type: "addQuest"; quest: Quest }
  | { type: "completeQuest"; questId: string }
  | { type: "deleteQuest"; questId: string }
  | { type: "moveQuest"; questId: string; category: GtdCategory }
  | { type: "focusFail"; questTitle: string }
  | { type: "grantGold"; gold: number; why: string }
  | { type: "buy"; item: ShopItem }
  | { type: "useItem"; itemId: string }
  | { type: "equipSkin"; skinId: string }
  | { type: "equipTitle"; titleId: string | null }
  | { type: "dailyReset" };

function goldMultiplier(state: GameState): number {
  return state.player.owned.includes("comp-dragon") ? 1.1 : 1;
}

function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "start":
      return newGame(action.nickname);
    case "reset":
      return null;
  }

  if (!state) return state;

  switch (action.type) {
    case "addQuest":
      return addQuest(state, action.quest);
    case "completeQuest":
      return completeQuest(state, action.questId, goldMultiplier(state));
    case "deleteQuest":
      return deleteQuest(state, action.questId);
    case "moveQuest":
      return moveQuest(state, action.questId, action.category);
    case "focusFail":
      return focusFailed(state, action.questTitle);
    case "grantGold":
      return grantGold(state, action.gold, action.why);
    case "dailyReset":
      return applyDailyReset(state);
    case "buy": {
      const item = action.item;
      if (state.player.gold < item.price) return state;
      const already = state.player.owned.includes(item.id);
      if (already && !CONSUMABLE_IDS.has(item.id)) return state;
      const player = {
        ...state.player,
        gold: state.player.gold - item.price,
        owned: already ? state.player.owned : [...state.player.owned, item.id],
      };
      return pushLog({ ...state, player }, "buy", `상점에서 ${item.glyph} ${item.name} 구매! -${item.price} G`);
    }
    case "useItem": {
      const id = action.itemId;
      if (!state.player.owned.includes(id)) return state;
      if (id === "item-potion") {
        const player = changeHp(
          { ...state.player, owned: state.player.owned.filter((x) => x !== id) },
          30,
        );
        return pushLog({ ...state, player }, "reward", `🧪 회복 물약 사용! HP +30`);
      }
      return state;
    }
    case "equipSkin": {
      if (!state.player.owned.includes(action.skinId)) return state;
      return { ...state, player: { ...state.player, equippedSkin: action.skinId } };
    }
    case "equipTitle":
      return { ...state, player: { ...state.player, equippedTitle: action.titleId } };
    default:
      return state;
  }
}

// ---- Toast (reward popups) ------------------------------------------------

export interface Toast {
  id: string;
  glyph: string;
  text: string;
  tone: "reward" | "level" | "bad";
}

// ---- Context --------------------------------------------------------------

/** localStorage key marking whether the browser has an active (logged-in) session. */
const SESSION_KEY = "questlog:session";

interface StoreCtx {
  state: GameState | null;
  ready: boolean;
  /** true when a save exists AND the user is logged in this browser */
  loggedIn: boolean;
  toasts: Toast[];
  start: (nickname: string) => void;
  /** resume the saved adventure without wiping it */
  resume: () => void;
  /** end the session but keep the save (returns to start screen) */
  logout: () => void;
  reset: () => void;
  addQuest: (q: Quest) => void;
  completeQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  moveQuest: (id: string, category: GtdCategory) => void;
  focusFail: (questTitle: string) => void;
  grantGold: (gold: number, why: string) => void;
  buy: (item: ShopItem) => void;
  useItem: (id: string) => void;
  equipSkin: (id: string) => void;
  equipTitle: (id: string | null) => void;
  toast: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevLevel = useRef<number | null>(null);

  // hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        const withReset = applyDailyReset(parsed);
        dispatch({ type: "hydrate", state: withReset });
        prevLevel.current = withReset.player.level;
        // stay logged in only if the session flag was set
        setSession(localStorage.getItem(SESSION_KEY) === "1");
      }
    } catch {
      /* ignore corrupt state */
    }
    setReady(true);
  }, []);

  // persist on every change
  useEffect(() => {
    if (!ready) return;
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state, ready]);

  // persist the session flag
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SESSION_KEY, session ? "1" : "0");
  }, [session, ready]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 2600);
  }, []);

  // watch level for level-up toast
  useEffect(() => {
    if (!state) {
      prevLevel.current = null;
      return;
    }
    if (prevLevel.current !== null && state.player.level > prevLevel.current) {
      toast({ glyph: "✨", text: `레벨 업! Lv.${state.player.level}`, tone: "level" });
    }
    prevLevel.current = state.player.level;
  }, [state, toast]);

  const api = useMemo<StoreCtx>(
    () => ({
      state,
      ready,
      loggedIn: !!state && session,
      toasts,
      toast,
      start: (nickname) => {
        dispatch({ type: "start", nickname });
        setSession(true);
      },
      resume: () => setSession(true),
      logout: () => setSession(false),
      reset: () => {
        dispatch({ type: "reset" });
        setSession(false);
      },
      addQuest: (quest) => dispatch({ type: "addQuest", quest }),
      completeQuest: (questId) => {
        const q = state?.quests.find((x) => x.id === questId);
        dispatch({ type: "completeQuest", questId });
        if (q) toast({ glyph: "⭐", text: `+${q.xpReward} XP · +${q.goldReward} G`, tone: "reward" });
      },
      deleteQuest: (questId) => dispatch({ type: "deleteQuest", questId }),
      moveQuest: (questId, category) => dispatch({ type: "moveQuest", questId, category }),
      focusFail: (questTitle) => {
        dispatch({ type: "focusFail", questTitle });
        toast({ glyph: "💥", text: `집중 실패 · HP 감소`, tone: "bad" });
      },
      grantGold: (gold, why) => {
        dispatch({ type: "grantGold", gold, why });
        toast({ glyph: "🚩", text: `깃발 통과! +${gold} G`, tone: "reward" });
      },
      buy: (item) => {
        dispatch({ type: "buy", item });
        toast({ glyph: item.glyph, text: `${item.name} 구매!`, tone: "reward" });
      },
      useItem: (id) => dispatch({ type: "useItem", itemId: id }),
      equipSkin: (id) => dispatch({ type: "equipSkin", skinId: id }),
      equipTitle: (id) => dispatch({ type: "equipTitle", titleId: id }),
    }),
    [state, ready, session, toasts, toast],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Look up a shop item definition by id. */
export function shopItem(id: string): ShopItem | undefined {
  return SHOP.find((s) => s.id === id);
}
