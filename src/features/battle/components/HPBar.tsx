/**
 * HPBar Component - Visual HP bar with animations
 * Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatHpDisplay } from "../utils/formatters";
import {
  calculateHpPercentage,
  getHpBarColor,
} from "../services/battleService";

export interface HPBarProps {
  currentHp: number;
  maxHp: number;
  showFlash?: boolean;
  animationDuration?: number; // default 500ms
}

/**
 * Get Tailwind CSS class for HP bar color
 */
function getColorClass(color: "green" | "yellow" | "red"): string {
  switch (color) {
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    case "red":
      return "bg-red-500";
  }
}

/**
 * HPBar Component
 * Displays current/max HP with animated width transitions and color changes
 * based on HP percentage thresholds.
 */
export function HPBar({
  currentHp,
  maxHp,
  showFlash = false,
  animationDuration = 500,
}: HPBarProps) {
  const [isFlashing, setIsFlashing] = useState(false);

  // Calculate HP percentage and color
  const percentage = calculateHpPercentage(currentHp, maxHp);
  const color = getHpBarColor(percentage);
  const colorClass = getColorClass(color);
  const hpDisplayText = formatHpDisplay(currentHp, maxHp);

  // Handle flash effect when damage is received
  useEffect(() => {
    if (showFlash) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 200); // Flash duration 200ms per design spec
      return () => clearTimeout(timer);
    }
  }, [showFlash, currentHp]);

  return (
    <div className="w-full space-y-1">
      {/* HP Text Display */}
      <div className="flex justify-between text-sm font-medium">
        <span>HP</span>
        <span>{hpDisplayText}</span>
      </div>

      {/* HP Bar Container */}
      <div
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
          isFlashing && "animate-pulse ring-2 ring-white"
        )}
      >
        {/* HP Bar Fill */}
        <div
          className={cn(
            "h-full rounded-full",
            colorClass,
            isFlashing && "brightness-150"
          )}
          style={{
            width: `${percentage}%`,
            transition: `width ${animationDuration}ms ease-out`,
          }}
        />

        {/* Flash overlay effect */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white/50 animate-ping rounded-full" />
        )}
      </div>
    </div>
  );
}

export default HPBar;
