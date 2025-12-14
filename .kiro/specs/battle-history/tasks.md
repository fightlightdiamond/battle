# Implementation Plan

- [x] 1. Create Battle History Types and Interfaces

  - [x] 1.1 Create battleHistoryTypes.ts with all interfaces

    - Define CombatantSnapshot, DamageBreakdown, LifestealDetail, DefenderHpState
    - Define TurnRecord, HpTimelineEntry, BattleRecord
    - Export all types
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 5.5_

  - [x] 1.2 Write property test for BattleRecord Structure Completeness

    - **Property 1: BattleRecord Structure Completeness**
    - **Validates: Requirements 1.2, 1.4**

  - [x] 1.3 Write property test for TurnRecord Structure Completeness
    - **Property 2: TurnRecord Structure Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 2. Create BattleRecorder Service

  - [x] 2.1 Create battleRecorder.ts with recording logic

    - Implement startRecording() to capture combatant snapshots
    - Implement recordTurn() to create TurnRecord with full damage breakdown
    - Implement finishRecording() to create complete BattleRecord
    - Build hpTimeline from turn data
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.6_

  - [x] 2.2 Write property test for Turn Order Preservation

    - **Property 3: Turn Order Preservation**
    - **Validates: Requirements 2.6**

  - [x] 2.3 Write property test for HP Timeline Consistency

    - **Property 4: HP Timeline Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [x] 2.4 Write property test for Defender HP Calculation

    - **Property 5: Defender HP Calculation**
    - **Validates: Requirements 2.4**

  - [x] 2.5 Write property test for Lifesteal Calculation
    - **Property 6: Lifesteal Calculation**
    - **Validates: Requirements 2.3**

- [x] 3. Create BattleHistoryService for API

  - [x] 3.1 Create battleHistoryService.ts with CRUD operations

    - Implement saveBattle() to POST to /battleHistory
    - Implement getBattles() with pagination support
    - Implement getBattleById() to fetch single record
    - Implement deleteBattle() to remove record
    - _Requirements: 1.3, 3.1_

  - [x] 3.2 Write property test for Battle Duration Calculation

    - **Property 7: Battle Duration Calculation**
    - **Validates: Requirements 5.3**

  - [x] 3.3 Write property test for JSON Round-Trip Serialization
    - **Property 8: JSON Round-Trip Serialization**
    - **Validates: Requirements 5.4**

- [x] 4. Update db.json Schema

  - [x] 4.1 Add battleHistory array to db.json
    - Add empty battleHistory array
    - _Requirements: 1.3_

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate BattleRecorder with BattleEngine

  - [x] 6.1 Update CombatSystem to use BattleRecorder

    - Call recordTurn() after each attack with full DamageResult
    - Pass all damage breakdown details
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Update BattleEngine to start/finish recording
    - Call startRecording() when battle starts
    - Call finishRecording() when battle ends
    - Save BattleRecord via BattleHistoryService
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Create History List Page

  - [x] 7.1 Create BattleHistoryListPage component

    - Fetch battles from API with pagination
    - Display battle cards with: date, challenger vs opponent, winner, turns, duration
    - Sort by date descending
    - Navigate to detail on click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.2 Create useBattleHistory hook
    - Fetch and cache battle history
    - Handle pagination state
    - _Requirements: 3.1, 3.5_

- [x] 8. Create History Detail Page

  - [x] 8.1 Create BattleHistoryDetailPage component

    - Display both combatant cards with battle-start stats
    - Show final result summary
    - _Requirements: 4.1, 4.4_

  - [x] 8.2 Create TurnTimeline component
    - Display turn-by-turn list with damage breakdown
    - Show crit indicators, lifesteal heals, HP changes
    - Highlight critical hits and lifesteal events
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 9. Create Battle Replay Player

  - [x] 9.1 Create BattleReplayPlayer component

    - Animate damage numbers and HP bar changes
    - Show crit indicators and lifesteal heals
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Create ReplayControls component

    - Play/Pause button
    - Speed selector (1x, 2x, 4x)
    - Progress indicator
    - _Requirements: 6.4, 6.5_

  - [x] 9.3 Create useReplayState hook
    - Manage replay state (currentTurn, isPlaying, speed)
    - Handle turn progression timing
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 10. Update Auto-Battle Flow

  - [x] 10.1 Modify auto-battle to compute-then-replay
    - Compute all turns first without animation
    - Save BattleRecord
    - Replay animation from saved data
    - _Requirements: 6.6_

- [x] 11. Add Routes and Navigation

  - [x] 11.1 Add routes for history pages
    - /history - Battle History List
    - /history/:id - Battle History Detail
    - Add navigation links
    - _Requirements: 3.3_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
