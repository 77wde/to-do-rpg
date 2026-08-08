"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { GTD, GTD_ORDER, suggestReward } from "@/lib/constants";
import { uid, todayStr } from "@/lib/game";
import type { GtdCategory, Quest } from "@/lib/types";
import QuestCard from "./QuestCard";

export default function QuestsView({ onFocus }: { onFocus: (q: Quest) => void }) {
  const { state, addQuest } = useStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GtdCategory>("inbox");
  const [estimate, setEstimate] = useState(25);
  const [isDaily, setIsDaily] = useState(false);
  const [filter, setFilter] = useState<GtdCategory | "all" | "done">("all");

  if (!state) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const { xp, gold } = suggestReward(estimate);
    const quest: Quest = {
      id: uid(),
      title: t,
      category,
      estimateMin: estimate,
      xpReward: xp,
      goldReward: gold,
      status: "todo",
      createdAt: Date.now(),
      isDaily,
      dueDate: category === "calendar" ? todayStr() : undefined,
    };
    addQuest(quest);
    setTitle("");
    setIsDaily(false);
  }

  const todo = state.quests.filter((q) => q.status === "todo");
  const doneList = state.quests.filter((q) => q.status === "done");

  const visibleCats: GtdCategory[] =
    filter === "all" || filter === "done" ? GTD_ORDER : [filter];

  return (
    <div className="col" style={{ gap: 20 }}>
      {/* Add quest */}
      <form onSubmit={submit} className="card add-card">
        <div className="row wrap" style={{ gap: 10 }}>
          <input
            className="input grow"
            style={{ minWidth: 200 }}
            placeholder="새 퀘스트… 예) 책 30페이지 읽기"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <select
            className="input"
            style={{ width: 150 }}
            value={category}
            onChange={(e) => setCategory(e.target.value as GtdCategory)}
          >
            {GTD_ORDER.map((k) => (
              <option key={k} value={k}>
                {GTD[k].label}
              </option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: 110 }}
            value={estimate}
            onChange={(e) => setEstimate(Number(e.target.value))}
            title="예상 집중 시간(뽀모도로 길이)"
          >
            {[5, 10, 15, 20, 25, 30].map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            + 추가
          </button>
        </div>
        <div className="row between" style={{ marginTop: 12 }}>
          <label className="row" style={{ gap: 8, cursor: "pointer", fontSize: 13, color: "var(--body)" }}>
            <input type="checkbox" checked={isDaily} onChange={(e) => setIsDaily(e.target.checked)} />
            ☀️ 매일 반복(데일리) · 미완료 시 패널티
          </label>
          <span className="caption mono">
            보상 예상 +{suggestReward(estimate).xp} XP · +{suggestReward(estimate).gold} G
          </span>
        </div>
      </form>

      {/* Filter chips */}
      <div className="row wrap" style={{ gap: 8 }}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {todo.length}
        </FilterChip>
        {GTD_ORDER.map((k) => {
          const n = todo.filter((q) => q.category === k).length;
          return (
            <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} color={GTD[k].color}>
              {GTD[k].label} {n}
            </FilterChip>
          );
        })}
        <FilterChip active={filter === "done"} onClick={() => setFilter("done")}>
          완료 {doneList.length}
        </FilterChip>
      </div>

      {/* Lists */}
      {filter === "done" ? (
        <Section title="완료한 퀘스트" quests={doneList} onFocus={onFocus} emptyText="아직 완료한 퀘스트가 없어요." />
      ) : (
        visibleCats.map((k) => {
          const list = todo.filter((q) => q.category === k);
          if (filter === "all" && list.length === 0) return null;
          return (
            <Section
              key={k}
              title={`${GTD[k].label}`}
              subtitle={GTD[k].desc}
              color={GTD[k].color}
              quests={list}
              onFocus={onFocus}
              emptyText="이 분류엔 퀘스트가 없어요."
            />
          );
        })
      )}

      {filter === "all" && todo.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
          🎉 모든 퀘스트를 비웠어요! 새 퀘스트를 추가해보세요.
        </div>
      )}

      <style jsx>{`
        .add-card {
          padding: 18px;
        }
      `}</style>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${active ? "var(--ink)" : "var(--hairline)"}`,
        background: active ? "var(--ink)" : "var(--surface-card)",
        color: active ? "var(--canvas)" : "var(--body)",
        borderRadius: "9999px",
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      {children}
    </button>
  );
}

function Section({
  title,
  subtitle,
  color,
  quests,
  onFocus,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  color?: string;
  quests: Quest[];
  onFocus: (q: Quest) => void;
  emptyText: string;
}) {
  return (
    <section className="col" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 10 }}>
        {color && <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />}
        <h3 className="title-md" style={{ margin: 0 }}>
          {title}
        </h3>
        {subtitle && <span className="caption">· {subtitle}</span>}
      </div>
      {quests.length === 0 ? (
        <p className="caption" style={{ padding: "4px 2px" }}>
          {emptyText}
        </p>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} onFocus={onFocus} />
          ))}
        </div>
      )}
    </section>
  );
}
