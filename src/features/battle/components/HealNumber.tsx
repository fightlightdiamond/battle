/**
 * HealNumber Component - Floating heal number animation for lifesteal display
 * Requirements: 3.3
 *
 * Uses Framer Motion for smooth animations.
 */

import { motion } from "framer-motion";
import type { CardPosition } from "../types";
import { getDamageTypeStyle } from "../engine/core/combatVisualConfig";

export interface HealNumberProps {
  healAmount: number;
  position: CardPosition;
  onAnimationEnd?: () => void;
  centered?: boolean;
}

export function HealNumber({ healAmount, onAnimationEnd }: HealNumberProps) {
  const style = getDamageTypeStyle("heal");

  const textStroke =
    "2px #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000";

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -50, scale: 1.2 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      onAnimationComplete={onAnimationEnd}
      style={{ pointerEvents: "none" }}
      data-testid="heal-number"
    >
      <span
        style={{
          color: style.color,
          fontSize: "1.25rem",
          fontWeight: 800,
          textShadow: textStroke,
          WebkitTextStroke: "1px black",
          display: "block",
        }}
      >
        {style.prefix}
        {healAmount}
      </span>
    </motion.div>
  );
}

export default HealNumber;
