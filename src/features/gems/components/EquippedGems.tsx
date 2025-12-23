import { Gem as GemIcon, X, Zap, Swords, Timer, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Gem, SkillType } from "../types/gem";
import { MAX_GEM_SLOTS } from "../types/equipment";

/**
 * Skill type display configuration
 */
const SKILL_TYPE_CONFIG: Record<
  SkillType,
  { label: string; color: string; bgColor: string }
> = {
  knockback: {
    label: "Knockback",
    color: "text-orange-500",
    bgColor: "bg-orange-500",
  },
  retreat: {
    label: "Retreat",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  double_move: {
    label: "Double Move",
    color: "text-green-500",
    bgColor: "bg-green-500",
  },
  double_attack: {
    label: "Double Attack",
    color: "text-red-500",
    bgColor: "bg-red-500",
  },
  execute: {
    label: "Execute",
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  leap_strike: {
    label: "Leap Strike",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
  },
};

interface EquippedGemsProps {
  gems: Gem[];
  onUnequip?: (gemId: string) => void;
  isUnequipping?: boolean;
  disabled?: boolean;
  showEmptySlots?: boolean;
}

/**
 * EquippedGems component
 * Displays equipped gems on a card with unequip option
 * Shows 3 gem slots (filled or empty)
 * Requirements: 2.3, 2.4
 */
export function EquippedGems({
  gems,
  onUnequip,
  isUnequipping,
  disabled,
  showEmptySlots = true,
}: EquippedGemsProps) {
  const emptySlots = showEmptySlots
    ? Math.max(0, MAX_GEM_SLOTS - gems.length)
    : 0;

  if (gems.length === 0 && !showEmptySlots) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <GemIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No gems equipped</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {gems.map((gem) => (
          <EquippedGemItem
            key={gem.id}
            gem={gem}
            onUnequip={onUnequip ? () => onUnequip(gem.id) : undefined}
            isUnequipping={isUnequipping}
            disabled={disabled}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <EmptyGemSlot
            key={`empty-${index}`}
            slotNumber={gems.length + index + 1}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

interface EquippedGemItemProps {
  gem: Gem;
  onUnequip?: () => void;
  isUnequipping?: boolean;
  disabled?: boolean;
}

/**
 * EquippedGemItem component
 * Displays a single equipped gem with details and unequip button
 */
function EquippedGemItem({
  gem,
  onUnequip,
  isUnequipping,
  disabled,
}: EquippedGemItemProps) {
  const skillConfig = SKILL_TYPE_CONFIG[gem.skillType];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
      {/* Gem Icon/Image */}
      {gem.imageUrl ? (
        <img
          src={gem.imageUrl}
          alt={gem.name}
          className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div
          className={`p-2 rounded-lg ${skillConfig.bgColor} text-white flex-shrink-0`}
        >
          <GemIcon className="h-4 w-4" />
        </div>
      )}

      {/* Gem Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate" title={gem.name}>
            {gem.name}
          </span>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {skillConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {gem.trigger === "combat" ? (
              <Swords className="h-3 w-3" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            {gem.trigger === "combat" ? "Combat" : "Movement"}
          </span>
          <span className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            {gem.activationChance}%
          </span>
          {gem.cooldown > 0 && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {gem.cooldown} turn CD
            </span>
          )}
        </div>
      </div>

      {/* Unequip Button */}
      {onUnequip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onUnequip}
              disabled={isUnequipping || disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unequip gem</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

interface EmptyGemSlotProps {
  slotNumber: number;
}

/**
 * EmptyGemSlot component
 * Displays an empty gem slot placeholder
 */
function EmptyGemSlot({ slotNumber }: EmptyGemSlotProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30">
      <div className="p-2 rounded-lg bg-muted flex-shrink-0">
        <GemIcon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">
          Empty Slot {slotNumber}
        </span>
      </div>
    </div>
  );
}

/**
 * EquippedGemsCompact component
 * Compact display of equipped gems (icons only)
 * Useful for card list views
 */
interface EquippedGemsCompactProps {
  gems: Gem[];
}

export function EquippedGemsCompact({ gems }: EquippedGemsCompactProps) {
  if (gems.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {gems.map((gem) => {
          const skillConfig = SKILL_TYPE_CONFIG[gem.skillType];
          return (
            <Tooltip key={gem.id}>
              <TooltipTrigger asChild>
                {gem.imageUrl ? (
                  <img
                    src={gem.imageUrl}
                    alt={gem.name}
                    className="w-6 h-6 object-cover rounded cursor-help"
                  />
                ) : (
                  <div
                    className={`p-1 rounded ${skillConfig.bgColor} text-white cursor-help`}
                  >
                    <GemIcon className="h-3 w-3" />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{gem.name}</p>
                <p className="text-xs text-muted-foreground">
                  {skillConfig.label} • {gem.activationChance}% chance
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {/* Show empty slot indicators */}
        {Array.from({ length: MAX_GEM_SLOTS - gems.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="p-1 rounded border border-dashed border-muted-foreground/30"
          >
            <GemIcon className="h-3 w-3 text-muted-foreground/30" />
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
