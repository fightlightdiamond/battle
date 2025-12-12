/**
 * BattleArenaPage - Combat UI for the Card Battle System
 * Requirements: 2.1, 7.1, 7.4, 8.4
 * - Layout: Card1 (left) vs Card2 (right)
 * - Entrance animation on load
 * - BattleControls at bottom
 * - BattleLog panel (collapsible sidebar)
 * - VictoryOverlay when battle ends
 * - Auto-battle timer logic with 1.5s delay
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BattleCard,
  BattleControls,
  BattleLog,
  DamageNumber,
  VictoryOverlay,
} from "../components";
import {
  useBattleStore,
  selectIsBattleFinished,
  selectWinner,
  selectLoser,
  selectDangerStatus,
} from "../store/battleStore";
import { BATTLE_PHASES } from "../types/battle";
import type { AttackResult, CardPosition } from "../types";

/** Auto-battle delay in milliseconds (Requirement 7.1) */
const AUTO_BATTLE_DELAY = 1500;

/** Animation state for tracking attack/damage visuals */
interface AnimationState {
  attackingPosition: CardPosition | null;
  receivingDamagePosition: CardPosition | null;
  damageNumber: {
    damage: number;
    isCritical: boolean;
    position: CardPosition;
  } | null;
}

const initialAnimationState: AnimationState = {
  attackingPosition: null,
  receivingDamagePosition: null,
  damageNumber: null,
};

