// ============================================================================
// USE SKILL TREE CONFIG HOOK
// ============================================================================

import { createContext, useContext } from "react";
import {
  defaultSkillTreeConfig,
  type SkillTreeConfig,
} from "../config/skillTreeConfig";

/**
 * Context for skill tree configuration
 * Allows components to access config without prop drilling
 */
export const SkillTreeConfigContext = createContext<SkillTreeConfig>(
  defaultSkillTreeConfig,
);

/**
 * useSkillTreeConfig - Hook to access skill tree configuration
 *
 * Provides access to the skill tree configuration from context.
 * Falls back to default config if no provider is present.
 *
 * Usage:
 * ```tsx
 * const config = useSkillTreeConfig();
 * const tierColor = config.tiers.basic.color;
 * ```
 *
 * Requirement: 10.5 - Config values change triggers re-render
 */
export function useSkillTreeConfig(): SkillTreeConfig {
  return useContext(SkillTreeConfigContext);
}
