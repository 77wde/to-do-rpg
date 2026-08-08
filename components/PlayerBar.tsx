"use client";
import { useStore, shopItem } from "@/lib/store";
import { xpToNext } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** XP and HP bars are game chrome, not form progress — kept as plain bars so
 *  the fill color and chunky outline stay under direct control. */
function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel w-8 shrink-0 text-[11px] tracking-widest text-foreground">
        {label}
      </span>
      <div className="h-3 flex-1 border-[3px] border-foreground bg-card">
        <span className="block h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">
        {value}/{max}
      </span>
    </div>
  );
}

export default function PlayerBar() {
  const { state, logout } = useStore();
  if (!state) return null;
  const p = state.player;
  const skin = shopItem(p.equippedSkin);
  const hpPct = (p.hp / p.maxHp) * 100;

  return (
    <div className="flex flex-col gap-2 px-4 py-2.5">
      {/* Identity — tapping the profile opens the account menu, which keeps
          the sign-out control out of the permanently pinned header. */}
      <div className="flex items-center gap-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-2.5 text-left">
            <span
              className="grid size-9 shrink-0 place-items-center border-[3px] border-foreground bg-card text-xl"
              aria-hidden
            >
              {skin?.glyph ?? "🧑‍🚀"}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5">
                <strong className="truncate text-sm font-semibold">{p.nickname}</strong>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  Lv.{p.level}
                </Badge>
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {p.streak > 0 ? `🔥 ${p.streak}-day streak` : "Let's get started today"}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="ml-auto flex shrink-0 items-center gap-1.5 border-[3px] border-foreground bg-card px-2 py-1">
          <span aria-hidden>🪙</span>
          <span className="text-xs font-semibold tabular-nums">
            {p.gold.toLocaleString()}
          </span>
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1">
        <StatBar label="XP" value={p.xp} max={xpToNext(p.level)} color="var(--xp)" />
        <StatBar
          label="HP"
          value={p.hp}
          max={p.maxHp}
          color={hpPct < 30 ? "var(--error)" : "var(--hp)"}
        />
      </div>
    </div>
  );
}
