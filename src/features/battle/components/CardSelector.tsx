/**
 * CardSelector Component - Select cards for battle match setup
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * - Display grid of available cards from existing card store
 * - Highlight selected cards
 * - Prevent selecting same card twice with warning toast
 * - Show selected cards preview with stats
 */

import { useCallback } from "react";
import { Swords, Heart, ImageOff, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Card as CardType } from "../../cards/types";

export interface CardSelectorProps {
  /** Available cards to select from */
  cards: CardType[];
  /** Currently selected card ID for this selector */
  selectedCardId: string | null;
  /** Card ID that is already selected by the other selector (to prevent duplicates) */
  otherSelectedCardId: string | null;
  /** Callback when a card is selected */
  onSelect: (card: CardType) => boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Label for this selector (e.g., "Challenger", "Opponent") */
  label: string;
  /** Position for styling purposes */
  position: "left" | "right";
}

/**
 * CardSelector component for battle match setup
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
  const handleCardClick = useCallback(
    (card: CardType) => {
      // Check if card is already selected by the other selector
      if (card.id === otherSelectedCardId) {
        toast.warning("Card already selected", {
          description: `${card.name} is already selected for the other slot. Please choose a different card.`,
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }

      // Try to select the card
      const success = onSelect(card);
      if (!success) {
        toast.warning("Cannot select card", {
          description: "This card cannot be selected at this time.",
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
    [otherSelectedCardId, onSelect]
  );

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with label */}
      <div
        className={cn(
          "flex items-center gap-2 text-lg font-semibold",
          position === "left" ? "justify-start" : "justify-end"
        )}
      >
        <span>{label}</span>
      </div>

      {/* Selected card preview */}
      <SelectedCardPreview card={selectedCard} position={position} />

      {/* Card grid */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Select a card
        </h4>
        {isLoading ? (
          <CardGridSkeleton />
        ) : cards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
            {cards.map((card) => (
              <SelectableCard
                key={card.id}
                card={card}
                isSelected={card.id === selectedCardId}
                isDisabled={card.id === otherSelectedCardId}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Props for SelectedCardPreview component
 */
interface SelectedCardPreviewProps {
  card: CardType | undefined;
  position: "left" | "right";
}

/**
 * Preview of the selected card with stats
 */
function SelectedCardPreview({ card, position }: SelectedCardPreviewProps) {
  if (!card) {
    return (
      <Card
        className={cn(
          "overflow-hidden border-2 border-dashed border-muted-foreground/30",
          "min-h-[200px] flex items-center justify-center"
        )}
      >
        <div className="text-center text-muted-foreground">
          <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No card selected</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-primary py-0",
        "ring-2 ring-primary/20 shadow-lg"
      )}
    >
      <div className="aspect-[3/4] relative bg-muted max-h-[200px]">
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
        {/* Selected badge */}
        <div
          className={cn(
            "absolute top-2 bg-primary text-primary-foreground",
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            position === "left" ? "left-2" : "right-2"
          )}
        >
          <Check className="h-3 w-3" />
          Selected
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold truncate text-sm" title={card.name}>
          {card.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Swords className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{card.atk}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-medium">{card.hp}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Props for SelectableCard component
 */
interface SelectableCardProps {
  card: CardType;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

/**
 * Individual selectable card in the grid
 */
function SelectableCard({
  card,
  isSelected,
  isDisabled,
  onClick,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:scale-105 hover:shadow-md",
        isSelected && "border-primary ring-2 ring-primary/20",
        isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
        !isSelected &&
          !isDisabled &&
          "border-transparent hover:border-primary/50"
      )}
    >
      {/* Card image */}
      <div className="aspect-[3/4] bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Card info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">{card.name}</p>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span className="flex items-center gap-0.5">
            <Swords className="h-3 w-3" />
            {card.atk}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className="h-3 w-3" />
            {card.hp}
          </span>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Disabled overlay */}
      {isDisabled && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
            Already selected
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * Loading skeleton for card grid
 */
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Empty state when no cards available
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <ImageOff className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No cards available</p>
      <p className="text-xs text-muted-foreground">
        Create some cards first to start a battle
      </p>
    </div>
  );
}
