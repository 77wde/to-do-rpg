"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, shopItem } from "@/lib/store";
import { FLAG_GOLD, FLAG_MINUTES } from "@/lib/constants";
import type { Quest } from "@/lib/types";

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

  // "데모 속도" compresses the whole session into ~48s so the mechanic is visible.
  const [fast, setFast] = useState(false);
  const totalSec = quest.estimateMin * 60;
  const speed = fast ? totalSec / 48 : 1;

  // Flags: the classic 10/20/25 checkpoints that fall inside this session,
  // plus a finish flag at the end.
  const flags = useMemo(() => {
    const inner = FLAG_MINUTES.filter((m) => m < quest.estimateMin).map((m) => ({
      frac: m / quest.estimateMin,
      label: `${m}분`,
    }));
    return [...inner, { frac: 1, label: "완료" }];
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
            grantGold(FLAG_GOLD, `🚩 ${flags[i].label} 지점 통과! +${FLAG_GOLD} G`);
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
    <div className="overlay">
      <div className={`focus-modal ${danger ? "shake" : ""}`}>
        {/* header */}
        <div className="row between" style={{ marginBottom: 4 }}>
          <span className="caption-upper" style={{ color: "var(--muted)" }}>
            Focus session · Pomodoro
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setFast((f) => !f)} title="Fast speed for demo">
            {fast ? "🐇 Demo speed ON" : "🐢 Real speed"}
          </button>
        </div>

        <h2 className="display-sm" style={{ margin: "0 0 2px" }}>
          {quest.title}
        </h2>
        <div className="row" style={{ gap: 12, marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 30, fontWeight: 700 }}>
            {fmt(remaining)}
          </span>
          <span className="caption">
            Time left · target {quest.estimateMin} min
          </span>
        </div>

        {/* runner scene */}
        <div className="scene">
          <div className="sky" />
          {/* flags */}
          {flags.map((f, i) => (
            <div key={i} className="flag" style={{ left: `calc(6% + ${f.frac * 82}%)` }}>
              <span className="flag-glyph">{f.frac >= 1 ? "🏁" : "🚩"}</span>
              <span className="flag-label caption mono">{f.label}</span>
            </div>
          ))}
          {/* spikes chasing from behind */}
          <div
            className="spikes"
            style={{ left: `calc(6% + ${Math.max(-0.06, spikeFrac) * 82}%)` }}
          >
            🌵🔺🔺
          </div>
          {/* hero */}
          <div className="hero" style={{ left: `calc(6% + ${heroFrac * 82}%)` }}>
            <span className={`hero-glyph ${phase === "running" ? "walking" : ""}`}>
              {skin?.glyph ?? "🧑‍🚀"}
            </span>
            {hasCat && <span className="companion">🐈</span>}
          </div>
          {/* ground */}
          <div className="ground" />
        </div>

        {/* gap meter */}
        <div className="row between" style={{ margin: "14px 0 6px" }}>
          <span className="caption">
            {phase === "won"
              ? "🏁 Reached the finish line!"
              : phase === "lost"
                ? "💥 Caught by the spikes"
                : danger
                  ? "⚠️ The spikes are right behind you!"
                  : "Distance from the spikes — it shrinks if you stop focusing"}
          </span>
          <span className="caption mono">{Math.round(gap * 100)}%</span>
        </div>
        <div className="bar" style={{ height: 10 }}>
          <span
            style={{
              width: `${Math.round(gap * 100)}%`,
              background: danger ? "var(--error)" : "var(--success)",
            }}
          />
        </div>

        {/* controls */}
        <div className="row wrap" style={{ gap: 10, marginTop: 20, justifyContent: "center" }}>
          {phase === "running" && (
            <>
              <button className="btn btn-secondary" onClick={() => setPhase("paused")}>
                ⏸ Pause
              </button>
              <button className="btn btn-primary" onClick={() => finish(true)}>
                ✓ I did it!
              </button>
              <button className="btn btn-ghost" onClick={() => finish(false)}>
                Give up
              </button>
            </>
          )}
          {phase === "paused" && (
            <>
              <div className="caption" style={{ width: "100%", textAlign: "center", color: "var(--error)" }}>
                ⏸ The spikes close in while you're stopped. Resume quickly!
              </div>
              <button className="btn btn-primary" onClick={() => setPhase("running")}>
                ▶ Resume
              </button>
              <button className="btn btn-primary" onClick={() => finish(true)}>
                ✓ I did it!
              </button>
              <button className="btn btn-ghost" onClick={() => finish(false)}>
                Give up
              </button>
            </>
          )}
          {phase === "won" && (
            <div className="result">
              <div className="result-emoji" style={{ animation: "pop 0.4s both" }}>
                🎉
              </div>
              <p className="title-md" style={{ margin: "0 0 4px" }}>
                Quest complete!
              </p>
              <p className="caption" style={{ margin: "0 0 16px" }}>
                Earned +{quest.xpReward} XP · +{quest.goldReward} G
              </p>
              <button className="btn btn-primary" onClick={onClose}>
                Continue →
              </button>
            </div>
          )}
          {phase === "lost" && (
            <div className="result">
              <div className="result-emoji">😵</div>
              <p className="title-md" style={{ margin: "0 0 4px" }}>
                Focus failed
              </p>
              <p className="caption" style={{ margin: "0 0 16px" }}>
                The spikes hit you and HP dropped. Give it another try!
              </p>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(38, 37, 30, 0.55);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          padding: 20px;
          animation: float-in 0.2s ease both;
        }
        .focus-modal {
          width: 100%;
          max-width: 620px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-xl);
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }
        .scene {
          position: relative;
          height: 168px;
          border-radius: var(--r-lg);
          overflow: hidden;
          border: 1px solid var(--hairline);
          background: linear-gradient(#dbeafe 0%, #eef2f7 62%, #e7e3d6 62%, #ded9c8 100%);
        }
        .sky {
          position: absolute;
          inset: 0 0 38% 0;
        }
        .ground {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 38%;
          background:
            repeating-linear-gradient(
              90deg,
              #cfc9b4 0 24px,
              #c7c1ac 24px 48px
            );
          border-top: 3px solid #b7b09a;
        }
        .hero {
          position: absolute;
          bottom: 30%;
          transform: translateX(-50%);
          transition: left 0.12s linear;
          text-align: center;
          z-index: 3;
        }
        .hero-glyph {
          font-size: 38px;
          display: inline-block;
          filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.25));
        }
        .walking {
          animation: walk 0.5s steps(2) infinite;
        }
        @keyframes walk {
          0% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-3px) rotate(3deg); }
          100% { transform: translateY(0) rotate(-3deg); }
        }
        .companion {
          position: absolute;
          left: -26px;
          bottom: 0;
          font-size: 22px;
        }
        .spikes {
          position: absolute;
          bottom: 30%;
          transform: translateX(-50%);
          transition: left 0.12s linear;
          font-size: 26px;
          letter-spacing: -6px;
          z-index: 2;
          filter: saturate(1.2);
        }
        .flag {
          position: absolute;
          bottom: 34%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
        }
        .flag-glyph {
          font-size: 22px;
        }
        .flag-label {
          margin-top: 2px;
          background: rgba(255, 255, 255, 0.7);
          padding: 0 4px;
          border-radius: 4px;
        }
        .result {
          text-align: center;
          width: 100%;
          animation: float-in 0.24s ease both;
        }
        .result-emoji {
          font-size: 48px;
        }
      `}</style>
    </div>
  );
}
