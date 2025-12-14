/**
 * TurnTimeline Component
 *
 * Displays turn-by-turn list with damage breakdown, crit indicators,
 * lifesteal heals, and HP changes.
 *
 * Requirements: 4.2, 4.3, 4.5
 */

import { cn } from "@/lib/utils";
import { Zap, Heart, Swords, Skull } from "lucide-react";
import type { TurnRecord } from "../types/battleHistoryTypes";

export interface TurnTimelineProps {
  turns: TurnRecord[];
  challengerId: string;
  opponentId: string;
}

/**
 * Single turn entry in the timeline
 */
function TurnEntry({
  turn,
  isChallenger,
}: {
  turn: TurnRecord;
  isChallenger: boolean;
}) {
  const { damage, lifesteal, defenderHp } = turn;
  const hasCrit = damage.isCrit;
  const hasLifesteal = lifesteal.lifestealAmount > 0;
  const isKnockout = defenderHp.isKnockout;

  return (
    <div
      className={cn(
        "relative flex gap-4 pb-6",
        // Timeline line
        "before:absolute before:left-[19px] before:top-10 before:h-full before:w-0.5",
        "before:bg-border last:before:hidden"
      )}
    >
      {/* Turn number indicator */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
          isChallenger
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-red-500 bg-red-50 text-red-700"
        )}
      >
        {turn.turnNumber}
      </div>

      {/* Turn content */}
      <div className="flex-1 space-y-2 pt-1">
        {/* Attacker info */}
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{turn.attackerName}</span>
          <span className="text-muted-foreground">attacks</span>
          <span className="font-semibold">{turn.defenderName}</span>
        </div>

        {/* Damage breakdown card */}
        <div
          className={cn(
            "rounded-lg border p-3 space-y-2",
            hasCrit && "border-amber-300 bg-amber-50/50",
            isKnockout && "border-red-300 bg-red-50/50"
          )}
        >
          {/* Main damage line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-xl font-bold",
                hasCrit ? "text-amber-600" : "text-foreground"
              )}
            >
              {damage.finalDamage}
            </span>
            <span className="text-muted-foreground">damage</span>

            {/* Crit indicator - Requirements: 4.5 */}
            {hasCrit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Zap className="h-3 w-3" />
                CRIT! x{damage.critMultiplier.toFixed(1)}
              </span>
            )}

            {/* Knockout indicator */}
            {isKnockout && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                <Skull className="h-3 w-3" />
                KO!
              </span>
            )}
          </div>

          {/* Damage breakdown details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div>Base: {damage.baseDamage}</div>
            <div>
              DEF: {damage.defenderOriginalDef} → {damage.effectiveDefense}
            </div>
            {hasCrit && (
              <div className="text-amber-600">
                Crit bonus: +{damage.critBonus}
              </div>
            )}
            {damage.armorPenPercent > 0 && (
              <div>Armor Pen: {damage.armorPenPercent}%</div>
            )}
          </div>

          {/* HP change */}
          <div className="flex items-center gap-2 text-sm border-t pt-2">
            <span className="text-muted-foreground">
              {turn.defenderName} HP:
            </span>
            <span className="font-medium">
              {defenderHp.defenderHpBefore} → {defenderHp.defenderHpAfter}
            </span>
            <span className="text-red-500">
              (-{defenderHp.defenderHpBefore - defenderHp.defenderHpAfter})
            </span>
          </div>

          {/* Lifesteal indicator - Requirements: 4.5 */}
          {hasLifesteal && (
            <div className="flex items-center gap-2 text-sm border-t pt-2">
              <Heart className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                +{lifesteal.lifestealAmount} HP
              </span>
              <span className="text-muted-foreground">
                (Lifesteal {lifesteal.attackerLifestealPercent}%)
              </span>
              <span className="text-muted-foreground ml-auto">
                {turn.attackerName}: {lifesteal.attackerHpBefore} →{" "}
                {lifesteal.attackerHpAfter}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TurnTimeline Component
 *
 * Displays turn-by-turn timeline with full damage breakdown.
 * - Shows turn number, attacker, defender
 * - Displays damage breakdown: base, crit, armor pen, effective def
 * - Highlights critical hits with visual indicator
 * - Shows lifesteal heals with visual indicator
 * - Displays HP changes for defender
 *
 * Requirements: 4.2, 4.3, 4.5
 */
export function TurnTimeline({ turns, challengerId }: TurnTimelineProps) {
  if (turns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No turns recorded
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {turns.map((turn) => (
        <TurnEntry
          key={turn.turnNumber}
          turn={turn}
          isChallenger={turn.attackerId === challengerId}
        />
      ))}
    </div>
  );
}

export default TurnTimeline;
