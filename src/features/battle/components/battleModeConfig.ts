/**
 * Battle Mode Configuration
 * Contains constants and utility functions for battle modes
 */

export type BattleMode = "classic" | "arena";

export interface BattleModeOption {
  id: BattleMode;
  label: string;
  description: string;
}

/**
 * Route configuration for each battle mode
 * Used by BattleSetupPage to navigate to the correct arena page
 */
export const BATTLE_MODE_ROUTES: Record<BattleMode, string> = {
  classic: "/battle/arena",
  arena: "/battle/arena-1d",
};

/**
 * Get the navigation route for a given battle mode
 * @param mode - The selected battle mode
 * @returns The route path for the battle arena page
 */
export function getBattleModeRoute(mode: BattleMode): string {
  return BATTLE_MODE_ROUTES[mode];
}
