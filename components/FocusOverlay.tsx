"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, shopItem } from "@/lib/store";
import { FLAG_GOLD, FLAG_MINUTES } from "@/lib/constants";
import type { Quest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "running" | "paused" | "won" | "lost";

/** Fraction of the track the hero starts ahead of the spikes. */
const HEADSTART = 0.14;

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function FocusOverlay({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const { state, completeQuest, focusFail, grantGold } = useStore();
  const skin = shopItem(state?.player.equippedSkin ?? "");
  const hasCat = state?.player.owned.includes("comp-cat");

  // Demo speed compresses the whole session into ~48s so the mechanic is visible.
  const [fast, setFast] = useState(false);
  const totalSec = quest.estimateMin * 60;
  const speed = fast ? totalSec / 48 : 1;

  // Flags: the classic 10/20/25 checkpoints that fall inside this session,
  // plus a finish flag at the end.
  const flags = useMemo(() => {
    const inner = FLAG_MINUTES.filter((m) => m < quest.estimateMin).map((m) => ({
      frac: m / quest.estimateMin,
      label: `${m}m`,
    }));
    return [...inner, { frac: 1, label: "Done" }];
  }, [quest.estimateMin]);

  const [phase, setPhase] = useState<Phase>("running");
  const [heroFrac, setHeroFrac] = useState(0);
  const [spikeFrac, setSpikeFrac] = useState(-HEADSTART);
  const passedFlags = useRef<Set<number>>(new Set());
  const runElapsed = useRef(0); // active focus seconds
  const spikeElapsed = useRef(0); // real seconds (advances even while paused)
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const phaseRef = useRef<Phase>("running");
  phaseRef.current = phase;

  const finish = useCallback(
    (win: boolean) => {
      if (phaseRef.current === "won" || phaseRef.current === "lost") return;
      setPhase(win ? "won" : "lost");
      if (win) completeQuest(quest.id);
      else focusFail(quest.title);
    },
    [completeQuest, focusFail, quest.id, quest.title],
  );

  // animation loop
  useEffect(() => {
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      const ph = phaseRef.current;

      if (ph === "running" || ph === "paused") {
        // spikes always advance; hero advances only while actively running
        spikeElapsed.current += dt * speed;
        if (ph === "running") runElapsed.current += dt * speed;

        const hf = Math.min(1, runElapsed.current / totalSec);
        const sf = spikeElapsed.current / totalSec - HEADSTART;
        setHeroFrac(hf);
        setSpikeFrac(sf);

        // flag rewards
        for (let i = 0; i < flags.length; i++) {
          if (!passedFlags.current.has(i) && hf >= flags[i].frac && flags[i].frac < 1) {
            passedFlags.current.add(i);
            grantGold(FLAG_GOLD, `🚩 Passed the ${flags[i].label} flag! +${FLAG_GOLD} G`);
          }
        }

        if (hf >= 1) {
          finish(true);
          return;
        }
        if (sf >= hf) {
          setSpikeFrac(hf);
          finish(false);
          return;
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, totalSec]);

  /**
   * Walking away is not a failure: the session is simply dropped, with no HP
   * loss and no log entry. Only the spikes catching you counts as a failure.
   */
  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    onClose();
  }, [onClose]);

  // Esc closes only when finished (avoid accidental abandon)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (phase === "won" || phase === "lost")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const remaining = Math.max(0, totalSec - runElapsed.current);
  const gap = Math.max(0, heroFrac - spikeFrac);
  const danger = phase !== "won" && phase !== "lost" && gap < 0.08;

  return (
    <div className="fixed inset-0 z-80 grid animate-[float-in_0.2s_ease_both] place-items-center bg-foreground/55 p-4 backdrop-blur-[3px]">
      <div
        className={cn(
          "w-full max-w-[400px] border-[3px] border-foreground bg-card p-4 shadow-[6px_6px_0_0_var(--foreground)]",
          danger && "shake",
        )}
      >
        {/* Header */}
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-pixel text-[9px] tracking-widest text-muted-foreground">
            FOCUS SESSION
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setFast((f) => !f)}
            title="Fast speed for demo"
          >
            {fast ? "🐇 Demo" : "🐢 Real"}
          </Button>
        </div>

        <h2 className="text-lg leading-snug font-semibold">{quest.title}</h2>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{fmt(remaining)}</span>
          <span className="text-xs text-muted-foreground">
            left · target {quest.estimateMin} min
          </span>
        </div>

        {/* Runner scene */}
        <div className="focus-scene">
          {flags.map((f, i) => (
            <div key={i} className="focus-flag" style={{ left: `calc(6% + ${f.frac * 82}%)` }}>
              <span className="text-lg">{f.frac >= 1 ? "🏁" : "🚩"}</span>
              <span className="mt-0.5 bg-white/70 px-1 text-[10px] tabular-nums">
                {f.label}
              </span>
            </div>
          ))}
          <div
            className="focus-actor focus-spikes"
            style={{ left: `calc(6% + ${Math.max(-0.06, spikeFrac) * 82}%)` }}
            aria-hidden
          >
            🌵🔺🔺
          </div>
          <div
            className="focus-actor focus-hero"
            style={{ left: `calc(6% + ${heroFrac * 82}%)` }}
          >
            <span
              className={cn("focus-hero-glyph", phase === "running" && "focus-walking")}
            >
              {skin?.glyph ?? "🧑‍🚀"}
            </span>
            {hasCat && <span className="absolute -left-6 bottom-0 text-xl">🐈</span>}
          </div>
          <div className="focus-ground" />
        </div>

        {/* Gap meter */}
        <div className="mt-3 mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {phase === "won"
              ? "🏁 Reached the finish line!"
              : phase === "lost"
                ? "💥 Caught by the spikes"
                : danger
                  ? "⚠️ The spikes are right behind you!"
                  : "Distance from the spikes"}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums">{Math.round(gap * 100)}%</span>
        </div>
        <div className="h-2.5 w-full border-[3px] border-foreground bg-card">
          <span
            className="block h-full"
            style={{
              width: `${Math.round(gap * 100)}%`,
              background: danger ? "var(--error)" : "var(--success)",
            }}
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2">
          {phase === "running" && (
            <>
              <Button onClick={() => finish(true)}>✓ I did it!</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPhase("paused")}>
                  ⏸ Pause
                </Button>
                <Button variant="ghost" className="flex-1" onClick={cancel}>
                  ✕ Cancel
                </Button>
              </div>
            </>
          )}
          {phase === "paused" && (
            <>
              <p className="text-center text-[11px] text-destructive">
                ⏸ The spikes close in while you&apos;re stopped. Resume quickly!
              </p>
              <Button onClick={() => setPhase("running")}>▶ Resume</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => finish(true)}>
                  ✓ I did it!
                </Button>
                <Button variant="ghost" className="flex-1" onClick={cancel}>
                  ✕ Cancel
                </Button>
              </div>
            </>
          )}
          {phase === "won" && (
            <div className="flex animate-[float-in_0.24s_ease_both] flex-col items-center gap-1 text-center">
              <div className="animate-[pop_0.4s_both] text-5xl">🎉</div>
              <p className="font-semibold">Quest complete!</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Earned +{quest.xpReward} XP · +{quest.goldReward} G
              </p>
              <Button className="w-full" onClick={onClose}>
                Continue →
              </Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="flex animate-[float-in_0.24s_ease_both] flex-col items-center gap-1 text-center">
              <div className="text-5xl">😵</div>
              <p className="font-semibold">Focus failed</p>
              <p className="mb-2 text-xs text-muted-foreground">
                The spikes hit you and HP dropped. Give it another try!
              </p>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
