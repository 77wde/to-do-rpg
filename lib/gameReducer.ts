// ============================================================================
// QuestLog — the reducer.
//
// Every mutation the UI can trigger, expressed as a transition over GameState.
// The rules themselves live in lib/game.ts; this only routes actions to them
// and holds the few that are pure inventory bookkeeping.
// ============================================================================
import { CONSUMABLE_IDS } from "./constants";
import {
  addQuest,
  applyDailyReset,
  changeHp,
  completeQuest,
  deleteQuest,
  focusFailed,
  grantGold,
  moveQuest,
  pushLog,
} from "./game";
import { newGame } from "./newGame";
import type { GameState, GtdCategory, Quest, ShopItem } from "./types";

export type Action =
  | { type: "hydrate"; state: GameState }
  | { type: "start"; nickname: string }
  | { type: "reset" }
  | { type: "addQuest"; quest: Quest }
  | { type: "completeQuest"; questId: string }
  | { type: "deleteQuest"; questId: string }
  | { type: "moveQuest"; questId: string; category: GtdCategory }
  | { type: "focusFail"; questTitle: string }
  | { type: "grantGold"; gold: number; why: string }
  | { type: "buy"; item: ShopItem }
  | { type: "useItem"; itemId: string }
  | { type: "equipSkin"; skinId: string }
  | { type: "equipTitle"; titleId: string | null }
  | { type: "dailyReset" };

function goldMultiplier(state: GameState): number {
  return state.player.owned.includes("comp-dragon") ? 1.1 : 1;
}

export function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "start":
      return newGame(action.nickname);
    case "reset":
      return null;
  }

  if (!state) return state;

  switch (action.type) {
    case "addQuest":
      return addQuest(state, action.quest);
    case "completeQuest":
      return completeQuest(state, action.questId, goldMultiplier(state));
    case "deleteQuest":
      return deleteQuest(state, action.questId);
    case "moveQuest":
      return moveQuest(state, action.questId, action.category);
    case "focusFail":
      return focusFailed(state, action.questTitle);
    case "grantGold":
      return grantGold(state, action.gold, action.why);
    case "dailyReset":
      return applyDailyReset(state);
    case "buy": {
      const item = action.item;
      if (state.player.gold < item.price) return state;
      const already = state.player.owned.includes(item.id);
      if (already && !CONSUMABLE_IDS.has(item.id)) return state;
      const player = {
        ...state.player,
        gold: state.player.gold - item.price,
        owned: already ? state.player.owned : [...state.player.owned, item.id],
      };
      return pushLog(
        { ...state, player },
        "buy",
        `Bought ${item.glyph} ${item.name} from the shop! -${item.price} G`,
      );
    }
    case "useItem": {
      const id = action.itemId;
      if (!state.player.owned.includes(id)) return state;
      if (id === "item-potion") {
        const player = changeHp(
          { ...state.player, owned: state.player.owned.filter((x) => x !== id) },
          30,
        );
        return pushLog({ ...state, player }, "reward", `🧪 Used a Health Potion! HP +30`);
      }
      return state;
    }
    case "equipSkin": {
      if (!state.player.owned.includes(action.skinId)) return state;
      return { ...state, player: { ...state.player, equippedSkin: action.skinId } };
    }
    case "equipTitle":
      return { ...state, player: { ...state.player, equippedTitle: action.titleId } };
    default:
      return state;
  }
}
