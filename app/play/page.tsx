"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { GtdCategory, Quest, Tab } from "@/lib/types";
import { GTD } from "@/lib/constants";
import { questsForRegion } from "@/lib/game";
import PlayerBar from "@/components/PlayerBar";
import QuestCard from "@/components/QuestCard";
import { CategoryLabel } from "@/components/CategoryTag";
import { Button } from "@/components/ui/button";
import Toasts from "@/components/Toasts";
import QuestComposer from "@/components/QuestComposer";
import MapView from "@/components/MapView";
import ShopView from "@/components/ShopView";
import CollectionView from "@/components/CollectionView";
import DailyView from "@/components/DailyView";
import ActivityLog from "@/components/ActivityLog";
import FocusOverlay from "@/components/FocusOverlay";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const TABS: { key: Tab; label: string; glyph: string }[] = [
  { key: "map", label: "Quest", glyph: "📜" },
  { key: "story", label: "Story", glyph: "📖" },
  { key: "shop", label: "Shop", glyph: "🛒" },
  // "Titles" rather than "Collection": the label has to fit a fifth of the bar.
  { key: "collection", label: "Titles", glyph: "🏆" },
];

export default function PlayPage() {
  const { state, ready, loggedIn, loadFailed } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("map");
  const [focusQuest, setFocusQuest] = useState<Quest | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  /** Which map region's quests are showing in the drawer, if any. */
  const [openCategory, setOpenCategory] = useState<GtdCategory | null>(null);

  useEffect(() => {
    // A failed load also lands here with no state; the start screen owns the
    // retry, so send them back rather than sitting on "Loading…".
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, loadFailed, router]);

  if (!ready || !state || !loggedIn) {
    return (
      <div className="px-5 py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  const startFocus = (q: Quest) => setFocusQuest(q);

  return (
    <>
      {/* Stats stay pinned at the top; navigation lives at the bottom. The
          shell is exactly one viewport tall, so the header and nav hold their
          place without sticky positioning and `main` does the scrolling. */}
      <header className="z-30 shrink-0 border-b-[3px] border-foreground bg-canvas">
        <PlayerBar />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-4">
        <div key={tab} className="float-in flex min-h-0 flex-1 flex-col">
          {/* Quest is the only home for work in progress: today's streak and
              dailies first — the time-boxed part of the day, belonging to no
              group — then the groups, each of which opens its own quests. */}
          {tab === "map" && (
            <div className="flex flex-col gap-5">
              <DailyView />
              <MapView onSelectCategory={setOpenCategory} />
            </div>
          )}
          {tab === "story" && <ActivityLog />}
          {tab === "shop" && <ShopView />}
          {tab === "collection" && <CollectionView />}
        </div>
      </main>

      {/* Bottom tab bar — thumb-reachable, the standard place for primary
          navigation on a phone. It is the last row of the shell rather than a
          fixed overlay, so it can never cover the scrolling content. */}
      <nav className="z-40 shrink-0 border-t-[3px] border-foreground bg-canvas">
        {/* Add sits in the middle of the bar as its own cell. The active tab
            is inked rather than orange so it never reads as a second Add. */}
        <div className="grid grid-cols-5">
          {TABS.slice(0, 2).map((t) => (
            <TabButton
              key={t.key}
              tab={t}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            />
          ))}

          <Button
            onClick={() => setComposerOpen(true)}
            aria-label="Add quest"
            className="h-auto flex-col gap-0.5 border-0 py-2 shadow-none active:translate-x-0 active:translate-y-0 active:scale-90 active:brightness-90"
          >
            <span className="text-lg leading-none" aria-hidden>
              ✚
            </span>
            <span className="font-pixel text-[8px] tracking-wide uppercase">Add</span>
          </Button>

          {TABS.slice(2).map((t) => (
            <TabButton
              key={t.key}
              tab={t}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            />
          ))}
        </div>
      </nav>

      {/* Quest entry */}
      <Drawer open={composerOpen} onOpenChange={setComposerOpen}>
        {/* Taller than the stock sheet so the date picker fits without
            scrolling; the popup animates between the two heights on its own. */}
        <DrawerContent className="mx-auto max-h-[calc(100dvh-2rem)] max-w-[430px] border-t-[3px] border-foreground">
          <DrawerHeader>
            <DrawerTitle className="font-pixel text-xs tracking-widest">
              NEW QUEST
            </DrawerTitle>
          </DrawerHeader>
          <QuestComposer onDone={() => setComposerOpen(false)} />
        </DrawerContent>
      </Drawer>

      {/* Quests of the tapped map region */}
      <Drawer
        open={openCategory !== null}
        onOpenChange={(open) => !open && setOpenCategory(null)}
      >
        <DrawerContent className="mx-auto max-w-[430px] border-t-[3px] border-foreground">
          {openCategory && (
            <>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2 text-base">
                  <span
                    className="size-3 border-2 border-foreground"
                    style={{ background: GTD[openCategory].color }}
                    aria-hidden
                  />
                  <CategoryLabel category={openCategory} />
                </DrawerTitle>
              </DrawerHeader>
              <CategoryQuests
                category={openCategory}
                onFocus={(q) => {
                  // Close first so the runner overlay is not stacked on the drawer.
                  setOpenCategory(null);
                  startFocus(q);
                }}
              />
            </>
          )}
        </DrawerContent>
      </Drawer>

      {focusQuest && <FocusOverlay quest={focusQuest} onClose={() => setFocusQuest(null)} />}

      <Toasts />
    </>
  );
}

/**
 * The quests of one map region. Scrolls inside the drawer so the whole list is
 * reachable without the sheet growing past the screen.
 */
function CategoryQuests({
  category,
  onFocus,
}: {
  category: GtdCategory;
  onFocus: (q: Quest) => void;
}) {
  const { state } = useStore();
  const list = state ? questsForRegion(state.quests, category) : [];

  return (
    <div className="flex max-h-[60dvh] flex-col gap-2.5 overflow-y-auto px-4 pb-4">
      <p className="text-xs text-muted-foreground">
        {GTD[category].desc}
        {category === "next-action" && " · dailies and anything due today show up here too"}
      </p>
      {list.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Nothing here yet. Tap ✚ to add a quest.
        </p>
      ) : (
        list.map((q) => <QuestCard key={q.id} quest={q} onFocus={onFocus} />)
      )}
    </div>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-auto flex-col gap-0.5 py-2",
        active ? "bg-foreground text-canvas hover:bg-foreground" : "text-muted-foreground",
      )}
    >
      <span className="text-lg leading-none" aria-hidden>
        {tab.glyph}
      </span>
      <span className="font-pixel text-[8px] tracking-wide uppercase">{tab.label}</span>
    </Button>
  );
}
