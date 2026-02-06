/**
 * VFXWrapper - Core visual effects wrapper component
 * Composition Pattern: Combines glow + particles + animations
 */

import React, { useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { VFXWrapperProps } from "./types";
import { particleConfigToOptions } from "./types";

// Singleton pattern for particles engine initialization
let particlesInitialized = false;
let particlesInitPromise: Promise<void> | null = null;

function initParticles(): Promise<void> {
  if (particlesInitialized) {
    return Promise.resolve();
  }
  if (!particlesInitPromise) {
    particlesInitPromise = initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      particlesInitialized = true;
    });
  }
  return particlesInitPromise;
}

/**
 * VFXWrapper - Main wrapper component for visual effects
 */
export const VFXWrapper: React.FC<VFXWrapperProps> = ({
  config,
  children,
  className = "",
  id,
  onComplete,
}) => {
  const [particlesReady, setParticlesReady] = useState(particlesInitialized);
  const reactId = useId();
  const uniqueId = id || `vfx-${config.variant}-${reactId}`;

  // Initialize particles engine
  useEffect(() => {
    if (!particlesReady) {
      initParticles().then(() => setParticlesReady(true));
    }
  }, [particlesReady]);

  // Particle options
  const particlesOptions = useMemo(() => {
    if (!config.particles.enabled) return null;
    return particleConfigToOptions(config.particles);
  }, [config.particles]);

  // Glow gradients
  const { glow, animation } = config;
  const normalGradient = `radial-gradient(ellipse at center, ${glow.centerColor} 0%, ${glow.midColor} 50%, ${glow.edgeColor} 100%)`;
  const intenseGradient = `radial-gradient(ellipse at center, ${intensifyColor(glow.centerColor, glow.pulseIntensity)} 0%, ${intensifyColor(glow.midColor, glow.pulseIntensity)} 40%, ${glow.edgeColor} 100%)`;

  // Outer glow animation
  const normalShadow = glow.outerGlow;
  const intenseShadow = intensifyShadow(glow.outerGlow, glow.pulseIntensity);

  // Shake animation variants
  const shakeVariants = animation.shake
    ? {
        shake: {
          x: [
            0,
            -animation.shakeIntensity,
            animation.shakeIntensity,
            -animation.shakeIntensity,
            0,
          ],
          transition: {
            duration: animation.duration / 4,
            repeat: animation.repeat === Infinity ? Infinity : animation.repeat,
            repeatType: "loop" as const,
          },
        },
      }
    : {};

  // Scale animation
  const scaleAnimation = animation.scalePulse
    ? {
        scale: [
          animation.scaleRange[0],
          animation.scaleRange[1],
          animation.scaleRange[0],
        ],
      }
    : {};

  return (
    <motion.div
      className={`relative rounded-xl ${className}`}
      style={{
        border: `${glow.borderWidth}px solid ${glow.borderColor}`,
        overflow: "visible",
      }}
      initial={{
        boxShadow: normalShadow,
        scale: animation.scaleRange[0],
      }}
      animate={{
        boxShadow: [normalShadow, intenseShadow, normalShadow],
        ...scaleAnimation,
        ...(animation.shake ? shakeVariants.shake : {}),
      }}
      transition={{
        duration: glow.pulseDuration,
        repeat: animation.repeat,
        repeatType: "reverse",
      }}
      onAnimationComplete={() => {
        if (animation.repeat !== Infinity && onComplete) {
          onComplete();
        }
      }}
    >
      {/* Particles layer */}
      {config.particles.enabled && particlesReady && particlesOptions && (
        <div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <Particles
            id={uniqueId}
            options={particlesOptions}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      {/* Radial glow layer */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ zIndex: 0 }}
        initial={{ background: normalGradient }}
        animate={{
          background: [normalGradient, intenseGradient, normalGradient],
        }}
        transition={{
          duration: glow.pulseDuration * 1.2,
          repeat: animation.repeat,
          repeatType: "reverse",
        }}
      />

      {/* Content layer */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {children}
      </div>
    </motion.div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Intensify rgba color by multiplying opacity
 */
function intensifyColor(rgba: string, intensity: number): string {
  return rgba.replace(/[\d.]+\)$/, (match) => {
    const opacity = parseFloat(match);
    return `${Math.min(opacity * intensity, 1)})`;
  });
}

/**
 * Intensify box shadow by increasing blur and spread
 */
function intensifyShadow(shadow: string, intensity: number): string {
  return shadow
    .replace(/[\d.]+\)$/, (match) => {
      const opacity = parseFloat(match);
      return `${Math.min(opacity * intensity, 1)})`;
    })
    .replace(/\d+px/g, (match) => {
      const value = parseInt(match);
      return `${Math.round(value * intensity)}px`;
    });
}

export default VFXWrapper;
