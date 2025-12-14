/**
 * Daily Bonus Service
 * Handles daily bonus claim logic with local storage persistence
 * Requirements: 1.1, 1.2, 1.3
 */

import type { DailyBonusClaim } from "../types/betting";

const DAILY_BONUS_STORAGE_KEY = "betting_daily_bonus";

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/**
 * Get the last daily bonus claim info from local storage
 */
export const getLastClaim = (): DailyBonusClaim | null => {
  try {
    const stored = localStorage.getItem(DAILY_BONUS_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as DailyBonusClaim;
  } catch {
    return null;
  }
};

/**
 * Check if the daily bonus can be claimed today
 * Returns true if no claim has been made today (same calendar day)
 * Requirements: 1.1, 1.2
 */
export const canClaimToday = (): boolean => {
  const lastClaim = getLastClaim();
  if (!lastClaim) return true;

  const todayDate = getTodayDateString();
  return lastClaim.lastClaimDate !== todayDate;
};

/**
 * Record a daily bonus claim to local storage
 * Saves the current timestamp and date
 * Requirements: 1.3
 */
export const recordClaim = (): void => {
  const claim: DailyBonusClaim = {
    lastClaimDate: getTodayDateString(),
    lastClaimTimestamp: Date.now(),
  };
  localStorage.setItem(DAILY_BONUS_STORAGE_KEY, JSON.stringify(claim));
};

/**
 * Daily bonus service object for convenient imports
 */
export const dailyBonusService = {
  canClaimToday,
  recordClaim,
  getLastClaim,
  getTodayDateString,
};
