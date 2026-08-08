"use client";
import { useStore } from "@/lib/store";
import { PENALTY_HP, PENALTY_XP } from "@/lib/constants";
import { todayStr } from "@/lib/game";
import type { Quest } from "@/lib/types";
import QuestCard from "./QuestCard";

export default function DailyView({ onFocus }: { onFocus: (q: Quest) => void }) {
  const { state } = useStore();
  if (!state) return null;
  const p = state.player;
  const today = todayStr();

  const dailies = state.quests.filter((q) => q.isDaily);
  const dueToday = state.quests.filter(
    (q) => !q.isDaily && q.category === "calendar" && q.dueDate === today,
  );
  const dailyDone = dailies.filter((q) => q.status === "done").length;
  const allDone = dailies.length > 0 && dailyDone === dailies.length;
  const pct = dailies.length ? Math.round((dailyDone / dailies.length) * 100) : 0;

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="col" style={{ gap: 4 }}>
        <h2 className="display-sm" style={{ margin: 0 }}>
          Today's Quests
        </h2>
        <p className="caption" style={{ margin: 0 }}>
          {today} · Finish your daily quests to build up a streak.
        </p>
      </div>

      {/* streak + progress */}
      <div className="card daily-hero">
        <div className="row between wrap" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="streak-badge">🔥</div>
            <div className="col" style={{ gap: 2 }}>
              <span className="display-sm" style={{ margin: 0 }}>
                {p.streak}-day streak
              </span>
              <span className="caption">Consecutive days you finished every daily</span>
            </div>
          </div>
          <div className="col" style={{ gap: 6, minWidth: 180, flex: 1, maxWidth: 260 }}>
            <div className="row between">
              <span className="caption-upper" style={{ color: "var(--muted)" }}>
                Today's progress
              </span>
              <span className="caption mono">
                {dailyDone}/{dailies.length}
              </span>
            </div>
            <div className="bar">
              <span style={{ width: `${pct}%`, background: allDone ? "var(--success)" : "var(--primary)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* penalty notice */}
      <div className="card warn-card">
        ⚠️ Miss a daily for a day and you'll take <b>HP -{PENALTY_HP}</b>, <b>XP -{PENALTY_XP}</b> on your next visit.
        (🛡️ A Focus Shield blocks it once.)
      </div>

      {/* daily quests */}
      <section className="col" style={{ gap: 12 }}>
        <h3 className="title-md" style={{ margin: 0 }}>
          ☀️ Dailies
        </h3>
        {dailies.length === 0 ? (
          <div className="card" style={{ color: "var(--muted)", textAlign: "center" }}>
            No dailies yet. Check <b>'Repeat daily'</b> when adding a quest and it'll show up here.
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {dailies.map((q) => (
              <QuestCard key={q.id} quest={q} onFocus={onFocus} />
            ))}
          </div>
        )}
      </section>

      {/* calendar due today */}
      {dueToday.length > 0 && (
        <section className="col" style={{ gap: 12 }}>
          <h3 className="title-md" style={{ margin: 0 }}>
            📅 Due today
          </h3>
          <div className="col" style={{ gap: 10 }}>
            {dueToday.map((q) => (
              <QuestCard key={q.id} quest={q} onFocus={onFocus} />
            ))}
          </div>
        </section>
      )}

      {allDone && (
        <div className="card done-card">🎉 All of today's dailies are done! Keep the momentum tomorrow!</div>
      )}

      <style jsx>{`
        .daily-hero {
          background: color-mix(in srgb, var(--primary) 6%, #ffffff);
          border-color: color-mix(in srgb, var(--primary) 22%, var(--hairline));
        }
        .streak-badge {
          width: 54px;
          height: 54px;
          border-radius: var(--r-lg);
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          display: grid;
          place-items: center;
          font-size: 28px;
        }
        .warn-card {
          background: color-mix(in srgb, var(--error) 6%, #ffffff);
          border-color: color-mix(in srgb, var(--error) 22%, var(--hairline));
          color: var(--ink);
          font-size: 14px;
        }
        .done-card {
          background: color-mix(in srgb, var(--success) 8%, #ffffff);
          border-color: color-mix(in srgb, var(--success) 25%, var(--hairline));
          text-align: center;
        }
      `}</style>
    </div>
  );
}
