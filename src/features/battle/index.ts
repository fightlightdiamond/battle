// Battle feature barrel export

// Styles - import battle CSS
import "./styles/battle.css";

// Types - export with explicit names to avoid conflicts
export type {
  BattleCard as BattleCardType,
  BattleLogEntry,
  BattleLogEntryType,
  BattlePhase,
  BattleResult,
  CurrentAttacker,
  AttackResult,
  BattleState,
  HpBarColor,
  CardPosition,
} from "./types";
export {
  BATTLE_PARTICIPANTS,
  BATTLE_PHASES,
  BATTLE_RESULTS,
  HP_BAR_COLORS,
  HP_THRESHOLDS,
  CARD_POSITIONS,
} from "./types";

// Services
export * from "./services";

// Store
export * from "./store";

// Hooks
export * from "./hooks";

// Components - BattleCard component takes precedence
export * from "./components";

// Pages
export * from "./pages";

// Utils
export * from "./utils";
