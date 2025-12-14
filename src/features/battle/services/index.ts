// Battle services exports
export {
  battleService,
  calculateAttack,
  checkBattleEnd,
  calculateHpPercentage,
  getHpBarColor,
} from "./battleService";

// Battle recorder exports
export {
  createBattleRecorder,
  battleRecorder,
  type BattleRecorderInstance,
} from "./battleRecorder";

// Battle history service exports
export {
  battleHistoryService,
  type PaginatedBattleResponse,
} from "./battleHistoryService";
