// Battle type exports
export type {
  BattleCard,
  BattleLogEntry,
  BattleLogEntryType,
  BattleState,
  AttackResult,
  BattlePhase,
  BattleResult,
  CurrentAttacker,
  HpBarColor,
  CardPosition,
} from "./battle";

export {
  HP_BAR_COLORS,
  HP_THRESHOLDS,
  BATTLE_PARTICIPANTS,
  BATTLE_PHASES,
  BATTLE_RESULTS,
  CARD_POSITIONS,
  COMBAT_CONSTANTS,
} from "./battle";

// Battle History type exports
export type {
  CombatantSnapshot,
  DamageBreakdown,
  LifestealDetail,
  DefenderHpState,
  TurnRecord,
  HpTimelineEntry,
  BattleRecord,
} from "./battleHistoryTypes";
