// ============================================================================
// SKILL SYSTEM
// ============================================================================

import type { CellIndex } from "@/features/arena1d/types/arena";
import type { SkillType, Gem } from "@/features/gems/types/gem";
import type {
  BattleCardGems,
  EquippedGemState,
} from "@/features/gems/types/equipment";

/**
 * Simplified attack result interface that works with both engine and battle service types
 * This allows the SkillSystem to be used with different attack result implementations
 */
export interface SkillAttackResult {
  defenderNewHp: number;
  defender: {
    maxHp: number;
  };
}

// ============================================================================
// SKILL SYSTEM TYPES
// ============================================================================

/**
 * Represents an activated skill during battle
 */
export interface ActivatedSkill {
  skillType: SkillType;
  gemId: string;
  gemName: string;
}

/**
 * Result of processing movement skills
 */
export interface MovementSkillResult {
  finalPosition: CellIndex;
  skillsActivated: ActivatedSkill[];
  enemyNewPosition?: CellIndex; // For leap_strike knockback
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
  // Wall collision effects
  wallCollision?: {
    pushedToEdge: boolean; // Defender was pushed to arena edge (50% bonus damage)
    wallSlam: boolean; // Defender was already at edge, couldn't be pushed (guaranteed crit)
    bonusDamage: number; // Extra damage from wall effects
  };
}

/**
 * Skill activation result with cooldown tracking
 */
export interface SkillActivationResult {
  activated: boolean;
  gem: Gem;
  newCooldown: number;
}

// ============================================================================
// SKILL SYSTEM INTERFACE
// ============================================================================

export interface SkillSystem {
  /**
   * Check and execute movement skills
   * @param card - Card with equipped gems
   * @param currentPosition - Current position of the card
   * @param targetPosition - Target position after normal movement
   * @param enemyPosition - Position of the enemy card
   * @returns Movement skill result with final position and activated skills
   */
  processMovementSkills(
    card: BattleCardGems,
    currentPosition: CellIndex,
    targetPosition: CellIndex,
    enemyPosition: CellIndex,
  ): MovementSkillResult;

  /**
   * Check and execute combat skills
   * @param attacker - Attacker card with equipped gems
   * @param defender - Defender card with equipped gems
   * @param attackerPosition - Position of the attacker
   * @param defenderPosition - Position of the defender
   * @param attackResult - Result of the initial attack
   * @param performAttack - Optional callback to perform additional attacks (for double_attack)
   * @returns Combat skill result with position changes and additional attacks
   */
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

  /**
   * Decrement cooldowns at turn end
   * @param cardGems - Card gems to update cooldowns for
   * @returns Updated card gems with decremented cooldowns
   */
  decrementCooldowns(cardGems: BattleCardGems): BattleCardGems;

  /**
   * Roll for skill activation based on chance
   * @param chance - Activation chance (0-100)
   * @returns true if skill activates, false otherwise
   */
  rollActivation(chance: number): boolean;

  /**
   * Check if a skill can activate (not on cooldown)
   * @param gemState - Equipped gem state to check
   * @returns true if skill can activate, false if on cooldown
   */
  canActivate(gemState: EquippedGemState): boolean;

  /**
   * Try to activate a skill, handling cooldown and chance roll
   * @param gemState - Equipped gem state to try activating
   * @returns Activation result with new cooldown
   */
  tryActivateSkill(gemState: EquippedGemState): SkillActivationResult;
}

// ============================================================================
// ARENA POSITION UTILITIES
// ============================================================================

const MIN_POSITION = 0;
const MAX_POSITION = 7;

/**
 * Clamp a position to valid arena bounds [0, 7]
 */
export function clampPosition(position: number): CellIndex {
  return Math.max(MIN_POSITION, Math.min(MAX_POSITION, position)) as CellIndex;
}

/**
 * Get the direction sign from one position to another
 * @returns 1 if target is to the right, -1 if to the left, 0 if same position
 */
