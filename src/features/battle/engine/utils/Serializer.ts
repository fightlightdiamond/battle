import type {
  BattleState,
  BattlePhase,
  Combatant,
  CombatantStats,
  ActiveBuff,
  BattleLogEntry,
  BattleResult,
  AttackLogData,
  SkillLogData,
} from "../core/types";

/**
 * Serializer utility for BattleState persistence.
 * Handles serialization to JSON and deserialization with validation.
 */
export const Serializer = {
  /**
   * Serialize a BattleState to a JSON string.
   */
  serialize(state: BattleState): string {
    return JSON.stringify(state);
  },

  /**
   * Deserialize a JSON string to a BattleState.
   * Validates the structure and throws if invalid.
   */
  deserialize(json: string): BattleState {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("Invalid JSON string");
    }

    return validateBattleState(parsed);
  },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateBattleState(data: unknown): BattleState {
  if (!isObject(data)) {
    throw new Error("BattleState must be an object");
  }

  const phase = validateBattlePhase(data.phase);
  const turn = validateNumber(data.turn, "turn");
  const challenger = validateCombatant(data.challenger, "challenger");
  const opponent = validateCombatant(data.opponent, "opponent");
  const currentAttacker = validateCurrentAttacker(data.currentAttacker);
  const battleLog = validateBattleLog(data.battleLog);
  const result = validateBattleResult(data.result);
  const isAutoBattle = validateBoolean(data.isAutoBattle, "isAutoBattle");

  return {
    phase,
    turn,
    challenger,
    opponent,
    currentAttacker,
    battleLog,
    result,
    isAutoBattle,
  };
}

function validateBattlePhase(value: unknown): BattlePhase {
  const validPhases: BattlePhase[] = ["setup", "ready", "fighting", "finished"];
  if (
    typeof value !== "string" ||
    !validPhases.includes(value as BattlePhase)
  ) {
    throw new Error(`Invalid phase: ${value}`);
  }
  return value as BattlePhase;
}

function validateCurrentAttacker(value: unknown): "challenger" | "opponent" {
  if (value !== "challenger" && value !== "opponent") {
    throw new Error(`Invalid currentAttacker: ${value}`);
  }
  return value;
}

function validateCombatant(data: unknown, name: string): Combatant {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  return {
    id: validateString(data.id, `${name}.id`),
    name: validateString(data.name, `${name}.name`),
    imageUrl: validateNullableString(data.imageUrl, `${name}.imageUrl`),
    baseStats: validateCombatantStats(data.baseStats, `${name}.baseStats`),
    currentHp: validateNumber(data.currentHp, `${name}.currentHp`),
    maxHp: validateNumber(data.maxHp, `${name}.maxHp`),
    buffs: validateBuffs(data.buffs, `${name}.buffs`),
    isDefeated: validateBoolean(data.isDefeated, `${name}.isDefeated`),
  };
}

function validateCombatantStats(data: unknown, name: string): CombatantStats {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  return {
    // Core Stats (Tier 1)
    atk: validateNumber(data.atk, `${name}.atk`),
    def: validateNumber(data.def, `${name}.def`),
    spd: validateNumber(data.spd, `${name}.spd`),

    // Combat Stats (Tier 2)
    critChance: validateNumber(data.critChance, `${name}.critChance`),
    critDamage: validateNumber(data.critDamage, `${name}.critDamage`),
    armorPen: validateNumber(data.armorPen, `${name}.armorPen`),
    lifesteal: validateNumber(data.lifesteal, `${name}.lifesteal`),
  };
}

function validateBuffs(data: unknown, name: string): readonly ActiveBuff[] {
  if (!Array.isArray(data)) {
    throw new Error(`${name} must be an array`);
  }

  return data.map((buff, index) =>
    validateActiveBuff(buff, `${name}[${index}]`)
  );
}

