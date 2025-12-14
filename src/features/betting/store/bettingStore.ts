/**
 * Betting Store - Zustand state management for Betting System
 * Requirements: 6.1, 6.2, 6.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 1.1, 1.2, 1.3
 */

import { create } from "zustand";
import type { BettingState, ActiveBet, BetRecord } from "../types/betting";
import { DAILY_BONUS_AMOUNT, PAYOUT_MULTIPLIER } from "../types/betting";
import { dailyBonusService } from "../services/dailyBonusService";
import { bettingService } from "../services/bettingService";
import { useBattleStore } from "../../battle/store/battleStore";
import { BATTLE_PHASES } from "../../battle/types/battle";

// Local storage key for gold balance
const GOLD_BALANCE_STORAGE_KEY = "betting_gold_balance";

/**
 * Betting store actions interface
 */
export interface BettingActions {
  placeBet: (cardId: string, amount: number) => boolean;
  resolveBet: (
    winnerId: string,
    winnerName: string,
    battleId: string,
    selectedCardName: string
  ) => Promise<BetRecord | null>;
  claimDailyBonus: () => boolean;
  checkDailyBonus: () => boolean;
  loadBalance: () => void;
  clearActiveBet: () => void;
  setCanPlaceBet: (canPlace: boolean) => void;
}

/**
 * Combined store interface
 */
export type BettingStoreState = BettingState & BettingActions;

/**
 * Get initial gold balance from local storage
 */
