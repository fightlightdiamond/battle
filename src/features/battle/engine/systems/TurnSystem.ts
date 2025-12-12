import type { BattleState, CombatantRole } from "../core/types";
import { getOppositeRole } from "../core/config";

// ============================================================================
// TURN SYSTEM INTERFACE
// ============================================================================

export interface TurnSystem {
  getNextAttacker(currentAttacker: CombatantRole): CombatantRole;
  advanceTurn(state: BattleState): BattleState;
}

// ============================================================================
// TURN SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a TurnSystem instance for managing turn alternation.
 *
 * Responsibilities:
 * - Alternate between challenger and opponent (Property 4)
 * - Advance turn counter immutably
 *
 * Requirements: 2.3
 */
export function createTurnSystem(): TurnSystem {
  return {
    /**
     * Get the next attacker based on current attacker.
     * Alternates between challenger and opponent (Property 4).
     *
     * @param currentAttacker - The current attacker role
     * @returns The next attacker role (opposite of current)
     */
    getNextAttacker(currentAttacker: CombatantRole): CombatantRole {
      return getOppositeRole(currentAttacker);
    },

    /**
     * Advance the turn, switching the current attacker and incrementing turn count.
     * This is an immutable operation - the original state is not modified.
     *
     * @param state - The current battle state
     * @returns New BattleState with updated turn and currentAttacker
     */
    advanceTurn(state: BattleState): BattleState {
      const nextAttacker = this.getNextAttacker(state.currentAttacker);

      return {
        ...state,
        turn: state.turn + 1,
        currentAttacker: nextAttacker,
      };
    },
  };
}

// Default singleton instance
export const turnSystem = createTurnSystem();
