// ============================================================================
// EVOLUTION PATH TYPES
// ============================================================================

/**
 * Evolution cost structure - resources required to evolve a gem
 */
export interface EvolutionCost {
  gold: number;
  materials?: Record<string, number>; // materialId -> quantity
}

/**
 * Evolution path definition - represents a possible evolution from one gem to another
 */
export interface EvolutionPath {
  id: string;
  sourceGemId: string;
  targetGemId: string;
  cost: EvolutionCost;
  createdAt: string;
  updatedAt: string;
}

/**
 * Evolution path form input - for creating/updating evolution paths
 */
export interface EvolutionPathInput {
  sourceGemId: string;
  targetGemId: string;
  cost: EvolutionCost;
}

/**
 * Result of an evolution attempt
 */
export interface EvolutionResult {
  success: boolean;
  newGemId?: string;
  error?: string;
}

/**
 * Validation result for evolution path creation
 */
export interface EvolutionValidationResult {
  valid: boolean;
  error?: string;
}
