/**
 * DailyBonusNotification Component - Toast notification for daily bonus
 * Requirements: 1.4
 * - Toast notification on daily bonus claim
 * - Show amount received (1000 gold)
 * - Auto-dismiss after delay
 */

import { useEffect, useCallback } from "react";
import { useBettingStore } from "../store/bettingStore";
import { showDailyBonusToast } from "../utils/showDailyBonusToast";

export interface DailyBonusNotificationProps {
  /** Whether to auto-check and claim on mount */
  autoCheck?: boolean;
}

/**
 * DailyBonusNotification Component
 * Handles automatic daily bonus check and notification display
 */
export function DailyBonusNotification({
  autoCheck = true,
}: DailyBonusNotificationProps) {
  const checkDailyBonus = useBettingStore((state) => state.checkDailyBonus);
  const claimDailyBonus = useBettingStore((state) => state.claimDailyBonus);

  const handleClaimBonus = useCallback(() => {
    const canClaim = checkDailyBonus();
    if (canClaim) {
      const claimed = claimDailyBonus();
      if (claimed) {
        showDailyBonusToast();
      }
    }
  }, [checkDailyBonus, claimDailyBonus]);

  // Auto-check and claim on mount if enabled
  useEffect(() => {
    if (autoCheck) {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(handleClaimBonus, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, handleClaimBonus]);

  // This component doesn't render anything visible
  // It just handles the notification logic
  return null;
}

export default DailyBonusNotification;
