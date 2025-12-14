/**
 * BettingPanel Component - Panel for placing bets on battle cards
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * - Card selection for betting (challenger or opponent)
 * - Bet amount input with validation
 * - Place Bet button with disabled states
 * - Show insufficient funds message when applicable
 */

import { useState, useCallback } from "react";
import { Coins, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useBettingStore,
  selectGoldBalance,
  selectActiveBet,
  selectCanPlaceBet,
} from "../store/bettingStore";

export interface BettingCard {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface BettingPanelProps {
  /** Challenger card */
  challengerCard: BettingCard | null;
  /** Opponent card */
  opponentCard: BettingCard | null;
  /** Whether betting is disabled (e.g., during battle) */
  disabled?: boolean;
  /** Callback when bet is placed successfully */
  onBetPlaced?: (cardId: string, amount: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BettingPanel Component
 * Allows users to select a card and place a bet
 */
export function BettingPanel({
  challengerCard,
  opponentCard,
  disabled = false,
  onBetPlaced,
  className,
}: BettingPanelProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Store state
  const goldBalance = useBettingStore(selectGoldBalance);
  const activeBet = useBettingStore(selectActiveBet);
  const canPlaceBet = useBettingStore(selectCanPlaceBet);
  const placeBet = useBettingStore((state) => state.placeBet);

  const amount = parseInt(betAmount, 10) || 0;
  const hasInsufficientFunds = amount > goldBalance;
  const isValidAmount = amount > 0;
  const canSubmit =
    selectedCardId !== null &&
    isValidAmount &&
    !hasInsufficientFunds &&
    canPlaceBet &&
    !disabled &&
    !activeBet;

  const handleCardSelect = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
    setError(null);
  }, []);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow positive integers
      if (value === "" || /^\d+$/.test(value)) {
        setBetAmount(value);
        setError(null);
      }
    },
    []
  );

  const handleQuickAmount = useCallback(
    (percentage: number) => {
      const quickAmount = Math.floor(goldBalance * percentage);
      if (quickAmount > 0) {
        setBetAmount(String(quickAmount));
        setError(null);
      }
    },
    [goldBalance]
  );

  const handlePlaceBet = useCallback(() => {
    if (!selectedCardId) {
      setError("Please select a card to bet on");
      return;
    }

    if (!isValidAmount) {
      setError("Please enter a valid bet amount");
      return;
    }

    if (hasInsufficientFunds) {
      setError("Insufficient funds");
      return;
    }

    // Attempt to place bet (Requirements: 2.1, 2.4)
    const success = placeBet(selectedCardId, amount);

    if (success) {
      onBetPlaced?.(selectedCardId, amount);
      // Reset form after successful bet
      setBetAmount("");
      setError(null);
    } else {
      setError("Unable to place bet at this time");
    }
  }, [
    selectedCardId,
    amount,
    isValidAmount,
    hasInsufficientFunds,
    placeBet,
    onBetPlaced,
  ]);

  // If there's already an active bet, show it
  if (activeBet) {
    const selectedCard =
      activeBet.selectedCardId === challengerCard?.id
        ? challengerCard
        : opponentCard;

    return (
      <div
        className={cn(
          "rounded-lg border border-green-500/30 bg-green-500/10 p-4",
          className
        )}
      >
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <Check className="h-5 w-5" />
          <span className="font-semibold">Bet Placed!</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Card: <span className="font-medium">{selectedCard?.name}</span>
          </p>
          <p>
            Amount:{" "}
            <span className="font-medium text-yellow-600">
              {activeBet.betAmount.toLocaleString()} gold
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-4",
        disabled && "opacity-50",
        className
      )}
      data-testid="betting-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Place Your Bet
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
          {challengerCard && (
            <CardOption
              card={challengerCard}
              isSelected={selectedCardId === challengerCard.id}
              onSelect={() => handleCardSelect(challengerCard.id)}
              disabled={disabled}
              label="Challenger"
            />
          )}
          {opponentCard && (
            <CardOption
              card={opponentCard}
              isSelected={selectedCardId === opponentCard.id}
              onSelect={() => handleCardSelect(opponentCard.id)}
              disabled={disabled}
              label="Opponent"
            />
          )}
        </div>
        {!challengerCard && !opponentCard && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select cards to enable betting
          </p>
        )}
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
            disabled={disabled}
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
              disabled={disabled || goldBalance === 0}
              className="flex-1 text-xs"
            >
              {pct === 1 ? "All" : `${pct * 100}%`}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Message (Requirements: 2.2, 2.3) */}
      {(error || hasInsufficientFunds) && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error || "Insufficient funds"}</span>
        </div>
      )}

      {/* Place Bet Button */}
      <Button
        onClick={handlePlaceBet}
        disabled={!canSubmit}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
      >
        <Coins className="h-4 w-4 mr-2" />
        Place Bet {isValidAmount && `(${amount.toLocaleString()} gold)`}
      </Button>
    </div>
  );
}

/**
 * Card option for selection
 */
interface CardOptionProps {
  card: BettingCard;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  label: string;
}

function CardOption({
  card,
  isSelected,
  onSelect,
  disabled,
  label,
}: CardOptionProps) {
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
      <p className="text-xs text-muted-foreground">{label}</p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

export default BettingPanel;
