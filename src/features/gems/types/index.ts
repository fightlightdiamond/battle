// Gem types and interfaces
export type {
  Gem,
  GemFormInput,
  SkillType,
  SkillTrigger,
  SkillEffectParams,
  GemTierType,
} from "./gem";

export { DEFAULT_GEM_TIER } from "./gem";

// Gem tier types
export type { GemTier, TieredGem } from "./gemTier";
export {
  TIER_ORDER,
  ALL_TIERS,
  DEFAULT_TIER,
  isTierHigher,
  isTierLower,
  getNextTier,
  getPreviousTier,
} from "./gemTier";

// Evolution path types
export type {
  EvolutionCost,
  EvolutionPath,
  EvolutionPathInput,
  EvolutionResult,
  EvolutionValidationResult,
} from "./evolutionPath";

// Skill tree types
export type { NodeState } from "./skillTree";
export type {
  GemNodeData,
  EvolutionEdgeData,
  GemFlowNode,
  EvolutionFlowEdge,
  SkillTreeState,
  PlayerGems,
  PlayerResources,
} from "./skillTree";

// Equipment types
export type {
  CardGemEquipment,
  EquippedGemState,
  BattleCardGems,
} from "./equipment";

// Equipment constants
export { MAX_GEM_SLOTS } from "./equipment";

// Schemas and validation
export {
  gemSchema,
  gemFormSchema,
  skillEffectParamsSchema,
  skillTypeSchema,
  skillTriggerSchema,
  gemTierSchema,
  validateGemName,
  GEM_NAME_MAX_LENGTH,
  GEM_DESCRIPTION_MAX_LENGTH,
  ACTIVATION_CHANCE_RANGE,
  COOLDOWN_RANGE,
  EFFECT_PARAM_RANGES,
} from "./schemas";

export type {
  GemSchemaType,
  GemFormSchemaType,
  SkillEffectParamsSchemaType,
} from "./schemas";
