"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, shopItem } from "@/lib/store";
import { FLAG_FRACTIONS, FLAG_GOLD, FLAG_HEAL_HP } from "@/lib/constants";
import type { Quest } from "@/lib/types";
import { Button } from "@/components/ui/button";

type Phase = "running" | "paused" | "won";

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function FocusOverlay({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const { state, completeQuest, flagReward } = useStore();
  const skin = shopItem(state?.player.equippedSkin ?? "");
  const hasCat = state?.player.owned.includes("comp-cat");

  // Demo speed compresses the whole session into ~48s so the mechanic is visible.
  const [fast, setFast] = useState(false);
  const totalSec = quest.estimateMin * 60;
  const speed = fast ? totalSec / 48 : 1;

  // Flags sit at even fractions of the session (thirds + finish), each labelled
  // with the minute it falls on. Reaching one hands out a small reward — there
  // is no penalty for anything, the runner only ever helps.
  const flags = useMemo(
    () =>
      FLAG_FRACTIONS.map((frac, i) => ({
        frac,
        finish: i === FLAG_FRACTIONS.length - 1,
        label:
          i === FLAG_FRACTIONS.length - 1
            ? "Done"
            : `${Math.round(frac * quest.estimateMin)}m`,
      })),
    [quest.estimateMin],
  );

  const [phase, setPhase] = useState<Phase>("running");
  const [heroFrac, setHeroFrac] = useState(0);
  const passedFlags = useRef<Set<number>>(new Set());
  const runElapsed = useRef(0); // active focus seconds
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const phaseRef = useRef<Phase>("running");
  phaseRef.current = phase;

  const win = useCallback(() => {
    if (phaseRef.current === "won") return;
    setPhase("won");
    completeQuest(quest.id);
  }, [completeQuest, quest.id]);

  // animation loop — the hero simply walks forward while the session runs.
  useEffect(() => {
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;

      if (phaseRef.current === "running") {
        runElapsed.current += dt * speed;
        const hf = Math.min(1, runElapsed.current / totalSec);
        setHeroFrac(hf);

        // Reaching each flag pays out once. The finish flag also ends the run.
        for (let i = 0; i < flags.length; i++) {
          if (passedFlags.current.has(i) || hf < flags[i].frac) continue;
          passedFlags.current.add(i);
          if (flags[i].finish) {
            win();
            return;
          }
          flagReward(
            FLAG_GOLD,
            FLAG_HEAL_HP,
            `🚩 Reached the ${flags[i].label} flag! +${FLAG_GOLD} G · +${FLAG_HEAL_HP} HP`,
          );
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

  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    onClose();
  }, [onClose]);

  // Esc closes only once finished, so it can't abandon a run by accident.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "won") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const remaining = Math.max(0, totalSec - runElapsed.current);
  const progress = Math.round(heroFrac * 100);

  return (
    <div className="fixed inset-0 z-80 grid animate-[float-in_0.2s_ease_both] place-items-center bg-foreground/55 p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-[400px] border-[3px] border-foreground bg-card p-4 shadow-[6px_6px_0_0_var(--foreground)]">
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
          <div className="focus-actor focus-hero" style={{ left: `calc(6% + ${heroFrac * 82}%)` }}>
            <span className={phase === "running" ? "focus-hero-glyph focus-walking" : "focus-hero-glyph"}>
              {skin?.glyph ?? "🧑‍🚀"}
            </span>
            {hasCat && <span className="absolute -left-6 bottom-0 text-xl">🐈</span>}
          </div>
          <div className="focus-ground" />
        </div>

        {/* Progress toward the finish */}
        <div className="mt-3 mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {phase === "won"
              ? "🏁 Reached the finish line!"
              : "Walk on — each flag hands you gold & HP"}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums">{progress}%</span>
        </div>
        <div className="h-2.5 w-full border-[3px] border-foreground bg-card">
          <span
            className="block h-full"
            style={{ width: `${progress}%`, background: "var(--success)" }}
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2">
          {phase === "running" && (
            <>
              <Button onClick={win}>✓ I did it!</Button>
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
              <p className="text-center text-[11px] text-muted-foreground">
                ⏸ Paused — take your time. Resume whenever you&apos;re ready.
              </p>
              <Button onClick={() => setPhase("running")}>▶ Resume</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={win}>
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
        </div>
      </div>
    </div>
  );
}