function validateActiveBuff(data: unknown, name: string): ActiveBuff {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  const type = data.type;
  if (type !== "buff" && type !== "debuff") {
    throw new Error(`${name}.type must be "buff" or "debuff"`);
  }

  const stat = data.stat;
  const validStats: (keyof CombatantStats)[] = [
    "atk",
    "def",
    "spd",
    "critChance",
    "critDamage",
    "armorPen",
    "lifesteal",
  ];
  if (
    typeof stat !== "string" ||
    !validStats.includes(stat as keyof CombatantStats)
  ) {
    throw new Error(`${name}.stat must be a valid stat key`);
  }

  const stackRule = data.stackRule;
  if (stackRule !== "replace" && stackRule !== "add" && stackRule !== "max") {
    throw new Error(`${name}.stackRule must be "replace", "add", or "max"`);
  }

  return {
    id: validateString(data.id, `${name}.id`),
    name: validateString(data.name, `${name}.name`),
    type,
    stat: stat as keyof CombatantStats,
    value: validateNumber(data.value, `${name}.value`),
    isPercentage: validateBoolean(data.isPercentage, `${name}.isPercentage`),
    remainingDuration: validateNumber(
      data.remainingDuration,
      `${name}.remainingDuration`
    ),
    stackRule,
    stacks: validateNumber(data.stacks, `${name}.stacks`),
  };
}

function validateBattleLog(data: unknown): readonly BattleLogEntry[] {
  if (!Array.isArray(data)) {
    throw new Error("battleLog must be an array");
  }

  return data.map((entry, index) =>
    validateBattleLogEntry(entry, `battleLog[${index}]`)
  );
}

function validateBattleLogEntry(data: unknown, name: string): BattleLogEntry {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  const type = data.type;
  const validTypes = ["attack", "damage", "skill", "buff", "victory"];
  if (typeof type !== "string" || !validTypes.includes(type)) {
    throw new Error(`${name}.type must be one of: ${validTypes.join(", ")}`);
  }

  const entry: BattleLogEntry = {
    id: validateString(data.id, `${name}.id`),
    timestamp: validateNumber(data.timestamp, `${name}.timestamp`),
    type: type as BattleLogEntry["type"],
    message: validateString(data.message, `${name}.message`),
  };

  if (data.data !== undefined) {
    if (type === "attack" || type === "damage") {
      return {
        ...entry,
        data: validateAttackLogData(data.data, `${name}.data`),
      };
    } else if (type === "skill") {
      return {
        ...entry,
        data: validateSkillLogData(data.data, `${name}.data`),
      };
    }
  }

  return entry;
}

function validateAttackLogData(data: unknown, name: string): AttackLogData {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  return {
    attackerId: validateString(data.attackerId, `${name}.attackerId`),
    defenderId: validateString(data.defenderId, `${name}.defenderId`),
    damage: validateNumber(data.damage, `${name}.damage`),
    isCritical: validateBoolean(data.isCritical, `${name}.isCritical`),
    defenderRemainingHp: validateNumber(
      data.defenderRemainingHp,
      `${name}.defenderRemainingHp`
    ),
  };
}

function validateSkillLogData(data: unknown, name: string): SkillLogData {
  if (!isObject(data)) {
    throw new Error(`${name} must be an object`);
  }

  const targetIds = data.targetIds;
  if (
    !Array.isArray(targetIds) ||
    !targetIds.every((id) => typeof id === "string")
  ) {
    throw new Error(`${name}.targetIds must be an array of strings`);
  }

  const effects = data.effects;
  if (!Array.isArray(effects) || !effects.every((e) => typeof e === "string")) {
    throw new Error(`${name}.effects must be an array of strings`);
  }

  return {
    skillId: validateString(data.skillId, `${name}.skillId`),
    skillName: validateString(data.skillName, `${name}.skillName`),
    casterId: validateString(data.casterId, `${name}.casterId`),
    targetIds: targetIds as readonly string[],
    effects: effects as readonly string[],
  };
}

function validateBattleResult(data: unknown): BattleResult | null {
  if (data === null) {
    return null;
  }

  if (!isObject(data)) {
    throw new Error("result must be an object or null");
  }

  const winner = data.winner;
  if (winner !== "challenger" && winner !== "opponent") {
    throw new Error('result.winner must be "challenger" or "opponent"');
  }

  return {
    winner,
    winnerName: validateString(data.winnerName, "result.winnerName"),
    totalTurns: validateNumber(data.totalTurns, "result.totalTurns"),
  };
}

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
  return value;
}

function validateNullableString(value: unknown, name: string): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string or null`);
  }
  return value;
}

function validateNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${name} must be a number`);
  }
  return value;
}

function validateBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean`);
  }
  return value;
}
