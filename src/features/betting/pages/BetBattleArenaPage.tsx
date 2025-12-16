/**
 * BetBattleArenaPage - Combat UI for betting battles
 * Requirements: 2.5, 3.1, 3.2, 3.3, 3.4
 * - Reuse battle arena components (BattleCard, HPBar, etc.)
 * - Disable betting during battle (phase = fighting)
 * - Show active bet info during battle
 * - Integrate bet resolution with battle end
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ScrollText, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BattleCard,
  BattleControls,
  BattleLog,
  BattleReplayPlayer,
} from "../../battle/components";
import {
  useBattleStore,
  selectIsBattleFinished,
  selectWinner,
  selectLoser,
  selectChallengerInDanger,
  selectOpponentInDanger,
} from "../../battle/store/battleStore";
import { BATTLE_PHASES } from "../../battle/types/battle";
import type {
  AttackResult,
  CardPosition,
  BattleCard as BattleCardType,
} from "../../battle/types";
import type { BattleRecord } from "../../battle/types/battleHistoryTypes";
import { BattleEngine } from "../../battle/engine/core/BattleEngine";
import type { Combatant, CombatantStats } from "../../battle/engine/core/types";
import { GoldBalanceDisplay } from "../components/GoldBalanceDisplay";
import { BetResultOverlay } from "../components/BetResultOverlay";
import { useBettingStore, selectActiveBet } from "../store/bettingStore";
import type { BetRecord } from "../types/betting";

/** Auto-battle delay in milliseconds */
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
  healNumber: {
    healAmount: number;
    position: CardPosition;
  } | null;
  animationKey: number;
}

const initialAnimationState: AnimationState = {
  attackingPosition: null,
  receivingDamagePosition: null,
  damageNumber: null,
  healNumber: null,
  animationKey: 0,
};

/**
 * Convert BattleCard to Combatant for BattleEngine
 */
function battleCardToCombatant(card: BattleCardType): Combatant {
  const baseStats: CombatantStats = {
    atk: card.atk,
    def: card.def,
    spd: card.spd,
    critChance: card.critChance,
    critDamage: card.critDamage,
    armorPen: card.armorPen,
    lifesteal: card.lifesteal,
  };

  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    baseStats,
    currentHp: card.currentHp,
    maxHp: card.maxHp,
    buffs: [],
    isDefeated: false,
  };
}