export function BattleArenaPage() {
  const navigate = useNavigate();

  // Battle store state
  const phase = useBattleStore((state) => state.phase);
  const challenger = useBattleStore((state) => state.challenger);
  const opponent = useBattleStore((state) => state.opponent);
  const currentAttacker = useBattleStore((state) => state.currentAttacker);
  const battleLog = useBattleStore((state) => state.battleLog);
  const isAutoBattle = useBattleStore((state) => state.isAutoBattle);
  const isBattleFinished = useBattleStore(selectIsBattleFinished);
  const winner = useBattleStore(selectWinner);
  const loser = useBattleStore(selectLoser);
  const dangerStatus = useBattleStore(selectDangerStatus);

  // Battle store actions
  const executeAttack = useBattleStore((state) => state.executeAttack);
  const toggleAutoBattle = useBattleStore((state) => state.toggleAutoBattle);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Local UI state
  const [isLogOpen, setIsLogOpen] = useState(true);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );

  // Ref for auto-battle interval
  const autoBattleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /**
   * Handle attack action with animations
   */
  const handleAttack = useCallback(() => {
    const currentPhase = useBattleStore.getState().phase;
    const attacker = useBattleStore.getState().currentAttacker;

    if (currentPhase !== BATTLE_PHASES.FIGHTING) return;

    // Determine positions based on current attacker
    const attackerPosition: CardPosition =
      attacker === "challenger" ? "left" : "right";
    const defenderPosition: CardPosition =
      attacker === "challenger" ? "right" : "left";

    // Start attack animation
    setAnimationState({
      attackingPosition: attackerPosition,
      receivingDamagePosition: null,
      damageNumber: null,
    });

    // Execute attack after brief delay for attack animation
    setTimeout(() => {
      const result: AttackResult | null = executeAttack();

      if (result) {
        // Show damage animation on defender
        setAnimationState({
          attackingPosition: null,
          receivingDamagePosition: defenderPosition,
          damageNumber: {
            damage: result.damage,
            isCritical: result.isCritical,
            position: defenderPosition,
          },
        });

        // Clear damage animation after it completes
        setTimeout(() => {
          setAnimationState(initialAnimationState);
        }, 800);
      } else {
        setAnimationState(initialAnimationState);
      }
    }, 200);
  }, [executeAttack]);

  /**
   * Handle new battle - reset and navigate to setup
   */
  const handleNewBattle = useCallback(() => {
    resetBattle();
    navigate("/battle/setup");
  }, [resetBattle, navigate]);

  /**
   * Handle damage number animation end
   */
  const handleDamageAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      damageNumber: null,
    }));
  }, []);

  // Redirect to setup if no cards selected
  useEffect(() => {
    if (!challenger || !opponent) {
      navigate("/battle/setup");
    }
  }, [challenger, opponent, navigate]);

  // Entrance animation on load (Requirement 8.4)
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntranceComplete(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Auto-battle timer logic (Requirements 7.1, 7.4)
   * - Execute turns automatically with 1.5s delay
   * - Clear interval on pause or battle end
   */
  useEffect(() => {
    // Clear any existing interval
    if (autoBattleIntervalRef.current) {
      clearInterval(autoBattleIntervalRef.current);
      autoBattleIntervalRef.current = null;
    }

    // Start auto-battle if enabled and battle is in progress
    if (isAutoBattle && phase === BATTLE_PHASES.FIGHTING) {
      autoBattleIntervalRef.current = setInterval(() => {
        handleAttack();
      }, AUTO_BATTLE_DELAY);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoBattleIntervalRef.current) {
        clearInterval(autoBattleIntervalRef.current);
        autoBattleIntervalRef.current = null;
      }
    };
  }, [isAutoBattle, phase, handleAttack]);

  // Don't render if no cards (will redirect)
  if (!challenger || !opponent) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Battle Arena Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleNewBattle}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Exit Battle
          </Button>

          <h1 className="text-2xl font-bold text-white">Battle Arena</h1>

          {/* Toggle Battle Log Button */}
          <Button
            variant="ghost"
            onClick={() => setIsLogOpen(!isLogOpen)}
            className="text-white hover:bg-white/10"
          >
            <ScrollText className="h-5 w-5 mr-1" />
            {isLogOpen ? "Hide Log" : "Show Log"}
            {isLogOpen ? (
              <ChevronRight className="h-4 w-4 ml-1" />
            ) : (
              <ChevronLeft className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Battle Area */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center justify-center gap-8 md:gap-16 lg:gap-24",
              "transition-all duration-700",
              entranceComplete ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            {/* Challenger Card (Left) */}
            <div
              className={cn(
                "relative transform transition-all duration-600",
                entranceComplete
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-20 opacity-0"
              )}
              style={{ transitionDelay: "100ms" }}
            >
              <BattleCard
                card={challenger}
                position="left"
                isAttacking={animationState.attackingPosition === "left"}
                isReceivingDamage={
                  animationState.receivingDamagePosition === "left"
                }
                isDanger={dangerStatus.challengerInDanger}
                isWinner={isBattleFinished && winner?.id === challenger.id}
                isLoser={isBattleFinished && loser?.id === challenger.id}
              />

              {/* Damage Number for Challenger */}
              {animationState.damageNumber?.position === "left" && (
                <DamageNumber
                  damage={animationState.damageNumber.damage}
                  isCritical={animationState.damageNumber.isCritical}
                  position="left"
                  onAnimationEnd={handleDamageAnimationEnd}
                />
              )}
            </div>

            {/* VS Indicator */}
            <div
              className={cn(
                "flex flex-col items-center transition-all duration-500",
                entranceComplete
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-50"
              )}
              style={{ transitionDelay: "300ms" }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 drop-shadow-lg">
                VS
              </div>
              {/* Turn Indicator */}
              {phase === BATTLE_PHASES.FIGHTING && (
                <div className="mt-4 text-sm text-white/70">
                  {currentAttacker === "challenger"
                    ? `${challenger.name}'s turn`
                    : `${opponent.name}'s turn`}
                </div>
              )}
            </div>

            {/* Opponent Card (Right) */}
            <div
              className={cn(
                "relative transform transition-all duration-600",
                entranceComplete
                  ? "translate-x-0 opacity-100"
                  : "translate-x-20 opacity-0"
              )}
              style={{ transitionDelay: "200ms" }}
            >
              <BattleCard
                card={opponent}
                position="right"
                isAttacking={animationState.attackingPosition === "right"}
                isReceivingDamage={
                  animationState.receivingDamagePosition === "right"
                }
                isDanger={dangerStatus.opponentInDanger}
                isWinner={isBattleFinished && winner?.id === opponent.id}
                isLoser={isBattleFinished && loser?.id === opponent.id}
              />

              {/* Damage Number for Opponent */}
              {animationState.damageNumber?.position === "right" && (
                <DamageNumber
                  damage={animationState.damageNumber.damage}
                  isCritical={animationState.damageNumber.isCritical}
                  position="right"
                  onAnimationEnd={handleDamageAnimationEnd}
                />
              )}
            </div>
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
          <BattleControls
            phase={phase}
            isAutoBattle={isAutoBattle}
            onAttack={handleAttack}
            onToggleAuto={toggleAutoBattle}
            onNewBattle={handleNewBattle}
          />
        </div>
      </div>

      {/* Collapsible Battle Log Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-card/95 backdrop-blur-sm border-l shadow-xl",
          "transform transition-transform duration-300 z-20",
          isLogOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Battle Log</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLogOpen(false)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <BattleLog entries={battleLog} maxHeight="calc(100vh - 120px)" />
          </div>
        </div>
      </div>

      {/* Victory Overlay */}
      {isBattleFinished && winner && loser && (
        <VictoryOverlay
          winner={winner}
          loser={loser}
          onNewBattle={handleNewBattle}
        />
      )}
    </div>
  );
}

export default BattleArenaPage;
