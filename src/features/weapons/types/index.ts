// Weapon types and interfaces
export type {
  Weapon,
  WeaponStats,
  WeaponFormInput,
  WeaponStatKey,
} from "./weapon";

// Weapon constants
export {
  DEFAULT_WEAPON_STATS,
  WEAPON_STAT_RANGES,
  applyDefaultWeaponStats,
} from "./weapon";

// Weapon type definitions
export type { WeaponType, WeaponTypeConfig } from "./weaponType";

export {
  WEAPON_TYPES,
  WEAPON_TYPE_CONFIGS,
  getWeaponTypeConfig,
  getAllWeaponTypes,
  isValidWeaponType,
  getWeaponTypeName,
  getWeaponTypeIcon,
} from "./weaponType";

// Schemas and validation
export {
  weaponSchema,
  weaponFormSchema,
  weaponStatsSchema,
  weaponTypeSchema,
  imageSchema,
  validateWeaponName,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  WEAPON_NAME_MAX_LENGTH,
} from "./schemas";

export type {
  WeaponSchemaType,
  WeaponFormSchemaType,
  WeaponStatsSchemaType,
} from "./schemas";

// Equipment types
export type {
  CardEquipment,
  EffectiveCardStats,
  WeaponBonusStats,
} from "./equipment";

// Enhancement types
export type {
  EnhanceLevel,
  EnhanceResult,
  EnhanceAttempt,
  EnhanceMaterial,
  EnhanceMaterialType,
  EnhanceTierConfig,
  EnhancePreview,
} from "./enhancement";

export { MAX_ENHANCE_LEVEL, MATERIAL_INFO } from "./enhancement";
