/# Implementation Plan

- [x] 1. Set up engine directory structure and core types

  - [x] 1.1 Create engine directory structure
    - Create `src/features/battle/engine/` with subdirectories: core, systems, calculations, utils, adapters
    - Create index.ts barrel exports for each directory
    - _Requirements: 1.1_
  - [x] 1.2 Define core type interfaces
    - Create types.ts with Combatant, CombatantStats, BattleState, BattleResult, AttackResult interfaces
    - Define GameEvent types and BattleLogEntry interface
    - _Requirements: 1.1, 2.1_

- [x] 2. Implement EventBus for event-driven architecture

  - [x] 2.1 Create EventBus class
    - Implement subscribe() method returning unsubscribe function
    - Implement emit() method to broadcast events to subscribers
    - Implement clear() method to remove all subscriptions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 Write unit tests for EventBus
    - Test subscribe/unsubscribe functionality
    - Test event delivery to multiple subscribers
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 3. Implement Serializer for state persistence

  - [x] 3.1 Create Serializer utility
    - Implement serialize(state: BattleState): string
    - Implement deserialize(json: string): BattleState
    - Handle validation of deserialized data
    - _Requirements: 1.3, 1.4_
  - [x] 3.2 Write property test for serialization round-trip
    - **Property 1: State Serialization Round-Trip**
    - **Validates: Requirements 1.3, 1.4**

- [x] 4. Implement DamageCalculator

  - [x] 4.1 Create DamageCalculator with damage formulas
    - Implement calculate() - basic damage = ATK
    - Implement calculateWithDef() - damage = ATK × (1 - DEF/(DEF + 100)) for future
    - Implement rollCritical() and applyCritical() for future crit system
    - _Requirements: 2.3, 8.1_
  - [x] 4.2 Write property test for damage calculation
    - **Property 3: Attack Damage Equals ATK**
    - **Validates: Requirements 2.3**
  - [x] 4.3 Write property test for critical damage threshold
    - **Property 11: Critical Damage Threshold**
    - **Validates: Requirements 2.3**

- [x] 5. Implement CombatSystem

  - [x] 5.1 Create CombatSystem with attack logic
    - Implement calculateAttack(attacker, defender): AttackResult
    - Implement applyDamage(combatant, damage): Combatant (immutable)
    - Use DamageCalculator for damage computation
    - _Requirements: 2.3, 2.4_
  - [x] 5.2 Write property test for HP reduction
    - **Property 7: HP Reduction Correctness**
    - **Validates: Requirements 2.3**

- [x] 6. Implement TurnSystem

  - [x] 6.1 Create TurnSystem for turn management
    - Implement getNextAttacker() - alternates between challenger/opponent
    - Implement advanceTurn(state): BattleState (immutable)
    - _Requirements: 2.3_
  - [x] 6.2 Write property test for turn alternation
    - **Property 4: Turn Alternation**
    - **Validates: Requirements 2.3**

- [x] 7. Implement VictorySystem

  - [x] 7.1 Create VictorySystem for win/lose detection
    - Implement isDefeated(combatant): boolean
    - Implement checkVictory(state): BattleResult | null
    - _Requirements: 2.4, 2.5_
  - [x] 7.2 Write property test for defeated detection
    - **Property 5: Defeated Combatant Detection**
    - **Validates: Requirements 2.4**
  - [x] 7.3 Write property test for victory determination
    - **Property 6: Victory Determination**
    - **Validates: Requirements 2.5**

- [x] 8. Checkpoint - Ensure all system tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement CombatLogger

  - [x] 9.1 Create CombatLogger utility
    - Implement logAttack(attacker, defender, damage, remainingHp): BattleLogEntry
    - Implement logVictory(winnerName): BattleLogEntry
    - Generate unique IDs and timestamps for entries
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.2 Write property test for combat log completeness
    - **Property 9: Combat Log Contains Attack Data**
    - **Validates: Requirements 9.2**

- [x] 10. Implement StageScaling (for future use)

  - [x] 10.1 Create StageScaling calculator
    - Implement scaleStats(baseStats, stageNumber): CombatantStats
    - Formula: stat = baseStat × (1 + stageNumber × 0.1)
    - _Requirements: 6.1_
  - [x] 10.2 Write property test for stage scaling formula
    - **Property 10: Stage Scaling Formula**
    - **Validates: Requirements 6.1**

- [x] 11. Implement BattleState management

  - [x] 11.1 Create BattleState factory and helpers
    - Implement createInitialState(challenger, opponent): BattleState
    - Implement state transition helpers (immutable updates)
    - _Requirements: 1.1, 1.2_
  - [x] 11.2 Write property test for state immutability
    - **Property 2: State Immutability**
    - **Validates: Requirements 1.2**

- [x] 12. Implement BattleEngine orchestrator

  - [x] 12.1 Create BattleEngine class
    - Integrate all systems: Combat, Turn, Victory
    - Implement initBattle(), startBattle(), executeAttack(), resetBattle()
    - Implement toggleAutoBattle()
    - Emit events on state changes
    - _Requirements: 1.1, 2.1, 2.3, 2.4, 2.5_
  - [x] 12.2 Write property test for battle end disables attacks
    - **Property 8: Battle End Disables Attacks**
    - **Validates: Requirements 2.5**
  - [x] 12.3 Write integration tests for BattleEngine
    - Test complete battle flow from init to victory
    - Test auto-battle functionality
    - _Requirements: 1.1, 2.1_

- [x] 13. Checkpoint - Ensure all engine tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Create React adapter

  - [ ] 14.1 Create useBattleEngine hook
    - Initialize engine instance
    - Expose state and actions to React components
    - Handle event subscriptions with useEffect cleanup
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 14.2 Create battleStoreAdapter
    - Sync engine state to existing Zustand battleStore
    - Translate store actions to engine commands
    - _Requirements: 7.2, 7.3_

- [ ] 15. Migrate existing battle feature to use engine

  - [ ] 15.1 Update battleStore to use engine via adapter
    - Replace direct state management with engine calls
    - Maintain backward compatibility with existing components
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ] 15.2 Verify existing tests still pass
    - Run all existing battle tests
    - Fix any compatibility issues
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
