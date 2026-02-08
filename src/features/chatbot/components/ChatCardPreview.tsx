/**
 * ChatCardPreview Component
 *
 * Wrapper around CardPreview for use in chat messages
 * Reuses the CardPreview component from cards feature for consistency
 */

import { CardPreview } from "@/features/cards/components";
import type { Card } from "@/features/cards/types";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";

interface ChatCardPreviewProps {
  card: Card;
  weapon?: Weapon | null;
  gems?: Gem[];
  compact?: boolean;
}

/**
 * ChatCardPreview - Displays a card preview in chat using the shared CardPreview component
 */
export function ChatCardPreview({
  card,
  weapon,
  gems = [],
  compact = true,
}: ChatCardPreviewProps) {
  return (
    <CardPreview
      card={card}
      weapon={weapon}
      gems={gems}
      compact={compact}
      showActions={true}
      className="mt-2"
    />
  );
}
