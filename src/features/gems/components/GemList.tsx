import { Gem as GemIcon } from "lucide-react";
import type { Gem } from "../types/gem";
import { GemCard, GemCardSkeleton } from "./GemCard";

interface GemListProps {
  gems: Gem[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onDelete?: (gem: Gem) => void;
}

/**
 * GemList component
 * Displays gems in a responsive grid layout
 * Requirements: 1.2
 */
export function GemList({ gems, isLoading, isEmpty, onDelete }: GemListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GemCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty || gems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GemIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No gems found</h3>
        <p className="text-muted-foreground">
          Get started by creating your first gem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {gems.map((gem) => (
        <GemCard
          key={gem.id}
          gem={gem}
          onDelete={onDelete ? () => onDelete(gem) : undefined}
        />
      ))}
    </div>
  );
}
