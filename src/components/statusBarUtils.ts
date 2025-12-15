/**
 * StatusBar Utility Functions
 * Requirements: 1.5
 * - Visibility logic based on route
 */

/**
 * Determines if the status bar should be visible based on the current route.
 * Hidden during battle arena and replay modes.
 *
 * @param pathname - Current route pathname
 * @returns true if status bar should be visible
 */
export function shouldShowStatusBar(pathname: string): boolean {
  // Hide during battle arena
  if (pathname === "/battle/arena") return false;
  // Hide during bet battle arena
  if (pathname === "/bet-battle/arena") return false;
  // Hide during replay
  if (pathname.includes("/replay")) return false;

  return true;
}
