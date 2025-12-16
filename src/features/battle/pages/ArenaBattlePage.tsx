/**
 * ArenaBattlePage - Combat UI for Arena Mode battles on 1D arena
 * Requirements: 2.1, 2.4, 3.3, 4.3, 5.1, 5.2, 5.4
 *
 * Features:
 * - Arena1D display with 8 cells
 * - ArenaCardWithStats for HP/stats overlay
 * - Movement phase: cards move toward each other
 * - Combat phase: attacks when adjacent
 * - Reuses BattleControls, BattleLog, VictoryOverlay
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import {
  BattleCard as BattleCardComponent,
  BattleLogPopup,
  VictoryOverlay,
} from "../components";
import { Arena1D } from "../../arena1d/components";
import {
  useArenaBattleStore,
  selectIsArenaFinished,
  selectWinner,
  selectLoser,
  selectCanMove,
  selectCanAttack,
  selectIsInCombat,
  selectChallengerInDanger,
  selectOpponentInDanger,
} from "../store/arenaBattleStore";
import { useBattleStore } from "../store/battleStore";
import {
  PHASE_MOVING,
  PHASE_COMBAT,
  PHASE_FINISHED,
  SIDE_LEFT,
  SIDE_RIGHT,
} from "../../arena1d/types/arena";
import type {
  ArenaCardData,
  CellIndex,
  CardSide,
  ArenaPhase,
} from "../../arena1d/types/arena";
import type { AttackResult, BattleCard as BattleCardType } from "../types";

/** Auto-battle delay in milliseconds */
const AUTO_BATTLE_DELAY = 1500;

/** Animation state for tracking attack/damage visuals */
interface AnimationState {
  damageDisplay: {
    damage: number;
    isCritical: boolean;
    side: CardSide;
  } | null;
  healDisplay: {
    healAmount: number;
    side: CardSide;
  } | null;
  animationKey: number;
}

const initialAnimationState: AnimationState = {
  damageDisplay: null,
  healDisplay: null,
  animationKey: 0,
};

