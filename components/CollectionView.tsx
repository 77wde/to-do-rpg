"use client";
import { useStore } from "@/lib/store";
import { COLLECTIBLES, xpToNext } from "@/lib/constants";

export default function CollectionView() {
  const { state, equipTitle } = useStore();
  if (!state) return null;
  const p = state.player;
  const nextLocked = COLLECTIBLES.filter((c) => c.unlockLevel > p.level).sort(
    (a, b) => a.unlockLevel - b.unlockLevel,
  )[0];

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="col" style={{ gap: 4 }}>
        <h2 className="display-sm" style={{ margin: 0 }}>
          Collection · Titles
        </h2>
        <p className="caption" style={{ margin: 0 }}>
          Level up to unlock special collectibles and titles no shop can sell.
        </p>
      </div>

      {nextLocked && (
        <div className="card next-unlock">
          <div className="row between wrap" style={{ gap: 8 }}>
            <span>
              Next unlock: <b>{nextLocked.glyph} {nextLocked.name}</b> — Lv.{nextLocked.unlockLevel}
            </span>
            <span className="caption mono">
              Currently Lv.{p.level} · {p.xp}/{xpToNext(p.level)} XP
            </span>
          </div>
        </div>
      )}

      <div className="coll-grid">
        {COLLECTIBLES.map((c) => {
          const unlocked = c.unlockLevel <= p.level;
          const isTitle = c.kind === "title";
          const equipped = p.equippedTitle === c.id;
          return (
            <div key={c.id} className={`coll-card ${unlocked ? "" : "locked"} ${equipped ? "equipped" : ""}`}>
              <div className="coll-glyph">{unlocked ? c.glyph : "❔"}</div>
              <div className="col grow" style={{ gap: 2 }}>
                <div className="row between">
                  <span className="title-sm">{unlocked ? c.name : "???"}</span>
                  <span className="badge">{isTitle ? "Title" : "Trophy"}</span>
                </div>
                <span className="caption">{unlocked ? c.desc : `Unlocks at Lv.${c.unlockLevel}`}</span>
              </div>
              {unlocked && isTitle && (
                <button
                  className="btn btn-sm btn-block"
                  style={
                    equipped
                      ? { background: "var(--success)", color: "#fff" }
                      : { background: "var(--surface-card)", border: "1px solid var(--hairline-strong)" }
                  }
                  onClick={() => equipTitle(equipped ? null : c.id)}
                >
                  {equipped ? "✓ Title equipped (unequip)" : "Equip title"}
                </button>
              )}
              {!unlocked && (
                <div className="lock-badge">🔒 Lv.{c.unlockLevel}</div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .next-unlock {
          background: color-mix(in srgb, var(--xp) 8%, #ffffff);
          border-color: color-mix(in srgb, var(--xp) 25%, var(--hairline));
        }
        .coll-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .coll-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-lg);
          padding: 16px;
        }
        .coll-card.locked {
          background: var(--canvas-soft);
          color: var(--muted);
        }
        .coll-card.equipped {
          border-color: var(--success);
          box-shadow: 0 0 0 1px var(--success);
        }
        .coll-glyph {
          font-size: 40px;
          filter: var(--f, none);
        }
        .locked .coll-glyph {
          filter: grayscale(1) opacity(0.5);
        }
        .lock-badge {
          margin-top: auto;
          text-align: center;
          font-size: 13px;
          color: var(--muted);
          background: var(--surface-strong);
          border-radius: var(--r-md);
          padding: 6px;
        }
      `}</style>
    </div>
  );
}
