"use client";
import { useStore } from "@/lib/store";
import { GTD, GTD_ORDER } from "@/lib/constants";
import type { GtdCategory, Quest } from "@/lib/types";

export default function QuestCard({
  quest,
  onFocus,
}: {
  quest: Quest;
  onFocus: (q: Quest) => void;
}) {
  const { completeQuest, deleteQuest, moveQuest } = useStore();
  const meta = GTD[quest.category];
  const done = quest.status === "done";

  return (
    <div className={`qcard ${done ? "qcard-done" : ""}`}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <button
          className="check"
          onClick={() => !done && completeQuest(quest.id)}
          disabled={done}
          aria-label="완료"
          title={done ? "완료됨" : "완료 처리"}
        >
          {done ? "✓" : ""}
        </button>

        <div className="col grow" style={{ gap: 8 }}>
          <div className="row between" style={{ gap: 8, alignItems: "flex-start" }}>
            <span className={`qtitle ${done ? "struck" : ""}`}>{quest.title}</span>
            <span className="pill" style={{ background: meta.color, flexShrink: 0 }}>
              {meta.short}
            </span>
          </div>

          <div className="row wrap" style={{ gap: 10 }}>
            <span className="chip mono">⏱ {quest.estimateMin}분</span>
            <span className="chip mono" style={{ color: "var(--xp)" }}>
              +{quest.xpReward} XP
            </span>
            <span className="chip mono" style={{ color: "var(--gold)" }}>
              +{quest.goldReward} G
            </span>
            {quest.isDaily && <span className="chip">☀️ 데일리</span>}
            {quest.dueDate && <span className="chip">📅 {quest.dueDate}</span>}
          </div>

          {!done && (
            <div className="row wrap" style={{ gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={() => onFocus(quest)}>
                ▶ 진행하기
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => completeQuest(quest.id)}>
                바로 완료
              </button>
              <select
                className="mini-select mono"
                value={quest.category}
                onChange={(e) => moveQuest(quest.id, e.target.value as GtdCategory)}
                title="분류 이동"
              >
                {GTD_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {GTD[k].label}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => deleteQuest(quest.id)}
                title="삭제"
              >
                🗑
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .qcard {
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-lg);
          padding: 16px;
          transition: border-color 0.12s ease;
        }
        .qcard:hover {
          border-color: var(--hairline-strong);
        }
        .qcard-done {
          opacity: 0.6;
          background: var(--canvas-soft);
        }
        .check {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 1.5px solid var(--hairline-strong);
          background: var(--surface-card);
          color: var(--on-primary);
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.12s ease;
        }
        .check:hover:not(:disabled) {
          border-color: var(--success);
        }
        .check:disabled {
          background: var(--success);
          border-color: var(--success);
          cursor: default;
        }
        .qtitle {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.4;
        }
        .struck {
          text-decoration: line-through;
          color: var(--muted);
        }
        .chip {
          font-size: 12px;
          color: var(--body);
        }
        .mini-select {
          height: 32px;
          border-radius: var(--r-md);
          border: 1px solid var(--hairline-strong);
          background: var(--surface-card);
          color: var(--body);
          font-size: 12px;
          padding: 0 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
