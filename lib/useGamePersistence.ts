"use client";
// ============================================================================
// QuestLog — where the save lives.
//
// Two modes behind one surface: without Supabase keys the save is a
// localStorage blob, with them it is rows owned by the signed-in user. The
// store only ever sees the result — a `ready` flag, who is signed in, and a
// writer it can hand work to.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEY } from "./constants";
import { applyDailyReset } from "./game";
import type { Action } from "./gameReducer";
import { createClient, isSupabaseConfigured } from "./supabase/client";
import { loadGameState, syncState } from "./supabase/gameRepo";
import type { GameState } from "./types";

/** localStorage key marking whether the browser has an active (logged-in) session. */
const SESSION_KEY = "questlog:session";

export interface Persistence {
  /** False until the save has been read (or found missing). */
  ready: boolean;
  /** Local mode only — cloud mode derives sign-in from the auth session. */
  session: boolean;
  setSession: (v: boolean) => void;
  userId: string | null;
  /** Cloud mode only: signed in, but the account has no save yet. */
  needsNickname: boolean;
  setNeedsNickname: (v: boolean) => void;
  /** Cloud mode only: signed in, but the save could not be fetched. */
  loadFailed: boolean;
  retryLoad: () => void;
  /**
   * Declares what the database now holds, so the next diff is measured from
   * there. Called when a save is created or wiped, never for ordinary edits —
   * those are picked up automatically.
   */
  setBaseline: (s: GameState | null) => void;
  /** Runs a write after every write queued before it, reporting failures once. */
  queueWrite: (run: () => Promise<void>, failure: string) => void;
}

export function useGamePersistence(
  state: GameState | null,
  dispatch: React.Dispatch<Action>,
  onWriteFailed: (message: string) => void,
): Persistence {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  /** Bumping this re-runs the load effect. */
  const [loadAttempt, setLoadAttempt] = useState(0);
  /** Last state known to be in the database — the baseline for the next diff. */
  const synced = useRef<GameState | null>(null);
  /** Who the last auth event reported, so an account switch can be spotted. */
  const signedInAs = useRef<string | null>(null);
  /** Serializes writes so a burst of actions cannot land out of order. */
  const writes = useRef<Promise<void>>(Promise.resolve());

  const queueWrite = useCallback(
    (run: () => Promise<void>, failure: string) => {
      writes.current = writes.current.then(run).catch((err) => {
        console.error(`[questlog] ${failure}`, err);
        onWriteFailed(failure);
      });
    },
    [onWriteFailed],
  );

  const setBaseline = useCallback((s: GameState | null) => {
    synced.current = s;
  }, []);

  // ---- Local mode: hydrate from localStorage once -------------------------
  useEffect(() => {
    if (isSupabaseConfigured) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: "hydrate", state: applyDailyReset(JSON.parse(raw) as GameState) });
        // stay logged in only if the session flag was set
        setSession(localStorage.getItem(SESSION_KEY) === "1");
      }
    } catch {
      /* ignore corrupt state */
    }
    setReady(true);
  }, [dispatch]);

  // ---- Cloud mode: follow the auth session --------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUserId(data.user?.id ?? null);
      // Signed out: nothing to load, so the app is ready right away.
      if (!data.user) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const id = authSession?.user?.id ?? null;
      setUserId(id);
      // Sign-out, but also a switch straight from one account to another (the
      // auth cookie can be rewritten by another tab). Either way the save in
      // memory belongs to the previous user: keeping it would show their data
      // until the new one loads, and the sync effect would write it to the new
      // user's rows in the meantime.
      if (id !== signedInAs.current) {
        if (signedInAs.current !== null || !id) {
          dispatch({ type: "reset" });
          synced.current = null;
          setNeedsNickname(false);
          setReady(true);
        }
        signedInAs.current = id;
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  // ---- Cloud mode: load the save for the signed-in user -------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;
    let alive = true;
    setReady(false);
    setLoadFailed(false);

    loadGameState(userId)
      .then((loaded) => {
        if (!alive) return;
        if (!loaded) {
          // Signed in with no save — the start screen asks for a nickname.
          setNeedsNickname(true);
          setReady(true);
          return;
        }
        // Baseline is what the database actually holds, so any delta the daily
        // reset produced gets written back by the sync effect below.
        synced.current = loaded;
        dispatch({ type: "hydrate", state: applyDailyReset(loaded) });
        setNeedsNickname(false);
        setReady(true);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("[questlog] could not load your save", err);
        setLoadFailed(true);
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [userId, loadAttempt, dispatch]);

  // ---- Local mode: persist on every change --------------------------------
  useEffect(() => {
    if (isSupabaseConfigured || !ready) return;
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state, ready]);

  // ---- Local mode: persist the session flag -------------------------------
  useEffect(() => {
    if (isSupabaseConfigured || !ready) return;
    localStorage.setItem(SESSION_KEY, session ? "1" : "0");
  }, [session, ready]);

  // ---- Cloud mode: push whatever changed ----------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !ready || !userId || !state) return;
    // No baseline yet means the save is still being created by start().
    if (!synced.current || synced.current === state) return;
    const target = state;
    queueWrite(async () => {
      // Read the baseline here rather than when the effect ran: writes are
      // serialized, so by now every earlier write has settled and moved it.
      const base = synced.current;
      if (!base || base === target) return;
      await syncState(userId, base, target);
      // Only now — if the write threw, the baseline stays put so this delta is
      // included in the next diff instead of being lost for good.
      synced.current = target;
    }, "Changes could not be saved.");
  }, [state, ready, userId, queueWrite]);

  const retryLoad = useCallback(() => setLoadAttempt((n) => n + 1), []);

  // Memoized: the store keeps this object in its context value, so a fresh one
  // on every render would re-render every consumer for nothing.
  return useMemo(
    () => ({
      ready,
      session,
      setSession,
      userId,
      needsNickname,
      setNeedsNickname,
      loadFailed,
      retryLoad,
      setBaseline,
      queueWrite,
    }),
    [ready, session, userId, needsNickname, loadFailed, retryLoad, setBaseline, queueWrite],
  );
}
