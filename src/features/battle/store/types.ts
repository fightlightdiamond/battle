/**
 * Battle Store Types
 * Separated from implementation for clean architecture
 */

import type {
  BattleCard,
  BattleLogEntry,
  BattlePhase,
  BattleResult,
  CurrentAttacker,
  AttackResult,
} from "../types";
import type { Card } from "../../cards/types";

// ============================================
// Battle Store Types
// ============================================

/**
 * Battle mode type - 'classic' or 'arena'
 */
export type BattleMode = "classic" | "arena";

/**
 * Battle store state interface (immutable via Readonly)
 */
export interface BattleState {
  readonly phase: BattlePhase;
  readonly challenger: Readonly<BattleCard> | null;
  readonly opponent: Readonly<BattleCard> | null;
  readonly currentAttacker: CurrentAttacker;
  readonly battleLog: ReadonlyArray<Readonly<BattleLogEntry>>;
  readonly result: BattleResult;
  readonly isAutoBattle: boolean;
  readonly battleMode: BattleMode;
}

/**
 * Battle store actions interface
 */
export interface BattleActions {
  selectChallenger: (card: Card) => Promise<boolean>;
  selectOpponent: (card: Card) => Promise<boolean>;
  setBattleMode: (mode: BattleMode) => void;
  startBattle: () => void;
  executeAttack: () => AttackResult | null;
  toggleAutoBattle: () => void;
  resetBattle: () => void;
}

/**
 * Combined store interface
 */
export type BattleStoreState = BattleState & BattleActions;

// ============================================
// Arena Battle Store Types
// ============================================

import type { CellIndex, ArenaPhase } from "../../arena1d/types/arena";
import type { BattleCardGems } from "../../gems/types";

/**
 * Arena Battle store state interface
 * Updated for Gem Skill System Requirements: 2.4, 9.4
 */
export interface ArenaBattleState {
  readonly challenger: Readonly<BattleCard> | null;
  readonly opponent: Readonly<BattleCard> | null;
  readonly leftPosition: CellIndex;
  readonly rightPosition: CellIndex;
  readonly arenaPhase: ArenaPhase;
  readonly currentTurn: "challenger" | "opponent";
  readonly battleLog: ReadonlyArray<Readonly<BattleLogEntry>>;
  readonly result: BattleResult;
  readonly isAutoBattle: boolean;
  /** Gem states for challenger card (Requirements: 2.4, 9.4) */
  readonly challengerGems: BattleCardGems | null;
  /** Gem states for opponent card (Requirements: 2.4, 9.4) */
  readonly opponentGems: BattleCardGems | null;
}

/**
 * Arena Battle store actions interface
 * Updated for Gem Skill System Requirements: 2.4, 9.4
 */
export interface ArenaBattleActions {
  initArena: (
    challenger: BattleCard,
    opponent: BattleCard,
    challengerGems?: BattleCardGems | null,
    opponentGems?: BattleCardGems | null,
  ) => void;
  initArenaWithCards: (challenger: Card, opponent: Card) => Promise<void>;
  executeMove: () => void;
  executeAttack: () => AttackResult | null;
  toggleAutoBattle: () => void;
  resetArena: () => void;
}

/**
 * Combined arena store interface
 */
export type ArenaBattleStoreState = ArenaBattleState & ArenaBattleActions;
