/**
 * BattleSetupPage - Match setup page for selecting two cards
 * Supports two modes:
 * - "battle": Practice battle - starts battle immediately
 * - "matchup": Create matchup - creates matchup for betting
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5
 * - Two CardSelector areas for card1 and card2
 * - Display selected cards side by side
 * - Action button (Start Battle or Create Matchup)
 * - Navigation based on mode
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swords, ArrowLeft, Loader2, History, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardSelector } from "../components/CardSelector";
import { useBattleStore, selectCanStartBattle } from "../store/battleStore";
import { useCards } from "../../cards/hooks/useCards";
import { matchupService } from "../../matchup/services/matchupService";
import type { Card } from "../../cards/types";

export type BattleSetupMode = "battle" | "matchup";

interface BattleSetupPageProps {
  mode?: BattleSetupMode;
}

/**
 * BattleSetupPage component for selecting cards
 * @param mode - "battle" for practice battle, "matchup" for creating matchup
 */
export function BattleSetupPage({ mode = "battle" }: BattleSetupPageProps) {
  const navigate = useNavigate();
  const [isCreatingMatchup, setIsCreatingMatchup] = useState(false);

  // Battle store state and actions
  const challenger = useBattleStore((state) => state.challenger);
  const opponent = useBattleStore((state) => state.opponent);
  const canStartBattle = useBattleStore(selectCanStartBattle);
  const selectChallenger = useBattleStore((state) => state.selectChallenger);
  const selectOpponent = useBattleStore((state) => state.selectOpponent);
  const startBattle = useBattleStore((state) => state.startBattle);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Fetch all cards for selection (large page size to get all cards)
  const { data, isLoading } = useCards({
    page: 1,
    pageSize: 100,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  const cards = data?.cards ?? [];

  // Reset battle state when component mounts
  useEffect(() => {
    resetBattle();
  }, [resetBattle]);

  // Handle challenger selection
  const handleSelectChallenger = useCallback(
    (card: Card): boolean => {
      return selectChallenger(card);
    },
    [selectChallenger]
  );

  // Handle opponent selection
  const handleSelectOpponent = useCallback(
    (card: Card): boolean => {
      return selectOpponent(card);
    },
    [selectOpponent]
  );

  // Handle start battle (practice mode)
  const handleStartBattle = useCallback(() => {
    startBattle();
    navigate("/battle/arena");
  }, [startBattle, navigate]);

  // Handle create matchup (matchup mode)
  const handleCreateMatchup = useCallback(async () => {
    if (!challenger || !opponent) {
      toast.error("Please select both cards");
      return;
    }

    setIsCreatingMatchup(true);

    try {
      const matchup = await matchupService.createMatchup({
        card1Id: challenger.id,
        card1Name: challenger.name,
        card2Id: opponent.id,
        card2Name: opponent.name,
      });

      toast.success("Matchup created!", {
        description: `${challenger.name} vs ${opponent.name}`,
      });

      // Navigate to admin matchup page
      navigate(`/admin/matchups/${matchup.id}`);
    } catch (err) {
      toast.error("Failed to create matchup", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCreatingMatchup(false);
    }
  }, [challenger, opponent, navigate]);

  // Handle action button click based on mode
  const handleAction =
    mode === "battle" ? handleStartBattle : handleCreateMatchup;
  const isActionDisabled = !canStartBattle || isCreatingMatchup;

  // Mode-specific config
  const config = {
    battle: {
      title: "Battle Setup",
      subtitle: "Select two cards to battle against each other",
      backLink: "/cards",
      actionLabel: "Start Battle",
      actionIcon: <Swords className="h-5 w-5" />,
      loadingLabel: "Loading Cards...",
      headerIcon: <Swords className="h-8 w-8 text-primary" />,
      showHistory: true,
    },
    matchup: {
      title: "Create Matchup",
      subtitle: "Select two cards for players to bet on",
      backLink: "/admin/matchups",
      actionLabel: isCreatingMatchup ? "Creating..." : "Create Matchup",
      actionIcon: isCreatingMatchup ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Trophy className="h-5 w-5" />
      ),
      loadingLabel: "Loading Cards...",
      headerIcon: <Trophy className="h-8 w-8 text-primary" />,
      showHistory: false,
    },
  };

  const currentConfig = config[mode];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to={currentConfig.backLink}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {currentConfig.headerIcon}
              {currentConfig.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentConfig.subtitle}
            </p>
          </div>
        </div>
        {currentConfig.showHistory && (
          <Button asChild variant="outline">
            <Link to="/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
        )}
      </div>

      {/* Card Selection Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Challenger (Card 1) Selection */}
        <div className="space-y-4">
          <CardSelector
            cards={cards}
            selectedCardId={challenger?.id ?? null}
            otherSelectedCardId={opponent?.id ?? null}
            onSelect={handleSelectChallenger}
            isLoading={isLoading}
            label={mode === "battle" ? "Challenger" : "Card 1"}
            position="left"
          />
        </div>

        {/* VS Divider - visible on large screens */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg">
            <span className="text-xl font-bold">VS</span>
          </div>
        </div>

        {/* Opponent (Card 2) Selection */}
        <div className="space-y-4">
          <CardSelector
            cards={cards}
            selectedCardId={opponent?.id ?? null}
            otherSelectedCardId={challenger?.id ?? null}
            onSelect={handleSelectOpponent}
            isLoading={isLoading}
            label={mode === "battle" ? "Opponent" : "Card 2"}
            position="right"
          />
        </div>
      </div>

      {/* VS Divider - visible on small screens */}
      <div className="flex lg:hidden justify-center my-4">
        <div className="bg-primary text-primary-foreground rounded-full px-6 py-2 shadow-lg">
          <span className="text-lg font-bold">VS</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mt-8">
        <Button
          size="lg"
          onClick={handleAction}
          disabled={isActionDisabled}
          className="px-12 py-6 text-lg font-semibold gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {currentConfig.loadingLabel}
            </>
          ) : (
            <>
              {currentConfig.actionIcon}
              {currentConfig.actionLabel}
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      {!canStartBattle && !isLoading && (
        <p className="text-center text-muted-foreground mt-4">
          {!challenger && !opponent
            ? `Select ${
                mode === "battle"
                  ? "a challenger and an opponent"
                  : "both cards"
              } to continue`
            : !challenger
            ? `Select ${
                mode === "battle" ? "a challenger" : "Card 1"
              } to continue`
            : `Select ${
                mode === "battle" ? "an opponent" : "Card 2"
              } to continue`}
        </p>
      )}
    </div>
  );
}
