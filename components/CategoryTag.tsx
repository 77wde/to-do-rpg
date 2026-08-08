// ============================================================================
// The single place a GTD category is rendered.
//
// Every surface that names a category — map regions, quest badges, filters,
// section headers, the move menu, drawer headers — goes through these, so the
// emoji and color stay identical wherever the category shows up.
// ============================================================================
import { GTD } from "@/lib/constants";
import type { GtdCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Just the emoji. Decorative — the label beside it carries the meaning. */
export function CategoryGlyph({
  category,
  className,
}: {
  category: GtdCategory;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("leading-none", className)}>
      {GTD[category].glyph}
    </span>
  );
}

/** Emoji + name. The default way to refer to a category inline. */
export function CategoryLabel({
  category,
  short = false,
  className,
}: {
  category: GtdCategory;
  /** Use the abbreviated name (IN, NEXT, …) where space is tight. */
  short?: boolean;
  className?: string;
}) {
  const meta = GTD[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryGlyph category={category} />
      <span className="truncate">{short ? meta.short : meta.label}</span>
    </span>
  );
}

/** Filled chip in the category color — used on quest cards. */
export function CategoryChip({
  category,
  className,
}: {
  category: GtdCategory;
  className?: string;
}) {
  const meta = GTD[category];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 border-2 border-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        className,
      )}
      style={{ background: meta.color }}
    >
      <CategoryGlyph category={category} className="text-[11px]" />
      {meta.short}
    </span>
  );
}
