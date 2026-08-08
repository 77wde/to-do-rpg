"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { GTD_ORDER, suggestReward } from "@/lib/constants";
import { todayStr, parseDateStr } from "@/lib/dates";
import { uid } from "@/lib/ids";
import type { GtdCategory, Quest } from "@/lib/types";
import { CategoryLabel } from "./CategoryTag";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FOCUS_MINUTES = [5, 10, 15, 20, 25, 30];

/** The quest entry form, shown inside the bottom drawer. */
export default function QuestComposer({ onDone }: { onDone: () => void }) {
  const { addQuest } = useStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GtdCategory>("inbox");
  const [estimate, setEstimate] = useState(25);
  const [isDaily, setIsDaily] = useState(false);
  // Only meaningful for the calendar category, but kept across switches so
  // toggling away and back does not lose the picked day.
  const [dueDate, setDueDate] = useState(todayStr());

  const scheduled = category === "calendar";

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
      dueDate: scheduled ? dueDate : undefined,
    };
    addQuest(quest);
    // Reset so the drawer is clean the next time it opens.
    setTitle("");
    setIsDaily(false);
    setDueDate(todayStr());
    onDone();
  }

  const reward = suggestReward(estimate);

  return (
    // `flex-1 min-h-0` rather than a fixed cap: the drawer sizes itself to the
    // content (and animates the change), so the form only starts scrolling once
    // the sheet has grown as tall as it is allowed to.
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="quest-title" className="font-pixel text-[10px] tracking-widest">
          QUEST
        </Label>
        <Input
          id="quest-title"
          placeholder="e.g. Read 30 pages"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="quest-category" className="font-pixel text-[10px] tracking-widest">
            WHERE
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as GtdCategory)}
          >
            <SelectTrigger id="quest-category" aria-label="Category">
              <SelectValue>
                {(v: GtdCategory) => <CategoryLabel category={v} short />}
              </SelectValue>
            </SelectTrigger>
            {/* Opens upward: the form sits at the bottom of the drawer, so a
                downward list is clipped by the sheet and has to be scrolled.
                `alignItemWithTrigger` has to go — while it is on, Base UI
                overlays the popup on the trigger and ignores `side`. */}
            <SelectContent side="top" alignItemWithTrigger={false}>
              {GTD_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  <CategoryLabel category={k} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="quest-estimate" className="font-pixel text-[10px] tracking-widest">
            FOCUS
          </Label>
          <Select
            value={estimate}
            onValueChange={(v) => setEstimate(Number(v))}
          >
            <SelectTrigger id="quest-estimate" aria-label="Focus length">
              <SelectValue>{(v: number) => `⏱ ${v} min`}</SelectValue>
            </SelectTrigger>
            {/* Opens upward: the form sits at the bottom of the drawer, so a
                downward list is clipped by the sheet and has to be scrolled.
                `alignItemWithTrigger` has to go — while it is on, Base UI
                overlays the popup on the trigger and ignores `side`. */}
            <SelectContent side="top" alignItemWithTrigger={false}>
              {FOCUS_MINUTES.map((m) => (
                <SelectItem key={m} value={m}>
                  ⏱ {m} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* A calendar quest is defined by its day, so the picker only appears for
          that category. It stays mounted and animates open through a 0fr→1fr
          grid row: the drawer sizes itself to its content, so growing the row
          over 300ms is what makes the sheet rise smoothly instead of snapping.
          `-mb-3` cancels the parent's gap while collapsed. */}
      <div
        aria-hidden={!scheduled}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          scheduled ? "grid-rows-[1fr] opacity-100" : "-mb-3 grid-rows-[0fr] opacity-0",
        )}
      >
        <div
          className={cn("min-h-0 overflow-hidden", !scheduled && "pointer-events-none")}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="font-pixel text-[10px] tracking-widest">WHEN</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                📅 {dueDate}
              </span>
            </div>
            <Calendar
              mode="single"
              required
              selected={parseDateStr(dueDate)}
              onSelect={(d) => d && setDueDate(todayStr(d))}
              defaultMonth={parseDateStr(dueDate)}
              disabled={!scheduled}
              className="border-[3px] border-foreground"
            />
          </div>
        </div>
      </div>

      <Label className="flex cursor-pointer items-center gap-2 text-xs font-normal">
        <Checkbox checked={isDaily} onCheckedChange={(v) => setIsDaily(v === true)} />
        ☀️ Repeat daily · penalty if missed
      </Label>

      {/* Sticky so the submit stays reachable on a short screen, where the
          calendar makes the form taller than the sheet can grow. */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex items-center justify-between gap-2 bg-popover px-4 pt-2">
        <span className="text-[11px] tabular-nums text-muted-foreground">
          +{reward.xp} XP · +{reward.gold} G
        </span>
        <Button type="submit" size="lg" disabled={!title.trim()}>
          + Add quest
        </Button>
      </div>
    </form>
  );
}
