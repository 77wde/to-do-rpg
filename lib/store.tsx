"use client";
// ============================================================================
// QuestLog — client store: React context over the pure game logic.
//
// Three pieces meet here and nothing else: the reducer (lib/gameReducer.ts),
// the save (lib/useGamePersistence.ts), and the transient reward popups.
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
import { SHOP } from "./constants";
import { reducer } from "./gameReducer";
import { newGame } from "./newGame";
import { signOut } from "./supabase/auth";
import { isSupabaseConfigured } from "./supabase/client";
import { createGame, deleteGame } from "./supabase/gameRepo";
import { useGamePersistence } from "./useGamePersistence";
import type { GameState, GtdCategory, Quest, ShopItem } from "./types";

// ---- Toast (reward popups) ------------------------------------------------

export interface Toast {
  id: string;
  glyph: string;
  text: string;
  tone: "reward" | "level" | "bad";
}

// ---- Context --------------------------------------------------------------

interface StoreCtx {
  state: GameState | null;
  ready: boolean;
  /** true when a save exists AND the user is logged in this browser */
  loggedIn: boolean;
  /**
   * Cloud mode only: signed in, but the account has no save yet. The start
   * screen uses this to ask for a nickname before creating one.
   */
  needsNickname: boolean;
  /**
   * Cloud mode only: signed in, but the save could not be fetched. Without
   * this the UI has no way to tell "still loading" from "gave up", and the
   * start screen would sit on its spinner forever.
   */
  loadFailed: boolean;
  /** Retries the failed load. */
  retryLoad: () => void;
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevLevel = useRef<number | null>(null);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 2600);
  }, []);

  const reportWriteFailure = useCallback(
    (message: string) => toast({ glyph: "⚠️", text: message, tone: "bad" }),
    [toast],
  );

  const save = useGamePersistence(state, dispatch, reportWriteFailure);
  const { userId, setBaseline, queueWrite, setNeedsNickname, setSession } = save;

  // Watch level for the level-up toast. prevLevel starts null, so hydrating a
  // high-level save never fires one.
  useEffect(() => {
    if (!state) {
      prevLevel.current = null;
      return;
    }
    if (prevLevel.current !== null && state.player.level > prevLevel.current) {
      toast({ glyph: "✨", text: `Level up! Lv.${state.player.level}`, tone: "level" });
    }
    prevLevel.current = state.player.level;
  }, [state, toast]);

  const api = useMemo<StoreCtx>(
    () => ({
      state,
      ready: save.ready,
      loggedIn: isSupabaseConfigured ? !!userId && !!state : !!state && save.session,
      needsNickname: save.needsNickname,
      loadFailed: save.loadFailed,
      retryLoad: save.retryLoad,
      toasts,
      toast,
      start: (nickname) => {
        if (!isSupabaseConfigured) {
          dispatch({ type: "start", nickname });
          setSession(true);
          return;
        }
        if (!userId) return;
        // Build the save once and reuse that exact object: dispatching "start"
        // would call newGame() again and mint different quest ids than the
        // ones written to the database.
        const fresh = newGame(nickname);
        setBaseline(fresh);
        dispatch({ type: "hydrate", state: fresh });
        setNeedsNickname(false);
        queueWrite(() => createGame(userId, fresh), "Could not create your save.");
      },
      resume: () => setSession(true),
      logout: () => {
        if (!isSupabaseConfigured) {
          setSession(false);
          return;
        }
        // onAuthStateChange clears the local state once the session is gone.
        void signOut();
      },
      reset: () => {
        dispatch({ type: "reset" });
        setBaseline(null);
        if (!isSupabaseConfigured) {
          setSession(false);
          return;
        }
        setNeedsNickname(true);
        if (userId) {
          queueWrite(() => deleteGame(userId), "Could not delete your save.");
        }
      },
      addQuest: (quest) => dispatch({ type: "addQuest", quest }),
      completeQuest: (questId) => {
        const q = state?.quests.find((x) => x.id === questId);
        dispatch({ type: "completeQuest", questId });
        if (q) {
          toast({ glyph: "⭐", text: `+${q.xpReward} XP · +${q.goldReward} G`, tone: "reward" });
        }
      },
      deleteQuest: (questId) => dispatch({ type: "deleteQuest", questId }),
      moveQuest: (questId, category) => dispatch({ type: "moveQuest", questId, category }),
      focusFail: (questTitle) => {
        dispatch({ type: "focusFail", questTitle });
        toast({ glyph: "💥", text: `Focus failed · HP down`, tone: "bad" });
      },
      grantGold: (gold, why) => {
        dispatch({ type: "grantGold", gold, why });
        toast({ glyph: "🚩", text: `Flag passed! +${gold} G`, tone: "reward" });
      },
      buy: (item) => {
        dispatch({ type: "buy", item });
        toast({ glyph: item.glyph, text: `Bought ${item.name}!`, tone: "reward" });
      },
      useItem: (id) => dispatch({ type: "useItem", itemId: id }),
      equipSkin: (id) => dispatch({ type: "equipSkin", skinId: id }),
      equipTitle: (id) => dispatch({ type: "equipTitle", titleId: id }),
    }),
    [state, save, userId, setBaseline, queueWrite, setNeedsNickname, setSession, toasts, toast],
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
