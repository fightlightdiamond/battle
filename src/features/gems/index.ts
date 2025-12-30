// Types
export type {
  Gem,
  GemFormInput,
  SkillType,
  SkillTrigger,
  SkillEffectParams,
  CardGemEquipment,
  EquippedGemState,
  BattleCardGems,
  GemSchemaType,
  GemFormSchemaType,
  SkillEffectParamsSchemaType,
  // Gem tier types
  GemTier,
  TieredGem,
  // Evolution path types
  EvolutionCost,
  EvolutionPath,
  EvolutionPathInput,
  EvolutionResult,
  EvolutionValidationResult,
  // Skill tree types
  NodeState,
  GemNodeData,
  EvolutionEdgeData,
  GemFlowNode,
  EvolutionFlowEdge,
  SkillTreeState,
  PlayerGems,
  PlayerResources,
} from "./types";

export {
  MAX_GEM_SLOTS,
  gemSchema,
  gemFormSchema,
  skillEffectParamsSchema,
  skillTypeSchema,
  skillTriggerSchema,
  validateGemName,
  GEM_NAME_MAX_LENGTH,
  GEM_DESCRIPTION_MAX_LENGTH,
  ACTIVATION_CHANCE_RANGE,
  COOLDOWN_RANGE,
  EFFECT_PARAM_RANGES,
  // Gem tier exports
  TIER_ORDER,
  ALL_TIERS,
  DEFAULT_TIER,
  isTierHigher,
  isTierLower,
  getNextTier,
  getPreviousTier,
} from "./types";

// Config
export type {
  TierConfig,
  NodeStateStyle,
  NodeStyleConfig,
  EdgeStyleConfig,
  LayoutConfig,
  SkillTypeConfig,
  SkillTreeConfig,
} from "./config";

export { defaultSkillTreeConfig } from "./config";

// Services
export { GemService } from "./services/gemService";
export { GemEquipmentService } from "./services/gemEquipmentService";
export {
  saveGemImage,
  deleteGemImage,
  getGemImageUrl,
} from "./services/gemImageStorage";

// Hooks
export {
  gemKeys,
  gemEquipmentKeys,
  useGems,
  useGem,
  useCreateGem,
  useUpdateGem,
  useDeleteGem,
  useCardGems,
  useEquipGem,
  useUnequipGem,
} from "./hooks";

// Components
export {
  GemCard,
  GemCardSkeleton,
  GemList,
  GemForm,
  GemSelector,
  GemSelectorWithActions,
  EquippedGems,
  EquippedGemsCompact,
} from "./components";

// Pages
export {
  GemListPage,
  GemCreatePage,
  GemEditPage,
  SkillTreePage,
} from "./pages";
