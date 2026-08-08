"use client";
import { useStore } from "@/lib/store";
import type { LogEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    // The card takes the whole tab and scrolls its own list, so its heading and
    // the entry count stay put while you read back.
    <Card size="sm" className="min-h-0 flex-1">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Story</CardTitle>
        <span className="text-xs text-muted-foreground">
          {state.player.totalCompleted} done
        </span>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {state.log.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nothing has happened yet. Complete a quest to start your story.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-3">
            {state.log.map((e) => (
              <li key={e.id} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 size-2 shrink-0"
                  style={{ background: TONE[e.kind] }}
                  aria-hidden
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm leading-snug">{e.text}</span>
                  <span className="text-xs text-muted-foreground">{ago(e.ts)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
