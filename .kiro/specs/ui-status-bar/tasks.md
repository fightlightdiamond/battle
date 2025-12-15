# Implementation Plan

- [x] 1. Create StatusBar component

  - [x] 1.1 Create StatusBar component with fixed positioning at top
    - Create `src/components/StatusBar.tsx`
    - Implement fixed positioning with height 36px
    - Add left/right content slots
    - Include visibility logic based on route
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  - [x] 1.2 Write property test for route visibility
    - **Property 2: Status bar visibility based on route**
    - **Validates: Requirements 1.5**
  - [x] 1.3 Integrate GoldBalanceDisplay into StatusBar
    - Move gold display from FloatingMenu to StatusBar right slot
    - Update GoldBalanceDisplay to use smaller size variant
    - _Requirements: 1.2_
  - [x] 1.4 Write property test for gold balance display
    - **Property 1: Gold balance display consistency**
    - **Validates: Requirements 1.2**

- [x] 2. Update FloatingMenu to icon-only with tooltips

  - [x] 2.1 Refactor menu items to icon-only buttons
    - Remove text labels from menu items
    - Adjust button sizing to 44px (within 40-48px range)
    - Update styling for icon-only appearance
    - _Requirements: 2.1, 2.5_
  - [x] 2.2 Add Tooltip wrapper to each menu item
    - Import Tooltip components from `@/components/ui/tooltip`
    - Wrap each icon button with Tooltip
    - Set tooltip content to item label
    - Configure delay for smooth UX
    - _Requirements: 2.2, 3.1, 3.4_
  - [x] 2.3 Write unit tests for FloatingMenu tooltips
    - Test tooltip renders on hover
    - Test tooltip content matches label
    - _Requirements: 2.2, 3.1_

- [x] 3. Integrate StatusBar into layouts

  - [x] 3.1 Update AppLayout to include StatusBar
    - Add StatusBar at top of layout
    - Add top padding to main content area (36px)
    - Pass visibility prop based on variant
    - _Requirements: 4.2, 4.3_
  - [x] 3.2 Update GameLayout to include StatusBar
    - Add StatusBar at top of layout
    - Adjust content positioning
    - Handle visibility for game variant
    - _Requirements: 4.2, 4.3_
  - [x] 3.3 Remove gold display from FloatingMenu
    - Remove the fixed top-right GoldBalanceDisplay
    - Clean up unused imports
    - _Requirements: 1.1_

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Final cleanup and export

  - [x] 5.1 Export StatusBar from components index
    - Add export to `src/components/layouts/index.ts`
    - _Requirements: 4.1_
  - [x] 5.2 Write integration tests
    - Test StatusBar renders in AppLayout
    - Test StatusBar renders in GameLayout
    - Test StatusBar hidden during battle/replay
    - _Requirements: 4.2_

- [x] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
