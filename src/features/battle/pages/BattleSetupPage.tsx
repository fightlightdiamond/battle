/**
 * BattleSetupPage - Match setup page for selecting two cards to battle
 * Requirements: 1.1, 1.2, 1.3, 1.5
 * - Two CardSelector areas for card1 and card2
 * - Display selected cards side by side
 * - Start Battle button (enabled when both cards selected)
 * - Navigation to BattleArenaPage
 */

import { useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swords, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSelector } from "../components/CardSelector";
import { useBattleStore, selectCanStartBattle } from "../store/battleStore";
import { useCards } from "../../cards/hooks/useCards";
import type { Card } from "../../cards/types";

/**
 * BattleSetupPage component for selecting cards and starting a battle
 */
export function BattleSetupPage() {
  const navigate = useNavigate();

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

  // Handle start battle
  const handleStartBattle = useCallback(() => {
    startBattle();
    navigate("/battle/arena");
  }, [startBattle, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Swords className="h-8 w-8 text-primary" />
              Battle Setup
            </h1>
            <p className="text-muted-foreground mt-1">
              Select two cards to battle against each other
            </p>
          </div>
        </div>
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
            label="Challenger"
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
            label="Opponent"
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

      {/* Start Battle Button */}
      <div className="flex justify-center mt-8">
        <Button
          size="lg"
          onClick={handleStartBattle}
          disabled={!canStartBattle}
          className="px-12 py-6 text-lg font-semibold gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Cards...
            </>
          ) : (
            <>
              <Swords className="h-5 w-5" />
              Start Battle
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      {!canStartBattle && !isLoading && (
        <p className="text-center text-muted-foreground mt-4">
          {!challenger && !opponent
            ? "Select a challenger and an opponent to start the battle"
            : !challenger
            ? "Select a challenger to continue"
            : "Select an opponent to continue"}
        </p>
      )}
    </div>
  );
}
