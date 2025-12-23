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
} from "./types";

export { MAX_GEM_SLOTS } from "./types";

// Services
export { GemService } from "./services/gemService";
export { GemEquipmentService } from "./services/gemEquipmentService";

// Hooks
export {
  gemKeys,
  useGems,
  useGem,
  useCreateGem,
  useUpdateGem,
  useDeleteGem,
} from "./hooks";

// Components
export { GemCard, GemCardSkeleton, GemList, GemForm } from "./components";

// Pages
export { GemListPage, GemCreatePage, GemEditPage } from "./pages";
