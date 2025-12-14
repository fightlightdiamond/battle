# Implementation Plan

- [x] 1. Set up betting feature structure and types

  - [x] 1.1 Create betting feature directory structure
    - Create `src/features/betting/` with subdirectories: types, services, store, components, pages, hooks
    - Create index.ts barrel exports
    - _Requirements: 4.2, 4.4_
  - [x] 1.2 Define betting types and interfaces
    - Create BetRecord, ActiveBet, DailyBonusClaim, BettingState interfaces
    - Define constants for daily bonus amount (1000), payout multiplier (2x)
    - _Requirements: 2.1, 3.1, 4.2_
  - [x] 1.3 Write property test for BetRecord serialization round-trip
    - **Property 7: Bet Record Serialization Round-Trip**
    - **Validates: Requirements 4.4, 4.5**

- [x] 2. Implement Daily Bonus Service

  - [x] 2.1 Create dailyBonusService with local storage persistence
    - Implement canClaimToday() - check if bonus available
    - Implement recordClaim() - save claim timestamp
    - Implement getLastClaim() - retrieve last claim info
    - Use date comparison for same calendar day check
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Write property test for daily bonus once per day
    - **Property 1: Daily Bonus Once Per Day**
    - **Validates: Requirements 1.1, 1.2**

- [x] 3. Implement Betting Service for json-api

  - [x] 3.1 Create bettingService with CRUD operations
    - Implement saveBetRecord() - POST to /bets endpoint
    - Implement getBetHistory() - GET with pagination and sorting
    - Implement getBetById() - GET single record
    - Add error handling for network failures
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.4_
  - [x] 3.2 Write property test for bet record completeness
    - **Property 6: Bet Record Completeness**
    - **Validates: Requirements 4.2**
  - [x] 3.3 Write property test for bet history sorting
    - **Property 8: Bet History Sorting**
    - **Validates: Requirements 5.1**

- [x] 4. Implement Betting Store with Zustand

  - [x] 4.1 Create bettingStore with state management
    - Implement goldBalance state with local storage persistence
    - Implement activeBet state for current bet
    - Implement dailyBonusClaimed state
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 4.2 Implement placeBet action with validation
    - Validate bet amount > 0 and <= balance
    - Validate battle phase is not 'fighting'
    - Deduct bet amount from balance immediately
    - Store active bet with cardId and amount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.3 Write property test for invalid bet rejection
    - **Property 2: Invalid Bet Rejection**
    - **Validates: Requirements 2.2, 2.3**
  - [x] 4.4 Write property test for bet deduction consistency
    - **Property 3: Bet Deduction Consistency**
    - **Validates: Requirements 2.4**
  - [x] 4.5 Write property test for battle phase bet prevention
    - **Property 4: Battle Phase Bet Prevention**
    - **Validates: Requirements 2.5**
  - [x] 4.6 Implement resolveBet action for payout calculation
    - Calculate payout: 2x if winner matches selected card, 0 otherwise
    - Update gold balance with payout
    - Create BetRecord and save via bettingService
    - Clear active bet
    - _Requirements: 3.1, 3.2, 3.3, 4.1_
  - [x] 4.7 Write property test for payout calculation
    - **Property 5: Payout Calculation**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 4.8 Implement claimDailyBonus action
    - Check if bonus can be claimed via dailyBonusService
    - Credit 1000 gold to balance
    - Record claim timestamp
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 4.9 Write property test for balance persistence consistency
    - **Property 9: Balance Persistence Consistency**
    - **Validates: Requirements 6.2, 6.3**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement UI Components

  - [x] 6.1 Create GoldBalanceDisplay component
    - Display current gold balance in header
    - Subscribe to bettingStore for real-time updates
    - Show gold icon with formatted number
    - _Requirements: 6.1, 6.2_
  - [x] 6.2 Create BettingPanel component
    - Card selection for betting (challenger or opponent)
    - Bet amount input with validation
    - Place Bet button with disabled states
    - Show insufficient funds message when applicable
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 6.3 Create DailyBonusNotification component
    - Toast notification on daily bonus claim
    - Show amount received (1000 gold)
    - Auto-dismiss after delay
    - _Requirements: 1.4_
  - [x] 6.4 Create BetResultOverlay component
    - Display bet result after battle ends
    - Show win/lose status and payout amount
    - Integrate with VictoryOverlay
    - _Requirements: 3.4_

- [x] 7. Implement Bet History Page

  - [x] 7.1 Create BetHistoryPage with list display
    - Fetch bet history from bettingService
    - Display paginated list of bet records
    - Show empty state when no history
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 7.2 Create BetHistoryItem component
    - Display bet amount, card names, result, payout
    - Visual indicator for win/lose
    - Timestamp formatting
    - _Requirements: 5.2_
  - [x] 7.3 Create useBetHistory hook with React Query
    - Fetch and cache bet history
    - Handle pagination
    - _Requirements: 5.4_

- [x] 8. Create Bet Battle Page (standalone page inheriting battle logic)

  - [x] 8.1 Create BetBattleSetupPage
    - Standalone page at /bet-battle route
    - Reuse CardSelector components from existing battle
    - Include BettingPanel for card selection and bet amount input
    - Show gold balance prominently
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1_
  - [x] 8.2 Create BetBattleArenaPage
    - Reuse battle arena components (BattleCard, HPBar, etc.)
    - Disable betting during battle (phase = fighting)
    - Show active bet info during battle
    - _Requirements: 2.5_
  - [x] 8.3 Integrate bet resolution with battle end
    - Call resolveBet when battle finishes
    - Pass winner information to betting store
    - Show BetResultOverlay with win/lose and payout
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 8.4 Add GoldBalanceDisplay to FloatingMenu
    - Show gold balance globally in floating menu
    - _Requirements: 6.1_
  - [x] 8.5 Add daily bonus check on app load
    - Check and claim daily bonus on first load
    - Show notification if bonus claimed
    - _Requirements: 1.1, 1.4_

- [x] 9. Update db.json schema for bets

  - [x] 9.1 Add bets collection to db.json
    - Add empty "bets" array to db.json
    - _Requirements: 4.1_

- [x] 10. Add routing for betting pages

  - [x] 10.1 Add betting routes to router
    - Add /bet-battle route for BetBattleSetupPage
    - Add /bet-battle/arena route for BetBattleArenaPage
    - Add /bet-history route for BetHistoryPage
    - Add navigation links in FloatingMenu/GameMenu
    - _Requirements: 5.1_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
