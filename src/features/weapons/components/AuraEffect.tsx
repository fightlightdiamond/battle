/**
 * AuraEffect Component
 *
 * Ultra Instinct style aura effect - energy radiating from card
 * with particles rising up like Goku's transformation
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

interface AuraEffectProps {
  enhanceLevel: number;
}

// Tier configurations - inspired by Dragon Ball transformations
const tierConfig = {
  tier1: {
    // Green aura - like Broly's controlled power
    colors: ["#22c55e", "#4ade80", "#86efac"],
    glowColor: "rgba(34, 197, 94, 0.6)",
    particleCount: 8,
    intensity: 0.6,
  },
  tier2: {
    // Blue aura - like Super Saiyan Blue
    colors: ["#00ffff", "#3b82f6", "#60a5fa"],
    glowColor: "rgba(0, 255, 255, 0.7)",
    particleCount: 15,
    intensity: 0.8,
  },
  tier3: {
    // Silver/Purple aura - Ultra Instinct
    colors: ["#c0c0c0", "#e879f9", "#f0abfc", "#fef3c7"],
    glowColor: "rgba(192, 192, 192, 0.8)",
    particleCount: 25,
    intensity: 1,
  },
};

function getTier(level: number): keyof typeof tierConfig | null {
  if (level <= 0) return null;
  if (level <= 5) return "tier1";
  if (level <= 10) return "tier2";
  return "tier3";
}

export function AuraEffect({ enhanceLevel }: AuraEffectProps) {
  const tier = getTier(enhanceLevel);

  if (!tier) return null;

  const config = tierConfig[tier];

  return (
    <>
      {/* Main aura glow - pulsing energy field */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${config.glowColor} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: tier === "tier3" ? 0.8 : tier === "tier2" ? 1.2 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer glow ring - expanding energy waves */}
      <motion.div
        className="absolute rounded-xl pointer-events-none"
        style={{
          inset: "-15px",
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, ${config.colors[0]}40 60%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.1, 0.95],
        }}
        transition={{
          duration: tier === "tier3" ? 1 : tier === "tier2" ? 1.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rising energy particles - the core Ultra Instinct effect */}
      <RisingParticles config={config} tier={tier} />

      {/* Bottom energy burst - flames rising up */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: "-20px",
          height: "60%",
          background: `linear-gradient(to top, ${config.colors[0]}60 0%, ${config.colors[1]}30 30%, transparent 100%)`,
          filter: "blur(8px)",
          borderRadius: "0 0 12px 12px",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scaleY: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: tier === "tier3" ? 0.6 : tier === "tier2" ? 0.8 : 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ambient box shadow glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 30px ${config.colors[0]}80, 0 0 60px ${config.colors[0]}40, 0 0 100px ${config.colors[0]}20`,
            `0 0 50px ${config.colors[0]}a0, 0 0 100px ${config.colors[0]}60, 0 0 150px ${config.colors[0]}30`,
            `0 0 30px ${config.colors[0]}80, 0 0 60px ${config.colors[0]}40, 0 0 100px ${config.colors[0]}20`,
          ],
        }}
        transition={{
          duration: tier === "tier3" ? 0.8 : tier === "tier2" ? 1.2 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

// Seeded random for deterministic particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Rising particles component - energy wisps floating upward
function RisingParticles({
  config,
  tier,
}: {
  config: (typeof tierConfig)[keyof typeof tierConfig];
  tier: keyof typeof tierConfig;
}) {
  // Generate stable deterministic positions using seeded random
  const particles = useMemo(() => {
    return Array.from({ length: config.particleCount }).map((_, i) => ({
      id: i,
      x: seededRandom(i * 7) * 100,
      size: seededRandom(i * 13) * 6 + 2,
      delay: seededRandom(i * 17) * 2,
      duration: 1.5 + seededRandom(i * 23) * 1.5,
      yOffset: seededRandom(i * 31) * 100,
      color: config.colors[i % config.colors.length],
    }));
  }, [config.particleCount, config.colors]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            bottom: "-10px",
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
          }}
          animate={{
            y: [0, -300 - particle.yOffset],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 0.8, 0],
          }}
          transition={{
            duration:
              particle.duration *
              (tier === "tier3" ? 0.7 : tier === "tier2" ? 0.85 : 1),
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
