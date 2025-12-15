/**
 * BetForm Component - Form for placing, updating, and cancelling bets on matchups
 * Requirements: 3.1, 3.2, 3.3, 4.1, 4.3
 * - Input for bet amount with validation
 * - Card selection (card1 or card2)
 * - Place Bet / Update Bet / Cancel Bet buttons
 * - Show current bet info if exists
 * - Disable when matchup not pending
 */

import { useState, useCallback } from "react";
import { Coins, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Matchup, MatchupBet } from "../types/matchup";
import {
  useMatchupBettingStore,
  selectGoldBalance,
  selectIsLoading,
  selectError,
} from "../store/matchupBettingStore";

export interface BetFormCard {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface BetFormProps {
  /** The matchup to bet on */
  matchup: Matchup;
  /** Card 1 info */
  card1: BetFormCard;
  /** Card 2 info */
  card2: BetFormCard;
  /** Current active bet if exists */
  currentBet?: MatchupBet | null;
  /** Callback when bet is placed successfully */
  onBetPlaced?: (bet: MatchupBet) => void;
  /** Callback when bet is updated successfully */
  onBetUpdated?: (bet: MatchupBet) => void;
  /** Callback when bet is cancelled successfully */
  onBetCancelled?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BetForm Component
 * Allows users to place, update, or cancel bets on matchups
 */
export function BetForm({
  matchup,
  card1,
  card2,
  currentBet,
  onBetPlaced,
  onBetUpdated,
  onBetCancelled,
  className,
}: BetFormProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    currentBet?.selectedCardId ?? null
  );
  const [betAmount, setBetAmount] = useState<string>(
    currentBet?.betAmount?.toString() ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Store state
  const goldBalance = useMatchupBettingStore(selectGoldBalance);
  const isLoading = useMatchupBettingStore(selectIsLoading);
  const storeError = useMatchupBettingStore(selectError);
  const placeMatchupBet = useMatchupBettingStore((s) => s.placeMatchupBet);
  const updateMatchupBet = useMatchupBettingStore((s) => s.updateMatchupBet);
  const cancelMatchupBet = useMatchupBettingStore((s) => s.cancelMatchupBet);
  const clearError = useMatchupBettingStore((s) => s.clearError);

  const isPending = matchup.status === "pending";
  const hasCurrentBet = !!currentBet && currentBet.status === "active";
  const amount = parseInt(betAmount, 10) || 0;

  // For new bets, check against full balance
  // For updates, check against balance + current bet amount (since we'll refund the difference)
  const availableBalance = hasCurrentBet
    ? goldBalance + currentBet.betAmount
    : goldBalance;
  const hasInsufficientFunds = amount > availableBalance;
  const isValidAmount = amount > 0;

  const canPlaceBet =
    isPending &&
    !hasCurrentBet &&
    selectedCardId !== null &&
    isValidAmount &&
    !hasInsufficientFunds &&
    !isLoading;

  const canUpdateBet =
    isPending &&
    hasCurrentBet &&
    selectedCardId !== null &&
    isValidAmount &&
    !hasInsufficientFunds &&
    !isLoading &&
    (amount !== currentBet?.betAmount ||
      selectedCardId !== currentBet?.selectedCardId);

  const canCancelBet = isPending && hasCurrentBet && !isLoading;

  const error = localError || storeError;

  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (!isPending) return;
      setSelectedCardId(cardId);
      setLocalError(null);
      clearError();
    },
    [isPending, clearError]
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "" || /^\d+$/.test(value)) {
        setBetAmount(value);
        setLocalError(null);
        clearError();
      }
    },
    [clearError]
  );

  const handleQuickAmount = useCallback(
    (percentage: number) => {
      const quickAmount = Math.floor(availableBalance * percentage);
      if (quickAmount > 0) {
        setBetAmount(String(quickAmount));
        setLocalError(null);
        clearError();
      }
    },
    [availableBalance, clearError]
  );

  const handlePlaceBet = useCallback(async () => {
    if (!selectedCardId) {
      setLocalError("Please select a card to bet on");
      return;
    }

    if (!isValidAmount) {
      setLocalError("Please enter a valid bet amount");
      return;
    }

    if (hasInsufficientFunds) {
      setLocalError("Insufficient funds");
      return;
    }

    const selectedCard = selectedCardId === card1.id ? card1 : card2;

    const success = await placeMatchupBet({
      matchupId: matchup.id,
      selectedCardId,
      selectedCardName: selectedCard.name,
      betAmount: amount,
    });

    if (success) {
      onBetPlaced?.({
        id: "", // Will be set by service
        matchupId: matchup.id,
        selectedCardId,
        selectedCardName: selectedCard.name,
        betAmount: amount,
        status: "active",
        payoutAmount: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        resolvedAt: null,
      });
    }
  }, [
    selectedCardId,
    amount,
    isValidAmount,
    hasInsufficientFunds,
    card1,
    card2,
    matchup.id,
    placeMatchupBet,
    onBetPlaced,
  ]);

  const handleUpdateBet = useCallback(async () => {
    if (!currentBet) return;

    if (!isValidAmount) {
      setLocalError("Please enter a valid bet amount");
      return;
    }

    if (hasInsufficientFunds) {
      setLocalError("Insufficient funds");
      return;
    }

    const success = await updateMatchupBet(currentBet.id, amount);

    if (success) {
      onBetUpdated?.({
        ...currentBet,
        betAmount: amount,
        updatedAt: Date.now(),
      });
    }
  }, [
    currentBet,
    amount,
    isValidAmount,
    hasInsufficientFunds,
    updateMatchupBet,
    onBetUpdated,
  ]);

  const handleCancelBet = useCallback(async () => {
    if (!currentBet) return;

    const success = await cancelMatchupBet(currentBet.id);

    if (success) {
      setBetAmount("");
      setSelectedCardId(null);
      onBetCancelled?.();
    }
  }, [currentBet, cancelMatchupBet, onBetCancelled]);

  // Show disabled state for non-pending matchups
  if (!isPending) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-muted/50 p-4 text-center",
          className
        )}
        data-testid="bet-form-disabled"
      >
        <p className="text-sm text-muted-foreground">
          {matchup.status === "in_progress"
            ? "Betting is closed - battle in progress"
            : matchup.status === "completed"
            ? "This matchup has ended"
            : "This matchup was cancelled"}
        </p>
        {hasCurrentBet && (
          <div className="mt-2 text-sm">
            <p>
              Your bet:{" "}
              <span className="font-medium text-yellow-600">
                {currentBet.betAmount.toLocaleString()} gold
              </span>{" "}
              on{" "}
              <span className="font-medium">{currentBet.selectedCardName}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg border bg-card p-4 space-y-4", className)}
      data-testid="bet-form"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          {hasCurrentBet ? "Update Your Bet" : "Place Your Bet"}
        </h3>
        <div className="text-sm text-muted-foreground">
          Balance:{" "}
          <span className="font-medium text-yellow-600">
            {goldBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Card Selection */}
      <div className="space-y-2">
        <Label>Select Winner</Label>
        <div className="grid grid-cols-2 gap-3">
          <CardOption
            card={card1}
            isSelected={selectedCardId === card1.id}
            onSelect={() => handleCardSelect(card1.id)}
            disabled={isLoading}
          />
          <CardOption
            card={card2}
            isSelected={selectedCardId === card2.id}
            onSelect={() => handleCardSelect(card2.id)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="bet-amount">Bet Amount</Label>
        <div className="relative">
          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
          <Input
            id="bet-amount"
            type="text"
            inputMode="numeric"
            placeholder="Enter amount"
            value={betAmount}
            onChange={handleAmountChange}
            disabled={isLoading}
            className={cn(
              "pl-10",
              hasInsufficientFunds &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2">
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <Button
              key={pct}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(pct)}
              disabled={isLoading || availableBalance === 0}
              className="flex-1 text-xs"
            >
              {pct === 1 ? "All" : `${pct * 100}%`}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Current bet info */}
      {hasCurrentBet && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">
            Current bet:{" "}
            <span className="font-medium text-foreground">
              {currentBet.betAmount.toLocaleString()} gold
            </span>{" "}
            on{" "}
            <span className="font-medium text-foreground">
              {currentBet.selectedCardName}
            </span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {hasCurrentBet ? (
          <>
            <Button
              onClick={handleUpdateBet}
              disabled={!canUpdateBet}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Bet
                </>
              )}
            </Button>
            <Button
              onClick={handleCancelBet}
              disabled={!canCancelBet}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Bet
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Place Bet {isValidAmount && `(${amount.toLocaleString()} gold)`}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Card option for selection
 */
interface CardOptionProps {
  card: BetFormCard;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CardOption({ card, isSelected, onSelect, disabled }: CardOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative rounded-lg border-2 p-3 transition-all",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
        isSelected
          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
          : "border-muted",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {/* Card image */}
      <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-2xl">🃏</span>
          </div>
        )}
      </div>

      {/* Card name */}
      <p className="text-sm font-medium truncate">{card.name}</p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

export default BetForm;
