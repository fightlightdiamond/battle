# Implementation Plan

- [x] 1. Set up matchup feature structure and types

  - [x] 1.1 Create matchup feature directory structure
    - Create `src/features/matchup/` with subdirectories: types, services, store, components, pages, hooks
    - Create index.ts barrel exports
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Define matchup types and interfaces
    - Create Matchup, MatchupBet, MatchupStatus, BetStatus interfaces
    - Define CreateMatchupRequest, PlaceBetRequest, UpdateBetRequest types
    - _Requirements: 1.2, 3.1_
  - [x] 1.3 Write property test for Matchup serialization round-trip
    - **Property 1: Matchup Serialization Round-Trip**
    - **Validates: Requirements 1.4, 1.5**

- [x] 2. Implement Matchup Service

  - [x] 2.1 Create matchupService with CRUD operations
    - Implement createMatchup() - POST to /matchups endpoint
    - Implement getMatchups() - GET with optional status filter
    - Implement getMatchupById() - GET single record
    - Implement startMatchup() - PATCH status to "in_progress"
    - Implement completeMatchup() - PATCH with winner info
    - Implement cancelMatchup() - PATCH status to "cancelled"
    - _Requirements: 1.1, 2.1, 5.1, 5.3_
  - [x] 2.2 Write property test for same card matchup rejection
    - **Property 2: Same Card Matchup Rejection**
    - **Validates: Requirements 1.3**
  - [x] 2.3 Write property test for matchup record completeness
    - **Property 3: Matchup Record Completeness**
    - **Validates: Requirements 1.2**
  - [x] 2.4 Write property test for pending matchup filtering and sorting
    - **Property 4: Pending Matchup Filtering and Sorting**
    - **Validates: Requirements 2.1**

- [x] 3. Implement Matchup Bet Service

  - [x] 3.1 Create matchupBetService with bet operations
    - Implement placeBet() - POST to /matchupBets endpoint
    - Implement getBetById() - GET single bet
    - Implement getBetsByMatchup() - GET bets for a matchup
    - Implement getBetHistory() - GET all player bets sorted by timestamp
    - Implement getActiveBetForMatchup() - GET player's active bet on matchup
    - Implement updateBet() - PATCH bet amount
    - Implement cancelBet() - PATCH status to "cancelled"
    - Implement resolveBets() - Resolve all bets for completed matchup
    - Implement refundBets() - Refund all bets for cancelled matchup
    - _Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 6.1, 6.2, 6.4, 6.5, 7.1_
  - [x] 3.2 Write property test for bet history sorting
    - **Property 12: Bet History Sorting**
    - **Validates: Requirements 7.1**

- [x] 4. Implement Matchup Betting Store

  - [x] 4.1 Create matchupBettingStore with state management
    - Extend existing bettingStore or create new store
    - Implement placeMatchupBet action with validation
    - Implement updateMatchupBet action
    - Implement cancelMatchupBet action
    - Implement resolveMatchupBets action
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.3, 4.4, 4.5, 6.1, 6.2_
  - [x] 4.2 Write property test for invalid bet rejection
    - **Property 5: Invalid Bet Rejection**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 4.3 Write property test for bet deduction consistency
    - **Property 6: Bet Deduction Consistency**
    - **Validates: Requirements 3.4**
  - [x] 4.4 Write property test for non-pending matchup bet prevention
    - **Property 7: Non-Pending Matchup Bet Prevention**
    - **Validates: Requirements 3.6, 4.6**
  - [x] 4.5 Write property test for bet cancellation refund
    - **Property 8: Bet Cancellation Refund**
    - **Validates: Requirements 4.1**
  - [x] 4.6 Write property test for bet update balance adjustment
    - **Property 9: Bet Update Balance Adjustment**
    - **Validates: Requirements 4.4, 4.5**
  - [x] 4.7 Write property test for payout calculation
    - **Property 10: Payout Calculation**
    - **Validates: Requirements 6.1, 6.2, 6.4**
  - [x] 4.8 Write property test for matchup cancellation refund
    - **Property 11: Matchup Cancellation Refund**
    - **Validates: Requirements 6.5**
  - [x] 4.9 Write property test for balance persistence consistency
    - **Property 13: Balance Persistence Consistency**
    - **Validates: Requirements 9.2, 9.3**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Matchup UI Components

  - [x] 6.1 Create MatchupCard component
    - Display two cards facing each other
    - Show card names, images, and key stats
    - Show total bets on each side
    - Show matchup status badge
    - _Requirements: 2.2_
  - [x] 6.2 Create BetForm component
    - Input for bet amount with validation
    - Card selection (card1 or card2)
    - Place Bet / Update Bet / Cancel Bet buttons
    - Show current bet info if exists
    - Disable when matchup not pending
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.3_
  - [x] 6.3 Create MatchupBetHistoryItem component
    - Display matchup info, bet amount, selected card
    - Show result (won/lost/cancelled/refunded)
    - Show payout amount for won bets
    - _Requirements: 7.2_

- [x] 7. Implement Matchup Pages

  - [x] 7.1 Create MatchupListPage
    - Fetch and display pending matchups
    - Show empty state when no matchups
    - Link to matchup detail page
    - _Requirements: 2.1, 2.3_
  - [x] 7.2 Create MatchupDetailPage
    - Display matchup info with MatchupCard
    - Show BetForm for placing/updating/cancelling bets
    - Show current player's bet if exists
    - Link to battle replay for completed matchups
    - _Requirements: 2.2, 3.1, 4.1, 4.3, 8.2_
  - [x] 7.3 Create MatchupCreatePage (Admin)
    - Card selection for card1 and card2
    - Validation for same card selection
    - Create matchup button
    - _Requirements: 1.1, 1.3_
  - [x] 7.4 Create MatchupBetHistoryPage
    - Fetch and display bet history
    - Show empty state when no bets
    - _Requirements: 7.1, 7.3_

- [x] 8. Integrate Battle Execution

  - [x] 8.1 Create matchup battle execution flow
    - Admin triggers startMatchup
    - Execute battle using existing BattleEngine
    - Save battle history using existing battleHistoryService
    - Update matchup with winner and battleHistoryId
    - _Requirements: 5.1, 5.2, 5.3, 8.1_
  - [x] 8.2 Integrate payout resolution
    - After matchup completes, call resolveBets
    - Update all active bets with won/lost status
    - Credit winners with 2x payout
    - _Requirements: 5.4, 6.1, 6.2, 6.3, 6.4_
  - [x] 8.3 Integrate matchup cancellation
    - Admin triggers cancelMatchup
    - Call refundBets to refund all active bets
    - _Requirements: 6.5_

- [x] 9. Update db.json schema

  - [x] 9.1 Add matchups and matchupBets collections to db.json
    - Add empty "matchups" array
    - Add empty "matchupBets" array
    - _Requirements: 1.1, 3.5_

- [x] 10. Add routing for matchup pages

  - [x] 10.1 Add matchup routes to router
    - Add /matchups route for MatchupListPage
    - Add /matchups/:id route for MatchupDetailPage
    - Add /matchups/create route for MatchupCreatePage (Admin)
    - Add /matchup-bets route for MatchupBetHistoryPage
    - Add navigation links in FloatingMenu/GameMenu
    - _Requirements: 2.1, 7.1_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
