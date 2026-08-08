"use client";
import { useStore } from "@/lib/store";
import { GTD, GTD_ORDER } from "@/lib/constants";
import type { GtdCategory, Quest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CategoryChip, CategoryLabel } from "./CategoryTag";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "border-[3px] border-foreground bg-card p-3 shadow-[4px_4px_0_0_var(--foreground)]",
        done && "opacity-60 shadow-none",
      )}
    >
      {/* No separate checkbox: the DONE button already completes the quest,
          and a finished one reads as done from the strikethrough alone. */}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[15px] leading-snug font-semibold",
              done && "text-muted-foreground line-through",
            )}
          >
            {quest.title}
          </span>
          <CategoryChip category={quest.category} />
        </div>

        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] tabular-nums">
          <span>⏱ {quest.estimateMin} min</span>
          <span className="text-[var(--xp)]">+{quest.xpReward} XP</span>
          <span className="text-[var(--gold)]">+{quest.goldReward} G</span>
          {quest.isDaily && <span>☀️ Daily</span>}
          {quest.dueDate && <span>📅 {quest.dueDate}</span>}
        </div>

        {!done && (
          /* One row, no wrapping: the move menu flexes and the rest hold their
             width, so four controls fit even at handset size. */
          <div className="mt-1 flex items-center gap-1.5">
            {/* Icon-only: the glyphs carry the meaning and the freed width goes
                to the category menu, which has to hold a full label. */}
            <Button
              size="icon-sm"
              className="shrink-0"
              aria-label="Start focus"
              title="Start"
              onClick={() => onFocus(quest)}
            >
              ▶
            </Button>

            <ConfirmButton
              trigger={
                <Button
                  size="icon-sm"
                  className="shrink-0 bg-success text-white hover:opacity-90"
                  aria-label="Complete quest"
                  title="Done"
                >
                  ✓
                </Button>
              }
              title="Complete this quest?"
              description={`You'll earn +${quest.xpReward} XP and +${quest.goldReward} G.`}
              confirmLabel="Complete"
              onConfirm={() => completeQuest(quest.id)}
            />

            {/* Category move, as a menu rather than a native select. */}
            <DropdownMenu>
              {/* Styled like the Buttons beside it — same outline, hard offset
                  shadow and press — but hand-rolled rather than buttonVariants,
                  which centers and uppercases its label. */}
              <DropdownMenuTrigger
                aria-label="Move category"
                className="flex h-9 min-w-0 flex-1 items-center justify-between gap-1 border-[3px] border-foreground bg-card px-2 text-xs shadow-[3px_3px_0_0_var(--foreground)] transition-[translate,box-shadow] duration-100 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transition-none"
              >
                <CategoryLabel category={quest.category} className="min-w-0" />
                <span aria-hidden>▾</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {GTD_ORDER.map((k) => (
                  <DropdownMenuItem
                    key={k}
                    onClick={() => moveQuest(quest.id, k as GtdCategory)}
                  >
                    <span
                      className="size-2.5 border-2 border-foreground"
                      style={{ background: GTD[k].color }}
                      aria-hidden
                    />
                    <CategoryLabel category={k} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmButton
              trigger={
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0"
                  aria-label="Delete quest"
                  title="Delete"
                >
                  ✕
                </Button>
              }
              title="Delete this quest?"
              description="It will be removed for good. This cannot be undone."
              confirmLabel="Delete"
              destructive
              onConfirm={() => deleteQuest(quest.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Wraps a trigger so the action only runs after an explicit confirmation. */
function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  // Base UI's `render` clones the element, so it needs an element — not any
  // ReactNode.
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(destructive && "bg-destructive text-white")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
