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
          오늘의 퀘스트
        </h2>
        <p className="caption" style={{ margin: 0 }}>
          {today} · 매일 반복되는 데일리를 끝내면 연속 달성이 쌓여요.
        </p>
      </div>

      {/* streak + progress */}
      <div className="card daily-hero">
        <div className="row between wrap" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="streak-badge">🔥</div>
            <div className="col" style={{ gap: 2 }}>
              <span className="display-sm" style={{ margin: 0 }}>
                {p.streak}일 연속
              </span>
              <span className="caption">데일리를 모두 완료한 날의 연속 기록</span>
            </div>
          </div>
          <div className="col" style={{ gap: 6, minWidth: 180, flex: 1, maxWidth: 260 }}>
            <div className="row between">
              <span className="caption-upper" style={{ color: "var(--muted)" }}>
                오늘 진행도
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
        ⚠️ 데일리를 하루 넘기면 다음 접속 시 <b>HP -{PENALTY_HP}</b>, <b>XP -{PENALTY_XP}</b> 패널티가 있어요.
        (🛡️ 집중 방패가 있으면 1회 막아줍니다)
      </div>

      {/* daily quests */}
      <section className="col" style={{ gap: 12 }}>
        <h3 className="title-md" style={{ margin: 0 }}>
          ☀️ 데일리
        </h3>
        {dailies.length === 0 ? (
          <div className="card" style={{ color: "var(--muted)", textAlign: "center" }}>
            아직 데일리가 없어요. 퀘스트 추가 시 <b>‘매일 반복’</b>을 체크하면 여기에 나타납니다.
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
            📅 오늘 마감
          </h3>
          <div className="col" style={{ gap: 10 }}>
            {dueToday.map((q) => (
              <QuestCard key={q.id} quest={q} onFocus={onFocus} />
            ))}
          </div>
        </section>
      )}

      {allDone && (
        <div className="card done-card">🎉 오늘의 데일리를 모두 완료했어요! 내일도 이 기세로!</div>
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
