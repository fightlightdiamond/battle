/**
 * ChatCardPreview Component
 *
 * Displays a card preview in chat messages
 * Reuses styling from the cards feature for consistency
 */

import { Link } from "react-router-dom";
import { ImageOff, Eye, Sword, Shield, Zap, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Card as CardType } from "@/features/cards/types";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";
import { cn } from "@/lib/utils";

interface ChatCardPreviewProps {
  card: CardType;
  weapon?: Weapon | null;
  gems?: Gem[];
  compact?: boolean;
}

/**
 * ChatCardPreview - Displays a card with optional equipment in chat
 */
export function ChatCardPreview({
  card,
  weapon,
  gems = [],
  compact = false,
}: ChatCardPreviewProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden mt-2",
        compact ? "max-w-[200px]" : "max-w-[280px]",
      )}
    >
      {/* Card Image */}
      <div
        className={cn(
          "relative bg-muted",
          compact ? "aspect-4/3" : "aspect-3/4",
        )}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Equipment badges overlay */}
        {(weapon || gems.length > 0) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {weapon && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Sword className="h-3 w-3" />
                {weapon.name}
              </Badge>
            )}
            {gems.slice(0, 2).map((gem) => (
              <Badge
                key={gem.id}
                variant="outline"
                className="text-[10px] gap-1 bg-background/80"
              >
                💎 {gem.name}
              </Badge>
            ))}
            {gems.length > 2 && (
              <Badge variant="outline" className="text-[10px] bg-background/80">
                +{gems.length - 2} more
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {/* Card Name */}
        <h3 className="font-semibold text-sm truncate mb-2" title={card.name}>
          {card.name}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <StatItem
            icon={Heart}
            label="HP"
            value={card.hp}
            color="text-red-500"
          />
          <StatItem
            icon={Sword}
            label="ATK"
            value={card.atk}
            color="text-orange-500"
          />
          <StatItem
            icon={Shield}
            label="DEF"
            value={card.def}
            color="text-blue-500"
          />
          <StatItem
            icon={Zap}
            label="SPD"
            value={card.spd}
            color="text-yellow-500"
          />
        </div>

        {/* Combat Stats (if not compact) */}
        {!compact &&
          (card.critChance ||
            card.critDamage ||
            card.armorPen ||
            card.lifesteal) && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3 pt-2 border-t">
              {card.critChance !== undefined && card.critChance > 0 && (
                <span>⚡ Crit: {card.critChance}%</span>
              )}
              {card.critDamage !== undefined && card.critDamage > 0 && (
                <span>💥 CritDMG: {card.critDamage}%</span>
              )}
              {card.armorPen !== undefined && card.armorPen > 0 && (
                <span>🗡️ ArmorPen: {card.armorPen}</span>
              )}
              {card.lifesteal !== undefined && card.lifesteal > 0 && (
                <span>❤️ Lifesteal: {card.lifesteal}%</span>
              )}
            </div>
          )}

        {/* Action Button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/cards/${card.id}`}>
            <Eye className="h-3 w-3 mr-1" />
            Xem chi tiết
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * StatItem - Individual stat display
 */
function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  color?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <Icon className={cn("h-3 w-3", color)} />
      <span className="font-medium">{label}:</span>
      <span>{value ?? 0}</span>
    </span>
  );
}
