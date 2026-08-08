"use client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  reward: "bg-foreground text-canvas",
  level: "bg-primary text-primary-foreground",
  bad: "bg-destructive text-white",
} as const;

export default function Toasts() {
  const { toasts } = useStore();

  return (
    // Pinned inside the phone shell rather than the viewport, so toasts stay
    // over the app instead of drifting into the desktop bezel.
    <div
      // Sits above the bottom tab bar rather than behind it.
      className="pointer-events-none fixed bottom-24 left-1/2 z-60 flex w-full max-w-[430px] -translate-x-1/2 flex-col items-center gap-2.5 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "inline-flex animate-[pop_0.24s_cubic-bezier(0.22,1,0.36,1)_both] items-center gap-2.5 border-[3px] border-foreground px-4 py-2.5 text-sm font-semibold shadow-[4px_4px_0_0_var(--foreground)]",
            TONE_CLASS[t.tone],
          )}
        >
          <span className="text-lg" aria-hidden>
            {t.glyph}
          </span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