export function getDirectionSign(from: number, to: number): number {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

/**
 * Check if a position is at the arena edge
 */
export function isAtEdge(position: number): boolean {
  return position === MIN_POSITION || position === MAX_POSITION;
}

/**
 * Wall collision result when knockback occurs
 */
export interface WallCollisionResult {
  finalPosition: CellIndex;
  pushedToEdge: boolean; // Was pushed to the edge (50% bonus damage)
  wallSlam: boolean; // Was already at edge, couldn't move (guaranteed crit = 100% bonus)
  bonusDamageMultiplier: number; // 0 = no bonus, 0.5 = 50% bonus, 1.0 = 100% bonus (crit)
}

/**
 * Calculate knockback with wall collision effects
 * - If pushed to arena edge: 50% bonus damage
 * - If already at edge and can't be pushed: guaranteed crit (100% bonus damage)
 */
export function calculateKnockbackWithWallCollision(
  currentPosition: number,
  knockbackDirection: number,
  knockbackDistance: number,
): WallCollisionResult {
  const targetPosition =
    currentPosition + knockbackDirection * knockbackDistance;
  const clampedPosition = clampPosition(targetPosition);

  // Check if already at edge before knockback
  const wasAtEdge = isAtEdge(currentPosition);
  const wouldBePushedBeyondEdge = targetPosition !== clampedPosition;

  // Wall slam: already at edge AND knockback direction would push further into wall
  const wallSlam =
    wasAtEdge &&
    ((currentPosition === MIN_POSITION && knockbackDirection < 0) ||
      (currentPosition === MAX_POSITION && knockbackDirection > 0));

  // Pushed to edge: wasn't at edge, but now is at edge after knockback
  const pushedToEdge =
    !wasAtEdge && isAtEdge(clampedPosition) && wouldBePushedBeyondEdge;

  // Calculate bonus damage multiplier
  let bonusDamageMultiplier = 0;
  if (wallSlam) {
    bonusDamageMultiplier = 1.0; // 100% bonus (guaranteed crit)
  } else if (pushedToEdge) {
    bonusDamageMultiplier = 0.5; // 50% bonus
  }

  return {
    finalPosition: clampedPosition,
    pushedToEdge,
    wallSlam,
    bonusDamageMultiplier,
  };
}

// ============================================================================
// SKILL SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a SkillSystem instance for handling skill activation and effects.
 * @param randomFn - Optional random function for testing (defaults to Math.random)
 */
export function createSkillSystem(
  randomFn: () => number = Math.random,
): SkillSystem {
  return {
    /**
     * Roll for skill activation based on chance
     * Requirements: 10.1, 10.2
     */
    rollActivation(chance: number): boolean {
      // Clamp chance to valid range
      const clampedChance = Math.max(0, Math.min(100, chance));
      // Roll a random number between 0 and 100
      const roll = randomFn() * 100;
      // Activate if roll is less than chance
      return roll < clampedChance;
    },

    /**
     * Check if a skill can activate (not on cooldown)
     * Requirements: 9.3
     */
    canActivate(gemState: EquippedGemState): boolean {
      return gemState.currentCooldown === 0;
    },

    /**
     * Try to activate a skill, handling cooldown and chance roll
     * Requirements: 10.1, 10.2, 10.3
     */
    tryActivateSkill(gemState: EquippedGemState): SkillActivationResult {
      const { gem, currentCooldown } = gemState;

      // If on cooldown, cannot activate (Requirement 9.3)
      if (currentCooldown > 0) {
        return {
          activated: false,
          gem,
          newCooldown: currentCooldown,
        };
      }

      // Roll for activation (Requirements 10.1, 10.2)
      const activated = this.rollActivation(gem.activationChance);

      // If activation fails, cooldown remains unchanged (Requirement 10.3)
      if (!activated) {
        return {
          activated: false,
          gem,
          newCooldown: 0,
        };
      }

      // Activation succeeded, set cooldown (Requirement 9.1)
      return {
        activated: true,
        gem,
        newCooldown: gem.cooldown,
      };
    },

    /**
     * Decrement cooldowns at turn end
     * Requirements: 9.1, 9.2
     */
    decrementCooldowns(cardGems: BattleCardGems): BattleCardGems {
      return {
        ...cardGems,
        equippedGems: cardGems.equippedGems.map((gemState) => ({
          ...gemState,
          currentCooldown: Math.max(0, gemState.currentCooldown - 1),
        })),
      };
    },

    /**
     * Process movement skills
     * Requirements: 5.1, 5.2, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5
     */
    processMovementSkills(
      card: BattleCardGems,
      currentPosition: CellIndex,
      targetPosition: CellIndex,
      enemyPosition: CellIndex,
    ): MovementSkillResult {
      let finalPosition = targetPosition;
      const skillsActivated: ActivatedSkill[] = [];
      let enemyNewPosition: CellIndex | undefined;

      // Get movement direction (1 = right, -1 = left)
      const moveDirection = getDirectionSign(currentPosition, targetPosition);

      // Process each equipped gem with movement trigger
      const updatedGems = card.equippedGems.map((gemState) => {
        const { gem } = gemState;

        // Only process movement trigger skills
        if (gem.trigger !== "movement") {
          return gemState;
        }

        // Try to activate the skill
        const activationResult = this.tryActivateSkill(gemState);

        if (!activationResult.activated) {
          return {
            ...gemState,
            currentCooldown: activationResult.newCooldown,
          };
        }

        // Process skill effect based on type
        switch (gem.skillType) {
          case "double_move": {
            // Double move: move 2 cells instead of 1
            // Requirements: 5.1, 5.2
            const moveDistance = gem.effectParams.moveDistance ?? 2;
            const newPosition = currentPosition + moveDirection * moveDistance;
            finalPosition = clampPosition(newPosition);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "leap_strike": {
            // Leap strike: jump to enemy if within range and knock them back
            // Requirements: 8.1, 8.2, 8.3, 8.4
            const leapRange = gem.effectParams.leapRange ?? 2;
            const leapKnockback = gem.effectParams.leapKnockback ?? 2;
            const distanceToEnemy = Math.abs(currentPosition - enemyPosition);

            // Check if enemy is within leap range
            if (distanceToEnemy <= leapRange && distanceToEnemy > 0) {
              // Move to position adjacent to enemy
              const directionToEnemy = getDirectionSign(
                currentPosition,
                enemyPosition,
              );
              const adjacentPosition = enemyPosition - directionToEnemy;
              finalPosition = clampPosition(adjacentPosition);

              // Knock enemy back
              const knockbackDirection = getDirectionSign(
                finalPosition,
                enemyPosition,
              );
              const newEnemyPosition =
                enemyPosition + knockbackDirection * leapKnockback;
              enemyNewPosition = clampPosition(newEnemyPosition);

              skillsActivated.push({
                skillType: gem.skillType,
                gemId: gem.id,
                gemName: gem.name,
              });
            }
            break;
          }

          case "speed_boost": {
            // Speed Boost (Sword & Shield Passive): Move extra 1 cell
            // 50% chance to increase movement by 1 cell
            const extraMove = gem.effectParams.moveDistance ?? 1;
            const newPosition = targetPosition + moveDirection * extraMove;
            finalPosition = clampPosition(newPosition);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          default:
            // Other skill types are not movement skills
            break;
        }

        return {
          ...gemState,
          currentCooldown: activationResult.newCooldown,
        };
      });

      // Update card gems with new cooldowns (side effect for caller to handle)
      card.equippedGems = updatedGems;

      return {
        finalPosition,
        skillsActivated,
        enemyNewPosition,
      };
    },

    /**
     * Process combat skills
     * Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3
     */
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

      // Track wall collision for bonus damage
      let wallCollisionResult:
        | {
            pushedToEdge: boolean;
            wallSlam: boolean;
            bonusDamage: number;
          }
        | undefined;
      let totalWallBonusDamage = 0;

      // Process each equipped gem with combat trigger
      const updatedGems = attacker.equippedGems.map((gemState) => {
        const { gem } = gemState;

        // Only process combat trigger skills
        if (gem.trigger !== "combat") {
          return gemState;
        }

        // Try to activate the skill
        const activationResult = this.tryActivateSkill(gemState);

        if (!activationResult.activated) {
          return {
            ...gemState,
            currentCooldown: activationResult.newCooldown,
          };
        }

        // Process skill effect based on type
        switch (gem.skillType) {
          case "knockback": {
            // Knockback: push defender 1 cell away from attacker
            // Requirements: 3.1, 3.2
            const knockbackDistance = gem.effectParams.knockbackDistance ?? 1;
            const knockbackDirection = getDirectionSign(
              attackerPosition,
              defenderPosition,
            );

            // Calculate knockback with wall collision
            const wallResult = calculateKnockbackWithWallCollision(
              defenderPosition,
              knockbackDirection,
              knockbackDistance,
            );
            newDefenderPosition = wallResult.finalPosition;

            // Apply wall collision bonus damage
            if (wallResult.bonusDamageMultiplier > 0) {
              const baseDamage =
                attackResult.defender.maxHp - attackResult.defenderNewHp;
              const wallBonusDamage = Math.floor(
                baseDamage * wallResult.bonusDamageMultiplier,
              );
              newDefenderHp = Math.max(0, newDefenderHp - wallBonusDamage);
              totalWallBonusDamage += wallBonusDamage;

              wallCollisionResult = {
                pushedToEdge: wallResult.pushedToEdge,
                wallSlam: wallResult.wallSlam,
                bonusDamage: totalWallBonusDamage,
              };
            }

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "retreat": {
            // Retreat: move attacker 1 cell backward (away from defender)
            // Requirements: 4.1, 4.2
            const retreatDistance = gem.effectParams.knockbackDistance ?? 1;
            const retreatDirection = getDirectionSign(
              defenderPosition,
              attackerPosition,
            );
            const newPosition =
              attackerPosition + retreatDirection * retreatDistance;
            newAttackerPosition = clampPosition(newPosition);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "double_attack": {
            // Double attack: perform a second attack if defender survives
            // Requirements: 6.1, 6.2
            // Only perform second attack if defender is still alive
            if (newDefenderHp > 0 && performAttack) {
              const secondAttack = performAttack(attacker, defender);
              additionalAttacks.push(secondAttack);
              newDefenderHp = secondAttack.defenderNewHp;
            }

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "execute": {
            // Execute: kill defender if HP below threshold after damage
            // Requirements: 7.1, 7.2
            const executeThreshold = gem.effectParams.executeThreshold ?? 15;
            const defenderMaxHp = attackResult.defender.maxHp;
            const hpPercentage = (newDefenderHp / defenderMaxHp) * 100;

            // Only execute if defender is still alive and below threshold
            if (newDefenderHp > 0 && hpPercentage < executeThreshold) {
              newDefenderHp = 0;

              skillsActivated.push({
                skillType: gem.skillType,
                gemId: gem.id,
                gemName: gem.name,
              });
            }
            break;
          }

          case "power_shot": {
            // Power Shot (Bow): Deal bonus damage and knockback
            // 150% damage + push enemy back 1 cell
            const knockbackDistance = gem.effectParams.knockbackDistance ?? 1;
            const knockbackDirection = getDirectionSign(
              attackerPosition,
              defenderPosition,
            );

            // Calculate knockback with wall collision
            const wallResult = calculateKnockbackWithWallCollision(
              defenderPosition,
              knockbackDirection,
              knockbackDistance,
            );
            newDefenderPosition = wallResult.finalPosition;

            // Apply damage multiplier (150% = extra 50% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 150;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            let bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

            // Apply wall collision bonus damage
            if (wallResult.bonusDamageMultiplier > 0) {
              const wallBonusDamage = Math.floor(
                baseDamage * wallResult.bonusDamageMultiplier,
              );
              bonusDamage += wallBonusDamage;
              totalWallBonusDamage += wallBonusDamage;

              wallCollisionResult = {
                pushedToEdge: wallResult.pushedToEdge,
                wallSlam: wallResult.wallSlam,
                bonusDamage: totalWallBonusDamage,
              };
            }

            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "evasive_shot": {
            // Evasive Shot (Bow): Deal bonus damage and retreat
            // 250% damage + jump back 1 cell
            const retreatDistance = gem.effectParams.retreatDistance ?? 1;
            const retreatDirection = getDirectionSign(
              defenderPosition,
              attackerPosition,
            );
            const newPosition =
              attackerPosition + retreatDirection * retreatDistance;
            newAttackerPosition = clampPosition(newPosition);

            // Apply damage multiplier (250% = extra 150% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 250;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);
            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "piercing_thrust": {
            // Piercing Thrust (Spear): Deal bonus damage and pull enemy closer
            // 170% damage + pull enemy 1 cell towards attacker
            const pullDistance = gem.effectParams.pullDistance ?? 1;
            // Pull direction is opposite of knockback - towards attacker
            const pullDirection = getDirectionSign(
              defenderPosition,
              attackerPosition,
            );
            const newPosition = defenderPosition + pullDirection * pullDistance;
            const clampedPos = clampPosition(newPosition);
            // Ensure enemy stays at least 1 cell away from attacker
            if (attackerPosition < defenderPosition) {
              newDefenderPosition = Math.max(
                attackerPosition + 1,
                clampedPos,
              ) as typeof clampedPos;
            } else {
              newDefenderPosition = Math.min(
                attackerPosition - 1,
                clampedPos,
              ) as typeof clampedPos;
            }

            // Apply damage multiplier (170% = extra 70% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 170;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);
            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "whirlwind_charge": {
            // Whirlwind Charge (Spear): Leap to enemy position, spin and push back
            // Only activates if enemy is in attack range (assumed already in range since combat)
            // 200% damage + push enemy 2 cells back
            const chargeKnockback = gem.effectParams.chargeKnockback ?? 2;

            // Move attacker to position adjacent to where defender was
            const directionToDefender = getDirectionSign(
              attackerPosition,
              defenderPosition,
            );
            const adjacentToDefender = defenderPosition - directionToDefender;
            newAttackerPosition = clampPosition(adjacentToDefender);

            // Push defender back 2 cells from new attacker position with wall collision
            const knockbackDirection = getDirectionSign(
              newAttackerPosition,
              defenderPosition,
            );

            const wallResult = calculateKnockbackWithWallCollision(
              defenderPosition,
              knockbackDirection,
              chargeKnockback,
            );
            newDefenderPosition = wallResult.finalPosition;

            // Apply damage multiplier (200% = extra 100% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 200;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            let bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

            // Apply wall collision bonus damage
            if (wallResult.bonusDamageMultiplier > 0) {
              const wallBonusDamage = Math.floor(
                baseDamage * wallResult.bonusDamageMultiplier,
              );
              bonusDamage += wallBonusDamage;
              totalWallBonusDamage += wallBonusDamage;

              wallCollisionResult = {
                pushedToEdge: wallResult.pushedToEdge,
                wallSlam: wallResult.wallSlam,
                bonusDamage: totalWallBonusDamage,
              };
            }

            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "stunning_slash": {
            // Stunning Slash (Sword & Shield): 180% damage + 20% stun chance
            // Apply damage multiplier (180% = extra 80% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 180;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);
            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            // Stun effect is handled by the battle system (future implementation)
            // The stunChance and stunDuration are in effectParams for the battle system to use

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "shield_bash": {
            // Shield Bash (Sword & Shield): Push enemy 1 cell + follow + 120% damage
            const knockbackDistance = gem.effectParams.knockbackDistance ?? 1;
            const followPush = gem.effectParams.followPush ?? true;

            // Push defender back with wall collision
            const knockbackDirection = getDirectionSign(
              attackerPosition,
              defenderPosition,
            );

            const wallResult = calculateKnockbackWithWallCollision(
              defenderPosition,
              knockbackDirection,
              knockbackDistance,
            );
            newDefenderPosition = wallResult.finalPosition;

            // If followPush is true, attacker moves to defender's old position
            if (followPush) {
              newAttackerPosition =
                defenderPosition as typeof newAttackerPosition;
            }

            // Apply damage multiplier (120% = extra 20% damage)
            const damageMultiplier = gem.effectParams.damageMultiplier ?? 120;
            const bonusDamagePercent = (damageMultiplier - 100) / 100;
            const baseDamage =
              attackResult.defender.maxHp - attackResult.defenderNewHp;
            let bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

            // Apply wall collision bonus damage
            if (wallResult.bonusDamageMultiplier > 0) {
              const wallBonusDamage = Math.floor(
                baseDamage * wallResult.bonusDamageMultiplier,
              );
              bonusDamage += wallBonusDamage;
              totalWallBonusDamage += wallBonusDamage;

              wallCollisionResult = {
                pushedToEdge: wallResult.pushedToEdge,
                wallSlam: wallResult.wallSlam,
                bonusDamage: totalWallBonusDamage,
              };
            }

            newDefenderHp = Math.max(0, newDefenderHp - bonusDamage);

            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          case "damage_immunity": {
            // Damage Immunity (Sword & Shield Passive): Negate all damage
            // This skill is a defensive skill - it should be processed on the defender side
            // When this activates, the defender takes no damage from the attack
            // Note: This skill is processed differently - it needs to be checked
            // when the card is being attacked, not when attacking
            // For now, log the activation (actual immunity handled by battle system)
            skillsActivated.push({
              skillType: gem.skillType,
              gemId: gem.id,
              gemName: gem.name,
            });
            break;
          }

          default:
            // Other skill types are not combat skills (movement skills)
            break;
        }

        return {
          ...gemState,
          currentCooldown: activationResult.newCooldown,
        };
      });

      // Update attacker gems with new cooldowns (side effect for caller to handle)
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
