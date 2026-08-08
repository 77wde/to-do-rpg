"use client";
import { useStore } from "@/lib/store";
import { GTD, GTD_ORDER } from "@/lib/constants";
import { questsForRegion } from "@/lib/game";
import type { GtdCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryGlyph, CategoryLabel } from "./CategoryTag";
import { cn } from "@/lib/utils";

export default function MapView({
  onSelectCategory,
}: {
  onSelectCategory: (cat: GtdCategory) => void;
}) {
  const { state } = useStore();
  if (!state) return null;

  const counts = (cat: GtdCategory) => questsForRegion(state.quests, cat).length;

  // A region is "urgent" (colored) when it belongs to an urgent GTD zone and
  // currently holds work — per PRD: Next Action / Calendar light up when there's
  // something to do right now.
  const isUrgent = (cat: GtdCategory) => GTD[cat].urgentByDefault && counts(cat) > 0;

  return (
    // The heading lives in the page so it can sit above the streak card.
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent>
          {/* Two columns at handset width — three squeezes the region labels
              onto three lines each. */}
          <div className="relative grid grid-cols-2 gap-2.5">
            {GTD_ORDER.map((cat) => {
              const n = counts(cat);
              const urgent = isUrgent(cat);
              const meta = GTD[cat];
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={cn(
                    "relative min-h-24 overflow-hidden border-[3px] border-foreground p-2.5 text-left transition-[scale] duration-100 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transition-none",
                    urgent
                      ? "text-foreground"
                      : n > 0
                        ? "bg-[#eceae4] text-foreground grayscale-[0.75]"
                        : "bg-[#eceae4] text-[#8a887f] grayscale",
                  )}
                  style={
                    urgent
                      ? { background: `color-mix(in srgb, ${meta.color} 30%, #fff)` }
                      : undefined
                  }
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-pixel text-[9px] tracking-widest">
                      {meta.short}
                    </span>
                    {n > 0 && (
                      <span
                        className={cn(
                          "grid h-5 min-w-5 place-items-center px-1 text-[11px] font-bold",
                          urgent
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground text-canvas",
                        )}
                      >
                        {n}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{meta.label}</div>
                  <CategoryGlyph
                    category={cat}
                    className="absolute right-1 bottom-0.5 text-3xl opacity-50"
                  />
                  {urgent && (
                    <span
                      className="absolute top-2 right-2 size-2.5 animate-[beacon_1.4s_infinite] bg-primary"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}

          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t-[3px] border-foreground pt-3">
            {GTD_ORDER.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5">
                <span className="size-2.5" style={{ background: GTD[cat].color }} aria-hidden />
                <CategoryLabel category={cat} className="text-[11px] text-muted-foreground" />
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
