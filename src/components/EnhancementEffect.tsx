/**
 * @deprecated Use `EnhancementVFX` from `@/components/vfx` instead.
 *
 * Migration:
 * ```tsx
 * // Before
 * import { EnhancementEffect } from "@/components/EnhancementEffect";
 * <EnhancementEffect tier="legendary">...</EnhancementEffect>
 *
 * // After
 * import { EnhancementVFX } from "@/components/vfx";
 * <EnhancementVFX tier="legendary">...</EnhancementVFX>
 * ```
 *
 * The new VFX system provides:
 * - Same visual effects (radial glow + particles)
 * - Additional animation options (shake, scale pulse)
 * - More effect variants (success, fail, damage, heal, etc.)
 * - Better performance with singleton particles engine
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export type EnhancementTier =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

const tierConfig: Record<
  EnhancementTier,
  {
    centerColor: string;
    midColor: string;
    edgeColor: string;
    border: string;
    outerGlow: string;
    particleColor: string;
    particleCount: number;
    particleSpeed: number;
  }
> = {
  common: {
    centerColor: "rgba(180,180,255,0.5)",
    midColor: "rgba(180,180,255,0.25)",
    edgeColor: "rgba(180,180,255,0)",
    border: "rgba(180,180,255,0.8)",
    outerGlow: "0 0 40px 15px rgba(180,180,255,0.4)",
    particleColor: "#b4b4ff",
    particleCount: 15,
    particleSpeed: 0.3,
  },
  rare: {
    centerColor: "rgba(80,180,255,0.6)",
    midColor: "rgba(80,180,255,0.3)",
    edgeColor: "rgba(80,180,255,0)",
    border: "rgba(80,180,255,0.9)",
    outerGlow: "0 0 50px 18px rgba(80,180,255,0.5)",
    particleColor: "#50b4ff",
    particleCount: 25,
    particleSpeed: 0.5,
  },
  epic: {
    centerColor: "rgba(180,80,255,0.7)",
    midColor: "rgba(180,80,255,0.35)",
    edgeColor: "rgba(180,80,255,0)",
    border: "rgba(180,80,255,0.95)",
    outerGlow: "0 0 60px 22px rgba(180,80,255,0.6)",
    particleColor: "#b450ff",
    particleCount: 35,
    particleSpeed: 0.7,
  },
  legendary: {
    centerColor: "rgba(255,180,80,0.8)",
    midColor: "rgba(255,180,80,0.4)",
    edgeColor: "rgba(255,180,80,0)",
    border: "rgba(255,180,80,1)",
    outerGlow: "0 0 70px 25px rgba(255,180,80,0.7)",
    particleColor: "#ffb450",
    particleCount: 45,
    particleSpeed: 1,
  },
  mythic: {
    centerColor: "rgba(255,80,180,0.9)",
    midColor: "rgba(255,80,180,0.45)",
    edgeColor: "rgba(255,80,180,0)",
    border: "rgba(255,80,180,1)",
    outerGlow: "0 0 80px 30px rgba(255,80,180,0.8)",
    particleColor: "#ff50b4",
    particleCount: 60,
    particleSpeed: 1.3,
  },
};

export interface EnhancementEffectProps {
  tier?: EnhancementTier;
  children: React.ReactNode;
  className?: string;
}

export const EnhancementEffect: React.FC<EnhancementEffectProps> = ({
  tier = "common",
  children,
  className = "",
}) => {
  const config = tierConfig[tier];
  const [particlesReady, setParticlesReady] = useState(false);

  // Khởi tạo tsparticles engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  // Cấu hình particles cho từng tier
  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: {
          value: config.particleCount,
          density: { enable: true, width: 200, height: 300 },
        },
        color: { value: config.particleColor },
        shape: { type: "circle" },
        opacity: {
          value: { min: 0.3, max: 0.8 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 4 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: config.particleSpeed,
          direction: "top" as const,
          random: true,
          straight: false,
          outModes: { default: "out" as const },
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1,
          },
        },
      },
      detectRetina: true,
    }),
    [config.particleColor, config.particleCount, config.particleSpeed],
  );

  // Radial gradient: sáng nhất ở trung tâm, mờ dần ra ngoài
  const normalGradient = `radial-gradient(ellipse at center, ${config.centerColor} 0%, ${config.midColor} 50%, ${config.edgeColor} 100%)`;
  const intenseGradient = `radial-gradient(ellipse at center, ${config.centerColor.replace(/[\d.]+\)$/, "0.95)")} 0%, ${config.midColor.replace(/[\d.]+\)$/, "0.6)")} 40%, ${config.edgeColor} 100%)`;

  return (
    <motion.div
      className={`relative rounded-xl ${className}`}
      style={{
        border: `2px solid ${config.border}`,
        overflow: "visible",
      }}
      initial={{ boxShadow: config.outerGlow }}
      animate={{
        boxShadow: [
          config.outerGlow,
          config.outerGlow
            .replace(/[\d.]+\)$/, "1)")
            .replace(/\d+px/g, (m) => `${parseInt(m) * 1.5}px`),
          config.outerGlow,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    >
      {/* Lớp particles bay lên */}
      {particlesReady && (
        <div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <Particles
            id={`particles-${tier}`}
            options={particlesOptions}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      {/* Lớp radial glow phía sau */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ zIndex: 0 }}
        initial={{ background: normalGradient }}
        animate={{
          background: [normalGradient, intenseGradient, normalGradient],
        }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Nội dung chính */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {children}
      </div>
    </motion.div>
  );
};