export function ArenaBattlePage() {
  const navigate = useNavigate();

  // Arena battle store state
  const challenger = useArenaBattleStore((state) => state.challenger);
  const opponent = useArenaBattleStore((state) => state.opponent);
  const leftPosition = useArenaBattleStore((state) => state.leftPosition);
  const rightPosition = useArenaBattleStore((state) => state.rightPosition);
  const arenaPhase = useArenaBattleStore((state) => state.arenaPhase);
  const currentTurn = useArenaBattleStore((state) => state.currentTurn);
  const battleLog = useArenaBattleStore((state) => state.battleLog);
  const isAutoBattle = useArenaBattleStore((state) => state.isAutoBattle);
  const isArenaFinished = useArenaBattleStore(selectIsArenaFinished);
  const winner = useArenaBattleStore(selectWinner);
  const loser = useArenaBattleStore(selectLoser);
  const canMove = useArenaBattleStore(selectCanMove);
  const canAttack = useArenaBattleStore(selectCanAttack);
  const isInCombat = useArenaBattleStore(selectIsInCombat);
  const challengerInDanger = useArenaBattleStore(selectChallengerInDanger);
  const opponentInDanger = useArenaBattleStore(selectOpponentInDanger);

  // Arena battle store actions
  const initArena = useArenaBattleStore((state) => state.initArena);
  const executeMove = useArenaBattleStore((state) => state.executeMove);
  const executeAttack = useArenaBattleStore((state) => state.executeAttack);
  const toggleAutoBattle = useArenaBattleStore(
    (state) => state.toggleAutoBattle
  );
  const resetArena = useArenaBattleStore((state) => state.resetArena);

  // Battle store for selected cards
  const selectedChallenger = useBattleStore((state) => state.challenger);
  const selectedOpponent = useBattleStore((state) => state.opponent);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Local UI state - log popup hidden by default
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );

  // Ref for auto-battle interval
  const autoBattleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Track if we've initialized for current selected cards
  const hasInitializedRef = useRef(false);
  const initializedCardsRef = useRef<{
    challengerId: string;
    opponentId: string;
  } | null>(null);

  // Initialize arena when page loads with selected cards
  // Always reinitialize if selected cards changed
  useEffect(() => {
    if (selectedChallenger && selectedOpponent) {
      const currentIds = {
        challengerId: selectedChallenger.id,
        opponentId: selectedOpponent.id,
      };

      // Check if we need to initialize (first time or cards changed)
      const needsInit =
        !hasInitializedRef.current ||
        !initializedCardsRef.current ||
        initializedCardsRef.current.challengerId !== currentIds.challengerId ||
        initializedCardsRef.current.opponentId !== currentIds.opponentId;

      if (needsInit) {
        initArena(selectedChallenger, selectedOpponent);
        hasInitializedRef.current = true;
        initializedCardsRef.current = currentIds;
      }
    }
  }, [selectedChallenger, selectedOpponent, initArena]);

  // Redirect to setup if no cards selected
  useEffect(() => {
    if (!selectedChallenger || !selectedOpponent) {
      navigate("/battle/setup");
    }
  }, [selectedChallenger, selectedOpponent, navigate]);

  // Entrance animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntranceComplete(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle action based on current phase
   * - Moving phase: execute move
   * - Combat phase: execute attack with animations
   */
  const handleAction = useCallback(() => {
    if (arenaPhase === PHASE_MOVING && canMove) {
      executeMove();
    } else if (arenaPhase === PHASE_COMBAT && canAttack) {
      // Determine which side is attacking/defending
      const attackerSide: CardSide =
        currentTurn === "challenger" ? SIDE_LEFT : SIDE_RIGHT;
      const defenderSide: CardSide =
        currentTurn === "challenger" ? SIDE_RIGHT : SIDE_LEFT;

      // Execute attack
      const result: AttackResult | null = executeAttack();

      if (result) {
        // Show damage animation on defender
        const lifestealHeal = result.lifestealHeal ?? 0;

        setAnimationState((prev) => ({
          damageDisplay: {
            damage: result.damage,
            isCritical: result.isCritical,
            side: defenderSide,
          },
          healDisplay:
            lifestealHeal > 0
              ? {
                  healAmount: lifestealHeal,
                  side: attackerSide,
                }
              : null,
          animationKey: prev.animationKey + 1,
        }));

        // Clear animations after they complete
        setTimeout(() => {
          setAnimationState((prev) => ({
            ...initialAnimationState,
            animationKey: prev.animationKey,
          }));
        }, 800);
      }
    }
  }, [arenaPhase, canMove, canAttack, currentTurn, executeMove, executeAttack]);

  /**
   * Handle toggle auto-battle
   */
  const handleToggleAutoBattle = useCallback(() => {
    if (arenaPhase !== PHASE_FINISHED) {
      toggleAutoBattle();
    }
  }, [arenaPhase, toggleAutoBattle]);

  /**
   * Handle new battle - reset and navigate to setup
   */
  const handleNewBattle = useCallback(() => {
    // Reset initialization tracking
    hasInitializedRef.current = false;
    initializedCardsRef.current = null;
    resetArena();
    resetBattle();
    navigate("/battle/setup");
  }, [resetArena, resetBattle, navigate]);

  /**
   * Handle damage number animation end
   */
  const handleDamageAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      damageDisplay: null,
    }));
  }, []);

  /**
   * Handle heal number animation end
   */
  const handleHealAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      healDisplay: null,
    }));
  }, []);

  /**
   * Auto-battle timer logic
   * - Execute moves or attacks automatically with delay
   * - Clear interval on pause or battle end
   */
  useEffect(() => {
    // Clear any existing interval
    if (autoBattleIntervalRef.current) {
      clearInterval(autoBattleIntervalRef.current);
      autoBattleIntervalRef.current = null;
    }

    // Start auto-battle if enabled and battle is in progress
    if (isAutoBattle && arenaPhase !== PHASE_FINISHED) {
      autoBattleIntervalRef.current = setInterval(() => {
        handleAction();
      }, AUTO_BATTLE_DELAY);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoBattleIntervalRef.current) {
        clearInterval(autoBattleIntervalRef.current);
        autoBattleIntervalRef.current = null;
      }
    };
  }, [isAutoBattle, arenaPhase, handleAction]);

  // Don't render if no cards (will redirect)
  if (!selectedChallenger || !selectedOpponent || !challenger || !opponent) {
    return null;
  }

  // Determine button label based on phase
  const actionButtonLabel = arenaPhase === PHASE_MOVING ? "Move" : "Attack";

  /** Battle log toggle button for headerRight prop */
  const battleLogToggle = (
    <Button
      variant="ghost"
      onClick={() => setIsLogOpen(!isLogOpen)}
      className="text-white hover:bg-white/10"
    >
      <ScrollText className="h-5 w-5 mr-1" />
      Log
    </Button>
  );

  return (
    <AppLayout
      variant="game"
      width="full"
      title="Arena Battle"
      backTo="/battle/setup"
      backLabel="Exit Battle"
      headerRight={battleLogToggle}
    >
      {/* Battle Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Turn Indicator */}
        <div
          className={cn(
            "text-white/70 text-sm transition-all duration-500",
            entranceComplete ? "opacity-100" : "opacity-0"
          )}
        >
          {arenaPhase === PHASE_MOVING && (
            <span>
              {currentTurn === "challenger" ? challenger.name : opponent.name}'s
              turn to move
            </span>
          )}
          {arenaPhase === PHASE_COMBAT && (
            <span>
              {currentTurn === "challenger" ? challenger.name : opponent.name}'s
              turn to attack
            </span>
          )}
          {arenaPhase === PHASE_FINISHED && <span>Battle Finished!</span>}
        </div>

        {/* Arena with Cards - Reusing BattleCard component */}
        <div
          className={cn(
            "transition-all duration-700 w-full",
            entranceComplete ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <ArenaBattleSection
            challenger={challenger}
            opponent={opponent}
            leftPosition={leftPosition}
            rightPosition={rightPosition}
            phase={arenaPhase}
            currentTurn={currentTurn}
            isInCombat={isInCombat}
            challengerInDanger={challengerInDanger}
            opponentInDanger={opponentInDanger}
            isFinished={isArenaFinished}
            winner={winner}
            loser={loser}
            animationState={animationState}
            onDamageAnimationEnd={handleDamageAnimationEnd}
            onHealAnimationEnd={handleHealAnimationEnd}
          />
        </div>

        {/* Phase Indicator */}
        <div
          className={cn(
            "flex items-center gap-2 text-white/60 text-xs transition-all duration-500",
            entranceComplete ? "opacity-100" : "opacity-0"
          )}
        >
          <span
            className={cn(
              "px-2 py-1 rounded",
              arenaPhase === PHASE_MOVING
                ? "bg-blue-500/30 text-blue-300"
                : "bg-slate-700/50"
            )}
          >
            Moving
          </span>
          <span className="text-white/30">→</span>
          <span
            className={cn(
              "px-2 py-1 rounded",
              arenaPhase === PHASE_COMBAT
                ? "bg-red-500/30 text-red-300"
                : "bg-slate-700/50"
            )}
          >
            Combat
          </span>
        </div>
      </div>

      {/* Battle Controls */}
      <div
        className={cn(
          "flex justify-center mb-8 transition-all duration-500",
          entranceComplete
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        )}
        style={{ transitionDelay: "400ms" }}
      >
        <ArenaControls
          phase={arenaPhase}
          isAutoBattle={isAutoBattle}
          onAction={handleAction}
          onToggleAuto={handleToggleAutoBattle}
          onNewBattle={handleNewBattle}
          actionLabel={actionButtonLabel}
          canAct={canMove || canAttack}
        />
      </div>

      {/* Battle Log Popup */}
      <BattleLogPopup
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        entries={battleLog}
      />

      {/* Victory Overlay */}
      {isArenaFinished && winner && loser && (
        <VictoryOverlay
          winner={winner}
          loser={loser}
          onNewBattle={handleNewBattle}
        />
      )}
    </AppLayout>
  );
}

/**
 * Arena section with BattleCard VS layout and Arena1D grid
 * Reuses BattleCard component from battle/components for consistent UI
 */
interface ArenaBattleSectionProps {
  challenger: BattleCardType;
  opponent: BattleCardType;
  leftPosition: CellIndex;
  rightPosition: CellIndex;
  phase: ArenaPhase;
  currentTurn: "challenger" | "opponent";
  isInCombat: boolean;
  challengerInDanger: boolean;
  opponentInDanger: boolean;
  isFinished: boolean;
  winner: BattleCardType | null;
  loser: BattleCardType | null;
  animationState: AnimationState;
  onDamageAnimationEnd: () => void;
  onHealAnimationEnd: () => void;
}

function ArenaBattleSection({
  challenger,
  opponent,
  leftPosition,
  rightPosition,
  phase,
  currentTurn,
  isInCombat,
  challengerInDanger,
  opponentInDanger,
  isFinished,
  winner,
  loser,
  animationState,
  onDamageAnimationEnd,
  onHealAnimationEnd,
}: ArenaBattleSectionProps) {
  // Convert to ArenaCardData for Arena1D
  const leftArenaCard: ArenaCardData = {
    id: challenger.id,
    name: challenger.name,
    imageUrl: challenger.imageUrl,
  };
  const rightArenaCard: ArenaCardData = {
    id: opponent.id,
    name: opponent.name,
    imageUrl: opponent.imageUrl,
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Cards with VS layout - Reusing BattleCard component */}
      <div className="flex items-center justify-center gap-8 md:gap-16 lg:gap-24">
        {/* Challenger Card (Left) */}
        <BattleCardComponent
          card={challenger}
          position="left"
          isAttacking={isInCombat && currentTurn === "challenger"}
          isReceivingDamage={animationState.damageDisplay?.side === SIDE_LEFT}
          isDanger={challengerInDanger}
          isWinner={isFinished && winner?.id === challenger.id}
          isLoser={isFinished && loser?.id === challenger.id}
          damageDisplay={
            animationState.damageDisplay?.side === SIDE_LEFT
              ? {
                  damage: animationState.damageDisplay.damage,
                  isCritical: animationState.damageDisplay.isCritical,
                }
              : null
          }
          healDisplay={
            animationState.healDisplay?.side === SIDE_LEFT
              ? { healAmount: animationState.healDisplay.healAmount }
              : null
          }
          animationKey={animationState.animationKey}
          onDamageAnimationEnd={onDamageAnimationEnd}
          onHealAnimationEnd={onHealAnimationEnd}
        />

        {/* VS Indicator */}
        <div className="flex flex-col items-center">
          <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 drop-shadow-lg">
            VS
          </div>
        </div>

        {/* Opponent Card (Right) */}
        <BattleCardComponent
          card={opponent}
          position="right"
          isAttacking={isInCombat && currentTurn === "opponent"}
          isReceivingDamage={animationState.damageDisplay?.side === SIDE_RIGHT}
          isDanger={opponentInDanger}
          isWinner={isFinished && winner?.id === opponent.id}
          isLoser={isFinished && loser?.id === opponent.id}
          damageDisplay={
            animationState.damageDisplay?.side === SIDE_RIGHT
              ? {
                  damage: animationState.damageDisplay.damage,
                  isCritical: animationState.damageDisplay.isCritical,
                }
              : null
          }
          healDisplay={
            animationState.healDisplay?.side === SIDE_RIGHT
              ? { healAmount: animationState.healDisplay.healAmount }
              : null
          }
          animationKey={animationState.animationKey}
          onDamageAnimationEnd={onDamageAnimationEnd}
          onHealAnimationEnd={onHealAnimationEnd}
        />
      </div>

      {/* Arena Grid - Full width */}
      <div className="w-full max-w-4xl px-4">
        <Arena1D
          leftCard={leftArenaCard}
          rightCard={rightArenaCard}
          leftPosition={leftPosition}
          rightPosition={rightPosition}
          phase={phase}
        />
      </div>
    </div>
  );
}

