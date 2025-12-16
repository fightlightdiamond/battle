/**
 * VictoryParticles Component - Confetti/sparkle effect for winner card
 * Uses tsparticles for smooth, GPU-accelerated animations
 */

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

interface VictoryParticlesProps {
  /** Unique ID for the particles container */
  id?: string;
}

export function VictoryParticles({
  id = "victory-particles",
}: VictoryParticlesProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: {
          value: 20,
          density: {
            enable: false,
          },
        },
        color: {
          value: ["#FFD700", "#FFA500", "#FFFF00", "#FFE4B5", "#FFFFFF"],
        },
        shape: {
          type: ["circle", "star"],
        },
        opacity: {
          value: { min: 0.3, max: 1 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        size: {
          value: { min: 2, max: 6 },
          animation: {
            enable: true,
            speed: 3,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: { min: 0.5, max: 2 },
          direction: "none" as const,
          random: true,
          straight: false,
          outModes: {
            default: "bounce" as const,
          },
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.1,
            opacity: 1,
            color: {
              value: "#FFFFFF",
            },
          },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (!init) {
    return null;
  }

  return (
    <Particles
      id={id}
      options={options}
      className="absolute inset-0 pointer-events-none z-20 rounded-xl"
    />
  );
}

export default VictoryParticles;
