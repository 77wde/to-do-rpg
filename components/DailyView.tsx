"use client";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The daily streak card. The dailies themselves are not listed here — they
 * surface in the Next Action group, which borrows everything due today.
 */
export default function DailyView() {
  const { state } = useStore();
  if (!state) return null;
  const p = state.player;

  const dailies = state.quests.filter((q) => q.isDaily);
  const dailyDone = dailies.filter((q) => q.status === "done").length;
  const allDone = dailies.length > 0 && dailyDone === dailies.length;
  const pct = dailies.length ? Math.round((dailyDone / dailies.length) * 100) : 0;

  return (
    <Card size="sm" className="bg-[color-mix(in_srgb,var(--primary)_6%,#fff)]">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center border-[3px] border-foreground bg-card text-2xl">
            🔥
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold">{p.streak}-day streak</span>
            <span className="text-xs text-muted-foreground">
              Consecutive days you finished every daily
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] tracking-widest text-muted-foreground">
              TODAY&apos;S PROGRESS
            </span>
            <span className="text-[11px] tabular-nums">
              {dailyDone}/{dailies.length}
            </span>
          </div>
          <div className="h-3 w-full border-[3px] border-foreground bg-card">
            <span
              className="block h-full"
              style={{
                width: `${pct}%`,
                background: allDone ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
