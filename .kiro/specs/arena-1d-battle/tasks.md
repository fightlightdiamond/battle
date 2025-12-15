# Implementation Plan

- [x] 1. Set up feature structure and types

  - [x] 1.1 Create arena1d feature directory structure
    - Create `src/features/arena1d/` with components, types, stories folders
    - Create index.ts exports
    - _Requirements: 1.1_
  - [x] 1.2 Define arena type definitions
    - Create `ArenaCardData`, `CellIndex`, `ArenaPhase`, `CellHighlight`, `ArenaState` types
    - Define constants for cell count (8) and boundary indices (0, 7)
    - _Requirements: 1.1, 1.2, 3.1, 3.2_
  - [x] 1.3 Write property test for boundary cell identification
    - **Property 2: Boundary cells are correctly identified**
    - **Validates: Requirements 1.2**

- [ ] 2. Implement ArenaCell component

  - [ ] 2.1 Create ArenaCell component
    - Display cell with index number
    - Apply boundary cell styling for index 0 and 7
    - Support highlight states (none, valid-move, combat-zone)
    - _Requirements: 1.2, 1.3, 2.3_
  - [ ] 2.2 Write unit tests for ArenaCell
    - Test boundary styling
    - Test highlight states
    - Test index display
    - _Requirements: 1.2, 1.3_

- [ ] 3. Implement ArenaCard component

  - [ ] 3.1 Create ArenaCard component
    - Display compact card with name, HP bar, ATK
    - Support left/right side styling
    - Support moving and combat states
    - _Requirements: 2.1, 2.4_
  - [ ] 3.2 Write property test for card data display
    - **Property: Card display shows required data**
    - For any ArenaCardData, rendered output contains name, HP, ATK
    - **Validates: Requirements 2.4**

- [ ] 4. Implement Arena1D main component

  - [ ] 4.1 Create Arena1D component
    - Render exactly 8 ArenaCell components
    - Position cards based on leftPosition and rightPosition props
    - Support phase-based rendering
    - _Requirements: 1.1, 2.1, 2.2_
  - [ ] 4.2 Write property test for cell count
    - **Property 1: Arena always has exactly 8 cells**
    - **Validates: Requirements 1.1**
  - [ ] 4.3 Write property test for initial positions
    - **Property 3: Initial positions are at boundaries**
    - **Validates: Requirements 3.1, 3.2**
  - [ ] 4.4 Write property test for position collision
    - **Property 4: Cards never occupy same cell**
    - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement movement animation

  - [ ] 6.1 Add CSS animations for card movement
    - Create slide-left and slide-right animations
    - Add transition classes for smooth movement
    - _Requirements: 4.1, 4.2_
  - [ ] 6.2 Implement movement state handling in Arena1D
    - Track moving state
    - Trigger onMoveComplete callback after animation
    - _Requirements: 4.2, 4.3_
  - [ ] 6.3 Write property test for position bounds
    - **Property 6: Position bounds are respected**
    - **Validates: Requirements 4.3**

- [ ] 7. Implement combat phase detection

  - [ ] 7.1 Add combat phase logic
    - Detect when cards are adjacent (|leftPos - rightPos| = 1)
    - Apply combat-zone highlight to adjacent cells
    - Apply combat styling to cards
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 7.2 Write property test for combat detection
    - **Property 5: Combat phase triggers when adjacent**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 8. Create Storybook stories

  - [ ] 8.1 Create Arena1D.stories.tsx
    - Story: Empty arena (8 cells, no cards)
    - Story: Initial setup (cards at boundaries)
    - Story: Mid-arena positions (cards at various positions)
    - Story: Movement animation demo
    - Story: Combat phase (adjacent cards)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
