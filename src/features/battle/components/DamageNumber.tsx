/**
 * DamageNumber Component - Floating damage number animation
 * Requirements: 3.4, 8.2
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CardPosition } from "../types";

export interface DamageNumberProps {
  damage: number;
  isCritical: boolean;
  position: CardPosition;
  onAnimationEnd: () => void;
}

/**
 * DamageNumber Component
 * Displays damage value with fly-up animation (800ms).
 * Enhanced style for critical damage (larger, different color).
 * Position based on defender location.
 */
export function DamageNumber({
  damage,
  isCritical,
  onAnimationEnd,
}: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationEnd();
    }, 800);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="damage-number animate-damage-fly-up"
      data-testid="damage-number"
    >
      <span
        className={cn(
          "damage-text",
          isCritical
            ? "damage-text-critical animate-critical-pulse"
            : "damage-text-normal"
        )}
      >
        -{damage}
        {isCritical && <span className="damage-crit-label">CRIT!</span>}
      </span>
    </div>
  );
}

export default DamageNumber;
