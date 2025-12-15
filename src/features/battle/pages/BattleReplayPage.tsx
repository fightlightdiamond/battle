/**
 * BattleReplayPage Component
 *
 * Dedicated page for replaying a battle with full animations.
 * Shows the battle replay player with controls and visual effects.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useParams, Link } from "react-router-dom";
import { Loader2, Swords, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import { Card, CardContent } from "@/components/ui/card";
import { useBattleDetail } from "../hooks/useBattleDetail";
import { BattleReplayPlayer } from "../components/BattleReplayPlayer";

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading battle data...</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Swords className="h-12 w-12 text-destructive mb-4" />
      <p className="text-destructive font-medium">{message}</p>
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
    <div className="flex flex-col items-center justify-center py-24 text-center">
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
 * BattleReplayPage
 *
 * Main page component for battle replay.
 * - Full-screen replay experience
 * - Animated damage numbers and HP bars
 * - Playback controls (play/pause, speed, progress)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function BattleReplayPage() {
  const { id } = useParams<{ id: string }>();
  const { data: battle, isLoading, isError, error } = useBattleDetail(id);

  const handleReplayComplete = () => {
    // Optional: could show a modal or auto-navigate
    console.log("Replay complete!");
  };

  return (
    <AppLayout
      variant="game"
      width="full"
      title="Battle Replay"
      backTo={`/history/${id}`}
      backLabel="Details"
      headerRight={
        battle ? (
          <Button variant="outline" asChild>
            <Link to={`/history/${id}`}>
              <Info className="h-4 w-4 mr-2" />
              View Details
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
        <Card className="border-2">
          <CardContent className="p-6 md:p-8">
            <BattleReplayPlayer
              battleRecord={battle}
              onComplete={handleReplayComplete}
            />
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}

export default BattleReplayPage;
