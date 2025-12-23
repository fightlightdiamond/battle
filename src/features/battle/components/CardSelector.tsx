/**
 * CardSelector Component - Select cards for battle match setup
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * - Display list of available cards on the left
 * - Show detailed card preview on the right when hover/select
 * - Highlight selected cards
 * - Prevent selecting same card twice with warning toast
 */

import { useCallback, useState } from "react";
import {
  Swords,
  Heart,
  ImageOff,
  Check,
  AlertCircle,
  Shield,
  Zap,
  Target,
  Flame,
  Crosshair,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Card as CardType } from "../../cards/types";

export interface CardSelectorProps {
  /** Available cards to select from */
  cards: CardType[];
  /** Currently selected card ID for this selector */
  selectedCardId: string | null;
  /** Card ID that is already selected by the other selector (to prevent duplicates) */
  otherSelectedCardId: string | null;
  /** Callback when a card is selected - can be sync or async */
  onSelect: (card: CardType) => boolean | Promise<boolean>;
  /** Loading state */
  isLoading?: boolean;
  /** Label for this selector (e.g., "Challenger", "Opponent") */
  label: string;
  /** Position for styling purposes */
  position: "left" | "right";
}

/**
 * CardSelector component for battle match setup
 * Layout: Left side = card list, Right side = card detail preview
 */
export function CardSelector({
  cards,
  selectedCardId,
  otherSelectedCardId,
  onSelect,
  isLoading,
  label,
  position,
}: CardSelectorProps) {
  // Track hovered card for preview
  const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);

  const handleCardClick = useCallback(
    async (card: CardType) => {
      // Check if card is already selected by the other selector
      if (card.id === otherSelectedCardId) {
        toast.warning("Card already selected", {
          description: `${card.name} is already selected for the other slot. Please choose a different card.`,
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }

      // Try to select the card (handle both sync and async callbacks)
      const success = await Promise.resolve(onSelect(card));
      if (!success) {
        toast.warning("Cannot select card", {
          description: "This card cannot be selected at this time.",
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
    [otherSelectedCardId, onSelect],
  );

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  // Show hovered card in preview, fallback to selected card
  const previewCard = hoveredCard || selectedCard;

  return (
    <div className="flex flex-col gap-2">
      {/* Header with label */}
      <div
        className={cn(
          "flex items-center gap-2 text-lg font-semibold",
          position === "left" ? "justify-start" : "justify-end",
        )}
      >
        <span>{label}</span>
        {selectedCard && (
          <span className="text-sm font-normal text-muted-foreground">
            — {selectedCard.name}
          </span>
        )}
      </div>

      {/* Main content: Left-Right layout */}
      <div className="flex gap-4 h-[420px]">
        {/* Left: Card list */}
        <div className="flex-1 border rounded-lg bg-muted/30 overflow-hidden">
          {isLoading ? (
            <CardListSkeleton />
          ) : cards.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {cards.map((card) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    isSelected={card.id === selectedCardId}
                    isDisabled={card.id === otherSelectedCardId}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right: Card detail preview */}
        <div className="w-[280px] shrink-0">
          <CardDetailPreview
            card={previewCard}
            isSelected={previewCard?.id === selectedCardId}
            isHovered={
              hoveredCard !== null && hoveredCard.id !== selectedCardId
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Props for CardListItem component
 */
interface CardListItemProps {
  card: CardType;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Individual card item in the list
 */
function CardListItem({
  card,
  isSelected,
  isDisabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CardListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        "hover:bg-accent",
        isSelected && "bg-primary/10 border border-primary",
        isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
        !isSelected && !isDisabled && "hover:bg-accent",
      )}
    >
      {/* Card thumbnail */}
      <div className="w-10 h-14 rounded overflow-hidden bg-muted shrink-0">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex-1 text-left min-w-0">
        <p className="font-medium text-sm truncate">{card.name}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-500" />
            {card.hp}
          </span>
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3 text-orange-500" />
            {card.atk}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            {card.def}
          </span>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="bg-primary text-primary-foreground rounded-full p-1 shrink-0">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Disabled indicator */}
      {isDisabled && (
        <span className="text-xs text-muted-foreground shrink-0">In use</span>
      )}
    </button>
  );
}

/**
 * Props for CardDetailPreview component
 */
interface CardDetailPreviewProps {
  card: CardType | undefined;
  isSelected: boolean;
  isHovered: boolean;
}

/**
 * Detailed preview of the card with all stats
 */
function CardDetailPreview({
  card,
  isSelected,
  isHovered,
}: CardDetailPreviewProps) {
  if (!card) {
    return (
      <Card className="h-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground p-4">
          <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Hover over a card to preview</p>
          <p className="text-xs mt-1">or select one to continue</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "h-full overflow-hidden border-2 py-0 flex flex-col",
        isSelected && "border-primary ring-2 ring-primary/20",
        isHovered && !isSelected && "border-accent-foreground/30",
      )}
    >
      {/* Card image */}
      <div className="aspect-[4/3] relative bg-muted shrink-0">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {/* Status badge */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Check className="h-3 w-3" />
            Selected
          </div>
        )}
        {isHovered && !isSelected && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
            Preview
          </div>
        )}
      </div>

      {/* Card details */}
      <CardContent className="p-3 flex-1 overflow-y-auto">
        <h3 className="font-semibold text-base mb-3" title={card.name}>
          {card.name}
        </h3>

        {/* Core Stats */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Core Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={Heart}
              label="HP"
              value={card.hp}
              color="text-red-500"
            />
            <StatItem
              icon={Swords}
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
        </div>

        {/* Combat Stats */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Combat Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={Target}
              label="Crit%"
              value={`${card.critChance}%`}
              color="text-purple-500"
            />
            <StatItem
              icon={Flame}
              label="CritDmg"
              value={`${card.critDamage}%`}
              color="text-orange-600"
            />
            <StatItem
              icon={Crosshair}
              label="ArPen"
              value={`${card.armorPen}%`}
              color="text-gray-500"
            />
            <StatItem
              icon={HeartPulse}
              label="LS"
              value={`${card.lifesteal}%`}
              color="text-pink-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual stat display item
 */
interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium ml-auto">{value}</span>
    </div>
  );
}

/**
 * Loading skeleton for card list
 */
function CardListSkeleton() {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-10 h-14 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no cards available
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <ImageOff className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No cards available</p>
      <p className="text-xs text-muted-foreground">
        Create some cards first to start a battle
      </p>
    </div>
  );
}
