import type {
  BattleState,
  Combatant,
  CombatantStats,
  BattleLogEntry,
  BattleResult,
  CombatantRole,
} from "./types";
import { BATTLE_PHASES, COMBATANT_ROLES } from "./types";
import {
  type DefaultStatsConfig,
  DEFAULT_STATS_CONFIG,
  getOppositeRole,
} from "./config";

// ============================================================================
// COMBATANT FACTORY
// ============================================================================

/**
 * Get default stats from config
 * Updated for Tier-Based Stat System
 */
function getDefaultStats(
  config: DefaultStatsConfig = DEFAULT_STATS_CONFIG
): CombatantStats {
  return {
    // Core Stats (Tier 1)
    atk: config.atk,
    def: config.def,
    spd: config.spd,

    // Combat Stats (Tier 2)
    critChance: config.critChance,
    critDamage: config.critDamage,
    armorPen: config.armorPen,
    lifesteal: config.lifesteal,
  };
}

/**
 * Creates a Combatant from minimal input data.
 * Useful for creating combatants from card data.
 * Updated for Tier-Based Stat System
 *
 * @param input - Partial combatant data
 * @returns A fully initialized Combatant
 */
export function createCombatant(
  input: {
    id: string;
    name: string;
    imageUrl?: string | null;
    hp: number;
    // Core Stats (Tier 1)
    atk?: number;
    def?: number;
    spd?: number;
    // Combat Stats (Tier 2)
    critChance?: number;
    critDamage?: number;
    armorPen?: number;
    lifesteal?: number;
  },
  statsConfig?: DefaultStatsConfig
): Combatant {
  const defaults = getDefaultStats(statsConfig);
  const baseStats: CombatantStats = {
    // Core Stats (Tier 1)
    atk: input.atk ?? defaults.atk,
    def: input.def ?? defaults.def,
    spd: input.spd ?? defaults.spd,
    // Combat Stats (Tier 2)
    critChance: input.critChance ?? defaults.critChance,
    critDamage: input.critDamage ?? defaults.critDamage,
    armorPen: input.armorPen ?? defaults.armorPen,
    lifesteal: input.lifesteal ?? defaults.lifesteal,
  };

  return {
    id: input.id,
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    baseStats,
    currentHp: input.hp,
    maxHp: input.hp,
    buffs: [],
    isDefeated: false,
  };
}

// ============================================================================
// BATTLE STATE FACTORY
// ============================================================================

/**
 * Creates an initial BattleState with two combatants.
 * The state starts in "ready" phase with challenger as first attacker.
 *
 * Requirements: 1.1, 1.2
 *
 * @param challenger - The challenger combatant
 * @param opponent - The opponent combatant
 * @returns A new BattleState in "ready" phase
 */
export function createInitialState(
  challenger: Combatant,
  opponent: Combatant
): BattleState {
  return {
    phase: BATTLE_PHASES.READY,
    turn: 1,
    challenger,
    opponent,
    currentAttacker: COMBATANT_ROLES.CHALLENGER,
    battleLog: [],
    result: null,
    isAutoBattle: false,
  };
}

// ============================================================================
// STATE TRANSITION HELPERS (Immutable Updates)
// ============================================================================

/**
 * Updates the challenger in the battle state immutably.
 *
 * @param state - Current battle state
 * @param challenger - New challenger data (partial or full)
 * @returns New BattleState with updated challenger
 */
export function updateChallenger(
  state: BattleState,
  challenger: Partial<Combatant>
): BattleState {
  return {
    ...state,
    challenger: {
      ...state.challenger,
      ...challenger,
    },
  };
}

/**
 * Updates the opponent in the battle state immutably.
 *
 * @param state - Current battle state
 * @param opponent - New opponent data (partial or full)
 * @returns New BattleState with updated opponent
 */
export function updateOpponent(
  state: BattleState,
  opponent: Partial<Combatant>
): BattleState {
  return {
    ...state,
    opponent: {
      ...state.opponent,
      ...opponent,
    },
  };
}

/**
 * Updates a combatant by role (challenger or opponent) immutably.
 *
 * @param state - Current battle state
 * @param role - Which combatant to update
 * @param updates - Partial combatant data to merge
 * @returns New BattleState with updated combatant
 */
export function updateCombatant(
  state: BattleState,
  role: CombatantRole,
  updates: Partial<Combatant>
): BattleState {
  return role === COMBATANT_ROLES.CHALLENGER
    ? updateChallenger(state, updates)
    : updateOpponent(state, updates);
}

/**
 * Sets the battle phase immutably.
 *
 * @param state - Current battle state
 * @param phase - New battle phase
 * @returns New BattleState with updated phase
 */
export function setPhase(
  state: BattleState,
  phase: BattleState["phase"]
): BattleState {
  return {
    ...state,
    phase,
  };
}

/**
 * Adds a log entry to the battle log immutably.
 *
 * @param state - Current battle state
 * @param entry - Log entry to add
 * @returns New BattleState with entry appended to battleLog
 */
export function addLogEntry(
  state: BattleState,
  entry: BattleLogEntry
): BattleState {
  return {
    ...state,
    battleLog: [...state.battleLog, entry],
  };
}

/**
 * Sets the battle result immutably.
 *
 * @param state - Current battle state
 * @param result - Battle result
 * @returns New BattleState with result set
 */
export function setResult(
  state: BattleState,
  result: BattleResult
): BattleState {
  return {
    ...state,
    result,
    phase: BATTLE_PHASES.FINISHED,
  };
}

/**
 * Toggles auto-battle mode immutably.
 *
 * @param state - Current battle state
 * @returns New BattleState with isAutoBattle toggled
 */
export function toggleAutoBattle(state: BattleState): BattleState {
  return {
    ...state,
    isAutoBattle: !state.isAutoBattle,
  };
}

/**
 * Advances the turn counter and switches attacker immutably.
 *
 * @param state - Current battle state
 * @returns New BattleState with incremented turn and switched attacker
 */
export function advanceTurn(state: BattleState): BattleState {
  return {
    ...state,
    turn: state.turn + 1,
    currentAttacker: getOppositeRole(state.currentAttacker),
  };
}

/**
 * Applies damage to a combatant by role immutably.
 * HP is clamped to minimum of 0.
 *
 * @param state - Current battle state
 * @param role - Which combatant to damage
 * @param damage - Amount of damage to apply
 * @returns New BattleState with updated combatant HP
 */
export function applyDamage(
  state: BattleState,
  role: CombatantRole,
  damage: number
): BattleState {
  const combatant = state[role];
  const newHp = Math.max(0, combatant.currentHp - damage);
  const isDefeated = newHp <= 0;

  return updateCombatant(state, role, {
    currentHp: newHp,
    isDefeated,
  });
}

/**
 * Creates a deep clone of the battle state.
 * Useful for ensuring complete immutability in tests.
 *
 * @param state - Battle state to clone
 * @returns A deep copy of the state
 */
export function cloneState(state: BattleState): BattleState {
  return {
    ...state,
    challenger: {
      ...state.challenger,
      baseStats: { ...state.challenger.baseStats },
      buffs: [...state.challenger.buffs],
    },
    opponent: {
      ...state.opponent,
      baseStats: { ...state.opponent.baseStats },
      buffs: [...state.opponent.buffs],
    },
    battleLog: [...state.battleLog],
    result: state.result ? { ...state.result } : null,
  };
}
