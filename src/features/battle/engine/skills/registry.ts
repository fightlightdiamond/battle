// ============================================================================
// SKILL HANDLER REGISTRY
// ============================================================================

import type {
  MovementSkillHandler,
  CombatSkillHandler,
  SkillHandler,
} from "./types";

// Import movement handlers
import {
  doubleMoveHandler,
  leapStrikeHandler,
  speedBoostHandler,
} from "./handlers/movement";

// Import combat handlers
import {
  knockbackHandler,
  retreatHandler,
  doubleAttackHandler,
  executeHandler,
  powerShotHandler,
  evasiveShotHandler,
  piercingThrustHandler,
  whirlwindChargeHandler,
  stunningSlashHandler,
  shieldBashHandler,
  damageImmunityHandler,
} from "./handlers/combat";

/**
 * Registry for movement skill handlers
 */
const movementHandlers = new Map<string, MovementSkillHandler>([
  [doubleMoveHandler.skillType, doubleMoveHandler],
  [leapStrikeHandler.skillType, leapStrikeHandler],
  [speedBoostHandler.skillType, speedBoostHandler],
]);

/**
 * Registry for combat skill handlers
 */
const combatHandlers = new Map<string, CombatSkillHandler>([
  [knockbackHandler.skillType, knockbackHandler],
  [retreatHandler.skillType, retreatHandler],
  [doubleAttackHandler.skillType, doubleAttackHandler],
  [executeHandler.skillType, executeHandler],
  [powerShotHandler.skillType, powerShotHandler],
  [evasiveShotHandler.skillType, evasiveShotHandler],
  [piercingThrustHandler.skillType, piercingThrustHandler],
  [whirlwindChargeHandler.skillType, whirlwindChargeHandler],
  [stunningSlashHandler.skillType, stunningSlashHandler],
  [shieldBashHandler.skillType, shieldBashHandler],
  [damageImmunityHandler.skillType, damageImmunityHandler],
]);

/**
 * Get a movement skill handler by skill type
 */
export function getMovementHandler(
  skillType: string,
): MovementSkillHandler | undefined {
  return movementHandlers.get(skillType);
}

/**
 * Get a combat skill handler by skill type
 */
export function getCombatHandler(
  skillType: string,
): CombatSkillHandler | undefined {
  return combatHandlers.get(skillType);
}

/**
 * Get any skill handler by skill type
 */
export function getHandler(skillType: string): SkillHandler | undefined {
  return movementHandlers.get(skillType) ?? combatHandlers.get(skillType);
}

/**
 * Register a new movement skill handler
 */
export function registerMovementHandler(handler: MovementSkillHandler): void {
  movementHandlers.set(handler.skillType, handler);
}

/**
 * Register a new combat skill handler
 */
export function registerCombatHandler(handler: CombatSkillHandler): void {
  combatHandlers.set(handler.skillType, handler);
}

/**
 * Get all registered movement skill types
 */
export function getMovementSkillTypes(): string[] {
  return Array.from(movementHandlers.keys());
}

/**
 * Get all registered combat skill types
 */
export function getCombatSkillTypes(): string[] {
  return Array.from(combatHandlers.keys());
}

/**
 * Check if a skill type is a movement skill
 */
export function isMovementSkill(skillType: string): boolean {
  return movementHandlers.has(skillType);
}

/**
 * Check if a skill type is a combat skill
 */
export function isCombatSkill(skillType: string): boolean {
  return combatHandlers.has(skillType);
}
