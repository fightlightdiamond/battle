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
} from "./types";

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
export { GemListPage, GemCreatePage, GemEditPage } from "./pages";
