// Gem types and interfaces
export type {
  Gem,
  GemFormInput,
  SkillType,
  SkillTrigger,
  SkillEffectParams,
} from "./gem";

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
