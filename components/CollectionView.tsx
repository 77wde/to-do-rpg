"use client";
import { useStore } from "@/lib/store";
import { COLLECTIBLES, xpToNext } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CollectionView() {
  const { state, equipTitle } = useStore();
  if (!state) return null;
  const p = state.player;
  const nextLocked = COLLECTIBLES.filter((c) => c.unlockLevel > p.level).sort(
    (a, b) => a.unlockLevel - b.unlockLevel,
  )[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Collection · Titles</h2>
        <p className="text-xs text-muted-foreground">
          Level up to unlock collectibles and titles no shop can sell.
        </p>
      </div>

      {nextLocked && (
        <Card size="sm" className="bg-[color-mix(in_srgb,var(--xp)_8%,#fff)]">
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm">
              Next unlock:{" "}
              <b>
                {nextLocked.glyph} {nextLocked.name}
              </b>{" "}
              — Lv.{nextLocked.unlockLevel}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              Currently Lv.{p.level} · {p.xp}/{xpToNext(p.level)} XP
            </span>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {COLLECTIBLES.map((c) => {
          const unlocked = c.unlockLevel <= p.level;
          const isTitle = c.kind === "title";
          const equipped = p.equippedTitle === c.id;
          return (
            <Card
              key={c.id}
              size="sm"
              className={cn(
                !unlocked && "bg-[var(--canvas-soft)] text-muted-foreground",
                equipped && "border-[var(--success)]",
              )}
            >
              <CardContent className="flex gap-3">
                <div
                  className={cn("text-4xl leading-none", !unlocked && "opacity-50 grayscale")}
                  aria-hidden
                >
                  {unlocked ? c.glyph : "❔"}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{unlocked ? c.name : "???"}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {isTitle ? "Title" : "Trophy"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {unlocked ? c.desc : `Unlocks at Lv.${c.unlockLevel}`}
                  </span>

                  {unlocked && isTitle && (
                    <Button
                      size="sm"
                      variant={equipped ? "default" : "outline"}
                      className={cn("mt-1 w-full", equipped && "bg-[var(--success)]")}
                      onClick={() => equipTitle(equipped ? null : c.id)}
                    >
                      {equipped ? "✓ Equipped (tap to remove)" : "Equip title"}
                    </Button>
                  )}
                  {!unlocked && (
                    <div className="mt-1 border-[3px] border-foreground bg-secondary py-1.5 text-center text-xs">
                      🔒 Lv.{c.unlockLevel}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
