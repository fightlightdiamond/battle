/**
 * Matchup Battle Service - Battle execution for matchups
 *
 * Provides battle execution flow for matchups:
 * - Start matchup and execute battle using BattleEngine
 * - Battle history is saved automatically by BattleEngine
 * - Update matchup with winner and battleHistoryId
 * - Resolve bets after battle completion
 * - Handle matchup cancellation with bet refunds
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1
 */

import { BattleEngine } from "../../battle/engine/core/BattleEngine";
import { cardToCombatant } from "../../battle/engine/adapters/CardAdapter";
import { cardApi } from "../../cards/api/cardApi";
import { matchupService } from "./matchupService";
import { matchupBetService } from "./matchupBetService";
import type { Matchup } from "../types/matchup";
import type { Card } from "../../cards/types";
import type { BattleRecord } from "../../battle/types/battleHistoryTypes";
import { BATTLE_PHASES, COMBATANT_ROLES } from "../../battle/engine/core/types";

/**
 * Result of executing a matchup battle
 */
export interface MatchupBattleResult {
  matchup: Matchup;
  battleRecord: BattleRecord;
  winnerId: string;
  winnerName: string;
}

/**
 * Matchup Battle Service
 *
 * Provides battle execution and resolution for matchups.
 */
export const matchupBattleService = {
  /**
   * Execute a matchup battle
   *
   * This function:
   * 1. Validates the matchup is in pending status
   * 2. Fetches both cards from the API
   * 3. Updates matchup status to "in_progress"
   * 4. Executes the battle using BattleEngine
   * 5. Saves battle history to json-server
   * 6. Updates matchup with winner and battleHistoryId
   *
   * @param matchupId - The matchup ID to execute
   * @returns The battle result with updated matchup and battle record
   * @throws Error if matchup not found, not pending, or cards not found
   *
   * Requirements: 5.1, 5.2, 5.3, 8.1
   */
  async executeMatchupBattle(matchupId: string): Promise<MatchupBattleResult> {
    // 1. Get and validate matchup
    const matchup = await matchupService.getMatchupById(matchupId);
    if (!matchup) {
      throw new Error("Matchup not found");
    }

    if (matchup.status !== "pending") {
      throw new Error("Matchup is not in pending status");
    }

    // 2. Fetch both cards
    const [card1, card2] = await Promise.all([
      cardApi.getById(matchup.card1Id),
      cardApi.getById(matchup.card2Id),
    ]);

    if (!card1) {
      throw new Error(`Card 1 not found: ${matchup.card1Id}`);
    }
    if (!card2) {
      throw new Error(`Card 2 not found: ${matchup.card2Id}`);
    }

    // 3. Update matchup status to "in_progress" (Requirements: 5.1)
    await matchupService.startMatchup(matchupId);

    // 4. Execute battle using BattleEngine (Requirements: 5.2)
    // Note: BattleEngine automatically saves battle record to server
    const battleResult = await this.runBattle(card1 as Card, card2 as Card);

    // 5. Battle history is already saved by BattleEngine (Requirements: 8.1)
    // We just use the returned battleRecord which has the saved ID
    const battleRecord = battleResult.battleRecord;

    // 6. Determine winner info
    const winnerId =
      battleResult.winnerRole === COMBATANT_ROLES.CHALLENGER
        ? card1.id
        : card2.id;
    const winnerName =
      battleResult.winnerRole === COMBATANT_ROLES.CHALLENGER
        ? card1.name
        : card2.name;

    // 7. Update matchup with winner and battleHistoryId (Requirements: 5.3)
    const completedMatchup = await matchupService.completeMatchup(
      matchupId,
      winnerId,
      winnerName,
      battleRecord.id
    );

    return {
      matchup: completedMatchup,
      battleRecord,
      winnerId,
      winnerName,
    };
  },

  /**
   * Run a battle between two cards
   *
   * @param card1 - The first card (challenger)
   * @param card2 - The second card (opponent)
   * @returns Battle result with winner role and battle record
   *
   * Requirements: 5.2
   */
  async runBattle(
    card1: Card,
    card2: Card
  ): Promise<{
    winnerRole: "challenger" | "opponent";
    battleRecord: BattleRecord;
  }> {
    // Convert cards to combatants
    const challenger = cardToCombatant(card1);
    const opponent = cardToCombatant(card2);

    // Create battle engine and initialize battle
    const engine = new BattleEngine();
    engine.initBattle(challenger, opponent);

    // Start battle
    engine.startBattle();

    // Execute battle until finished
    let state = engine.getState();
    while (state && state.phase === BATTLE_PHASES.FIGHTING) {
      engine.executeAttack();
      state = engine.getState();
    }

    // Get battle result
    const finalState = engine.getState();
    if (!finalState || !finalState.result) {
      throw new Error("Battle did not complete properly");
    }

    // Get battle record
    const battleRecord = engine.getLastBattleRecord();
    if (!battleRecord) {
      throw new Error("Battle record not created");
    }

    return {
      winnerRole: finalState.result.winner,
      battleRecord,
    };
  },

  /**
   * Execute matchup battle and resolve all bets
   *
   * This is the main entry point for admin to start a matchup.
   * It executes the battle and then resolves all bets.
   *
   * Note: This method only updates the database records. The player's
   * local gold balance should be updated separately by calling
   * matchupBettingStore.resolveMatchupBets() or by using the
   * matchupStore.executeMatchupBattle() action which handles both.
   *
   * @param matchupId - The matchup ID to execute
   * @returns The battle result
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4
   */
  async executeAndResolveBets(matchupId: string): Promise<MatchupBattleResult> {
    // Execute the battle
    const result = await this.executeMatchupBattle(matchupId);

    // Resolve all bets in database (Requirements: 5.4, 6.1, 6.2, 6.3, 6.4)
    await matchupBetService.resolveBets(matchupId, result.winnerId);

    return result;
  },

  /**
   * Cancel a matchup and refund all bets
   *
   * @param matchupId - The matchup ID to cancel
   * @returns The cancelled matchup
   *
   * Requirements: 6.5
   */
  async cancelMatchupAndRefundBets(matchupId: string): Promise<Matchup> {
    // Get and validate matchup
    const matchup = await matchupService.getMatchupById(matchupId);
    if (!matchup) {
      throw new Error("Matchup not found");
    }

    if (matchup.status !== "pending") {
      throw new Error("Can only cancel pending matchups");
    }

    // Refund all active bets (Requirements: 6.5)
    await matchupBetService.refundBets(matchupId);

    // Cancel the matchup
    const cancelledMatchup = await matchupService.cancelMatchup(matchupId);

    return cancelledMatchup;
  },
};
