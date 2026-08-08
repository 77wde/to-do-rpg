"use client";
import { useStore } from "@/lib/store";
import { CONSUMABLE_IDS, SHOP } from "@/lib/constants";
import type { ShopItem } from "@/lib/types";

const KIND_LABEL: Record<ShopItem["kind"], string> = {
  skin: "캐릭터 스킨",
  item: "소모품",
  companion: "동료",
};

export default function ShopView() {
  const { state, buy, useItem, equipSkin } = useStore();
  if (!state) return null;
  const p = state.player;

  const groups: ShopItem["kind"][] = ["skin", "companion", "item"];

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="row between wrap" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 4 }}>
          <h2 className="display-sm" style={{ margin: 0 }}>
            상점
          </h2>
          <p className="caption" style={{ margin: 0 }}>
            퀘스트로 모은 골드로 스킨·동료·아이템을 사보세요.
          </p>
        </div>
        <span className="gold-big row">🪙 <b className="mono">{p.gold.toLocaleString()}</b> G</span>
      </div>

      {groups.map((g) => (
        <section key={g} className="col" style={{ gap: 12 }}>
          <h3 className="title-sm" style={{ margin: 0, color: "var(--muted)" }}>
            {KIND_LABEL[g]}
          </h3>
          <div className="shop-grid">
            {SHOP.filter((s) => s.kind === g).map((item) => {
              const owned = p.owned.includes(item.id);
              const consumable = CONSUMABLE_IDS.has(item.id);
              const equipped = p.equippedSkin === item.id;
              const locked = item.reqLevel != null && p.level < item.reqLevel;
              const canAfford = p.gold >= item.price;

              return (
                <div key={item.id} className={`shop-card ${equipped ? "equipped" : ""}`}>
                  <div className="glyph">{item.glyph}</div>
                  <div className="col grow" style={{ gap: 2 }}>
                    <div className="row between">
                      <span className="title-sm">{item.name}</span>
                      {item.price === 0 ? (
                        <span className="caption">기본</span>
                      ) : (
                        <span className="mono" style={{ color: "var(--gold)", fontWeight: 600 }}>
                          {item.price} G
                        </span>
                      )}
                    </div>
                    <span className="caption">{item.desc}</span>
                    {item.reqLevel && (
                      <span className="caption" style={{ color: locked ? "var(--error)" : "var(--success)" }}>
                        Lv.{item.reqLevel} 필요
                      </span>
                    )}
                  </div>

                  <div className="actions">
                    {locked ? (
                      <button className="btn btn-secondary btn-sm btn-block" disabled>
                        🔒 Lv.{item.reqLevel}
                      </button>
                    ) : g === "skin" ? (
                      owned ? (
                        <button
                          className="btn btn-sm btn-block"
                          style={
                            equipped
                              ? { background: "var(--success)", color: "#fff" }
                              : { background: "var(--surface-card)", border: "1px solid var(--hairline-strong)" }
                          }
                          onClick={() => equipSkin(item.id)}
                          disabled={equipped}
                        >
                          {equipped ? "✓ 착용 중" : "착용하기"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm btn-block"
                          onClick={() => buy(item)}
                          disabled={!canAfford}
                        >
                          {canAfford ? "구매" : "골드 부족"}
                        </button>
                      )
                    ) : consumable ? (
                      <div className="col" style={{ gap: 6 }}>
                        <button
                          className="btn btn-primary btn-sm btn-block"
                          onClick={() => buy(item)}
                          disabled={!canAfford}
                        >
                          {canAfford ? "구매" : "골드 부족"}
                        </button>
                        {owned && item.id === "item-potion" && (
                          <button className="btn btn-secondary btn-sm btn-block" onClick={() => useItem(item.id)}>
                            🧪 사용 (HP+30)
                          </button>
                        )}
                        {owned && item.id === "item-shield" && (
                          <span className="caption" style={{ textAlign: "center", color: "var(--success)" }}>
                            🛡️ 보유 중 (자동 방어)
                          </span>
                        )}
                      </div>
                    ) : owned ? (
                      <button className="btn btn-sm btn-block" style={{ background: "var(--success)", color: "#fff" }} disabled>
                        ✓ 보유 중
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm btn-block"
                        onClick={() => buy(item)}
                        disabled={!canAfford}
                      >
                        {canAfford ? "구매" : "골드 부족"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <style jsx>{`
        .gold-big {
          gap: 6px;
          font-size: 18px;
          color: var(--gold);
        }
        .gold-big b {
          color: var(--ink);
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .shop-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-lg);
          padding: 16px;
        }
        .shop-card.equipped {
          border-color: var(--success);
          box-shadow: 0 0 0 1px var(--success);
        }
        .glyph {
          font-size: 40px;
          line-height: 1;
        }
        .actions {
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}
