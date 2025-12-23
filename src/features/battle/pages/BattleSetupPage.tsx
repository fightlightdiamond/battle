/**
 * BattleSetupPage - Match setup page with step-by-step flow
 * Supports two modes:
 * - "battle": Practice battle - starts battle immediately
 * - "matchup": Create matchup - creates matchup for betting
 *
 * Steps:
 * - Step 1: Select Battle Mode (only for battle mode)
 * - Step 2: Select Challenger
 * - Step 3: Select Opponent & Start
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Swords,
  Loader2,
  History,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layouts";
import { CardSelector } from "../components/CardSelector";
import {
  BattleModeSelector,
  type BattleMode,
} from "../components/BattleModeSelector";
import { getBattleModeRoute } from "../components/battleModeConfig";
import { useBattleStore, selectCanStartBattle } from "../store/battleStore";
import { useCards } from "../../cards/hooks/useCards";
import { matchupService } from "../../matchup/services/matchupService";
import type { Card } from "../../cards/types";

export type BattleSetupMode = "battle" | "matchup";

interface BattleSetupPageProps {
  mode?: BattleSetupMode;
}

type SetupStep = "mode" | "challenger" | "opponent";

const BATTLE_STEPS: SetupStep[] = ["mode", "challenger", "opponent"];
const MATCHUP_STEPS: SetupStep[] = ["challenger", "opponent"];

/**
 * BattleSetupPage component with step-by-step flow
 */
export function BattleSetupPage({ mode = "battle" }: BattleSetupPageProps) {
  const navigate = useNavigate();
  const [isCreatingMatchup, setIsCreatingMatchup] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleMode>("classic");
  const [currentStep, setCurrentStep] = useState<SetupStep>(
    mode === "battle" ? "mode" : "challenger",
  );

  const steps = mode === "battle" ? BATTLE_STEPS : MATCHUP_STEPS;

  // Battle store state and actions
  const challenger = useBattleStore((state) => state.challenger);
  const opponent = useBattleStore((state) => state.opponent);
  const canStartBattle = useBattleStore(selectCanStartBattle);
  const selectChallenger = useBattleStore((state) => state.selectChallenger);
  const selectOpponent = useBattleStore((state) => state.selectOpponent);
  const setBattleModeInStore = useBattleStore((state) => state.setBattleMode);
  const startBattle = useBattleStore((state) => state.startBattle);
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Fetch all cards
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

  // Step navigation helpers
  const currentStepIndex = steps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const canGoNext = () => {
    if (currentStep === "mode") return true;
    if (currentStep === "challenger") return !!challenger;
    if (currentStep === "opponent") return !!opponent;
    return false;
  };

  const goToNextStep = () => {
    if (!isLastStep && canGoNext()) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  // Handle challenger selection
  const handleSelectChallenger = useCallback(
    async (card: Card): Promise<boolean> => {
      const result = await selectChallenger(card);
      if (result) {
        // Auto-advance to next step
        setTimeout(() => setCurrentStep("opponent"), 300);
      }
      return result;
    },
    [selectChallenger],
  );

  // Handle opponent selection
  const handleSelectOpponent = useCallback(
    async (card: Card): Promise<boolean> => {
      return selectOpponent(card);
    },
    [selectOpponent],
  );

  // Handle start battle
  const handleStartBattle = useCallback(() => {
    setBattleModeInStore(battleMode);
    startBattle();
    const route = getBattleModeRoute(battleMode);
    navigate(route);
  }, [setBattleModeInStore, startBattle, navigate, battleMode]);

  // Handle create matchup
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

      navigate(`/admin/matchups/${matchup.id}`);
    } catch (err) {
      toast.error("Failed to create matchup", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCreatingMatchup(false);
    }
  }, [challenger, opponent, navigate]);

  const handleAction =
    mode === "battle" ? handleStartBattle : handleCreateMatchup;

  // Step completion status
  const isStepComplete = (step: SetupStep) => {
    if (step === "mode") return true;
    if (step === "challenger") return !!challenger;
    if (step === "opponent") return !!opponent;
    return false;
  };

  // Mode-specific config
  const config = {
    battle: {
      title: "Battle Setup",
      backLink: "/cards",
      actionLabel: "Start Battle",
      actionIcon: <Swords className="h-5 w-5" />,
      showHistory: true,
    },
    matchup: {
      title: "Create Matchup",
      backLink: "/admin/matchups",
      actionLabel: isCreatingMatchup ? "Creating..." : "Create Matchup",
      actionIcon: isCreatingMatchup ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Trophy className="h-5 w-5" />
      ),
      showHistory: false,
    },
  };

  const currentConfig = config[mode];

  const stepLabels: Record<SetupStep, string> = {
    mode: "1. Battle Mode",
    challenger: mode === "battle" ? "2. Challenger" : "1. Card 1",
    opponent: mode === "battle" ? "3. Opponent" : "2. Card 2",
  };

  return (
    <AppLayout
      variant="menu"
      width="full"
      title={currentConfig.title}
      backTo={currentConfig.backLink}
      backLabel="Back"
      headerRight={
        currentConfig.showHistory ? (
          <Button asChild variant="outline">
            <Link to="/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="flex-1 flex flex-col">
        <Tabs
          value={currentStep}
          onValueChange={(v) => setCurrentStep(v as SetupStep)}
          className="flex-1 flex flex-col"
        >
          {/* Step Tabs */}
          <TabsList className="w-full max-w-2xl mx-auto mb-6">
            {steps.map((step) => (
              <TabsTrigger
                key={step}
                value={step}
                disabled={
                  step !== "mode" &&
                  step !== currentStep &&
                  !isStepComplete(steps[steps.indexOf(step) - 1] || steps[0])
                }
                className="flex-1 gap-2"
              >
                {isStepComplete(step) && step !== currentStep && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {stepLabels[step]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Step 1: Battle Mode (only for battle mode) */}
          {mode === "battle" && (
            <TabsContent value="mode" className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold mb-6">
                  Select Battle Mode
                </h2>
                <BattleModeSelector
                  selectedMode={battleMode}
                  onModeChange={setBattleMode}
                  className="w-full max-w-md"
                />
                <Button className="mt-8" size="lg" onClick={goToNextStep}>
                  Next: Select Challenger
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Step 2: Challenger Selection */}
          <TabsContent value="challenger" className="flex-1 flex flex-col">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {mode === "battle" ? "Select Challenger" : "Select Card 1"}
              </h2>
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
            <div className="flex justify-between mt-6 pb-4">
              {mode === "battle" && (
                <Button variant="outline" onClick={goToPrevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {mode === "matchup" && <div />}
              <Button onClick={goToNextStep} disabled={!challenger}>
                Next: Select {mode === "battle" ? "Opponent" : "Card 2"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Opponent Selection & Start */}
          <TabsContent value="opponent" className="flex-1 flex flex-col">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {mode === "battle" ? "Select Opponent" : "Select Card 2"}
              </h2>
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
            <div className="flex justify-between mt-6 pb-4">
              <Button variant="outline" onClick={goToPrevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleAction}
                disabled={!canStartBattle || isCreatingMatchup}
                className="gap-2"
              >
                {currentConfig.actionIcon}
                {currentConfig.actionLabel}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
