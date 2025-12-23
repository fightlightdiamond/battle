// Battle store types (separated from implementation)
export type {
  BattleMode,
  BattleState,
  BattleActions,
  BattleStoreState,
  ArenaBattleState,
  ArenaBattleActions,
  ArenaBattleStoreState,
} from "./types";

// Battle store exports
export { useBattleStore } from "./battleStore";
export {
  selectCanStartBattle,
  selectCanAttack as selectCanAttackClassic,
  selectIsBattleFinished,
  selectIsBattleInProgress,
  selectWinner as selectClassicWinner,
  selectLoser as selectClassicLoser,
  selectCurrentAttackerCard,
  selectCurrentDefenderCard,
  selectLatestLogEntry,
  selectChallengerInDanger as selectClassicChallengerInDanger,
  selectOpponentInDanger as selectClassicOpponentInDanger,
  selectDangerStatus,
} from "./battleStore";

// Arena Battle store exports
export { useArenaBattleStore } from "./arenaBattleStore";
export {
  getDistance,
  areAdjacent,
  getNextPosition,
  determinePhase,
  determinePhaseWithRange,
  isInAttackRange,
  canCardMove,
  selectCanMove,
  selectCanMoveWithRange,
  selectCanAttack,
  selectIsArenaFinished,
  selectIsInCombat,
  selectIsMoving,
  selectWinner,
  selectLoser,
  selectChallengerInDanger,
  selectOpponentInDanger,
} from "./arenaBattleStore";
