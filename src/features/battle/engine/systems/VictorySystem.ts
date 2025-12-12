import type { Combatant, BattleState, BattleResult } from "../core/types";
import { COMBATANT_ROLES } from "../core/types";

// ============================================================================
// VICTORY SYSTEM INTERFACE
// ============================================================================

export interface VictorySystem {
  isDefeated(combatant: Combatant): boolean;
  checkVictory(state: BattleState): BattleResult | null;
}

// ============================================================================
// VICTORY SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a VictorySystem instance for handling win/lose detection.
 *
 * Responsibilities:
 * - Determine if a combatant is defeated (HP <= 0)
 * - Check battle state for victory conditions
 * - Return battle result when victory is achieved
 *
 * Requirements: 2.4, 2.5
 */
export function createVictorySystem(): VictorySystem {
  return {
    /**
     * Check if a combatant is defeated.
     * A combatant is defeated when their currentHp is <= 0.
     *
     * Property 5: For any combatant with currentHp <= 0, isDefeated SHALL be true.
     * Validates: Requirements 2.4
     *
     * @param combatant - The combatant to check
     * @returns true if combatant is defeated, false otherwise
     */
    isDefeated(combatant: Combatant): boolean {
      return combatant.currentHp <= 0;
    },

    /**
     * Check if the battle has a winner.
     * Returns BattleResult if one combatant is defeated, null otherwise.
     *
     * Property 6: For any battle state where challenger.currentHp <= 0,
     * result SHALL be opponent_wins. For opponent.currentHp <= 0,
     * result SHALL be challenger_wins.
     * Validates: Requirements 2.5
     *
     * @param state - The current battle state
     * @returns BattleResult if victory achieved, null if battle continues
     */
    checkVictory(state: BattleState): BattleResult | null {
      // Check if challenger is defeated - opponent wins
      if (state.challenger.currentHp <= 0) {
        return {
          winner: COMBATANT_ROLES.OPPONENT,
          winnerName: state.opponent.name,
          totalTurns: state.turn,
        };
      }

      // Check if opponent is defeated - challenger wins
      if (state.opponent.currentHp <= 0) {
        return {
          winner: COMBATANT_ROLES.CHALLENGER,
          winnerName: state.challenger.name,
          totalTurns: state.turn,
        };
      }

      // No victory yet - battle continues
      return null;
    },
  };
}

// Default singleton instance
export const victorySystem = createVictorySystem();
