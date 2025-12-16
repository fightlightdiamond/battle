# Implementation Plan

## Arena Battle Mode

- [x] 1. Create BattleModeSelector component

  - [x] 1.1 Create BattleModeSelector component with Classic/Arena options
    - Create `src/features/battle/components/BattleModeSelector.tsx`
    - Implement toggle UI with icons and descriptions
    - Export from `src/features/battle/components/index.ts`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Write property test for mode selection
    - **Property 1: Navigation routes to correct page based on mode**
    - **Validates: Requirements 1.4**

- [x] 2. Update BattleSetupPage with mode selector

  - [x] 2.1 Add BattleModeSelector to BattleSetupPage
    - Add state for selected battle mode (default: 'classic')
    - Integrate BattleModeSelector component
    - Update navigation logic based on selected mode
    - _Requirements: 1.1, 1.4_

- [x] 3. Create arenaBattleStore for Arena Mode state

  - [x] 3.1 Create arenaBattleStore with position and phase management
    - Create `src/features/battle/store/arenaBattleStore.ts`
    - Implement state: positions, arenaPhase, currentTurn, battleLog, result
    - Implement actions: initArena, executeMove, executeAttack, toggleAutoBattle, resetArena
    - Reuse calculateAttack from battleService
    - Export from `src/features/battle/store/index.ts`
    - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.4, 4.1, 4.2_
  - [x] 3.2 Write property test for initial positions
    - **Property 2: Initial positions are at boundaries**
    - **Validates: Requirements 2.2, 2.3**
  - [x] 3.3 Write property test for phase determination
    - **Property 3: Phase determination by distance**
    - **Validates: Requirements 3.1, 4.1**
  - [x] 3.4 Write property test for movement logic
    - **Property 4: Movement is exactly 1 cell toward opponent**
    - **Validates: Requirements 3.2**
  - [x] 3.5 Write property test for turn alternation
    - **Property 5: Turn alternates after movement**
    - **Validates: Requirements 3.4**

- [ ] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create ArenaCardWithStats component

  - [x] 5.1 Create ArenaCardWithStats component with HP bar overlay
    - Create `src/features/arena1d/components/ArenaCardWithStats.tsx`
    - Wrap ArenaCard with HP bar and stats display
    - Support damage/heal display props
    - Support danger state visual
    - Export from `src/features/arena1d/components/index.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 5.2 Write property test for HP bar value
    - **Property 9: HP bar reflects current HP**
    - **Validates: Requirements 6.2**
  - [x] 5.3 Write property test for danger state
    - **Property 10: Danger state triggers below 25% HP**
    - **Validates: Requirements 6.3**

- [x] 6. Create ArenaBattlePage

  - [x] 6.1 Create ArenaBattlePage component
    - Create `src/features/battle/pages/ArenaBattlePage.tsx`
    - Integrate Arena1D with ArenaCardWithStats
    - Reuse BattleControls, BattleLog, VictoryOverlay
    - Connect to arenaBattleStore
    - Handle movement and combat phases
    - _Requirements: 2.1, 2.4, 3.3, 4.3, 5.1, 5.2, 5.4_
  - [x] 6.2 Write property test for combat execution
    - **Property 6: Combat executes attacks correctly**
    - **Validates: Requirements 4.2**
  - [x] 6.3 Write property test for battle end
    - **Property 7: Battle ends when HP reaches 0**
    - **Validates: Requirements 4.4**

- [x] 7. Implement auto-battle for Arena Mode

  - [x] 7.1 Add auto-battle logic to ArenaBattlePage
    - Implement auto-move in moving phase
    - Implement auto-attack in combat phase
    - Use existing BattleControls toggle
    - _Requirements: 5.3_
  - [x] 7.2 Write property test for auto-battle action
    - **Property 8: Auto-battle executes correct action for phase**
    - **Validates: Requirements 5.3**

- [x] 8. Add routing for ArenaBattlePage

  - [x] 8.1 Add route for Arena Battle page
    - Add route `/battle/arena-1d` to `src/main.tsx`
    - Export ArenaBattlePage from `src/features/battle/pages/index.ts`
    - _Requirements: 1.4_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
