// ============================================================================
// SKILL SYSTEM (REFACTORED)
// ============================================================================
// This file provides the SkillSystem interface using Strategy Pattern.
// All skill logic is delegated to individual handlers in the skills/ folder.
// ============================================================================

import type { CellIndex } from "@/features/arena1d/types/arena";
import type { Gem } from "@/features/gems/types/gem";
import type {
  BattleCardGems,
  EquippedGemState,
} from "@/features/gems/types/equipment";

import {
  getMovementHandler,
  getCombatHandler,
  type SkillAttackResult,
  type MovementSkillContext,
  type CombatSkillContext,
  type WallCollisionEffect,
  getDirectionSign,
} from "../skills";

// ============================================================================
// SKILL SYSTEM TYPES
// ============================================================================

/**
 * Represents an activated skill during battle
 */
export interface ActivatedSkill {
  skillType: string;
  gemId: string;
  gemName: string;
}

/**
 * Result of processing movement skills
 */
export interface MovementSkillResult {
  finalPosition: CellIndex;
  skillsActivated: ActivatedSkill[];
  enemyNewPosition?: CellIndex;
}

/**
 * Result of processing combat skills
 */
export interface CombatSkillResult {
  attackerNewPosition: CellIndex;
  defenderNewPosition: CellIndex;
  defenderNewHp: number;
  additionalAttacks: SkillAttackResult[];
  skillsActivated: ActivatedSkill[];
  wallCollision?: WallCollisionEffect;
}

/**
 * Skill activation result with cooldown tracking
 */
export interface SkillActivationResult {
  activated: boolean;
  gem: Gem;
  newCooldown: number;
}

// Re-export SkillAttackResult for backward compatibility
export type { SkillAttackResult };

// ============================================================================
// SKILL SYSTEM INTERFACE
// ============================================================================

export interface SkillSystem {
  processMovementSkills(
    card: BattleCardGems,
    currentPosition: CellIndex,
    targetPosition: CellIndex,
    enemyPosition: CellIndex,
  ): MovementSkillResult;

  processCombatSkills(
    attacker: BattleCardGems,
    defender: BattleCardGems,
    attackerPosition: CellIndex,
    defenderPosition: CellIndex,
    attackResult: SkillAttackResult,
    performAttack?: (
      attacker: BattleCardGems,
      defender: BattleCardGems,
    ) => SkillAttackResult,
  ): CombatSkillResult;

  decrementCooldowns(cardGems: BattleCardGems): BattleCardGems;
  rollActivation(chance: number): boolean;
  canActivate(gemState: EquippedGemState): boolean;
  tryActivateSkill(gemState: EquippedGemState): SkillActivationResult;
}

// ============================================================================
// SKILL SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a SkillSystem instance using the Strategy Pattern.
 * Individual skill logic is delegated to handlers registered in the registry.
 *
 * @param randomFn - Optional random function for testing (defaults to Math.random)
 */
