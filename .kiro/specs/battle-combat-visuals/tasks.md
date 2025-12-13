# Implementation Plan

- [x] 1. Create Combat Visual Config

  - [x] 1.1 Create combatVisualConfig.ts with types and default config

    - Define DamageType, DamageTypeStyle, AnimationConfig, MessageTemplates types
    - Create COMBAT_VISUAL_CONFIG with default values for all damage types
    - Export helper functions: getDamageTypeStyle(), getAnimationConfig()
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Write property test for Config Completeness
    - **Property 1: Config Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. Extend DamageCalculator with DamageResult

  - [x] 2.1 Create DamageResult interface and calculateWithDetails method

    - Define DamageResult interface with all required fields
    - Implement calculateWithDetails() that returns full breakdown
    - Include crit roll, crit bonus calculation, lifesteal calculation
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.2 Write property test for DamageResult Structure

    - **Property 4: DamageResult Structure Completeness**
    - **Validates: Requirements 4.1**

  - [x] 2.3 Write property test for Crit Bonus Calculation

    - **Property 5: Crit Bonus Calculation**
    - **Validates: Requirements 4.2**

  - [x] 2.4 Write property test for Lifesteal Calculation
    - **Property 6: Lifesteal Calculation**
    - **Validates: Requirements 4.3**

- [x] 3. Create Message Formatter Utility

  - [x] 3.1 Create messageFormatter.ts with formatBattleMessage function

    - Implement template selection based on DamageResult
    - Implement placeholder replacement
    - Export formatBattleMessage() function
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Write property test for Message Formatting
    - **Property 2: Message Formatting Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update DamageNumber Component

  - [x] 5.1 Refactor DamageNumber to use config-driven styling

    - Accept DamageResult instead of separate damage/isCritical props
    - Use getDamageTypeStyle() for styling
    - Use getAnimationConfig() for animation settings
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3_

  - [x] 5.2 Write property test for Style Retrieval
    - **Property 3: Style Retrieval Correctness**
    - **Validates: Requirements 3.2, 3.3, 5.2, 5.3**

- [x] 6. Create HealNumber Component

  - [x] 6.1 Create HealNumber component for lifesteal display
    - Use heal style from config
    - Display with "+" prefix and green color
    - Same animation as DamageNumber
    - _Requirements: 3.3_

- [x] 7. Update Battle Log

  - [x] 7.1 Update BattleLog to use formatBattleMessage
    - Import and use formatBattleMessage for attack entries
    - Update log entry types to support new message formats
    - Add visual indicators for crit and lifesteal in log
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Integrate with CombatSystem

  - [x] 8.1 Update CombatSystem to use calculateWithDetails

    - Replace calculate() calls with calculateWithDetails()
    - Pass DamageResult to event bus for UI updates
    - Apply lifesteal heal to attacker HP
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Update BattleArenaPage to display HealNumber
    - Add state for heal numbers
    - Display HealNumber on attacker when lifesteal triggers
    - Coordinate timing with DamageNumber
    - _Requirements: 3.3_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
