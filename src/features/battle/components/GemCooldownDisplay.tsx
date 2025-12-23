/**
 * GemCooldownDisplay Component - Shows remaining cooldown on equipped gems during battle
 * Requirements: 9.4 - Display remaining cooldown for each equipped gem
 */

import { cn } from "@/lib/utils";
import type { EquippedGemState } from "../../gems/types/equipment";
import type { SkillType } from "../../gems/types/gem";

export interface GemCooldownDisplayProps {
  /** Equipped gems with their current cooldown states */
  equippedGems: EquippedGemState[];
  /** Position of the card (affects layout) */
  position?: "left" | "right";
  /** Compact mode for smaller display */
  compact?: boolean;
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
      return "⚔️";
    case "execute":
      return "💀";
    case "leap_strike":
      return "🦘";
    default:
      return "💎";
  }
}

/**
 * Single gem cooldown badge
 */
interface GemCooldownBadgeProps {
  gemState: EquippedGemState;
  compact?: boolean;
}

function GemCooldownBadge({
  gemState,
  compact = false,
}: GemCooldownBadgeProps) {
  const { gem, currentCooldown } = gemState;
  const isReady = currentCooldown === 0;
  const icon = getSkillIcon(gem.skillType);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5",
        "transition-all duration-300",
        isReady
          ? "bg-green-500/20 border border-green-500/50 text-green-400"
          : "bg-slate-700/80 border border-slate-600 text-slate-300 animate-cooldown-pulse",
        compact ? "text-xs" : "text-sm",
      )}
      title={`${gem.name}: ${isReady ? "Ready" : `${currentCooldown} turns`}`}
    >
      <span className={compact ? "text-sm" : "text-base"}>{icon}</span>
      {!compact && (
        <span className="font-medium truncate max-w-[60px]">{gem.name}</span>
      )}
      {!isReady && (
        <span
          className={cn(
            "font-bold rounded-full bg-slate-600 text-white",
            compact ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs",
            "flex items-center justify-center",
          )}
        >
          {currentCooldown}
        </span>
      )}
      {isReady && (
        <span className={cn("text-green-400", compact ? "text-xs" : "text-sm")}>
          ✓
        </span>
      )}
    </div>
  );
}

/**
 * GemCooldownDisplay Component
 * Displays the cooldown status of all equipped gems for a card during battle.
 * Shows gem icon, name, and remaining cooldown turns.
 */
export function GemCooldownDisplay({
  equippedGems,
  position = "left",
  compact = false,
  className,
}: GemCooldownDisplayProps) {
  if (equippedGems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-1",
        position === "left" ? "flex-row" : "flex-row-reverse",
        compact ? "flex-wrap" : "flex-col",
        className,
      )}
      data-testid="gem-cooldown-display"
    >
      {equippedGems.map((gemState) => (
        <GemCooldownBadge
          key={gemState.gem.id}
          gemState={gemState}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Compact inline version for use in battle cards
 */
export function GemCooldownInline({
  equippedGems,
  className,
}: {
  equippedGems: EquippedGemState[];
  className?: string;
}) {
  if (equippedGems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 flex-wrap justify-center",
        className,
      )}
      data-testid="gem-cooldown-inline"
    >
      {equippedGems.map((gemState) => {
        const { gem, currentCooldown } = gemState;
        const isReady = currentCooldown === 0;
        const icon = getSkillIcon(gem.skillType);

        return (
          <div
            key={gem.id}
            className={cn(
              "relative inline-flex items-center justify-center",
              "w-6 h-6 rounded-full text-sm",
              isReady
                ? "bg-green-500/30 border border-green-500/50"
                : "bg-slate-700/80 border border-slate-600",
            )}
            title={`${gem.name}: ${isReady ? "Ready" : `${currentCooldown} turns`}`}
          >
            <span>{icon}</span>
            {!isReady && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full 
                           bg-red-500 text-white text-[10px] font-bold
                           flex items-center justify-center"
              >
                {currentCooldown}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default GemCooldownDisplay;
