# Implementation Plan

- [x] 1. Extend WeaponStats with attackRange field
  - [x] 1.1 Add attackRange to WeaponStats interface and defaults
    - Add `attackRange: number` to `WeaponStats` interface in `src/features/weapons/types/weapon.ts`
    - Add `attackRange: 0` to `DEFAULT_WEAPON_STATS`
    - Add `attackRange: { min: 0, max: 6 }` to `WEAPON_STAT_RANGES`
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Write property test for weapon attackRange default
    - **Property 1: Weapon attack range default value**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Write property test for weapon attackRange validation
    - **Property 2: Weapon attack range validation bounds**
    - **Validates: Requirements 1.2**

- [x] 2. Update weapon schema and form
  - [x] 2.1 Update weapon Zod schema with attackRange validation
    - Add `attackRange` field to weapon schema in `src/features/weapons/types/schemas.ts`
    - Validate range [0, 6]
    - _Requirements: 1.2_
  - [x] 2.2 Update WeaponForm component to include attackRange input
    - Add attackRange input field to `src/features/weapons/components/WeaponForm.tsx`
    - _Requirements: 1.3_
  - [x] 2.3 Update WeaponCard to display attackRange stat
    - Show attackRange in `src/features/weapons/components/WeaponCard.tsx`
    - _Requirements: 1.3_
  - [x] 2.4 Write property test for weapon serialization round-trip
    - **Property 3: Weapon serialization round-trip**
    - **Validates: Requirements 1.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement effective range calculation
  - [x] 4.1 Add calculateEffectiveRange function to equipmentService
    - Add `DEFAULT_ATTACK_RANGE = 1` constant
    - Add `calculateEffectiveRange(weapon)` function returning `1 + (weapon?.attackRange ?? 0)`
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Write property test for default effective range
    - **Property 4: Default effective range without weapon**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Write property test for effective range calculation
    - **Property 5: Effective range calculation with weapon**
    - **Validates: Requirements 2.2**

- [x] 5. Update BattleCard type and adapter
  - [x] 5.1 Add effectiveRange to BattleCard type
    - Add `effectiveRange: number` to BattleCard in `src/features/battle/types/battle.ts`
    - _Requirements: 2.2, 2.3_
  - [x] 5.2 Update CardAdapter to include effectiveRange
    - Update `cardToCombatantWithWeapon` to calculate and include effectiveRange
    - _Requirements: 2.2_
  - [x] 5.3 Update battleService to populate effectiveRange
    - Update `cardToBattleCardWithEquipment` to include effectiveRange
    - _Requirements: 2.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement range detection in arena battle
  - [x] 7.1 Add isInAttackRange utility function
    - Add `isInAttackRange(attackerPos, targetPos, effectiveRange)` to arenaBattleStore
    - Returns `Math.abs(attackerPos - targetPos) <= effectiveRange`
    - _Requirements: 3.1, 3.3_
  - [x] 7.2 Write property test for in-range determination
    - **Property 6: In-range determination using absolute distance**
    - **Validates: Requirements 3.1, 3.3**
  - [x] 7.3 Add canCardMove utility function
    - Add `canCardMove(cardPos, enemyPos, effectiveRange)` returning `!isInAttackRange(...)`
    - _Requirements: 4.1, 4.2_
  - [x] 7.4 Write property test for movement blocked when in range
    - **Property 7: Movement blocked when enemy in range**
    - **Validates: Requirements 4.1**
  - [x] 7.5 Write property test for movement allowed when out of range
    - **Property 8: Movement allowed when enemy out of range**
    - **Validates: Requirements 4.2**

- [x] 8. Update phase determination logic
  - [x] 8.1 Update determinePhase to use effective range
    - Modify `determinePhase` to accept effectiveRange parameters
    - Enter PHASE_COMBAT if either card is in range of the other
    - _Requirements: 3.1, 4.1_
  - [x] 8.2 Update executeMove to check effective range before moving
    - Check if enemy is in range before allowing movement
    - If in range, skip movement and proceed to attack
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 9. Update combat execution for ranged attacks
  - [x] 9.1 Update executeAttack to work with effective range
    - Verify target is in effective range before executing attack
    - _Requirements: 5.1, 5.2_
  - [x] 9.2 Write property test for attack execution within range
    - **Property 9: Attack execution within effective range**
    - **Validates: Requirements 3.2, 5.1**
  - [x] 9.3 Write property test for mutual combat
    - **Property 10: Mutual combat when both in range**
    - **Validates: Requirements 5.3**

- [x] 10. Update arena initialization
  - [x] 10.1 Update initArenaWithCards to load effectiveRange
    - Ensure effectiveRange is calculated and stored for both cards
    - _Requirements: 2.2_
  - [x] 10.2 Update selectors for range-aware state
    - Add `selectCanMoveWithRange` selector
    - Update `selectCanAttack` to use effective range
    - _Requirements: 4.1, 4.2, 5.1_

- [-] 11. Update UI components
  - [x] 11.1 Update CardDetailPage to show effective range
    - Display effective attack range in card stats section
    - _Requirements: 2.3_
  - [x] 11.2 Update ArenaBattlePage to indicate range-based combat
    - Show visual indicator when movement is blocked due to range
    - _Requirements: 4.4_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
