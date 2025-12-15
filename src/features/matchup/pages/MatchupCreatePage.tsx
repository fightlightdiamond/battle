/**
 * MatchupCreatePage - Admin page to create new matchups
 *
 * Reuses BattleSetupPage with mode="matchup"
 *
 * Requirements: 1.1, 1.3
 */

import { BattleSetupPage } from "../../battle/pages/BattleSetupPage";

/**
 * MatchupCreatePage
 *
 * Wrapper around BattleSetupPage with matchup mode.
 * This allows admin to select two cards and create a matchup for betting.
 */
export function MatchupCreatePage() {
  return <BattleSetupPage mode="matchup" />;
}

export default MatchupCreatePage;
