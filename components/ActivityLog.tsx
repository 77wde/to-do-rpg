"use client";
import { useStore } from "@/lib/store";
import type { LogEntry } from "@/lib/types";

const TONE: Record<LogEntry["kind"], string> = {
  complete: "var(--success)",
  levelup: "var(--primary)",
  penalty: "var(--error)",
  reward: "var(--body)",
  surprise: "var(--tl-done)",
  buy: "var(--gold)",
  unlock: "var(--xp)",
  focusFail: "var(--error)",
};

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityLog() {
  const { state } = useStore();
  if (!state) return null;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <span className="title-sm">Activity Log</span>
        <span className="caption mono">{state.player.totalCompleted} done</span>
      </div>
      <ul className="log">
        {state.log.map((e) => (
          <li key={e.id}>
            <span className="dot" style={{ background: TONE[e.kind] }} />
            <div className="col" style={{ gap: 2 }}>
              <span className="body-sm">{e.text}</span>
              <span className="caption">{ago(e.ts)}</span>
            </div>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .log {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 460px;
          overflow-y: auto;
        }
        .log li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
