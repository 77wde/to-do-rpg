"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Quest, Tab } from "@/lib/types";
import PlayerBar from "@/components/PlayerBar";
import Toasts from "@/components/Toasts";
import QuestsView from "@/components/QuestsView";
import MapView from "@/components/MapView";
import ShopView from "@/components/ShopView";
import CollectionView from "@/components/CollectionView";
import DailyView from "@/components/DailyView";
import ActivityLog from "@/components/ActivityLog";
import FocusOverlay from "@/components/FocusOverlay";

const TABS: { key: Tab; label: string; glyph: string }[] = [
  { key: "quests", label: "퀘스트", glyph: "📜" },
  { key: "map", label: "맵", glyph: "🗺️" },
  { key: "daily", label: "오늘", glyph: "☀️" },
  { key: "shop", label: "상점", glyph: "🛒" },
  { key: "collection", label: "수집", glyph: "🏆" },
];

export default function PlayPage() {
  const { state, ready, loggedIn } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("quests");
  const [focusQuest, setFocusQuest] = useState<Quest | null>(null);

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, router]);

  if (!ready || !state || !loggedIn) {
    return (
      <div className="container" style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
        불러오는 중…
      </div>
    );
  }

  const startFocus = (q: Quest) => setFocusQuest(q);

  return (
    <>
      <PlayerBar />

      {/* Tab nav */}
      <nav className="container tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "tab-on" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span aria-hidden>{t.glyph}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="container" style={{ padding: "24px 24px 96px" }}>
        <div className="play-grid">
          <div key={tab} className="float-in">
            {tab === "quests" && <QuestsView onFocus={startFocus} />}
            {tab === "map" && <MapView onGoQuests={() => setTab("quests")} />}
            {tab === "daily" && <DailyView onFocus={startFocus} />}
            {tab === "shop" && <ShopView />}
            {tab === "collection" && <CollectionView />}
          </div>
          <aside className="play-side">
            <ActivityLog />
          </aside>
        </div>
      </main>

      {focusQuest && <FocusOverlay quest={focusQuest} onClose={() => setFocusQuest(null)} />}

      <Toasts />

      <style jsx>{`
        .tabbar {
          display: flex;
          gap: 4px;
          padding-top: 16px;
          padding-bottom: 4px;
          overflow-x: auto;
        }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--r-pill);
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--body);
          white-space: nowrap;
          transition: all 0.12s ease;
        }
        .tab:hover {
          color: var(--ink);
          background: var(--surface-strong);
        }
        .tab-on {
          background: var(--ink);
          color: var(--canvas);
        }
        .tab-on:hover {
          background: var(--ink);
          color: var(--canvas);
        }
        .play-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .play-grid {
            grid-template-columns: 1fr;
          }
          .play-side {
            order: -1;
          }
        }
      `}</style>
    </>
  );
}
