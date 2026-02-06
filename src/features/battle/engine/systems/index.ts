// Systems module barrel exports
export {
  createCombatSystem,
  combatSystem,
  type CombatSystem,
} from "./CombatSystem";

export { createTurnSystem, turnSystem, type TurnSystem } from "./TurnSystem";

export {
  createVictorySystem,
  victorySystem,
  type VictorySystem,
} from "./VictorySystem";

// Use the new refactored SkillSystem with Strategy Pattern
export {
  createSkillSystem,
  skillSystem,
  clampPosition,
  getDirectionSign,
  isAtEdge,
  calculateKnockbackWithWallCollision,
  type SkillSystem,
  type ActivatedSkill,
  type MovementSkillResult,
  type CombatSkillResult,
  type SkillActivationResult,
  type SkillAttackResult,
  type WallCollisionResult,
} from "./SkillSystemNew";
