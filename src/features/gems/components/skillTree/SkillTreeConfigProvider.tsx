// ============================================================================
// SKILL TREE CONFIG PROVIDER
// ============================================================================

import { type ReactNode, useMemo } from "react";
import { SkillTreeConfigContext } from "../../hooks/useSkillTreeConfig";
import {
  defaultSkillTreeConfig,
  type SkillTreeConfig,
} from "../../config/skillTreeConfig";

interface SkillTreeConfigProviderProps {
  children: ReactNode;
  config?: Partial<SkillTreeConfig>;
}

/**
 * SkillTreeConfigProvider - Provides skill tree configuration to child components
 *
 * Allows overriding default configuration values while maintaining defaults
 * for any unspecified values.
 *
 * Usage:
 * ```tsx
 * <SkillTreeConfigProvider config={{ layout: { tierSpacing: 400 } }}>
 *   <SkillTreeCanvas />
 * </SkillTreeConfigProvider>
 * ```
 *
 * Requirement: 10.5 - Config changes trigger re-render
 */
export function SkillTreeConfigProvider({
  children,
  config,
}: SkillTreeConfigProviderProps) {
  // Merge provided config with defaults
  const mergedConfig = useMemo<SkillTreeConfig>(() => {
    if (!config) {
      return defaultSkillTreeConfig;
    }

    return {
      tiers: {
        ...defaultSkillTreeConfig.tiers,
        ...config.tiers,
      },
      nodeStyle: {
        ...defaultSkillTreeConfig.nodeStyle,
        ...config.nodeStyle,
        states: {
          ...defaultSkillTreeConfig.nodeStyle.states,
          ...config.nodeStyle?.states,
        },
      },
      edgeStyle: {
        ...defaultSkillTreeConfig.edgeStyle,
        ...config.edgeStyle,
      },
      layout: {
        ...defaultSkillTreeConfig.layout,
        ...config.layout,
      },
      skillTypes: {
        ...defaultSkillTreeConfig.skillTypes,
        ...config.skillTypes,
      },
    };
  }, [config]);

  return (
    <SkillTreeConfigContext.Provider value={mergedConfig}>
      {children}
    </SkillTreeConfigContext.Provider>
  );
}
