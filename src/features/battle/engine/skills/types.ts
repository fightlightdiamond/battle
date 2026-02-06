// ============================================================================
// SKILL HANDLER TYPES
// ============================================================================

import type { CellIndex } from "@/features/arena1d/types/arena";
import type { Gem } from "@/features/gems/types/gem";
import type { BattleCardGems } from "@/features/gems/types/equipment";

/**
 * Context for movement skill execution
 */
export interface MovementSkillContext {
  card: BattleCardGems;
  currentPosition: CellIndex;
  targetPosition: CellIndex;
  enemyPosition: CellIndex;
  moveDirection: number;
  gem: Gem;
}

/**
 * Result from a movement skill handler
 */
export interface MovementSkillHandlerResult {
  finalPosition: CellIndex;
  enemyNewPosition?: CellIndex;
}

/**
 * Movement skill handler interface
 */
export interface MovementSkillHandler {
  readonly skillType: string;
  readonly trigger: "movement";
  execute(context: MovementSkillContext): MovementSkillHandlerResult;
}

/**
 * Attack result interface for combat skills
 */
export interface SkillAttackResult {
  defenderNewHp: number;
  defender: {
    maxHp: number;
  };
}

/**
 * Context for combat skill execution
 */
export interface CombatSkillContext {
  attacker: BattleCardGems;
  defender: BattleCardGems;
  attackerPosition: CellIndex;
  defenderPosition: CellIndex;
  attackResult: SkillAttackResult;
  gem: Gem;
  performAttack?: (
    attacker: BattleCardGems,
    defender: BattleCardGems,
  ) => SkillAttackResult;
}

/**
 * Wall collision effect result
 */
export interface WallCollisionEffect {
  pushedToEdge: boolean;
  wallSlam: boolean;
  bonusDamage: number;
}

/**
 * Result from a combat skill handler
 */
export interface CombatSkillHandlerResult {
  attackerNewPosition?: CellIndex;
  defenderNewPosition?: CellIndex;
  defenderNewHp?: number;
  additionalAttacks?: SkillAttackResult[];
  wallCollision?: WallCollisionEffect;
}

/**
 * Combat skill handler interface
 */
export interface CombatSkillHandler {
  readonly skillType: string;
  readonly trigger: "combat";
  execute(context: CombatSkillContext): CombatSkillHandlerResult;
}

/**
 * Union type for all skill handlers
 */
export type SkillHandler = MovementSkillHandler | CombatSkillHandler;
