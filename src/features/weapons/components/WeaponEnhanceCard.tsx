/**
 * WeaponEnhanceCard Component
 *
 * Displays weapon with enhancement level and stats
 * Simple glow wrapper approach - one outer div with border/background
 */

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Weapon } from "../types/weapon";
import {
  getEnhanceLevelDisplay,
  getEnhanceLevelColor,
} from "../config/enhanceConfig";
import {
  calculateEnhancedStats,
  type EnhanceableWeapon,
} from "../services/enhancementService";

interface WeaponEnhanceCardProps {
  weapon: Weapon | EnhanceableWeapon;
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

// Get glow wrapper styles based on enhance level
function getGlowStyles(level: number): React.CSSProperties {
  if (level <= 0) return {};

  if (level <= 5) {
    // Tier 1: Green glow
    return {
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 197, 94, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse 50% 80% at 0% 50%, rgba(74, 222, 128, 0.2) 0%, transparent 50%),
        radial-gradient(ellipse 50% 80% at 100% 50%, rgba(74, 222, 128, 0.2) 0%, transparent 50%)
      `,
      boxShadow: `
        0 0 20px rgba(34, 197, 94, 0.5),
        0 0 40px rgba(34, 197, 94, 0.3),
        inset 0 0 30px rgba(34, 197, 94, 0.1)
      `,
      border: "2px solid rgba(34, 197, 94, 0.6)",
    };
  }

  if (level <= 10) {
    // Tier 2: Blue/Cyan glow
    return {
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 255, 0.5) 0%, transparent 50%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse 50% 80% at 0% 50%, rgba(0, 212, 255, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse 50% 80% at 100% 50%, rgba(0, 212, 255, 0.3) 0%, transparent 50%)
      `,
      boxShadow: `
        0 0 25px rgba(0, 255, 255, 0.6),
        0 0 50px rgba(59, 130, 246, 0.4),
        0 0 80px rgba(0, 255, 255, 0.2),
        inset 0 0 40px rgba(0, 255, 255, 0.1)
      `,
      border: "3px solid rgba(0, 255, 255, 0.7)",
    };
  }

  // Tier 3: Purple/Gold legendary glow
  return {
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168, 85, 247, 0.6) 0%, transparent 50%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(251, 191, 36, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 0% 50%, rgba(255, 0, 255, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 100% 50%, rgba(255, 107, 0, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse 60% 60% at 50% 50%, rgba(192, 192, 192, 0.2) 0%, transparent 70%)
    `,
    boxShadow: `
      0 0 30px rgba(168, 85, 247, 0.7),
      0 0 60px rgba(255, 0, 255, 0.5),
      0 0 100px rgba(251, 191, 36, 0.4),
      0 0 140px rgba(168, 85, 247, 0.2),
      inset 0 0 50px rgba(192, 192, 192, 0.15)
    `,
    border: "4px solid rgba(168, 85, 247, 0.8)",
  };
}

export function WeaponEnhanceCard({
  weapon,
  selected = false,
  onClick,
  showStats = false,
}: WeaponEnhanceCardProps) {
  // Ensure enhanceLevel has a default value
  const enhanceLevel = weapon.enhanceLevel ?? 0;
  const levelDisplay = getEnhanceLevelDisplay(enhanceLevel);
  const levelColor = getEnhanceLevelColor(enhanceLevel);
  const stats = calculateEnhancedStats(weapon);
  const glowStyles = getGlowStyles(enhanceLevel);
  const hasEnhancement = enhanceLevel > 0;

  return (
    // Outer glow wrapper - THIS is the key: one div that wraps everything
    // with background and border for the glow effect
    <div
      className={cn(
        "rounded-2xl p-1 transition-all",
        hasEnhancement && "animate-pulse",
      )}
      style={glowStyles}
    >
      {/* Card - Main content inside the glow wrapper */}
      <Card
        className={cn(
          "cursor-pointer transition-all hover:scale-[1.02] bg-card",
          selected && "ring-2 ring-primary ring-offset-2",
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Weapon Image */}
          <div className="relative aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
            {weapon.imageUrl ? (
              <img
                src={weapon.imageUrl}
                alt={weapon.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                ⚔️
              </div>
            )}

            {/* Enhancement Level Badge */}
            {enhanceLevel > 0 && (
              <Badge
                className={cn(
                  "absolute top-2 right-2 font-bold text-white shadow-lg",
                  enhanceLevel <= 5 && "bg-green-500",
                  enhanceLevel > 5 && enhanceLevel <= 10 && "bg-blue-500",
                  enhanceLevel > 10 &&
                    "bg-gradient-to-r from-purple-500 to-amber-500",
                )}
              >
                {levelDisplay}
              </Badge>
            )}
          </div>

          {/* Weapon Name */}
          <h3 className="font-semibold text-center truncate">
            {weapon.name}
            {levelDisplay && (
              <span className={cn("ml-1 font-bold", levelColor)}>
                {levelDisplay}
              </span>
            )}
          </h3>

          {/* Stats (optional) */}
          {showStats && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>ATK</span>
                <span className="font-mono">
                  {stats.baseAtk}
                  {stats.enhancedAtk > stats.baseAtk && (
                    <span className="text-green-500 ml-1">
                      (+{stats.enhancedAtk - stats.baseAtk})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Crit%</span>
                <span className="font-mono">
                  {stats.baseCritChance}
                  {stats.enhancedCritChance > stats.baseCritChance && (
                    <span className="text-green-500 ml-1">
                      (+{stats.enhancedCritChance - stats.baseCritChance})
                    </span>
                  )}
                </span>
              </div>
              {stats.totalBonusPercent > 0 && (
                <div className="text-center text-green-500 font-medium mt-1">
                  +{stats.totalBonusPercent}% Total Bonus
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
