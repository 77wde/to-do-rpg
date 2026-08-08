"use client";
import { useStore } from "@/lib/store";
import { CONSUMABLE_IDS, SHOP } from "@/lib/constants";
import type { ShopItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ShopItem["kind"], string> = {
  skin: "Character Skins",
  item: "Consumables",
  companion: "Companions",
};

export default function ShopView() {
  const { state, buy, useItem, equipSkin } = useStore();
  if (!state) return null;
  const p = state.player;

  const groups: ShopItem["kind"][] = ["skin", "companion", "item"];

  return (
    <div className="flex flex-col gap-5">
      {/* No gold counter here — the header carries it on every tab. */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Shop</h2>
        <p className="text-xs text-muted-foreground">
          Spend the gold you earned from quests.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{KIND_LABEL[g]}</h3>
          {/* One column: at handset width a two-up grid squeezes the buy
              buttons below a comfortable tap target. */}
          <div className="flex flex-col gap-2.5">
            {SHOP.filter((s) => s.kind === g).map((item) => {
              const owned = p.owned.includes(item.id);
              const consumable = CONSUMABLE_IDS.has(item.id);
              const equipped = p.equippedSkin === item.id;
              const locked = item.reqLevel != null && p.level < item.reqLevel;
              const canAfford = p.gold >= item.price;

              return (
                <Card
                  key={item.id}
                  size="sm"
                  className={cn(equipped && "border-[var(--success)]")}
                >
                  <CardContent className="flex gap-3">
                    <div className="text-4xl leading-none" aria-hidden>
                      {item.glyph}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{item.name}</span>
                        {item.price === 0 ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Default
                          </span>
                        ) : (
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--gold)]">
                            {item.price} G
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                      {item.reqLevel && (
                        <span
                          className={cn(
                            "text-xs",
                            locked ? "text-destructive" : "text-[var(--success)]",
                          )}
                        >
                          Requires Lv.{item.reqLevel}
                        </span>
                      )}

                      <div className="mt-1 flex flex-col gap-1.5">
                        {locked ? (
                          <Button size="sm" variant="outline" disabled className="w-full">
                            🔒 Lv.{item.reqLevel}
                          </Button>
                        ) : g === "skin" ? (
                          owned ? (
                            <Button
                              size="sm"
                              variant={equipped ? "default" : "outline"}
                              className={cn("w-full", equipped && "bg-[var(--success)]")}
                              onClick={() => equipSkin(item.id)}
                              disabled={equipped}
                            >
                              {equipped ? "✓ Equipped" : "Equip"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => buy(item)}
                              disabled={!canAfford}
                            >
                              {canAfford ? "Buy" : "Not enough gold"}
                            </Button>
                          )
                        ) : consumable ? (
                          <>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => buy(item)}
                              disabled={!canAfford}
                            >
                              {canAfford ? "Buy" : "Not enough gold"}
                            </Button>
                            {owned && item.id === "item-potion" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => useItem(item.id)}
                              >
                                🧪 Use (HP+30)
                              </Button>
                            )}
                            {owned && item.id === "item-shield" && (
                              <span className="text-center text-xs text-[var(--success)]">
                                🛡️ Owned (auto-defends)
                              </span>
                            )}
                          </>
                        ) : owned ? (
                          <Button
                            size="sm"
                            className="w-full bg-[var(--success)]"
                            disabled
                          >
                            ✓ Owned
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => buy(item)}
                            disabled={!canAfford}
                          >
                            {canAfford ? "Buy" : "Not enough gold"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
