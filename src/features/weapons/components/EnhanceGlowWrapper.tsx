/**
 * EnhanceGlowWrapper Component
 *
 * A wrapper component that adds glow effects around its children
 * based on enhancement level tier.
 *
 * Structure:
 * <EnhanceGlowWrapper level={15}>
 *   <Card>...</Card>
 * </EnhanceGlowWrapper>
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EnhanceGlowWrapperProps {
  /** Enhancement level (0-15) */
  level: number;
  /** Content to wrap */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

// Tier configuration
const tierConfig = {
  tier0: {
    border: "none",
    background: "transparent",
    boxShadow: "none",
    animation: "",
  },
  tier1: {
    // Green glow (+1 to +5)
    border: "2px solid rgba(34, 197, 94, 0.6)",
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 197, 94, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(34, 197, 94, 0.25) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 0% 50%, rgba(74, 222, 128, 0.2) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 100% 50%, rgba(74, 222, 128, 0.2) 0%, transparent 50%)
    `,
    boxShadow: `
      0 0 15px rgba(34, 197, 94, 0.5),
      0 0 30px rgba(34, 197, 94, 0.3),
      inset 0 0 20px rgba(34, 197, 94, 0.1)
    `,
    animation: "pulse 3s ease-in-out infinite",
  },
  tier2: {
    // Blue/Cyan glow (+6 to +10)
    border: "3px solid rgba(0, 255, 255, 0.7)",
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 255, 0.45) 0%, transparent 50%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(59, 130, 246, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 0% 50%, rgba(0, 212, 255, 0.25) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 100% 50%, rgba(0, 212, 255, 0.25) 0%, transparent 50%)
    `,
    boxShadow: `
      0 0 20px rgba(0, 255, 255, 0.6),
      0 0 40px rgba(59, 130, 246, 0.4),
      0 0 60px rgba(0, 255, 255, 0.2),
      inset 0 0 30px rgba(0, 255, 255, 0.1)
    `,
    animation: "pulse 2s ease-in-out infinite",
  },
  tier3: {
    // Purple/Gold legendary glow (+11 to +15)
    border: "4px solid rgba(168, 85, 247, 0.8)",
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168, 85, 247, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(251, 191, 36, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 0% 50%, rgba(255, 0, 255, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 50% 80% at 100% 50%, rgba(255, 107, 0, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 60% 60% at 50% 50%, rgba(192, 192, 192, 0.15) 0%, transparent 70%)
    `,
    boxShadow: `
      0 0 25px rgba(168, 85, 247, 0.7),
      0 0 50px rgba(255, 0, 255, 0.5),
      0 0 80px rgba(251, 191, 36, 0.4),
      0 0 120px rgba(168, 85, 247, 0.2),
      inset 0 0 40px rgba(192, 192, 192, 0.1)
    `,
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

function getTier(level: number): keyof typeof tierConfig {
  if (level <= 0) return "tier0";
  if (level <= 5) return "tier1";
  if (level <= 10) return "tier2";
  return "tier3";
}

export function EnhanceGlowWrapper({
  level,
  children,
  className,
}: EnhanceGlowWrapperProps) {
  const tier = getTier(level);
  const config = tierConfig[tier];

  // No enhancement - just render children without wrapper styles
  if (tier === "tier0") {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn("rounded-2xl p-1", className)}
      style={{
        border: config.border,
        background: config.background,
        boxShadow: config.boxShadow,
        animation: config.animation,
      }}
    >
      {children}
    </div>
  );
}
