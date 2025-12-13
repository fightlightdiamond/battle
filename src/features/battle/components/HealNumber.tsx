/**
 * HealNumber Component - Floating heal number animation for lifesteal display
 * Requirements: 3.3
 *
 * Config-driven styling using Combat Visual Config.
 * Displays heal amount with "+" prefix and green color from config.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CardPosition } from "../types";
import {
  getDamageTypeStyle,
  getAnimationConfig,
} from "../engine/core/combatVisualConfig";

/**
 * Props for HealNumber component
 */
export interface HealNumberProps {
  healAmount: number;
  position: CardPosition;
  onAnimationEnd: () => void;
}

/**
 * HealNumber Component
 *
 * Displays heal value with config-driven styling and animation.
 * - Uses getDamageTypeStyle("heal") for colors, fonts, and prefix
 * - Uses getAnimationConfig() for animation duration and easing
 * - Same animation behavior as DamageNumber
 *
 * Requirements: 3.3
 */
export function HealNumber({
  healAmount,
  position,
  onAnimationEnd,
}: HealNumberProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Get animation config from central config
  const animationConfig = getAnimationConfig();

  // Get heal style from config
  const style = getDamageTypeStyle("heal");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationEnd();
    }, animationConfig.duration);

    return () => clearTimeout(timer);
  }, [onAnimationEnd, animationConfig.duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "heal-number",
        `animate-damage-fly-${animationConfig.direction}`
      )}
      data-testid="heal-number"
      style={{
        animationDuration: `${animationConfig.duration}ms`,
        animationTimingFunction: animationConfig.easing,
      }}
    >
      <span
        className="heal-text"
        style={{
          color: style.color,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
        }}
      >
        {style.prefix}
        {healAmount}
      </span>
    </div>
  );
}

export default HealNumber;
