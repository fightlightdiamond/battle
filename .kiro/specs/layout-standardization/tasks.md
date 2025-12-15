# Implementation Plan

- [x] 1. Fix BattleReplayPage syntax errors and refactor to use GameLayout

  - [x] 1.1 Rewrite BattleReplayPage component with correct JSX structure
    - Fix broken code starting at `className="bg-gra`
    - Remove duplicate code blocks
    - Use GameLayout with title, backTo, backLabel, headerRight props
    - Handle loading, error, not found, and success states
    - _Requirements: 4.1, 4.2, 4.3, 1.2_
  - [x] 1.2 Write unit test for BattleReplayPage renders without errors
    - Test component mounts successfully
    - Test loading state displays
    - Test error state displays
    - _Requirements: 4.2_

- [x] 2. Refactor BattleArenaPage to use GameLayout

  - [x] 2.1 Wrap BattleArenaPage content with GameLayout
    - Replace custom gradient background div with GameLayout showBackground prop
    - Move back button logic to backTo prop
    - Move "Battle Arena" title to title prop
    - Keep battle log toggle in headerRight
    - Preserve all battle-specific UI (cards, controls, log sidebar, overlays)
    - _Requirements: 1.1, 1.4, 3.1, 3.2_
  - [x] 2.2 Write property test for GameLayout header consistency
    - **Property 1: GameLayout header consistency**
    - **Validates: Requirements 1.4**
    - Generate random title and backTo values
    - Render GameLayout with props
    - Assert header contains back link and title text

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Verify existing pages maintain correct layout usage

  - [x] 4.1 Verify BattleSetupPage continues using GameLayout correctly
    - Review props usage (title, backTo, headerRight)
    - Ensure no custom header implementation
    - _Requirements: 1.3, 3.1, 3.2_
  - [x] 4.2 Verify MenuLayout pages use correct variants
    - CardEditPage should use variant="narrow"
    - MatchupAdminPage should use variant="narrow"
    - List pages should use default variant
    - _Requirements: 2.2, 2.5_

- [ ] 5. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
