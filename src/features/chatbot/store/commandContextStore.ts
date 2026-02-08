/**
 * Command Context Store - Zustand state management for chatbot conversation context
 * Requirements: 8.1, 8.5
 *
 * This store tracks the last referenced entities (card, weapon, gem, battle) and
 * the current conversation language to enable context-aware follow-up commands.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Card } from "../../cards/types/card";
import type { Weapon } from "../../weapons/types/weapon";
import type { Gem } from "../../gems/types/gem";
import type { BattleRecord } from "../../battle/types";
import type { Language } from "../types";

/**
 * Command context state
 */
interface CommandContextState {
  /** Last referenced card */
  lastCard?: Card;
  /** Last referenced weapon */
  lastWeapon?: Weapon;
  /** Last referenced gem */
  lastGem?: Gem;
  /** Last battle reference */
  lastBattle?: BattleRecord;
  /** Current conversation language */
  language: Language;
}

/**
 * Command context actions
 */
interface CommandContextActions {
  /** Update last referenced card */
  setLastCard(card: Card): void;
  /** Update last referenced weapon */
  setLastWeapon(weapon: Weapon): void;
  /** Update last referenced gem */
  setLastGem(gem: Gem): void;
  /** Update last battle reference */
  setLastBattle(battle: BattleRecord): void;
  /** Update conversation language */
  setLanguage(lang: Language): void;
  /** Clear all context */
  clear(): void;
}

/**
 * Combined store type
 */
export type CommandContextStore = CommandContextState & CommandContextActions;

/**
 * Initial state
 */
const initialState: CommandContextState = {
  lastCard: undefined,
  lastWeapon: undefined,
  lastGem: undefined,
  lastBattle: undefined,
  language: "en",
};

/**
 * Command Context Zustand Store
 *
 * Tracks conversation context for follow-up commands:
 * - Last referenced entities (card, weapon, gem, battle)
 * - Current conversation language (vi/en/mixed)
 *
 * Example usage:
 * ```typescript
 * const { lastCard, setLastCard, clear } = useCommandContextStore();
 *
 * // Set context after command execution
 * setLastCard(createdCard);
 *
 * // Use context in follow-up commands
 * if (lastCard) {
 *   // "equip weapon to it" can use lastCard
 * }
 *
 * // Clear context when switching command categories
 * clear();
 * ```
 */
export const useCommandContextStore = create<CommandContextStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setLastCard: (card: Card) =>
        set({ lastCard: card }, false, "setLastCard"),

      setLastWeapon: (weapon: Weapon) =>
        set({ lastWeapon: weapon }, false, "setLastWeapon"),

      setLastGem: (gem: Gem) => set({ lastGem: gem }, false, "setLastGem"),

      setLastBattle: (battle: BattleRecord) =>
        set({ lastBattle: battle }, false, "setLastBattle"),

      setLanguage: (lang: Language) =>
        set({ language: lang }, false, "setLanguage"),

      clear: () => set(initialState, false, "clear"),
    }),
    { name: "command-context-store" },
  ),
);

// ============================================================================
// Selectors for optimized re-renders
// ============================================================================

export const selectLastCard = (state: CommandContextStore) => state.lastCard;
export const selectLastWeapon = (state: CommandContextStore) =>
  state.lastWeapon;
export const selectLastGem = (state: CommandContextStore) => state.lastGem;
export const selectLastBattle = (state: CommandContextStore) =>
  state.lastBattle;
export const selectLanguage = (state: CommandContextStore) => state.language;

/**
 * Check if any entity context exists
 */
export const selectHasContext = (state: CommandContextStore): boolean =>
  !!(state.lastCard || state.lastWeapon || state.lastGem || state.lastBattle);

/**
 * Get all context as a single object
 */
export const selectAllContext = (
  state: CommandContextStore,
): CommandContextState => ({
  lastCard: state.lastCard,
  lastWeapon: state.lastWeapon,
  lastGem: state.lastGem,
  lastBattle: state.lastBattle,
  language: state.language,
});
