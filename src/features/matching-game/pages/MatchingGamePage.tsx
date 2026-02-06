/**
 * MatchingGamePage - Main game page for players
 * Supports loading a specific game template by ID
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchingBoard } from "../components/MatchingBoard";
import { GameStats } from "../components/GameStats";
import { GameResultModal } from "../components/GameResultModal";
import { useMatchingGameStore } from "../store/matchingGameStore";
import { useSentences } from "../hooks/useSentences";
import { useGameTemplate } from "../hooks/useGameTemplates";
import type { GameResult, Sentence } from "../types";

type SentenceType = Sentence;

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random sentences from array
 */
function getRandomSentences(
  sentences: SentenceType[],
  count: number,
): SentenceType[] {
  const shuffled = shuffleArray(sentences);
  return shuffled.slice(0, count);
}

export function MatchingGamePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Load game template
  const { data: template, isLoading: isLoadingTemplate } =
    useGameTemplate(templateId);

  // Load sentences for this template
  const { data: allSentences = [], isLoading: isLoadingSentences } =
    useSentences(templateId ? { gameTemplateId: templateId } : undefined);

  const {
    session,
    elapsedTime,
    startGame,
    selectCard,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
  } = useMatchingGameStore();

  // Auto-show result when game completes
  useEffect(() => {
    if (session?.status === "completed" && !showResult) {
      const timeoutId = setTimeout(() => {
        const result = endGame();
        if (result) {
          setGameResult(result);
          setShowResult(true);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [session?.status, showResult, endGame]);

  const handleStartGame = () => {
    if (!template || allSentences.length === 0) return;

    const pairsCount = Math.min(
      template.config.pairsPerRound,
      allSentences.length,
    );
    const selectedSentences = getRandomSentences(allSentences, pairsCount);
    startGame(selectedSentences, { pairsPerRound: pairsCount });
  };

  const handlePlayAgain = () => {
    if (!template) return;

    setShowResult(false);
    setGameResult(null);
    resetGame();

    const pairsCount = Math.min(
      template.config.pairsPerRound,
      allSentences.length,
    );
    const selectedSentences = getRandomSentences(allSentences, pairsCount);
    startGame(selectedSentences, { pairsPerRound: pairsCount });
  };

  const handleGoBack = () => {
    resetGame();
    navigate("/matching-game");
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  // Loading state
  if (isLoadingTemplate || isLoadingSentences) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        Đang tải game...
      </div>
    );
  }

  // Template not found
  if (!template) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground mb-4">Game không tồn tại</p>
        <Button onClick={() => navigate("/matching-game")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Not enough sentences
  if (allSentences.length < 2) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground mb-4">
          Game này chưa có đủ câu hỏi ({allSentences.length} câu)
        </p>
        <Button onClick={() => navigate("/matching-game")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const wrongAttempts =
    session?.attempts.filter((a) => !a.isCorrect).length ?? 0;
  const isPlaying = session?.status === "playing";
  const isPaused = session?.status === "paused";

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            {template.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            {template.description ||
              "Ghép câu tiếng Anh với bản dịch tiếng Việt"}
          </p>
        </div>
      </motion.div>

      {/* Game not started - Show start button */}
      {!session && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto space-y-6"
        >
          <div className="p-6 bg-card rounded-xl border space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg">🎮 Sẵn sàng chơi?</p>
              <p className="text-sm text-muted-foreground">
                Ghép{" "}
                {Math.min(template.config.pairsPerRound, allSentences.length)}{" "}
                cặp câu • Thời gian: {template.config.timeLimit}s
              </p>
            </div>

            <Button size="lg" className="w-full" onClick={handleStartGame}>
              <Play className="w-5 h-5 mr-2" />
              Bắt đầu
            </Button>
          </div>
        </motion.div>
      )}

      {/* Game in progress */}
      {session && (
        <div className="space-y-6">
          {/* Stats */}
          <GameStats
            elapsedTime={elapsedTime}
            matchedPairs={session.matchedPairs}
            totalPairs={session.totalPairs}
            wrongAttempts={wrongAttempts}
          />

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {isPlaying && (
              <Button variant="outline" onClick={pauseGame}>
                <Pause className="w-4 h-4 mr-2" />
                Tạm dừng
              </Button>
            )}
            {isPaused && (
              <Button onClick={resumeGame}>
                <Play className="w-4 h-4 mr-2" />
                Tiếp tục
              </Button>
            )}
            <Button variant="outline" onClick={handlePlayAgain}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Chơi lại
            </Button>
          </div>

          {/* Game board */}
          <MatchingBoard
            cards={session.cards}
            onCardClick={selectCard}
            disabled={!isPlaying}
          />
        </div>
      )}

      {/* Result modal */}
      <GameResultModal
        result={gameResult}
        isOpen={showResult}
        onClose={handleCloseResult}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoBack}
      />
    </div>
  );
}