const getStoredBalance = (): number => {
  try {
    const stored = localStorage.getItem(GOLD_BALANCE_STORAGE_KEY);
    if (stored) {
      const balance = parseInt(stored, 10);
      return isNaN(balance) ? 0 : balance;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 0;
};

/**
 * Persist gold balance to local storage
 * Requirements: 6.3
 */
const persistBalance = (balance: number): void => {
  try {
    localStorage.setItem(GOLD_BALANCE_STORAGE_KEY, String(balance));
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Initial state factory
 */
const createInitialState = (): BettingState => ({
  goldBalance: getStoredBalance(),
  activeBet: null,
  canPlaceBet: true,
  dailyBonusClaimed: !dailyBonusService.canClaimToday(),
});

/**
 * Generate a unique ID for bet records
 */
const generateBetId = (): string => {
  return `bet-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Betting store using Zustand
 */
export const useBettingStore = create<BettingStoreState>((set, get) => ({
  ...createInitialState(),

  /**
   * Place a bet on a card
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   *
   * @param cardId - The ID of the card to bet on
   * @param amount - The amount of gold to bet
   * @returns true if bet was placed successfully, false otherwise
   */
  placeBet: (cardId: string, amount: number): boolean => {
    const { goldBalance, canPlaceBet } = get();

    // Validate bet amount > 0 (Requirements: 2.3)
    if (amount <= 0) {
      return false;
    }

    // Validate bet amount <= balance (Requirements: 2.2)
    if (amount > goldBalance) {
      return false;
    }

    // Validate battle phase is not 'fighting' (Requirements: 2.5)
    const battlePhase = useBattleStore.getState().phase;
    if (battlePhase === BATTLE_PHASES.FIGHTING) {
      return false;
    }

    // Check if betting is allowed
    if (!canPlaceBet) {
      return false;
    }

    // Deduct bet amount from balance immediately (Requirements: 2.4)
    const newBalance = goldBalance - amount;

    // Store active bet with cardId and amount (Requirements: 2.1)
    const activeBet: ActiveBet = {
      selectedCardId: cardId,
      betAmount: amount,
    };

    // Update state and persist balance
    set({
      goldBalance: newBalance,
      activeBet,
    });

    // Persist balance to local storage (Requirements: 6.3)
    persistBalance(newBalance);

    return true;
  },

  /**
   * Resolve a bet after battle ends
   * Requirements: 3.1, 3.2, 3.3, 4.1
   *
   * @param winnerId - The ID of the winning card
   * @param winnerName - The name of the winning card
   * @param battleId - The ID of the battle
   * @param selectedCardName - The name of the selected card
   * @returns The created BetRecord or null if no active bet
   */
  resolveBet: async (
    winnerId: string,
    winnerName: string,
    battleId: string,
    selectedCardName: string
  ): Promise<BetRecord | null> => {
    const { activeBet, goldBalance } = get();

    if (!activeBet) {
      return null;
    }

    // Calculate payout (Requirements: 3.1, 3.2)
    const isWin = activeBet.selectedCardId === winnerId;
    const payoutAmount = isWin ? activeBet.betAmount * PAYOUT_MULTIPLIER : 0;
    const result: "win" | "lose" = isWin ? "win" : "lose";

    // Update gold balance with payout (Requirements: 3.3)
    const newBalance = goldBalance + payoutAmount;

    // Create BetRecord (Requirements: 4.1, 4.2)
    const betRecord: BetRecord = {
      id: generateBetId(),
      battleId,
      betAmount: activeBet.betAmount,
      selectedCardId: activeBet.selectedCardId,
      selectedCardName,
      winnerCardId: winnerId,
      winnerCardName: winnerName,
      payoutAmount,
      result,
      timestamp: Date.now(),
    };

    // Update state
    set({
      goldBalance: newBalance,
      activeBet: null,
    });

    // Persist balance to local storage (Requirements: 6.3)
    persistBalance(newBalance);

    // Save bet record to server (Requirements: 4.1)
    try {
      await bettingService.saveBetRecord(betRecord);
    } catch (error) {
      // TODO: Queue for retry (Requirements: 4.3)
      console.error("Failed to save bet record:", error);
    }

    return betRecord;
  },

  /**
   * Claim daily bonus
   * Requirements: 1.1, 1.2, 1.3
   *
   * @returns true if bonus was claimed, false if already claimed today
   */
  claimDailyBonus: (): boolean => {
    // Check if bonus can be claimed (Requirements: 1.1, 1.2)
    if (!dailyBonusService.canClaimToday()) {
      return false;
    }

    const { goldBalance } = get();

    // Credit bonus to balance (Requirements: 1.1)
    const newBalance = goldBalance + DAILY_BONUS_AMOUNT;

    // Record claim timestamp (Requirements: 1.3)
    dailyBonusService.recordClaim();

    // Update state
    set({
      goldBalance: newBalance,
      dailyBonusClaimed: true,
    });

    // Persist balance to local storage (Requirements: 6.3)
    persistBalance(newBalance);

    return true;
  },

  /**
   * Check if daily bonus can be claimed
   * @returns true if bonus is available
   */
  checkDailyBonus: (): boolean => {
    const canClaim = dailyBonusService.canClaimToday();
    set({ dailyBonusClaimed: !canClaim });
    return canClaim;
  },

  /**
   * Load balance from local storage
   * Requirements: 6.1
   */
  loadBalance: (): void => {
    const balance = getStoredBalance();
    set({ goldBalance: balance });
  },

  /**
   * Clear active bet without resolving
   */
  clearActiveBet: (): void => {
    set({ activeBet: null });
  },

  /**
   * Set whether betting is allowed
   */
  setCanPlaceBet: (canPlace: boolean): void => {
    set({ canPlaceBet: canPlace });
  },
}));

// ============================================================================
// SELECTORS - Derived state
// ============================================================================

export const selectGoldBalance = (state: BettingState): number =>
  state.goldBalance;

export const selectActiveBet = (state: BettingState): ActiveBet | null =>
  state.activeBet;

export const selectCanPlaceBet = (state: BettingState): boolean =>
  state.canPlaceBet;

export const selectDailyBonusClaimed = (state: BettingState): boolean =>
  state.dailyBonusClaimed;

export const selectHasActiveBet = (state: BettingState): boolean =>
  state.activeBet !== null;

export const selectCanAffordBet =
  (amount: number) =>
  (state: BettingState): boolean =>
    state.goldBalance >= amount && amount > 0;
