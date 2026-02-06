/**
 * EnhanceGlowEffect Component
 *
 * Animated light trail running around border using Framer Motion
 * Tier 1 (Green), Tier 2 (Blue/Cyan), Tier 3 (Purple/Gold Legendary)
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhanceGlowEffectProps {
  enhanceLevel: number;
  className?: string;
}

// Color configurations for each tier
const tierColors = {
  tier1: {
    primary: "#22c55e",
    glow: "rgba(34, 197, 94, 0.8)",
    trail: "rgba(34, 197, 94, 0)",
    shadow: "0 0 20px #22c55e, 0 0 40px rgba(34, 197, 94, 0.5)",
    duration: 3,
    trailSize: 60, // degrees
  },
  tier2: {
    primary: "#00ffff",
    glow: "rgba(0, 255, 255, 0.9)",
    trail: "rgba(59, 130, 246, 0)",
    shadow:
      "0 0 25px #00ffff, 0 0 50px rgba(0, 255, 255, 0.6), 0 0 75px rgba(59, 130, 246, 0.4)",
    duration: 2,
    trailSize: 90,
  },
  tier3: {
    primary: "#ff00ff",
    secondary: "#fbbf24",
    glow: "rgba(255, 0, 255, 0.9)",
    trail: "rgba(168, 85, 247, 0)",
    shadow:
      "0 0 30px #ff00ff, 0 0 60px rgba(255, 0, 255, 0.7), 0 0 90px rgba(255, 107, 0, 0.5), 0 0 120px rgba(251, 191, 36, 0.4)",
    duration: 1.5,
    trailSize: 120,
  },
};

function getTier(level: number): keyof typeof tierColors | null {
  if (level <= 0) return null;
  if (level <= 5) return "tier1";
  if (level <= 10) return "tier2";
  return "tier3";
}

export function EnhanceGlowEffect({
  enhanceLevel,
  className,
}: EnhanceGlowEffectProps) {
  const tier = getTier(enhanceLevel);

  if (!tier) return null;

  const config = tierColors[tier];
  const borderWidth = tier === "tier3" ? 5 : tier === "tier2" ? 4 : 3;
  // Offset to position effects OUTSIDE the card (negative = expand outward)
  const offset = tier === "tier3" ? 8 : tier === "tier2" ? 6 : 5;

  return (
    <>
      {/* 
        All effects use absolute positioning relative to parent wrapper.
        inset with negative values expands OUTSIDE the card boundaries.
        These are siblings to Card, rendered AFTER Card in DOM = on top visually,
        but we use pointer-events-none so clicks pass through to Card.
      */}

      {/* Glow shadow layer - outermost, creates the ambient glow */}
      <motion.div
        className={cn("absolute rounded-xl pointer-events-none", className)}
        style={{
          top: `-${offset + 4}px`,
          left: `-${offset + 4}px`,
          right: `-${offset + 4}px`,
          bottom: `-${offset + 4}px`,
          boxShadow: config.shadow,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Running light trail - animated border around card */}
      <motion.div
        className={cn("absolute rounded-xl pointer-events-none", className)}
        style={{
          top: `-${offset}px`,
          left: `-${offset}px`,
          right: `-${offset}px`,
          bottom: `-${offset}px`,
          padding: borderWidth,
          background: `conic-gradient(
            from var(--angle, 0deg),
            ${config.trail} 0deg,
            ${config.glow} ${config.trailSize / 2}deg,
            ${config.primary} ${config.trailSize}deg,
            ${config.glow} ${config.trailSize * 1.5}deg,
            ${config.trail} ${config.trailSize * 2}deg,
            transparent ${config.trailSize * 2}deg
          )`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        animate={
          {
            "--angle": ["0deg", "360deg"],
          } as Record<string, string[]>
        }
        transition={{
          duration: config.duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Second light trail for tier 3 (opposite direction) */}
      {tier === "tier3" && (
        <motion.div
          className={cn("absolute rounded-xl pointer-events-none", className)}
          style={{
            top: `-${offset}px`,
            left: `-${offset}px`,
            right: `-${offset}px`,
            bottom: `-${offset}px`,
            padding: borderWidth,
            background: `conic-gradient(
              from var(--angle2, 180deg),
              transparent 0deg,
              rgba(251, 191, 36, 0) 0deg,
              rgba(251, 191, 36, 0.9) 30deg,
              #fbbf24 60deg,
              rgba(251, 191, 36, 0.9) 90deg,
              rgba(251, 191, 36, 0) 120deg,
              transparent 120deg
            )`,
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          animate={
            {
              "--angle2": ["180deg", "-180deg"],
            } as Record<string, string[]>
          }
          transition={{
            duration: config.duration * 1.3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Sparkle particles for tier 2 and 3 - positioned OUTSIDE the card */}
      {(tier === "tier2" || tier === "tier3") && (
        <SparkleParticles tier={tier} offset={offset} />
      )}
    </>
  );
}

function SparkleParticles({
  tier,
  offset,
}: {
  tier: "tier2" | "tier3";
  offset: number;
}) {
  const particleCount = tier === "tier3" ? 8 : 4;
  const colors =
    tier === "tier3"
      ? ["#ff00ff", "#fbbf24", "#ff6b00", "#a855f7"]
      : ["#00ffff", "#3b82f6"];

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            background: colors[i % colors.length],
            boxShadow: `0 0 10px ${colors[i % colors.length]}, 0 0 20px ${colors[i % colors.length]}`,
            left: `${10 + (i * 80) / particleCount}%`,
            top: i % 2 === 0 ? `-${offset + 10}px` : "auto",
            bottom: i % 2 === 1 ? `-${offset + 10}px` : "auto",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: i % 2 === 0 ? [0, -15, -30] : [0, 15, 30],
          }}
          transition={{
            duration: tier === "tier3" ? 1.5 : 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}
