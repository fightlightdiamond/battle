/**
 * BattleArenaPage - Combat UI for the Card Battle System
 * Requirements: 2.1, 7.1, 7.4, 8.4, 6.6, 1.1, 1.4, 3.1, 3.2
 * - Layout: Card1 (left) vs Card2 (right)
 * - Entrance animation on load
 * - BattleControls at bottom
 * - BattleLog panel (collapsible sidebar)
 * - VictoryOverlay when battle ends
 * - Auto-battle: compute-then-replay mode (Requirement 6.6)
 * - Uses GameLayout for consistent header styling (Requirements 1.1, 1.4, 3.1, 3.2)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import {
  BattleCard,
  BattleControls,
  BattleLog,
  VictoryOverlay,
  BattleReplayPlayer,
} from "../components";
import {
  useBattleStore,
  selectIsBattleFinished,
  selectWinner,
  selectLoser,
  selectChallengerInDanger,
  selectOpponentInDanger,
} from "../store/battleStore";
import { BATTLE_PHASES } from "../types/battle";
import type {
  AttackResult,
  CardPosition,
  BattleCard as BattleCardType,
} from "../types";
import type { BattleRecord } from "../types/battleHistoryTypes";
import { BattleEngine } from "../engine/core/BattleEngine";
import type { Combatant, CombatantStats } from "../engine/core/types";

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
  /** Heal number for lifesteal display (Requirements 3.3) */
  healNumber: {
    healAmount: number;
    position: CardPosition;
  } | null;
  /** Key to force re-mount damage/heal animations */
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
 * Requirements: 6.6
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
  const challengerInDanger = useBattleStore(selectChallengerInDanger);
  const opponentInDanger = useBattleStore(selectOpponentInDanger);

  // Battle store actions
  const executeAttack = useBattleStore((state) => state.executeAttack);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Local UI state
  const [isLogOpen, setIsLogOpen] = useState(true);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );

  // Auto-battle replay state (Requirement 6.6)
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayBattleRecord, setReplayBattleRecord] =
    useState<BattleRecord | null>(null);
  const [isComputingBattle, setIsComputingBattle] = useState(false);

  // Ref for auto-battle interval
  const autoBattleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /**
   * Compute entire battle without animation and return BattleRecord
   * Requirements: 6.6 - Compute all turns first, save BattleRecord, then replay
   */
  const computeEntireBattle =
    useCallback(async (): Promise<BattleRecord | null> => {
      if (!challenger || !opponent) return null;

      // Create a new BattleEngine instance for computation
      const engine = new BattleEngine();

      // Convert BattleCards to Combatants
      const challengerCombatant = battleCardToCombatant(challenger);
      const opponentCombatant = battleCardToCombatant(opponent);

      // Initialize and start battle
      engine.initBattle(challengerCombatant, opponentCombatant);
      engine.startBattle();

      // Execute all attacks until battle ends (max 1000 turns for safety)
      let turnCount = 0;
      const maxTurns = 1000;

      while (engine.getState()?.phase === "fighting" && turnCount < maxTurns) {
        engine.executeAttack();
        turnCount++;
      }

      // Get the battle record
      const battleRecord = engine.getLastBattleRecord();

      // Clean up
      engine.clearSubscriptions();

      return battleRecord;
    }, [challenger, opponent]);

  /**
   * Handle auto-battle toggle with compute-then-replay mode
   * Requirements: 6.6
   */
  const handleToggleAutoBattle = useCallback(async () => {
    const currentPhase = useBattleStore.getState().phase;

    if (currentPhase !== BATTLE_PHASES.FIGHTING) return;

    // If already in replay mode, exit replay mode
    if (isReplayMode) {
      setIsReplayMode(false);
      setReplayBattleRecord(null);
      return;
    }

    // Start compute-then-replay mode
    setIsComputingBattle(true);

    try {
      const battleRecord = await computeEntireBattle();

      if (battleRecord) {
        // Enter replay mode with the computed battle record
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
   * Requirements: 6.6
   */
  const handleReplayComplete = useCallback(() => {
    if (!replayBattleRecord) return;

    // Reset battle store and navigate to history detail
    resetBattle();
    navigate(`/history/${replayBattleRecord.id}`);
  }, [replayBattleRecord, resetBattle, navigate]);

  /**
   * Handle attack action with animations
   * Updated to display HealNumber when lifesteal triggers (Requirements 3.3)
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
    setAnimationState((prev) => ({
      attackingPosition: attackerPosition,
      receivingDamagePosition: null,
      damageNumber: null,
      healNumber: null,
      animationKey: prev.animationKey,
    }));

    // Execute attack after brief delay for attack animation
    setTimeout(() => {
      const result: AttackResult | null = executeAttack();

      if (result) {
        // Show damage animation on defender
        // Also show heal number on attacker if lifesteal triggered (Requirements 3.3)
        const lifestealHeal = result.lifestealHeal ?? 0;

        setAnimationState((prev) => ({
          attackingPosition: null,
          receivingDamagePosition: defenderPosition,
          damageNumber: {
            damage: result.damage,
            isCritical: result.isCritical,
            position: defenderPosition,
          },
          // Show heal number on attacker if lifesteal healed any HP
          healNumber:
            lifestealHeal > 0
              ? {
                  healAmount: lifestealHeal,
                  position: attackerPosition,
                }
              : null,
          animationKey: prev.animationKey + 1,
        }));

        // Clear damage and heal animations after they complete
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

  /**
   * Handle heal number animation end (Requirements 3.3)
   */
  const handleHealAnimationEnd = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      healNumber: null,
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
   * - Disabled when in replay mode (Requirement 6.6)
   */
  useEffect(() => {
    // Clear any existing interval
    if (autoBattleIntervalRef.current) {
      clearInterval(autoBattleIntervalRef.current);
      autoBattleIntervalRef.current = null;
    }

    // Don't run auto-battle when in replay mode
    if (isReplayMode) return;

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
  }, [isAutoBattle, phase, handleAttack, isReplayMode]);

  // Don't render if no cards (will redirect)
  if (!challenger || !opponent) {
    return null;
  }

  /** Battle log toggle button for headerRight prop */
  const battleLogToggle = (
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
  );

  // Render replay mode (Requirement 6.6)
  if (isReplayMode && replayBattleRecord) {
    return (
      <AppLayout
        variant="game"
        width="full"
        title="Battle Replay"
        backTo="/battle/setup"
        backLabel="Exit Battle"
      >
        {/* Replay Player */}
        <div className="flex-1 flex items-center justify-center">
          <BattleReplayPlayer
            battleRecord={replayBattleRecord}
            onComplete={handleReplayComplete}
            className="w-full max-w-4xl"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      variant="game"
      width="full"
      title="Battle Arena"
      backTo="/battle/setup"
      backLabel="Exit Battle"
      headerRight={battleLogToggle}
    >
      {/* Computing Battle Overlay (Requirement 6.6) */}
      {isComputingBattle && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl font-bold animate-pulse">
            Computing battle...
          </div>
        </div>
      )}

      {/* Battle Area */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center gap-8 md:gap-16 lg:gap-24",
            "transition-all duration-700",
            entranceComplete ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          {/* Challenger Card (Left) - with integrated damage/heal display */}
          <div
            className={cn(
              "transform transition-all duration-600",
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
              entranceComplete ? "opacity-100 scale-100" : "opacity-0 scale-50"
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

          {/* Opponent Card (Right) - with integrated damage/heal display */}
          <div
            className={cn(
              "transform transition-all duration-600",
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
            : "opacity-0 translate-y-10"
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
    </AppLayout>
  );
}

export default BattleArenaPage;
