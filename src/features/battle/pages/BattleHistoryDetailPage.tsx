/**
 * BattleHistoryDetailPage Component
 *
 * Displays detailed battle information including combatant cards,
 * final result summary, turn-by-turn timeline, and link to replay.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Clock,
  Hash,
  Loader2,
  Swords,
  Shield,
  Zap,
  Heart,
  Target,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBattleDetail } from "../hooks/useBattleDetail";
import { TurnTimeline } from "../components/TurnTimeline";
import { formatBattleDate, formatBattleDuration } from "../utils/formatters";
import type { CombatantSnapshot } from "../types/battleHistoryTypes";

/**
 * Combatant card display for battle detail
 * Shows full stats at battle start
 *
 * Requirements: 4.1
 */
function CombatantCard({
  combatant,
  isWinner,
  position,
}: {
  combatant: CombatantSnapshot;
  isWinner: boolean;
  position: "challenger" | "opponent";
}) {
  return (
    <Card className={`relative ${isWinner ? "ring-2 ring-amber-400" : ""}`}>
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-amber-500 text-white">
            <Trophy className="h-3 w-3 mr-1" />
            Winner
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <CardDescription className="capitalize">{position}</CardDescription>
        <CardTitle className="text-xl">{combatant.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Card Image */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
          {combatant.imageUrl ? (
            <img
              src={combatant.imageUrl}
              alt={combatant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Swords className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* HP */}
          <div className="flex items-center gap-2 col-span-2 p-2 rounded bg-red-50">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">HP:</span>
            <span className="font-bold text-red-600">{combatant.maxHp}</span>
          </div>

          {/* Core Stats */}
          <div className="flex items-center gap-2 p-2 rounded bg-orange-50">
            <Swords className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">ATK:</span>
            <span className="font-bold text-orange-600">{combatant.atk}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-blue-50">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">DEF:</span>
            <span className="font-bold text-blue-600">{combatant.def}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-green-50">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">SPD:</span>
            <span className="font-bold text-green-600">{combatant.spd}</span>
          </div>

          {/* Combat Stats */}
          <div className="flex items-center gap-2 p-2 rounded bg-amber-50">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Crit:</span>
            <span className="font-bold text-amber-600">
              {combatant.critChance}%
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-purple-50">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">Crit DMG:</span>
            <span className="font-bold text-purple-600">
              {combatant.critDamage}%
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
            <Shield className="h-4 w-4 text-slate-500" />
            <span className="text-muted-foreground">Armor Pen:</span>
            <span className="font-bold text-slate-600">
              {combatant.armorPen}%
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-pink-50">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-muted-foreground">Lifesteal:</span>
            <span className="font-bold text-pink-600">
              {combatant.lifesteal}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Battle result summary card
 *
 * Requirements: 4.4
 */
function BattleResultSummary({
  winnerName,
  totalTurns,
  durationMs,
  startedAt,
}: {
  winnerName: string;
  totalTurns: number;
  durationMs: number;
  startedAt: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Battle Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-amber-50">
            <div className="text-sm text-muted-foreground">Winner</div>
            <div className="font-bold text-amber-600">{winnerName}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Hash className="h-3 w-3" />
              Total Turns
            </div>
            <div className="font-bold">{totalTurns}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <div className="font-bold">{formatBattleDuration(durationMs)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-bold text-sm">
              {formatBattleDate(startedAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link to="/history">Back to History</Link>
      </Button>
    </div>
  );
}

/**
 * Not found state component
 */
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Swords className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Battle not found</h3>
      <p className="text-muted-foreground mt-1">
        This battle record doesn't exist or has been deleted.
      </p>
      <Button asChild className="mt-4">
        <Link to="/history">Back to History</Link>
      </Button>
    </div>
  );
}

/**
 * BattleHistoryDetailPage
 *
 * Main page component for displaying battle detail.
 * - Displays both combatant cards with battle-start stats
 * - Shows final result summary (winner, turns, duration)
 * - Displays turn-by-turn timeline with damage breakdown
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function BattleHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: battle, isLoading, isError, error } = useBattleDetail(id);

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Battle Detail"
      backTo="/history"
      headerRight={
        battle ? (
          <Button asChild size="lg" className="gap-2">
            <Link to={`/history/${id}/replay`}>
              <Play className="h-5 w-5" />
              Watch Replay
            </Link>
          </Button>
        ) : undefined
      }
    >
      {/* Content */}
      {isLoading && <LoadingState />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load battle"
          }
        />
      )}

      {!isLoading && !isError && !battle && <NotFoundState />}

      {!isLoading && !isError && battle && (
        <div className="flex flex-col gap-6">
          {/* Battle Result Summary - Requirements: 4.4 */}
          <BattleResultSummary
            winnerName={battle.winnerName}
            totalTurns={battle.totalTurns}
            durationMs={battle.battleDurationMs}
            startedAt={battle.startedAt}
          />

          {/* Combatant Cards - Requirements: 4.1 */}
          <div className="grid md:grid-cols-2 gap-6">
            <CombatantCard
              combatant={battle.challenger}
              isWinner={battle.winnerId === battle.challenger.id}
              position="challenger"
            />
            <CombatantCard
              combatant={battle.opponent}
              isWinner={battle.winnerId === battle.opponent.id}
              position="opponent"
            />
          </div>

          <Separator />

          {/* Turn Timeline - Requirements: 4.2, 4.3, 4.5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Turn-by-Turn Timeline
              </CardTitle>
              <CardDescription>
                Detailed breakdown of each turn in the battle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TurnTimeline
                turns={battle.turns}
                challengerId={battle.challenger.id}
                opponentId={battle.opponent.id}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