export function BetBattleArenaPage() {
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
  const challengerInDanger = useBattleStore(selectChallengerInDanger);
  const opponentInDanger = useBattleStore(selectOpponentInDanger);

  // Battle store actions
  const executeAttack = useBattleStore((state) => state.executeAttack);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Betting store state and actions
  const activeBet = useBettingStore(selectActiveBet);
  const resolveBet = useBettingStore((state) => state.resolveBet);
  const clearActiveBet = useBettingStore((state) => state.clearActiveBet);

  // Local UI state
  const [isLogOpen, setIsLogOpen] = useState(true);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState,
  );

  // Bet result state
  const [betResult, setBetResult] = useState<BetRecord | null>(null);
  const [showBetResult, setShowBetResult] = useState(false);
  const betResolvedRef = useRef(false);

  // Auto-battle replay state
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayBattleRecord, setReplayBattleRecord] =
    useState<BattleRecord | null>(null);
  const [isComputingBattle, setIsComputingBattle] = useState(false);

  // Ref for auto-battle interval
  const autoBattleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  /**
   * Resolve bet when battle finishes - Requirements: 3.1, 3.2, 3.3
   */
  useEffect(() => {
    const resolveBetAsync = async () => {
      if (isBattleFinished && winner && activeBet && !betResolvedRef.current) {
        betResolvedRef.current = true;

        // Get selected card name
        const selectedCard =
          activeBet.selectedCardId === challenger?.id ? challenger : opponent;
        const selectedCardName = selectedCard?.name ?? "Unknown";

        // Generate a battle ID
        const battleId = `battle-${Date.now()}`;

        // Resolve the bet - Requirements: 3.1, 3.2, 3.3
        const result = await resolveBet(
          winner.id,
          winner.name,
          battleId,
          selectedCardName,
        );

        if (result) {
          setBetResult(result);
          // Show bet result overlay after a short delay
          setTimeout(() => {
            setShowBetResult(true);
          }, 500);
        }
      }
    };

    resolveBetAsync();
  }, [isBattleFinished, winner, activeBet, challenger, opponent, resolveBet]);

  /**
   * Compute entire battle without animation and return BattleRecord
   */
  const computeEntireBattle =
    useCallback(async (): Promise<BattleRecord | null> => {
      if (!challenger || !opponent) return null;

      const engine = new BattleEngine();
      const challengerCombatant = battleCardToCombatant(challenger);
      const opponentCombatant = battleCardToCombatant(opponent);

      engine.initBattle(challengerCombatant, opponentCombatant);
      engine.startBattle();

      let turnCount = 0;
      const maxTurns = 1000;

      while (engine.getState()?.phase === "fighting" && turnCount < maxTurns) {
        engine.executeAttack();
        turnCount++;
      }

      const battleRecord = engine.getLastBattleRecord();
      engine.clearSubscriptions();

      return battleRecord;
    }, [challenger, opponent]);

  /**
   * Handle auto-battle toggle with compute-then-replay mode
   */
  const handleToggleAutoBattle = useCallback(async () => {
    const currentPhase = useBattleStore.getState().phase;

    if (currentPhase !== BATTLE_PHASES.FIGHTING) return;

    if (isReplayMode) {
      setIsReplayMode(false);
      setReplayBattleRecord(null);
      return;
    }

    setIsComputingBattle(true);

    try {
      const battleRecord = await computeEntireBattle();

      if (battleRecord) {
        setReplayBattleRecord(battleRecord);
        setIsReplayMode(true);
      }
    } catch (error) {
      console.error("Failed to compute battle:", error);
    } finally {
      setIsComputingBattle(false);
    }
  }, [computeEntireBattle, isReplayMode]);

  /**
   * Handle replay completion - sync store state with replay result
   */
  const handleReplayComplete = useCallback(() => {
    if (!replayBattleRecord) return;

    resetBattle();
    navigate(`/history/${replayBattleRecord.id}`);
  }, [replayBattleRecord, resetBattle, navigate]);

  /**
   * Handle attack action with animations
   */
  const handleAttack = useCallback(() => {
    const currentPhase = useBattleStore.getState().phase;
    const attacker = useBattleStore.getState().currentAttacker;

    if (currentPhase !== BATTLE_PHASES.FIGHTING) return;

    const attackerPosition: CardPosition =
      attacker === "challenger" ? "left" : "right";
    const defenderPosition: CardPosition =
      attacker === "challenger" ? "right" : "left";

    setAnimationState((prev) => ({
      attackingPosition: attackerPosition,
      receivingDamagePosition: null,
      damageNumber: null,
      healNumber: null,
      animationKey: prev.animationKey,
    }));

    setTimeout(() => {
      const result: AttackResult | null = executeAttack();

      if (result) {
        const lifestealHeal = result.lifestealHeal ?? 0;

        setAnimationState((prev) => ({
          attackingPosition: null,
          receivingDamagePosition: defenderPosition,
          damageNumber: {
            damage: result.damage,
            isCritical: result.isCritical,
            position: defenderPosition,
          },
          healNumber:
            lifestealHeal > 0
              ? {
                  healAmount: lifestealHeal,
                  position: attackerPosition,
                }
              : null,
          animationKey: prev.animationKey + 1,
        }));

        setTimeout(() => {
          setAnimationState((prev) => ({
            ...initialAnimationState,
            animationKey: prev.animationKey,
          }));
        }, 800);
      } else {
        setAnimationState((prev) => ({
          ...initialAnimationState,
          animationKey: prev.animationKey,
        }));
      }
    }, 200);
  }, [executeAttack]);

  /**
   * Handle new battle - reset and navigate to setup
   */
  const handleNewBattle = useCallback(() => {
    resetBattle();
    clearActiveBet();
    betResolvedRef.current = false;
    setBetResult(null);
    setShowBetResult(false);
    navigate("/bet-battle");
  }, [resetBattle, clearActiveBet, navigate]);

  /**
   * Handle bet result overlay dismiss
   */
  const handleBetResultDismiss = useCallback(() => {
    setShowBetResult(false);
  }, []);

  const handleDamageAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      damageNumber: null,
    }));
  }, []);

  const handleHealAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      healNumber: null,
    }));
  }, []);

  // Redirect to setup if no cards selected
  useEffect(() => {
    if (!challenger || !opponent) {
      navigate("/bet-battle");
    }
  }, [challenger, opponent, navigate]);

  // Entrance animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntranceComplete(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-battle timer logic
  useEffect(() => {
    if (autoBattleIntervalRef.current) {
      clearInterval(autoBattleIntervalRef.current);
      autoBattleIntervalRef.current = null;
    }

    if (isReplayMode) return;

    if (isAutoBattle && phase === BATTLE_PHASES.FIGHTING) {
      autoBattleIntervalRef.current = setInterval(() => {
        handleAttack();
      }, AUTO_BATTLE_DELAY);
    }

    return () => {
      if (autoBattleIntervalRef.current) {
        clearInterval(autoBattleIntervalRef.current);
        autoBattleIntervalRef.current = null;
      }
    };
  }, [isAutoBattle, phase, handleAttack, isReplayMode]);

  if (!challenger || !opponent) {
    return null;
  }

  // Get selected card name for display
  const selectedCard =
    activeBet?.selectedCardId === challenger.id ? challenger : opponent;

  // Render replay mode
  if (isReplayMode && replayBattleRecord) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50" />

        <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleNewBattle}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Exit Battle
            </Button>
            <h1 className="text-2xl font-bold text-white">Battle Replay</h1>
            <div className="w-24" />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <BattleReplayPlayer
              battleRecord={replayBattleRecord}
              onComplete={handleReplayComplete}
              className="w-full max-w-4xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Battle Arena Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50" />

      {/* Computing Battle Overlay */}
      {isComputingBattle && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl font-bold animate-pulse">
            Computing battle...
          </div>
        </div>
      )}

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

          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Bet Battle Arena</h1>
            {/* Gold Balance Display */}
            <GoldBalanceDisplay size="md" />
          </div>

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

        {/* Active Bet Info - Requirements: 2.5 */}
        {activeBet && (
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-4 py-2 flex items-center gap-3">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-white">
                Bet on{" "}
                <span className="font-bold text-yellow-400">
                  {selectedCard?.name}
                </span>
              </span>
              <span className="text-yellow-400 font-bold">
                {activeBet.betAmount.toLocaleString()} gold
              </span>
            </div>
          </div>
        )}

        {/* Battle Area */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center justify-center gap-8 md:gap-16 lg:gap-24",
              "transition-all duration-700",
              entranceComplete ? "opacity-100 scale-100" : "opacity-0 scale-90",
            )}
          >
            {/* Challenger Card (Left) */}
            <div
              className={cn(
                "transform transition-all duration-600",
                entranceComplete
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-20 opacity-0",
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
                isDanger={challengerInDanger}
                isWinner={isBattleFinished && winner?.id === challenger.id}
                isLoser={isBattleFinished && loser?.id === challenger.id}
                damageDisplay={
                  animationState.damageNumber?.position === "left"
                    ? {
                        damage: animationState.damageNumber.damage,
                        isCritical: animationState.damageNumber.isCritical,
                      }
                    : null
                }
                healDisplay={
                  animationState.healNumber?.position === "left"
                    ? { healAmount: animationState.healNumber.healAmount }
                    : null
                }
                animationKey={animationState.animationKey}
                onDamageAnimationEnd={handleDamageAnimationEnd}
                onHealAnimationEnd={handleHealAnimationEnd}
              />
            </div>

            {/* VS Indicator */}
            <div
              className={cn(
                "flex flex-col items-center transition-all duration-500",
                entranceComplete
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-50",
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
                "transform transition-all duration-600",
                entranceComplete
                  ? "translate-x-0 opacity-100"
                  : "translate-x-20 opacity-0",
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
                isDanger={opponentInDanger}
                isWinner={isBattleFinished && winner?.id === opponent.id}
                isLoser={isBattleFinished && loser?.id === opponent.id}
                damageDisplay={
                  animationState.damageNumber?.position === "right"
                    ? {
                        damage: animationState.damageNumber.damage,
                        isCritical: animationState.damageNumber.isCritical,
                      }
                    : null
                }
                healDisplay={
                  animationState.healNumber?.position === "right"
                    ? { healAmount: animationState.healNumber.healAmount }
                    : null
                }
                animationKey={animationState.animationKey}
                onDamageAnimationEnd={handleDamageAnimationEnd}
                onHealAnimationEnd={handleHealAnimationEnd}
              />
            </div>
          </div>
        </div>

        {/* Battle Controls */}
        <div
          className={cn(
            "flex justify-center mb-8 transition-all duration-500",
            entranceComplete
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10",
          )}
          style={{ transitionDelay: "400ms" }}
        >
          <BattleControls
            phase={phase}
            isAutoBattle={isAutoBattle || isReplayMode}
            onAttack={handleAttack}
            onToggleAuto={handleToggleAutoBattle}
            onNewBattle={handleNewBattle}
          />
        </div>
      </div>

      {/* Collapsible Battle Log Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-card/95 backdrop-blur-sm border-l shadow-xl",
          "transform transition-transform duration-300 z-20",
          isLogOpen ? "translate-x-0" : "translate-x-full",
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

      {/* Bet Result Overlay - Requirements: 3.4 */}
      <BetResultOverlay
        betResult={betResult}
        isVisible={showBetResult}
        onDismiss={handleBetResultDismiss}
      />
    </div>
  );
}

export default BetBattleArenaPage;
