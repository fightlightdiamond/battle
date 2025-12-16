// Battle store exports
export { useBattleStore } from "./battleStore";
export type { BattleStoreState } from "./battleStore";

// Arena Battle store exports
export { useArenaBattleStore } from "./arenaBattleStore";
export type {
  ArenaBattleState,
  ArenaBattleStoreState,
} from "./arenaBattleStore";
export {
  getDistance,
  areAdjacent,
  getNextPosition,
  determinePhase,
  selectCanMove,
  selectCanAttack,
  selectIsArenaFinished,
  selectIsInCombat,
  selectIsMoving,
  selectWinner,
  selectLoser,
  selectChallengerInDanger,
  selectOpponentInDanger,
} from "./arenaBattleStore";
