"use client";
import { useStore, shopItem } from "@/lib/store";
import { GTD, GTD_ORDER } from "@/lib/constants";
import type { GtdCategory } from "@/lib/types";

export default function MapView({ onGoQuests }: { onGoQuests: () => void }) {
  const { state } = useStore();
  if (!state) return null;

  const counts = (cat: GtdCategory) =>
    state.quests.filter((q) => q.category === cat && q.status === "todo").length;

  // A region is "urgent" (colored) when it belongs to an urgent GTD zone and
  // currently holds work — per PRD: Next Action / Calendar light up when there's
  // something to do right now.
  const isUrgent = (cat: GtdCategory) => GTD[cat].urgentByDefault && counts(cat) > 0;
  const anyUrgent = GTD_ORDER.some(isUrgent);
  const skin = shopItem(state.player.equippedSkin);

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row between wrap" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 4 }}>
          <h2 className="display-sm" style={{ margin: 0 }}>
            모험의 대륙
          </h2>
          <p className="caption" style={{ margin: 0 }}>
            평소엔 흑백. <b style={{ color: "var(--ink)" }}>지금 해야 할 일</b>이 생긴 지역에 색이 켜집니다.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onGoQuests}>
          퀘스트로 이동 →
        </button>
      </div>

      <div className={`map ${anyUrgent ? "map-alert" : ""}`}>
        <div className="map-grid">
          {GTD_ORDER.map((cat) => {
            const n = counts(cat);
            const urgent = isUrgent(cat);
            const meta = GTD[cat];
            return (
              <button
                key={cat}
                className={`region ${urgent ? "region-on" : n > 0 ? "region-dim" : ""}`}
                onClick={onGoQuests}
                style={urgent ? ({ ["--rc" as string]: meta.color } as React.CSSProperties) : undefined}
              >
                <div className="region-head row between">
                  <span className="caption-upper">{meta.short}</span>
                  {n > 0 && <span className="count">{n}</span>}
                </div>
                <div className="region-name">{meta.label}</div>
                <div className="region-terrain" aria-hidden>
                  {TERRAIN[cat]}
                </div>
                {urgent && <span className="beacon" aria-hidden />}
              </button>
            );
          })}

          {/* wandering hero sits in the most urgent / most populated region */}
          <div className="hero-token" aria-hidden>
            {skin?.glyph ?? "🧑‍🚀"}
          </div>
        </div>

        <div className="map-legend row wrap">
          {GTD_ORDER.map((cat) => (
            <span key={cat} className="row" style={{ gap: 6 }}>
              <span className="lg-dot" style={{ background: GTD[cat].color }} />
              <span className="caption">{GTD[cat].label}</span>
            </span>
          ))}
        </div>
      </div>

      {anyUrgent ? (
        <div className="card alert-card">
          🔴 지금 <b>당장 해야 할 일</b>이 있어요. 색이 켜진 지역을 눌러 진행하세요!
        </div>
      ) : (
        <div className="card" style={{ color: "var(--muted)", textAlign: "center" }}>
          🌫️ 급한 일이 없습니다. 대륙이 고요하네요. (다음 행동·캘린더에 일이 생기면 색이 켜져요)
        </div>
      )}

      <style jsx>{`
        .map {
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-xl);
          padding: 20px;
        }
        .map-alert {
          border-color: var(--hairline-strong);
        }
        .map-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .region {
          position: relative;
          text-align: left;
          border: 1px solid var(--hairline);
          border-radius: var(--r-lg);
          padding: 14px;
          min-height: 118px;
          background: #eceae4;
          color: #8a887f;
          filter: grayscale(1);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .region-dim {
          filter: grayscale(0.75);
          color: var(--body);
        }
        .region-on {
          filter: none;
          background: color-mix(in srgb, var(--rc) 22%, #ffffff);
          border-color: var(--rc);
          color: var(--ink);
          box-shadow: 0 0 0 1px var(--rc);
        }
        .region-head {
          margin-bottom: 8px;
        }
        .count {
          background: var(--ink);
          color: var(--canvas);
          border-radius: 9999px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 700;
        }
        .region-on .count {
          background: var(--primary);
          color: #fff;
        }
        .region-name {
          font-size: 15px;
          font-weight: 600;
        }
        .region-terrain {
          position: absolute;
          right: 8px;
          bottom: 6px;
          font-size: 34px;
          opacity: 0.5;
        }
        .beacon {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 0 0 var(--primary);
          animation: beacon 1.4s infinite;
        }
        @keyframes beacon {
          0% { box-shadow: 0 0 0 0 rgba(245, 78, 0, 0.5); }
          100% { box-shadow: 0 0 0 12px rgba(245, 78, 0, 0); }
        }
        .hero-token {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 30px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          animation: bob 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes bob {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-50%, -62%); }
        }
        .map-legend {
          gap: 14px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--hairline);
        }
        .lg-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          display: inline-block;
        }
        .alert-card {
          background: color-mix(in srgb, var(--primary) 8%, #ffffff);
          border-color: color-mix(in srgb, var(--primary) 30%, var(--hairline));
          color: var(--ink);
        }
        @media (max-width: 560px) {
          .map-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

const TERRAIN: Record<GtdCategory, string> = {
  inbox: "📥",
  "next-action": "⚔️",
  calendar: "🏰",
  "someday-maybe": "🌫️",
  "waiting-for": "⏳",
};
