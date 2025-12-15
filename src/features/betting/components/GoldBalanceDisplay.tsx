/**
 * GoldBalanceDisplay Component - Displays current gold balance
 * Requirements: 6.1, 6.2
 * - Display current gold balance in header
 * - Subscribe to bettingStore for real-time updates
 * - Show gold icon with formatted number
 */

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBettingStore, selectGoldBalance } from "../store/bettingStore";
import { formatGold } from "../utils/formatGold";

export interface GoldBalanceDisplayProps {
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show label text */
  showLabel?: boolean;
}

/**
 * GoldBalanceDisplay Component
 * Displays the current gold balance with a coin icon
 */
export function GoldBalanceDisplay({
  className,
  size = "md",
  showLabel = false,
}: GoldBalanceDisplayProps) {
  // Subscribe to gold balance from betting store (Requirements: 6.2)
  const goldBalance = useBettingStore(selectGoldBalance);

  const sizeClasses = {
    sm: {
      container: "px-2 py-1 gap-1",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    md: {
      container: "px-3 py-1.5 gap-2",
      icon: "h-5 w-5",
      text: "text-base",
    },
    lg: {
      container: "px-4 py-2 gap-2",
      icon: "h-6 w-6",
      text: "text-lg",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex items-center rounded-full",
        "bg-slate-900/80",
        "border-2 border-yellow-500/50",
        classes.container,
        className
      )}
      data-testid="gold-balance-display"
    >
      <Coins
        className={cn(
          classes.icon,
          "text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]"
        )}
      />
      {showLabel && (
        <span className={cn(classes.text, "text-yellow-300 font-medium")}>
          Gold:
        </span>
      )}
      <span
        className={cn(
          classes.text,
          "font-bold text-white",
          "drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
        )}
      >
        {formatGold(goldBalance)}
      </span>
    </div>
  );
}

export default GoldBalanceDisplay;
