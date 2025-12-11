import { Link } from "react-router-dom";
import { Pencil, Trash2, Swords, Heart, ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Card as CardType } from "../types";
import { useDeleteDialog } from "../store";

interface CardListProps {
  cards: CardType[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

/**
 * CardList component
 * Display cards in a grid with image, name, ATK, HP
 * Show placeholder image for cards without image
 * Implement empty state and loading state
 * Edit button links to `/cards/:id/edit`
 * Delete button opens confirmation dialog
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function CardList({ cards, isLoading, isEmpty }: CardListProps) {
  const { open: openDeleteDialog } = useDeleteDialog();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No cards found</h3>
        <p className="text-muted-foreground">
          Get started by adding your first card.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onDelete={() => openDeleteDialog(card)}
        />
      ))}
    </div>
  );
}

interface CardItemProps {
  card: CardType;
  onDelete: () => void;
}

function CardItem({ card, onDelete }: CardItemProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-[3/4] relative bg-muted">
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
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-2" title={card.name}>
          {card.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Swords className="h-4 w-4" />
            {card.atk}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {card.hp}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/cards/${card.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <Skeleton className="aspect-[3/4] rounded-none" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex gap-4 mb-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