/**
 * Arena-specific controls with Move/Attack button
 */
interface ArenaControlsProps {
  phase: ArenaPhase;
  isAutoBattle: boolean;
  onAction: () => void;
  onToggleAuto: () => void;
  onNewBattle: () => void;
  actionLabel: string;
  canAct: boolean;
}

function ArenaControls({
  phase,
  isAutoBattle,
  onAction,
  onToggleAuto,
  onNewBattle,
  actionLabel,
  canAct,
}: ArenaControlsProps) {
  const isFinished = phase === PHASE_FINISHED;
  const canDoAction = canAct && !isAutoBattle;

  return (
    <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-card border">
      {/* Action Button (Move or Attack) */}
      {!isFinished && (
        <Button
          variant="default"
          size="lg"
          onClick={onAction}
          disabled={!canDoAction}
          className={cn(
            "min-w-[120px]",
            actionLabel === "Move"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          )}
        >
          <span className="mr-2">{actionLabel === "Move" ? "🚶" : "⚔️"}</span>
          {actionLabel}
        </Button>
      )}

      {/* Auto-Battle Toggle */}
      {!isFinished && (
        <Button
          variant={isAutoBattle ? "destructive" : "secondary"}
          size="lg"
          onClick={onToggleAuto}
          className="min-w-[120px]"
        >
          {isAutoBattle ? (
            <>
              <span className="mr-2">⏸️</span>
              Pause
            </>
          ) : (
            <>
              <span className="mr-2">▶️</span>
              Auto Battle
            </>
          )}
        </Button>
      )}

      {/* New Battle Button */}
      {isFinished && (
        <Button
          variant="default"
          size="lg"
          onClick={onNewBattle}
          className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
        >
          <span className="mr-2">🔄</span>
          New Battle
        </Button>
      )}
    </div>
  );
}

export default ArenaBattlePage;
