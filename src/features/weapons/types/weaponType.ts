// ============================================================================
// WEAPON TYPE DEFINITIONS
// ============================================================================

import type {
  SkillType,
  SkillTrigger,
  SkillEffectParams,
} from "../../gems/types/gem";

/**
 * Fixed weapon types in the game
 */
export const WEAPON_TYPES = ["bow", "spear", "sword_shield"] as const;

export type WeaponType = (typeof WEAPON_TYPES)[number];

/**
 * Weapon skill configuration
 */
export interface WeaponSkill {
  id: string;
  name: string;
  description: string;
  skillType: SkillType;
  trigger: SkillTrigger;
  activationChance: number; // 0-100 percentage
  cooldown: number;
  effectParams: SkillEffectParams;
}

/**
 * Weapon type configuration with base stats and characteristics
 */
export interface WeaponTypeConfig {
  type: WeaponType;
  name: string;
  description: string;
  icon: string;
  // Base stat modifiers (applied on creation)
  baseStats: {
    atk: number;
    critChance: number;
    critDamage: number;
    armorPen: number;
    lifesteal: number;
    attackRange: number;
  };
  // Combat characteristics
  characteristics: {
    attackSpeed: "slow" | "medium" | "fast";
    damageType: "physical" | "piercing";
    playstyle: string;
  };
  // Weapon-specific skills
  skills: WeaponSkill[];
}

/**
 * Weapon type configurations
 */
export const WEAPON_TYPE_CONFIGS: Record<WeaponType, WeaponTypeConfig> = {
  bow: {
    type: "bow",
    name: "Bow",
    description: "Long-range weapon with high critical hit potential",
    icon: "🏹",
    baseStats: {
      atk: 80,
      critChance: 25,
      critDamage: 180,
      armorPen: 10,
      lifesteal: 0,
      attackRange: 4,
    },
    characteristics: {
      attackSpeed: "medium",
      damageType: "piercing",
      playstyle: "Ranged DPS - Attack from distance with critical strikes",
    },
    skills: [
      {
        id: "bow_power_shot",
        name: "Power Shot",
        description: "Bắn mạnh gây 150% sát thương và đẩy lùi địch 1 ô",
        skillType: "power_shot",
        trigger: "combat",
        activationChance: 30,
        cooldown: 2,
        effectParams: {
          damageMultiplier: 150,
          knockbackDistance: 1,
        },
      },
      {
        id: "bow_evasive_shot",
        name: "Evasive Shot",
        description: "Bắn gây 250% sát thương và nhảy lùi 1 ô",
        skillType: "evasive_shot",
        trigger: "combat",
        activationChance: 40,
        cooldown: 4,
        effectParams: {
          damageMultiplier: 250,
          retreatDistance: 1,
        },
      },
    ],
  },
  spear: {
    type: "spear",
    name: "Spear",
    description: "Balanced weapon with medium range and armor penetration",
    icon: "🔱",
    baseStats: {
      atk: 100,
      critChance: 15,
      critDamage: 150,
      armorPen: 25,
      lifesteal: 5,
      attackRange: 2,
    },
    characteristics: {
      attackSpeed: "medium",
      damageType: "piercing",
      playstyle: "Balanced Fighter - Good reach with armor-piercing attacks",
    },
    skills: [
      {
        id: "spear_piercing_thrust",
        name: "Piercing Thrust",
        description: "Đâm thương gây 170% sát thương và kéo địch về 1 ô",
        skillType: "piercing_thrust",
        trigger: "combat",
        activationChance: 50,
        cooldown: 2,
        effectParams: {
          damageMultiplier: 170,
          pullDistance: 1,
        },
      },
      {
        id: "spear_whirlwind_charge",
        name: "Whirlwind Charge",
        description:
          "Nhảy vào vị trí địch, xoáy thương đẩy xa 2 ô gây 200% sát thương",
        skillType: "whirlwind_charge",
        trigger: "combat",
        activationChance: 100,
        cooldown: 4,
        effectParams: {
          damageMultiplier: 200,
          chargeKnockback: 2,
        },
      },
    ],
  },
  sword_shield: {
    type: "sword_shield",
    name: "Sword & Shield",
    description: "Close-range weapon with high attack and lifesteal",
    icon: "⚔️🛡️",
    baseStats: {
      atk: 120,
      critChance: 10,
      critDamage: 150,
      armorPen: 15,
      lifesteal: 15,
      attackRange: 1,
    },
    characteristics: {
      attackSpeed: "fast",
      damageType: "physical",
      playstyle: "Melee Tank - High damage with sustain from lifesteal",
    },
    skills: [
      {
        id: "sword_speed_boost",
        name: "Swift Advance",
        description: "Bị động: 50% cơ hội tăng tốc di chuyển thêm 1 ô",
        skillType: "speed_boost",
        trigger: "movement",
        activationChance: 50,
        cooldown: 0,
        effectParams: {
          moveDistance: 1,
        },
      },
      {
        id: "sword_damage_immunity",
        name: "Iron Guard",
        description:
          "Bị động: 20% cơ hội miễn hoàn toàn sát thương khi bị tấn công",
        skillType: "damage_immunity",
        trigger: "combat",
        activationChance: 20,
        cooldown: 0,
        effectParams: {},
      },
      {
        id: "sword_stunning_slash",
        name: "Stunning Slash",
        description: "Chém ngang gây 180% sát thương, 20% làm choáng 1 turn",
        skillType: "stunning_slash",
        trigger: "combat",
        activationChance: 100,
        cooldown: 2,
        effectParams: {
          damageMultiplier: 180,
          stunChance: 20,
          stunDuration: 1,
        },
      },
      {
        id: "sword_shield_bash",
        name: "Shield Bash",
        description:
          "Đẩy khiên đẩy địch 1 ô và di chuyển theo, gây 120% sát thương",
        skillType: "shield_bash",
        trigger: "combat",
        activationChance: 100,
        cooldown: 4,
        effectParams: {
          damageMultiplier: 120,
          knockbackDistance: 1,
          followPush: true,
        },
      },
    ],
  },
};

/**
 * Get weapon type config by type
 */
export function getWeaponTypeConfig(type: WeaponType): WeaponTypeConfig {
  return WEAPON_TYPE_CONFIGS[type];
}

/**
 * Get all weapon types as array
 */
export function getAllWeaponTypes(): WeaponTypeConfig[] {
  return WEAPON_TYPES.map((type) => WEAPON_TYPE_CONFIGS[type]);
}

/**
 * Check if a string is a valid weapon type
 */
export function isValidWeaponType(type: string): type is WeaponType {
  return WEAPON_TYPES.includes(type as WeaponType);
}

/**
 * Get display name for weapon type
 */
export function getWeaponTypeName(type: WeaponType): string {
  return WEAPON_TYPE_CONFIGS[type].name;
}

/**
 * Get icon for weapon type
 */
export function getWeaponTypeIcon(type: WeaponType): string {
  return WEAPON_TYPE_CONFIGS[type].icon;
}
