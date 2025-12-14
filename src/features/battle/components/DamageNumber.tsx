/**
 * DamageNumber Component - Floating damage number animation
 * Requirements: 3.1, 3.2, 5.1, 5.2, 5.3
 *
 * Uses Framer Motion for smooth animations.
 */

import { motion } from "framer-motion";
import type { CardPosition } from "../types";
import type { DamageResult } from "../engine/calculations/DamageCalculator";
import {
  getDamageTypeStyle,
  type DamageType,
} from "../engine/core/combatVisualConfig";

export interface DamageNumberProps {
  damageResult: DamageResult;
  position: CardPosition;
  onAnimationEnd?: () => void;
  centered?: boolean;
}

export interface LegacyDamageNumberProps {
  damage: number;
  isCritical: boolean;
  position: CardPosition;
  onAnimationEnd?: () => void;
  centered?: boolean;
}

function getDamageTypeFromResult(damageResult: DamageResult): DamageType {
  return damageResult.isCrit ? "crit" : "normal";
}

export function DamageNumber(
  props: DamageNumberProps | LegacyDamageNumberProps
) {
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
  const damageType = getDamageTypeFromResult(damageResult);
  const style = getDamageTypeStyle(damageType);

  const textStroke =
    "2px #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000";

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      onAnimationComplete={onAnimationEnd}
      style={{ pointerEvents: "none" }}
      data-testid="damage-number"
    >
      <span
        style={{
          color: style.color,
          fontSize: damageResult.isCrit ? "1.75rem" : "1.5rem",
          fontWeight: damageResult.isCrit ? 900 : 800,
          textShadow: textStroke,
          WebkitTextStroke: "1px black",
          display: "block",
        }}
      >
        {style.prefix}
        {damageResult.finalDamage}
      </span>
    </motion.div>
  );
}

export default DamageNumber;
