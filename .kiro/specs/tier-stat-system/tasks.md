# Implementation Plan

- [x] 1. Update Card types and constants

  - [x] 1.1 Add DEFAULT_STATS and STAT_RANGES constants
    - Create constants file with default values for all stats
    - HP: 1000, ATK: 100, DEF: 50, SPD: 100
    - critChance: 5, critDamage: 150, armorPen: 0, lifesteal: 0
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 1.2 Update Card interface with new stat fields
    - Add def, spd, critChance, critDamage, armorPen, lifesteal to Card interface
    - All fields should be required numbers
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 1.3 Update CardFormInput interface
    - Add same stat fields to form input type
    - _Requirements: 8.1, 8.2_

- [x] 2. Update Card schema validation

  - [x] 2.1 Add Zod schemas for new stat fields
    - def: integer >= 0, default 50
    - spd: integer >= 1, default 100
    - critChance: number 0-100, default 5
    - critDamage: number >= 100, default 150
    - armorPen: number 0-100, default 0
    - lifesteal: number 0-100, default 0
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 2.2 Write property test for stat validation ranges
    - **Property 8: Stat Validation Ranges**
    - **Validates: Requirements 9.1-9.6**
  - [x] 2.3 Write property test for default stats
    - **Property 7: Default Stats Applied**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 7.1-7.6**

- [x] 3. Update Card service for migration

  - [x] 3.1 Add migration function to apply defaults
    - Create applyDefaultStats() function
    - Handle cards loaded without new fields
    - Preserve existing HP and ATK values
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 3.2 Write property test for migration
    - **Property 10: Migration Preserves Existing Data**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 4. Checkpoint - Ensure card types and migration work

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update CardForm component

  - [x] 5.1 Add Core Stats section to form
    - Add DEF and SPD fields alongside existing HP and ATK
    - Use NumericFormat for consistent input
    - Pre-fill with default values
    - _Requirements: 8.1, 8.3, 8.4_
  - [x] 5.2 Add Combat Stats section to form
    - Add critChance, critDamage, armorPen, lifesteal fields
    - Show percentage labels where appropriate
    - Pre-fill with default values
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 5.3 Update form submission handling
    - Ensure all stat fields are included in submission
    - Apply defaults for empty fields
    - _Requirements: 8.5, 8.6_

- [x] 6. Update Battle Engine types

  - [x] 6.1 Update CombatantStats interface
    - Add spd, critChance, critDamage, armorPen, lifesteal fields
    - Ensure readonly for immutability
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_
  - [x] 6.2 Update AttackResult interface
    - Add attackerNewHp for lifesteal tracking
    - Add lifestealHeal amount
    - _Requirements: 5.1, 5.2_

- [x] 7. Update DamageCalculator

  - [x] 7.1 Implement armor penetration in damage formula
    - effectiveDef = DEF × (1 - armorPen/100)
    - Update calculateWithDef to use effectiveDef
    - _Requirements: 2.3, 4.2_
  - [x] 7.2 Write property test for armor penetration
    - **Property 2: Armor Penetration Reduces Effective Defense**
    - **Validates: Requirements 2.3, 4.2**
  - [x] 7.3 Update critical hit calculation
    - Use critChance for roll probability
    - Use critDamage/100 as multiplier
    - _Requirements: 2.1, 2.2, 4.4_
  - [x] 7.4 Write property test for critical damage
    - **Property 3: Critical Damage Multiplier**
    - **Validates: Requirements 2.2, 4.4**
  - [x] 7.5 Write property test for defense formula
    - **Property 1: Defense Reduction Formula**
    - **Validates: Requirements 1.4, 4.3**
  - [x] 7.6 Write property test for minimum damage
    - **Property 6: Minimum Damage Guarantee**
    - **Validates: Requirements 4.5**

- [x] 8. Update CombatSystem with lifesteal

  - [x] 8.1 Implement lifesteal mechanic
    - Calculate heal = damage × (lifesteal/100)
    - Cap healing at maxHp
    - Update attacker HP after damage dealt
    - _Requirements: 2.4, 5.1, 5.2, 5.3_
  - [x] 8.2 Write property test for lifesteal
    - **Property 4: Lifesteal Healing**
    - **Validates: Requirements 2.4, 5.1, 5.2, 5.3**

- [x] 9. Update TurnSystem with speed-based order

  - [x] 9.1 Implement speed comparison for first attacker
    - Compare challenger.spd vs opponent.spd
    - Higher speed attacks first
    - Random selection on equal speed
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 9.2 Write property test for speed turn order
    - **Property 5: Speed Determines First Attacker**
    - **Validates: Requirements 3.2**

- [x] 10. Checkpoint - Ensure battle engine updates work

  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration and cleanup

  - [x] 11.1 Update Card to Combatant conversion
    - Map all new Card stats to Combatant stats
    - Ensure battleService uses new stats
    - _Requirements: 1.1, 7.1-7.6_
  - [x] 11.2 Update existing tests for compatibility
    - Fix any broken tests due to new required fields
    - Add test fixtures with full stat sets
    - _Requirements: All_
  - [x] 11.3 Write property test for serialization round-trip
    - **Property 9: Card Serialization Round-Trip**
    - **Validates: Requirements 8.1, 8.2 (from battle-engine-refactor)**

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
