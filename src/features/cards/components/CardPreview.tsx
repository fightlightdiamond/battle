/**
 * CardPreview Component
 *
 * Reusable card preview component for displaying card info
 * Used in CardList and ChatCardPreview
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Eye, Sword } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Card as CardType } from "../types";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";
import { getCompactStats } from "../types/statConfig";
import { StatDisplay } from "./StatDisplay";
import { cn } from "@/lib/utils";

export interface CardPreviewProps {
  card: CardType;
  /** Optional weapon equipped on the card */
  weapon?: Weapon | null;
  /** Optional gems equipped on the card */
  gems?: Gem[];
  /** Compact mode for smaller display (e.g., in chat) */
  compact?: boolean;
  /** Show action buttons (View, Edit, Delete) */
  showActions?: boolean;
  /** Custom action buttons */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * CardPreview - Displays a card with image, stats, and optional equipment
 */
export function CardPreview({
  card,
  weapon,
  gems = [],
  compact = false,
  showActions = true,
  actions,
  className,
}: CardPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const compactStats = getCompactStats();

  // Check if imageUrl is valid (blob URLs from old sessions won't work)
  const hasValidImage = card.imageUrl && !imageError;

  return (
    <Card
      className={cn(
        "overflow-hidden py-0",
        compact && "max-w-[220px]",
        className,
      )}
    >
      {/* Card Image */}
      <div
        className={cn(
          "relative bg-muted",
          compact ? "aspect-4/3" : "aspect-3/4",
        )}
      >
        {hasValidImage ? (
          <img
            src={card.imageUrl!}
            alt={card.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff
              className={cn(
                "text-muted-foreground",
                compact ? "h-8 w-8" : "h-12 w-12",
              )}
            />
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

      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Card Name */}
        <h3
          className={cn(
            "font-semibold truncate mb-2",
            compact && "text-sm mb-1",
          )}
          title={card.name}
        >
          {card.name}
        </h3>

        {/* Stats Grid */}
        <div
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground",
            showActions && "mb-3",
            compact && "mb-2",
          )}
        >
          {compactStats.map((stat) => (
            <StatDisplay
              key={stat.key}
              stat={stat}
              value={card[stat.key as keyof CardType] as number}
            />
          ))}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            {actions || (
              <Button
                variant="outline"
                size="sm"
                className={cn("flex-1", compact && "h-7 text-xs")}
                asChild
              >
                <Link to={`/cards/${card.id}`}>
                  <Eye
                    className={cn("mr-1", compact ? "h-3 w-3" : "h-4 w-4")}
                  />
                  {compact ? "Chi tiết" : "View"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
