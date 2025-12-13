/**
 * DamageNumber Component - Floating damage number animation
 * Requirements: 3.1, 3.2, 5.1, 5.2, 5.3
 *
 * Config-driven styling using Combat Visual Config.
 * Accepts DamageResult for detailed damage information.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CardPosition } from "../types";
import type { DamageResult } from "../engine/calculations/DamageCalculator";
import {
  getDamageTypeStyle,
  getAnimationConfig,
  type DamageType,
} from "../engine/core/combatVisualConfig";

/**
 * Props for DamageNumber component
 * Uses DamageResult for config-driven styling
 */
export interface DamageNumberProps {
  damageResult: DamageResult;
  position: CardPosition;
  onAnimationEnd: () => void;
}

/**
 * Legacy props for backward compatibility
 * @deprecated Use DamageNumberProps with damageResult instead
 */
export interface LegacyDamageNumberProps {
  damage: number;
  isCritical: boolean;
  position: CardPosition;
  onAnimationEnd: () => void;
}

/**
 * Get damage type from DamageResult for styling lookup
 */
function getDamageTypeFromResult(damageResult: DamageResult): DamageType {
  return damageResult.isCrit ? "crit" : "normal";
}

/**
 * DamageNumber Component
 *
 * Displays damage value with config-driven styling and animation.
 * - Uses getDamageTypeStyle() for colors, fonts, and labels
 * - Uses getAnimationConfig() for animation duration and easing
 * - Supports both new DamageResult props and legacy props for backward compatibility
 *
 * Requirements: 3.1, 3.2, 5.1, 5.2, 5.3
 */
export function DamageNumber(
  props: DamageNumberProps | LegacyDamageNumberProps
) {
  const [isVisible, setIsVisible] = useState(true);

  // Get animation config from central config
  const animationConfig = getAnimationConfig();

  // Normalize props - support both new and legacy format
  const damageResult: DamageResult =
    "damageResult" in props
      ? props.damageResult
      : {
          finalDamage: props.damage,
          baseDamage: props.damage,
          isCrit: props.isCritical,
          critBonus: 0,
          lifestealAmount: 0,
        };

  const { onAnimationEnd } = props;

  // Get style from config based on damage type
  const damageType = getDamageTypeFromResult(damageResult);
  const style = getDamageTypeStyle(damageType);

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
        "damage-number",
        `animate-damage-fly-${animationConfig.direction}`
      )}
      data-testid="damage-number"
      style={{
        animationDuration: `${animationConfig.duration}ms`,
        animationTimingFunction: animationConfig.easing,
      }}
    >
      <span
        className={cn(
          "damage-text",
          damageResult.isCrit && "animate-critical-pulse"
        )}
        style={{
          color: style.color,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
        }}
      >
        {style.prefix}
        {damageResult.finalDamage}
        {style.label && (
          <span className="damage-crit-label">{style.label}</span>
        )}
      </span>
    </div>
  );
}

export default DamageNumber;
