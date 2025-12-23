/**
 * SkillActivationIndicator Component - Visual indicator for skill activation in battle
 * Requirements: 11.2 - Display visual indicator on card when skill activates
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SkillType } from "../../gems/types/gem";

export interface SkillActivationIndicatorProps {
  /** Skill type that was activated */
  skillType: SkillType;
  /** Name of the gem that activated */
  gemName: string;
  /** Callback when animation ends */
  onAnimationEnd?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get skill icon based on skill type
 */
function getSkillIcon(skillType: SkillType): string {
  switch (skillType) {
    case "knockback":
      return "💨";
    case "retreat":
      return "🔙";
    case "double_move":
      return "⚡";
    case "double_attack":
      return "⚔️⚔️";
    case "execute":
      return "💀";
    case "leap_strike":
      return "🦘";
    default:
      return "✨";
  }
}

/**
 * Get skill display name based on skill type
 */
function getSkillDisplayName(skillType: SkillType): string {
  switch (skillType) {
    case "knockback":
      return "Knockback";
    case "retreat":
      return "Retreat";
    case "double_move":
      return "Double Move";
    case "double_attack":
      return "Double Attack";
    case "execute":
      return "Execute";
    case "leap_strike":
      return "Leap Strike";
    default:
      return skillType;
  }
}

/**
 * Get skill color based on skill type
 */
function getSkillColor(skillType: SkillType): string {
  switch (skillType) {
    case "knockback":
      return "from-blue-500 to-cyan-500";
    case "retreat":
      return "from-purple-500 to-indigo-500";
    case "double_move":
      return "from-yellow-500 to-orange-500";
    case "double_attack":
      return "from-red-500 to-pink-500";
    case "execute":
      return "from-gray-700 to-red-900";
    case "leap_strike":
      return "from-green-500 to-emerald-500";
    default:
      return "from-slate-500 to-slate-600";
  }
}

/**
 * SkillActivationIndicator Component
 * Displays a brief visual indicator when a skill activates during battle.
 * Shows skill icon, name, and gem name with a fade-in/out animation.
 */
export function SkillActivationIndicator({
  skillType,
  gemName,
  onAnimationEnd,
  className,
}: SkillActivationIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after animation duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationEnd?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  if (!isVisible) return null;

  const icon = getSkillIcon(skillType);
  const displayName = getSkillDisplayName(skillType);
  const colorGradient = getSkillColor(skillType);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none z-40",
        "animate-skill-activation",
        className,
      )}
      data-testid="skill-activation-indicator"
    >
      <div
        className={cn(
          "px-4 py-2 rounded-lg shadow-lg",
          "bg-gradient-to-r",
          colorGradient,
          "text-white font-bold text-center",
          "transform scale-100",
        )}
      >
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-sm font-semibold">{displayName}</div>
        <div className="text-xs opacity-80">{gemName}</div>
      </div>
    </div>
  );
}

export default SkillActivationIndicator;
