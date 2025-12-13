# Implementation Plan

- [x] 1. Create Stat Registry and Type Utilities

  - [x] 1.1 Create statConfig.ts with StatDefinition interface and STAT_REGISTRY
    - Define StatFormat, StatTier types
    - Define StatDefinition interface with all required fields
    - Create STAT_REGISTRY array with current stats (hp, atk, def, spd, critChance, critDamage, armorPen, lifesteal)
    - Create TIER_CONFIG for tier labels and ordering
    - Export helper functions: getStatsByTier(), getCompactStats(), getStatByKey()
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Write property test for Stat Registry Completeness
    - **Property 1: Stat Registry Completeness**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Create statTypes.ts with derived TypeScript types
    - Create StatKey type from registry keys
    - Create CardStats type mapping keys to numbers
    - Update Card interface to extend CardStats
    - Create CardFormInput with optional stats
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 2. Create Schema Generator

  - [x] 2.1 Create schemaGenerator.ts
    - Implement generateStatSchema() function that iterates STAT_REGISTRY
    - Apply min/max validation from config
    - Apply default values from config
    - Export generated cardFormSchema
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.2 Write property test for Schema-Config Consistency
    - **Property 2: Schema-Config Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3, 2.3, 2.4**
  - [x] 2.3 Write property test for Validation Range Enforcement
    - **Property 7: Validation Range Enforcement**
    - **Validates: Requirements 4.2, 2.4**

- [x] 3. Create Stat Display Utilities

  - [x] 3.1 Create statDisplay.ts with formatting and icon utilities
    - Implement formatStatValue() function based on format type and decimalPlaces
    - Create icon mapping from string to Lucide components
    - Implement getStatIcon() function
    - _Requirements: 2.2, 3.2, 3.3_
  - [x] 3.2 Write property test for Format Application Correctness
    - **Property 4: Format Application Correctness**
    - **Validates: Requirements 2.2, 3.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refactor CardForm to be Config-Driven

  - [x] 5.1 Create StatFormField component
    - Accept StatDefinition and form control as props
    - Render NumericFormat with correct suffix, decimalPlaces from config
    - Use label from config
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 5.2 Update CardForm to iterate over STAT_REGISTRY
    - Remove hardcoded stat fields
    - Use getStatsByTier() to group stats
    - Render StatFormField for each stat
    - Maintain tier section headers
    - _Requirements: 2.1, 2.5_
  - [x] 5.3 Write property test for Dynamic Field Generation
    - **Property 6: Dynamic Field Generation**
    - **Validates: Requirements 2.1, 3.1**

- [x] 6. Refactor CardList to be Config-Driven

  - [x] 6.1 Create StatDisplay component
    - Accept StatDefinition and value as props
    - Use getStatIcon() for icon
    - Use formatStatValue() for formatting
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.2 Update CardItem to use config-driven stats
    - Remove hardcoded ATK/HP display
    - Use getCompactStats() to get stats to display
    - Render StatDisplay for each compact stat
    - _Requirements: 3.1, 3.4_
  - [x] 6.3 Write property test for Compact View Filtering
    - **Property 5: Compact View Filtering**
    - **Validates: Requirements 3.4**

- [x] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update Existing Types and Remove Old Constants

  - [x] 8.1 Update card.ts to use derived types
    - Import Card and CardFormInput from statTypes.ts
    - Remove hardcoded stat fields from interfaces
    - Re-export types for backward compatibility
    - _Requirements: 5.1, 5.2_
  - [x] 8.2 Update constants.ts to re-export from statConfig
    - Remove DEFAULT_STATS and STAT_RANGES (now in statConfig)
    - Re-export for backward compatibility if needed
    - Update StatName type to use derived type
    - _Requirements: 1.1_
  - [x] 8.3 Update schemas.ts to use generated schema
    - Import cardFormSchema from schemaGenerator
    - Remove hardcoded stat validation
    - _Requirements: 4.1, 4.4_
  - [x] 8.4 Write property test for Stat Grouping Correctness
    - **Property 3: Stat Grouping Correctness**
    - **Validates: Requirements 1.4, 2.5**

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
