/**
 * BetBattleSetupPage - Standalone page for setting up a battle with betting
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1
 * - Standalone page at /bet-battle route
 * - Reuse CardSelector components from existing battle
 * - Include BettingPanel for card selection and bet amount input
 * - Show gold balance prominently
 */

import { useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swords, ArrowLeft, Loader2, Coins, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSelector } from "../../battle/components/CardSelector";
import {
  useBattleStore,
  selectCanStartBattle,
} from "../../battle/store/battleStore";
import { useCards } from "../../cards/hooks/useCards";
import { GoldBalanceDisplay } from "../components/GoldBalanceDisplay";
import { BettingPanel } from "../components/BettingPanel";
import { useBettingStore, selectActiveBet } from "../store/bettingStore";
import type { Card } from "../../cards/types";

/**
 * BetBattleSetupPage component for selecting cards and placing bets before battle
 */
export function BetBattleSetupPage() {
  const navigate = useNavigate();

  // Battle store state and actions
  const challenger = useBattleStore((state) => state.challenger);
  const opponent = useBattleStore((state) => state.opponent);
  const canStartBattle = useBattleStore(selectCanStartBattle);
  const selectChallenger = useBattleStore((state) => state.selectChallenger);
  const selectOpponent = useBattleStore((state) => state.selectOpponent);
  const startBattle = useBattleStore((state) => state.startBattle);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Betting store state
  const activeBet = useBettingStore(selectActiveBet);
  const clearActiveBet = useBettingStore((state) => state.clearActiveBet);

  // Fetch all cards for selection
  const { data, isLoading } = useCards({
    page: 1,
    pageSize: 100,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  const cards = data?.cards ?? [];

  // Reset battle and betting state when component mounts
  useEffect(() => {
    resetBattle();
    clearActiveBet();
  }, [resetBattle, clearActiveBet]);

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

  // Handle bet placed callback
  const handleBetPlaced = useCallback(() => {
    // Bet placed - state is managed by betting store
  }, []);

  // Handle start battle - only allow if bet is placed
  const handleStartBattle = useCallback(() => {
    if (!activeBet) {
      return;
    }
    startBattle();
    navigate("/bet-battle/arena");
  }, [startBattle, navigate, activeBet]);

  // Can start battle only if both cards selected AND bet is placed
  const canStart = canStartBattle && activeBet !== null;

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
              <Coins className="h-8 w-8 text-yellow-500" />
              Bet Battle
            </h1>
            <p className="text-muted-foreground mt-1">
              Place your bet and battle for gold!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Gold Balance Display - Requirements: 6.1 */}
          <GoldBalanceDisplay size="lg" />
          <Button asChild variant="outline">
            <Link to="/bet-history">
              <History className="h-4 w-4 mr-2" />
              Bet History
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Card Selection Area - 2 columns on xl */}
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
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
        </div>

        {/* Betting Panel - Requirements: 2.1, 2.2, 2.3, 2.4 */}
        <div className="xl:col-span-1">
          <div className="sticky top-8">
            <BettingPanel
              challengerCard={
                challenger
                  ? {
                      id: challenger.id,
                      name: challenger.name,
                      imageUrl: challenger.imageUrl ?? undefined,
                    }
                  : null
              }
              opponentCard={
                opponent
                  ? {
                      id: opponent.id,
                      name: opponent.name,
                      imageUrl: opponent.imageUrl ?? undefined,
                    }
                  : null
              }
              disabled={!canStartBattle}
              onBetPlaced={handleBetPlaced}
            />

            {/* Start Battle Button */}
            <div className="mt-6">
              <Button
                size="lg"
                onClick={handleStartBattle}
                disabled={!canStart}
                className="w-full py-6 text-lg font-semibold gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
            {!canStart && !isLoading && (
              <p className="text-center text-muted-foreground mt-4 text-sm">
                {!challenger && !opponent
                  ? "Select two cards and place a bet to start"
                  : !challenger
                  ? "Select a challenger"
                  : !opponent
                  ? "Select an opponent"
                  : !activeBet
                  ? "Place a bet to start the battle"
                  : "Ready to battle!"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BetBattleSetupPage;
