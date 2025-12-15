/**
 * BetBattleSetupPage - Admin page for creating matchups (betting matches)
 * This page is for ADMIN to set up matchups that players can bet on.
 * Players will view and bet on matchups at /matchups page.
 *
 * Flow:
 * 1. Admin creates matchup here (selects 2 cards)
 * 2. Matchup appears in /matchups for players to bet
 * 3. Admin starts the battle from matchup detail page
 * 4. System resolves bets automatically
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Swords,
  Check,
  AlertCircle,
  ImageOff,
  Heart,
  Shield,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { matchupService } from "@/features/matchup/services/matchupService";
import { cardApi } from "@/features/cards/api/cardApi";
import type { ApiCard } from "@/features/cards/api/types";

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Empty state when no cards available
 */
function EmptyCardsState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <ImageOff className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No cards available</p>
      <p className="text-xs text-muted-foreground">
        Create some cards first to create a matchup
      </p>
      <Button asChild className="mt-4">
        <Link to="/cards/new">Create Card</Link>
      </Button>
    </div>
  );
}

/**
 * Selected card preview
 */
interface SelectedCardPreviewProps {
  card: ApiCard | null;
  label: string;
  color: string;
}

function SelectedCardPreview({ card, label, color }: SelectedCardPreviewProps) {
  if (!card) {
    return (
      <Card className="overflow-hidden border-2 border-dashed border-muted-foreground/30 min-h-[280px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">Select {label}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 py-0 shadow-xl",
        color === "blue" && "border-blue-500 ring-2 ring-blue-500/20",
        color === "red" && "border-red-500 ring-2 ring-red-500/20"
      )}
    >
      <div className="aspect-[3/4] relative bg-gradient-to-b from-muted to-muted/50 max-h-[200px]">
        <div className="flex h-full w-full items-center justify-center text-6xl">
          🃏
        </div>
        <div
          className={cn(
            "absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-white",
            color === "blue" && "bg-blue-500",
            color === "red" && "bg-red-500"
          )}
        >
          <Check className="h-3 w-3" />
          {label}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg truncate" title={card.name}>
          {card.name}
        </h3>
        <div className="flex items-center gap-4 text-sm mt-2">
          <span className="flex items-center gap-1">
            <Swords className="h-4 w-4 text-orange-500" />
            <span className="font-semibold">{card.atk}</span>
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{card.def}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-semibold">{card.hp}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Selectable card in the grid
 */
interface SelectableCardProps {
  card: ApiCard;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

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
      <div className="aspect-[3/4] bg-muted">
        <div className="flex h-full w-full items-center justify-center text-3xl">
          🃏
        </div>
      </div>

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

      {isSelected && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}

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
 * BetBattleSetupPage (Admin Create Matchup)
 *
 * Admin page for creating new matchups between two cards.
 * After creation, the matchup will appear in /matchups for players to bet on.
 */
export function BetBattleSetupPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [card1, setCard1] = useState<ApiCard | null>(null);
  const [card2, setCard2] = useState<ApiCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cards
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allCards = await cardApi.getAll();
        setCards(allCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cards");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Handle card1 selection
  const handleCard1Select = useCallback(
    (card: ApiCard) => {
      if (card2 && card.id === card2.id) {
        toast.warning("Same card selected", {
          description: "Cannot select the same card for both positions.",
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }
      setCard1(card);
    },
    [card2]
  );

  // Handle card2 selection
  const handleCard2Select = useCallback(
    (card: ApiCard) => {
      if (card1 && card.id === card1.id) {
        toast.warning("Same card selected", {
          description: "Cannot select the same card for both positions.",
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }
      setCard2(card);
    },
    [card1]
  );

  // Handle matchup creation
  const handleCreateMatchup = useCallback(async () => {
    if (!card1 || !card2) {
      toast.error("Please select both cards");
      return;
    }

    if (card1.id === card2.id) {
      toast.error("Cannot create matchup", {
        description: "Please select two different cards.",
      });
      return;
    }

    setIsCreating(true);

    try {
      const matchup = await matchupService.createMatchup({
        card1Id: card1.id,
        card1Name: card1.name,
        card2Id: card2.id,
        card2Name: card2.name,
      });

      toast.success("Matchup created!", {
        description: `${card1.name} vs ${card2.name} - Players can now bet on this matchup.`,
      });

      // Navigate to the matchup detail page (admin can start battle there)
      navigate(`/matchups/${matchup.id}`);
    } catch (err) {
      toast.error("Failed to create matchup", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCreating(false);
    }
  }, [card1, card2, navigate]);

  const canCreate = card1 && card2 && card1.id !== card2.id && !isCreating;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/matchups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Create Matchup
            </h1>
            <p className="text-muted-foreground mt-1">
              Set up a battle for players to bet on
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/matchups">
            <Swords className="h-4 w-4 mr-2" />
            View All Matchups
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading && <LoadingState />}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && cards.length === 0 && <EmptyCardsState />}

      {!isLoading && !error && cards.length > 0 && (
        <>
          {/* Selected cards preview - VS layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">
                Card 1 (Blue Corner)
              </h3>
              <SelectedCardPreview card={card1} label="Card 1" color="blue" />
            </div>

            {/* VS indicator */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white rounded-full px-6 py-3 shadow-lg">
                <span className="text-2xl font-bold">VS</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">
                Card 2 (Red Corner)
              </h3>
              <SelectedCardPreview card={card2} label="Card 2" color="red" />
            </div>
          </div>

          {/* Card selection grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Card 1 selection */}
            <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
              <h4 className="text-sm font-medium text-blue-600 mb-3">
                Select Card 1 (Blue Corner)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto">
                {cards.map((card) => (
                  <SelectableCard
                    key={card.id}
                    card={card}
                    isSelected={card1?.id === card.id}
                    isDisabled={card2?.id === card.id}
                    onClick={() => handleCard1Select(card)}
                  />
                ))}
              </div>
            </div>

            {/* Card 2 selection */}
            <div className="border rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
              <h4 className="text-sm font-medium text-red-600 mb-3">
                Select Card 2 (Red Corner)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto">
                {cards.map((card) => (
                  <SelectableCard
                    key={card.id}
                    card={card}
                    isSelected={card2?.id === card.id}
                    isDisabled={card1?.id === card.id}
                    onClick={() => handleCard2Select(card)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Create button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={handleCreateMatchup}
              disabled={!canCreate}
              className="min-w-[250px] py-6 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Matchup...
                </>
              ) : (
                <>
                  <Trophy className="h-5 w-5 mr-2" />
                  Create Matchup
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              After creating, the matchup will appear in the Matchups page where
              players can place their bets. You can start the battle from the
              matchup detail page.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default BetBattleSetupPage;