export function createSkillSystem(
  randomFn: () => number = Math.random,
): SkillSystem {
  return {
    rollActivation(chance: number): boolean {
      const clampedChance = Math.max(0, Math.min(100, chance));
      const roll = randomFn() * 100;
      return roll < clampedChance;
    },

    canActivate(gemState: EquippedGemState): boolean {
      return gemState.currentCooldown === 0;
    },

    tryActivateSkill(gemState: EquippedGemState): SkillActivationResult {
      const { gem, currentCooldown } = gemState;

      if (currentCooldown > 0) {
        return { activated: false, gem, newCooldown: currentCooldown };
      }

      const activated = this.rollActivation(gem.activationChance);

      if (!activated) {
        return { activated: false, gem, newCooldown: 0 };
      }

      return { activated: true, gem, newCooldown: gem.cooldown };
    },

    decrementCooldowns(cardGems: BattleCardGems): BattleCardGems {
      return {
        ...cardGems,
        equippedGems: cardGems.equippedGems.map((gemState) => ({
          ...gemState,
          currentCooldown: Math.max(0, gemState.currentCooldown - 1),
        })),
      };
    },

    processMovementSkills(
      card: BattleCardGems,
      currentPosition: CellIndex,
      targetPosition: CellIndex,
      enemyPosition: CellIndex,
    ): MovementSkillResult {
      let finalPosition = targetPosition;
      const skillsActivated: ActivatedSkill[] = [];
      let enemyNewPosition: CellIndex | undefined;

      const moveDirection = getDirectionSign(currentPosition, targetPosition);

      const updatedGems = card.equippedGems.map((gemState) => {
        const { gem } = gemState;

        if (gem.trigger !== "movement") {
          return gemState;
        }

        const activationResult = this.tryActivateSkill(gemState);

        if (!activationResult.activated) {
          return {
            ...gemState,
            currentCooldown: activationResult.newCooldown,
          };
        }

        // Get handler from registry
        const handler = getMovementHandler(gem.skillType);

        if (handler) {
          const context: MovementSkillContext = {
            card,
            currentPosition,
            targetPosition,
            enemyPosition,
            moveDirection,
            gem,
          };

          const result = handler.execute(context);
          finalPosition = result.finalPosition;

          if (result.enemyNewPosition !== undefined) {
            enemyNewPosition = result.enemyNewPosition;
          }

          skillsActivated.push({
            skillType: gem.skillType,
            gemId: gem.id,
            gemName: gem.name,
          });
        }

        return {
          ...gemState,
          currentCooldown: activationResult.newCooldown,
        };
      });

      card.equippedGems = updatedGems;

      return {
        finalPosition,
        skillsActivated,
        enemyNewPosition,
      };
    },

    processCombatSkills(
      attacker: BattleCardGems,
      defender: BattleCardGems,
      attackerPosition: CellIndex,
      defenderPosition: CellIndex,
      attackResult: SkillAttackResult,
      performAttack?: (
        attacker: BattleCardGems,
        defender: BattleCardGems,
      ) => SkillAttackResult,
    ): CombatSkillResult {
      let newAttackerPosition = attackerPosition;
      let newDefenderPosition = defenderPosition;
      let newDefenderHp = attackResult.defenderNewHp;
      const additionalAttacks: SkillAttackResult[] = [];
      const skillsActivated: ActivatedSkill[] = [];
      let wallCollisionResult: WallCollisionEffect | undefined;
      let totalWallBonusDamage = 0;

      const updatedGems = attacker.equippedGems.map((gemState) => {
        const { gem } = gemState;

        if (gem.trigger !== "combat") {
          return gemState;
        }

        const activationResult = this.tryActivateSkill(gemState);

        if (!activationResult.activated) {
          return {
            ...gemState,
            currentCooldown: activationResult.newCooldown,
          };
        }

        // Get handler from registry
        const handler = getCombatHandler(gem.skillType);

        if (handler) {
          const context: CombatSkillContext = {
            attacker,
            defender,
            attackerPosition: newAttackerPosition,
            defenderPosition: newDefenderPosition,
            attackResult: {
              ...attackResult,
              defenderNewHp: newDefenderHp,
            },
            gem,
            performAttack,
          };

          const result = handler.execute(context);

          // Apply position changes
          if (result.attackerNewPosition !== undefined) {
            newAttackerPosition = result.attackerNewPosition;
          }
          if (result.defenderNewPosition !== undefined) {
            newDefenderPosition = result.defenderNewPosition;
          }
          if (result.defenderNewHp !== undefined) {
            newDefenderHp = result.defenderNewHp;
          }
          if (result.additionalAttacks) {
            additionalAttacks.push(...result.additionalAttacks);
          }

          // Accumulate wall collision damage
          if (result.wallCollision) {
            totalWallBonusDamage += result.wallCollision.bonusDamage;
            wallCollisionResult = {
              pushedToEdge:
                wallCollisionResult?.pushedToEdge ||
                result.wallCollision.pushedToEdge,
              wallSlam:
                wallCollisionResult?.wallSlam || result.wallCollision.wallSlam,
              bonusDamage: totalWallBonusDamage,
            };
          }

          skillsActivated.push({
            skillType: gem.skillType,
            gemId: gem.id,
            gemName: gem.name,
          });
        }

        return {
          ...gemState,
          currentCooldown: activationResult.newCooldown,
        };
      });

      attacker.equippedGems = updatedGems;

      return {
        attackerNewPosition: newAttackerPosition,
        defenderNewPosition: newDefenderPosition,
        defenderNewHp: newDefenderHp,
        additionalAttacks,
        skillsActivated,
        wallCollision: wallCollisionResult,
      };
    },
  };
}

// Default singleton instance
export const skillSystem = createSkillSystem();

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// Re-export utility functions for backward compatibility
export { clampPosition, getDirectionSign, isAtEdge } from "../skills/utils";
export {
  calculateKnockbackWithWallCollision,
  type WallCollisionResult,
} from "../skills/utils/wallCollision";
