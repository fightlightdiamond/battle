/**
 * Daily Bonus Toast utility
 * Requirements: 1.4
 */

import { toast } from "sonner";
import { Coins, Gift } from "lucide-react";
import { DAILY_BONUS_AMOUNT } from "../types/betting";

/**
 * Show daily bonus toast notification
 */
export function showDailyBonusToast(amount: number = DAILY_BONUS_AMOUNT) {
  toast.success(
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <Gift className="h-5 w-5 text-yellow-500" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Daily Bonus Claimed!</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Coins className="h-3 w-3 text-yellow-500" />
          <span className="font-medium text-yellow-600">
            +{amount.toLocaleString()}
          </span>{" "}
          gold added
        </p>
      </div>
    </div>,
    {
      duration: 5000,
      className: "daily-bonus-toast",
    }
  );
}
