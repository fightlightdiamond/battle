import type {
  BattleState,
  Combatant,
  AttackResult,
  GameEvent,
  GameEventType,
  BattleResult,
  CombatantRole,
} from "./types";
import { BATTLE_PHASES, GAME_EVENTS, COMBATANT_ROLES } from "./types";
import {
  type BattleEngineConfig,
  DEFAULT_BATTLE_CONFIG,
  getOppositeRole,
} from "./config";
import { EventBus, type EventHandler } from "./EventBus";
import {
  createInitialState,
  setPhase,
  addLogEntry,
  setResult,
  toggleAutoBattle as toggleAutoBattleState,
  updateCombatant,
} from "./BattleState";
import { createCombatSystem, type CombatSystem } from "../systems/CombatSystem";
import { createTurnSystem, type TurnSystem } from "../systems/TurnSystem";
import {
  createVictorySystem,
  type VictorySystem,
} from "../systems/VictorySystem";
import {
  createCombatLogger,
  type CombatLoggerInstance,
} from "../utils/CombatLogger";
import { Serializer } from "../utils/Serializer";
import {
  createBattleRecorder,
  type BattleRecorderInstance,
} from "../../services/battleRecorder";
import { battleHistoryService } from "../../services/battleHistoryService";
import type { BattleRecord } from "../../types/battleHistoryTypes";

/**
 * BattleEngine - Main orchestrator for the AFK Battle Engine
 *
 * Integrates all systems (Combat, Turn, Victory) and provides
 * a unified API for battle management.
 *
 * Requirements: 1.1, 2.1, 2.3, 2.4, 2.5
 * Battle History Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4
 */
export class BattleEngine {
  private state: BattleState | null = null;
  private eventBus: EventBus;
  private combat: CombatSystem;
  private turn: TurnSystem;
  private victory: VictorySystem;
  private logger: CombatLoggerInstance;
  private recorder: BattleRecorderInstance;
  private lastBattleRecord: BattleRecord | null = null;
  readonly config: BattleEngineConfig;

  constructor(config: BattleEngineConfig = DEFAULT_BATTLE_CONFIG) {
    this.config = config;
    this.eventBus = new EventBus();
    this.combat = createCombatSystem(config.combat);
    this.turn = createTurnSystem();
    this.victory = createVictorySystem();
    this.logger = createCombatLogger(config.combat);
    this.recorder = createBattleRecorder();
  }

  /**
   * Get the current battle state.
   * @returns Current BattleState or null if not initialized
   */
  getState(): BattleState | null {
    return this.state;
  }

  /**
   * Initialize a new battle with two combatants.
   * Sets up the initial state in "ready" phase.
   *
   * Requirements: 1.1
   *
   * @param challenger - The challenger combatant
   * @param opponent - The opponent combatant
   * @returns The initial BattleState
   */
  initBattle(challenger: Combatant, opponent: Combatant): BattleState {
    this.state = createInitialState(challenger, opponent);
    this.emitStateChanged();
    return this.state;
  }

  /**
   * Start the battle, transitioning from "ready" to "fighting" phase.
   * Starts recording battle history.
   *
   * Requirements: 2.1
   * Battle History Requirements: 1.1, 1.2
   *
   * @returns The updated BattleState, or null if not in ready phase
   */
  startBattle(): BattleState | null {
    if (!this.state || this.state.phase !== BATTLE_PHASES.READY) {
      return null;
    }

    this.state = setPhase(this.state, BATTLE_PHASES.FIGHTING);

    // Start recording battle history (Requirements: 1.1, 1.2)
    this.recorder.startRecording(this.state.challenger, this.state.opponent);

    this.emit({
      type: GAME_EVENTS.BATTLE_START,
      timestamp: Date.now(),
      payload: {
        challenger: this.state.challenger,
        opponent: this.state.opponent,
      },
    });

    this.emitStateChanged();
    return this.state;
  }

  /**
   * Execute an attack from the current attacker to the defender.
   * Returns null if battle is not in "fighting" phase.
   * Records turn data for battle history.
   *
   * Property 8: Battle End Disables Attacks
   * For any battle in 'finished' phase, executeAttack() SHALL return null
   * and state SHALL remain unchanged.
   *
   * Requirements: 2.3, 2.4, 2.5
   * Battle History Requirements: 2.1, 2.2, 2.3, 2.4
   *
   * @returns AttackResult if attack executed, null if battle not in fighting phase
   */
  executeAttack(): AttackResult | null {
    // Property 8: Return null if not in fighting phase
    if (!this.state || this.state.phase !== BATTLE_PHASES.FIGHTING) {
      return null;
    }

    // Determine attacker and defender
    const attackerRole: CombatantRole = this.state.currentAttacker;
    const defenderRole: CombatantRole = getOppositeRole(attackerRole);
    const attacker = this.state[attackerRole];
    const defender = this.state[defenderRole];

    // Capture HP before attack for recording (Requirements: 2.3, 2.4)
    const defenderHpBefore = defender.currentHp;
    const attackerHpBefore = attacker.currentHp;

    // Calculate attack result using CombatSystem
    const attackResult = this.combat.calculateAttack(attacker, defender);

    // Record turn for battle history (Requirements: 2.1, 2.2, 2.3, 2.4)
    if (this.recorder.isRecording()) {
      this.recorder.recordTurn(
        this.state.turn,
        attacker,
        defender,
        attackResult,
        defenderHpBefore,
        attackerHpBefore
      );
    }

    // Update state with new defender HP
    this.state = updateCombatant(this.state, defenderRole, {
      currentHp: attackResult.defenderNewHp,
      isDefeated: attackResult.isKnockout,
    });

    // Update state with attacker's new HP (for lifesteal)
    if (attackResult.lifestealHeal > 0) {
      this.state = updateCombatant(this.state, attackerRole, {
        currentHp: attackResult.attackerNewHp,
      });
    }

    // Log the attack
    const logEntry = this.logger.logAttack(
      attacker,
      defender,
      attackResult.damage,
      attackResult.defenderNewHp
    );
    this.state = addLogEntry(this.state, logEntry);

    // Emit attack event
    this.emit({
      type: GAME_EVENTS.ATTACK,
      timestamp: Date.now(),
      payload: attackResult,
    });

    // Check for victory
    const result = this.victory.checkVictory(this.state);
    if (result) {
      this.handleVictory(result);
    } else {
      // Advance turn if battle continues
      this.state = this.turn.advanceTurn(this.state);
      this.emit({
        type: GAME_EVENTS.TURN_END,
        timestamp: Date.now(),
        payload: { turn: this.state.turn - 1 },
      });
    }

    this.emitStateChanged();
    return attackResult;
  }

