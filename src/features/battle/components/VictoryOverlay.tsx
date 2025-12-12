/**
 * VictoryOverlay Component - Displays victory celebration effects
 * Requirements: 5.2, 5.3, 8.5
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BattleCard } from "../types";

export interface VictoryOverlayProps {
  winner: BattleCard;
  loser: BattleCard;
  onNewBattle: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  isCircle: boolean;
}

const CONFETTI_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i + Math.random() * 1000,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 2,
    velocityY: 2 + Math.random() * 3,
    isCircle: Math.random() > 0.5,
  }));
}

export function VictoryOverlay({
  winner,
  loser,
  onNewBattle,
}: VictoryOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>(() =>
    createParticles(50)
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            rotation: p.rotation + 5,
          }))
          .filter((p) => p.y < 120)
      );
    }, 50);

    const regenerateInterval = setInterval(() => {
      setParticles((prev) =>
        prev.length < 30 ? [...prev, ...createParticles(20)] : prev
      );
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(regenerateInterval);
    };
  }, []);

  return (
    <div
      className={cn(
        "victory-overlay",
        isVisible ? "victory-overlay--visible" : "victory-overlay--hidden"
      )}
      data-testid="victory-overlay"
    >
      {/* Confetti */}
      <div className="victory-confetti-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              borderRadius: p.isCircle ? "50%" : "0",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className={cn(
          "victory-content",
          isVisible ? "victory-content--visible" : "victory-content--hidden"
        )}
      >
        <h1 className="victory-title animate-victory-title">VICTORY!</h1>

        <div className="victory-cards-container">
          {/* Winner */}
          <div
            className={cn(
              "victory-card-wrapper victory-card-wrapper--winner",
              isVisible
                ? "victory-card-wrapper--visible"
                : "victory-card-wrapper--hidden"
            )}
          >
            <div className="victory-glow animate-winner-glow-pulse" />
            <div className="victory-winner-card">
              <div className="victory-badge victory-badge--winner animate-bounce-subtle">
                🏆 VICTORY
              </div>
              <div className="victory-card-image victory-card-image--winner">
                {winner.imageUrl ? (
                  <img
                    src={winner.imageUrl}
                    alt={winner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="victory-card-image-placeholder victory-card-image-placeholder--winner">
                    <WinnerIcon />
                  </div>
                )}
              </div>
              <h2 className="victory-card-name--winner">{winner.name}</h2>
              <div className="victory-card-stats--winner">
                <span>ATK: {winner.atk}</span>
                <span>
                  HP: {winner.currentHp}/{winner.maxHp}
                </span>
              </div>
            </div>
          </div>

          <div className="victory-vs-divider">VS</div>

          {/* Loser */}
          <div
            className={cn(
              "victory-card-wrapper victory-card-wrapper--loser",
              isVisible
                ? "victory-card-wrapper--visible"
                : "victory-card-wrapper--hidden"
            )}
          >
            <div className="victory-loser-card">
              <div className="victory-badge victory-badge--loser">
                💀 DEFEATED
              </div>
              <div className="victory-card-image victory-card-image--loser">
                {loser.imageUrl ? (
                  <img
                    src={loser.imageUrl}
                    alt={loser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="victory-card-image-placeholder victory-card-image-placeholder--loser">
                    <LoserIcon />
                  </div>
                )}
              </div>
              <h2 className="victory-card-name--loser">{loser.name}</h2>
              <div className="victory-card-stats--loser">
                <span>ATK: {loser.atk}</span>
                <span className="text-red-400">HP: 0/{loser.maxHp}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onNewBattle}
          size="lg"
          className={cn(
            "victory-new-battle-btn",
            isVisible
              ? "victory-new-battle-btn--visible"
              : "victory-new-battle-btn--hidden"
          )}
          style={{ transitionDelay: "400ms" }}
        >
          ⚔️ New Battle
        </Button>
      </div>
    </div>
  );
}

function WinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-16 text-yellow-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function LoserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default VictoryOverlay;
