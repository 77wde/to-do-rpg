"use client";
import { useStore, shopItem } from "@/lib/store";
import { xpToNext } from "@/lib/constants";

export default function PlayerBar() {
  const { state, reset, logout } = useStore();
  if (!state) return null;
  const p = state.player;
  const need = xpToNext(p.level);
  const xpPct = Math.min(100, (p.xp / need) * 100);
  const hpPct = Math.min(100, (p.hp / p.maxHp) * 100);
  const skin = shopItem(p.equippedSkin);

  return (
    <div className="pbar">
      <div className="container row between" style={{ gap: 16, minHeight: 68, flexWrap: "wrap" }}>
        {/* Avatar + identity */}
        <div className="row" style={{ gap: 14 }}>
          <div className="avatar" aria-hidden>
            {skin?.glyph ?? "🧑‍🚀"}
          </div>
          <div className="col" style={{ gap: 2 }}>
            <div className="row" style={{ gap: 8 }}>
              <strong style={{ fontWeight: 600 }}>{p.nickname}</strong>
              <span className="badge">Lv.{p.level}</span>
            </div>
            <span className="caption">{p.streak > 0 ? `🔥 ${p.streak}-day streak` : "Let's get started today"}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="col grow" style={{ minWidth: 180, maxWidth: 320, gap: 6 }}>
          <div className="row between">
            <span className="caption-upper" style={{ color: "var(--muted)" }}>
              XP
            </span>
            <span className="caption mono">
              {p.xp} / {need}
            </span>
          </div>
          <div className="bar">
            <span style={{ width: `${xpPct}%`, background: "var(--xp)" }} />
          </div>
        </div>

        {/* HP bar */}
        <div className="col" style={{ minWidth: 150, maxWidth: 240, flex: 1, gap: 6 }}>
          <div className="row between">
            <span className="caption-upper" style={{ color: "var(--muted)" }}>
              HP
            </span>
            <span className="caption mono">
              {p.hp} / {p.maxHp}
            </span>
          </div>
          <div className="bar">
            <span style={{ width: `${hpPct}%`, background: hpPct < 30 ? "var(--error)" : "var(--hp)" }} />
          </div>
        </div>

        {/* Gold */}
        <div className="gold-chip" title="Gold">
          <span aria-hidden>🪙</span>
          <span className="mono" style={{ fontWeight: 600 }}>
            {p.gold.toLocaleString()}
          </span>
        </div>

        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={logout} title="Log out (save is kept)">
            Log out
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm("Start over from scratch? Your saved adventure will be deleted.")) reset();
            }}
            title="New game (deletes save)"
          >
            ↺
          </button>
        </div>
      </div>

      <style jsx>{`
        .pbar {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(247, 247, 244, 0.85);
          backdrop-filter: saturate(1.4) blur(8px);
          border-bottom: 1px solid var(--hairline);
          padding: 8px 0;
        }
        .avatar {
          width: 46px;
          height: 46px;
          border-radius: var(--r-lg);
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          display: grid;
          place-items: center;
          font-size: 26px;
        }
        .gold-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-pill);
          padding: 8px 14px;
          color: var(--gold);
        }
        .gold-chip span:last-child {
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}