  /**
   * Handle victory condition - set result and transition to finished phase.
   * Finishes recording and saves battle history.
   *
   * Battle History Requirements: 1.1, 1.2, 1.3
   */
  private handleVictory(result: BattleResult): void {
    if (!this.state) return;

    // Log victory
    const victoryLog = this.logger.logVictory(result.winnerName);
    this.state = addLogEntry(this.state, victoryLog);

    // Set result and phase
    this.state = setResult(this.state, result);

    // Finish recording and save battle history (Requirements: 1.1, 1.2, 1.3)
    if (this.recorder.isRecording()) {
      const winnerId =
        result.winner === COMBATANT_ROLES.CHALLENGER
          ? this.state.challenger.id
          : this.state.opponent.id;

      const battleRecord = this.recorder.finishRecording(
        winnerId,
        result.winnerName
      );

      // Store the last battle record for retrieval
      this.lastBattleRecord = battleRecord;

      // Save to server asynchronously (fire and forget, errors logged)
      this.saveBattleRecord(battleRecord);
    }

    // Emit events
    this.emit({
      type: GAME_EVENTS.COMBATANT_DEFEATED,
      timestamp: Date.now(),
      payload: {
        loser:
          result.winner === COMBATANT_ROLES.CHALLENGER
            ? COMBATANT_ROLES.OPPONENT
            : COMBATANT_ROLES.CHALLENGER,
      },
    });

    this.emit({
      type: GAME_EVENTS.BATTLE_END,
      timestamp: Date.now(),
      payload: result,
    });
  }

  /**
   * Save battle record to server asynchronously.
   * Errors are logged but don't interrupt the battle flow.
   *
   * Requirements: 1.3
   */
  private async saveBattleRecord(record: BattleRecord): Promise<void> {
    try {
      await battleHistoryService.saveBattle(record);
    } catch (error) {
      console.error("Failed to save battle record:", error);
    }
  }

  /**
   * Get the last completed battle record.
   * Useful for replay functionality.
   *
   * @returns The last BattleRecord or null if no battle completed
   */
  getLastBattleRecord(): BattleRecord | null {
    return this.lastBattleRecord;
  }

  /**
   * Reset the battle to initial state with the same combatants.
   * Also resets the battle recorder.
   *
   * @returns The reset BattleState, or null if no battle was initialized
   */
  resetBattle(): BattleState | null {
    if (!this.state) {
      return null;
    }

    // Reset the recorder if it was recording
    if (this.recorder.isRecording()) {
      this.recorder.reset();
    }

    // Reset combatants to full HP
    const resetChallenger: Combatant = {
      ...this.state.challenger,
      currentHp: this.state.challenger.maxHp,
      isDefeated: false,
    };

    const resetOpponent: Combatant = {
      ...this.state.opponent,
      currentHp: this.state.opponent.maxHp,
      isDefeated: false,
    };

    this.state = createInitialState(resetChallenger, resetOpponent);
    this.emitStateChanged();
    return this.state;
  }

  /**
   * Toggle auto-battle mode.
   *
   * @returns The updated BattleState, or null if no battle initialized
   */
  toggleAutoBattle(): BattleState | null {
    if (!this.state) {
      return null;
    }

    this.state = toggleAutoBattleState(this.state);
    this.emitStateChanged();
    return this.state;
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to a specific event type.
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - Callback function to handle the event
   * @returns Unsubscribe function
   */
  subscribe<T = unknown>(
    eventType: GameEventType,
    handler: EventHandler<T>
  ): () => void {
    return this.eventBus.subscribe(eventType, handler);
  }

  /**
   * Emit an event to all subscribers.
   *
   * @param event - The event to emit
   */
  emit<T = unknown>(event: GameEvent<T>): void {
    this.eventBus.emit(event);
  }

  /**
   * Emit a state_changed event with current state.
   */
  private emitStateChanged(): void {
    if (this.state) {
      this.emit({
        type: GAME_EVENTS.STATE_CHANGED,
        timestamp: Date.now(),
        payload: this.state,
      });
    }
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Serialize the current battle state to JSON.
   *
   * @returns JSON string representation of the state
   * @throws Error if no battle is initialized
   */
  serialize(): string {
    if (!this.state) {
      throw new Error("No battle state to serialize");
    }
    return Serializer.serialize(this.state);
  }

  /**
   * Deserialize a JSON string and restore the battle state.
   *
   * @param json - JSON string to deserialize
   * @returns The restored BattleState
   */
  deserialize(json: string): BattleState {
    this.state = Serializer.deserialize(json);
    this.emitStateChanged();
    return this.state;
  }

  /**
   * Clear all event subscriptions.
   */
  clearSubscriptions(): void {
    this.eventBus.clear();
  }
}
