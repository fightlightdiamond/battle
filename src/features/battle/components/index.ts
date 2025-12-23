// Battle components exports
export { HPBar } from "./HPBar";
export type { HPBarProps } from "./HPBar";

export { BattleCard } from "./BattleCard";
export type { BattleCardProps } from "./BattleCard";

export { DamageNumber } from "./DamageNumber";
export type { DamageNumberProps } from "./DamageNumber";

export { HealNumber } from "./HealNumber";
export type { HealNumberProps } from "./HealNumber";

export { BattleLog } from "./BattleLog";
export type { BattleLogProps } from "./BattleLog";

export { BattleLogPopup } from "./BattleLogPopup";
export type { BattleLogPopupProps } from "./BattleLogPopup";

export { BattleControls } from "./BattleControls";
export type { BattleControlsProps } from "./BattleControls";

export { CardSelector } from "./CardSelector";
export type { CardSelectorProps } from "./CardSelector";

export { TurnTimeline } from "./TurnTimeline";
export type { TurnTimelineProps } from "./TurnTimeline";

export { BattleReplayPlayer } from "./BattleReplayPlayer";
export type { BattleReplayPlayerProps } from "./BattleReplayPlayer";

export { ReplayControls } from "./ReplayControls";
export type { ReplayControlsProps } from "./ReplayControls";

export { BattleModeSelector } from "./BattleModeSelector";
export type {
  BattleModeSelectorProps,
  BattleMode,
  BattleModeOption,
} from "./BattleModeSelector";
export { getBattleModeRoute, BATTLE_MODE_ROUTES } from "./battleModeConfig";

export { VictoryParticles } from "./VictoryParticles";

// Skill display components (Requirements: 9.4, 11.2)
export { SkillActivationIndicator } from "./SkillActivationIndicator";
export type { SkillActivationIndicatorProps } from "./SkillActivationIndicator";

export { GemCooldownDisplay, GemCooldownInline } from "./GemCooldownDisplay";
export type { GemCooldownDisplayProps } from "./GemCooldownDisplay";
