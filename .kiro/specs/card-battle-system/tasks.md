# Implementation Plan

- [x] 1. Set up battle feature structure and types

  - [x] 1.1 Create battle feature directory structure
    - Create `src/features/battle/` with subdirectories: types, services, store, components, pages
    - Create index.ts barrel exports
    - _Requirements: 1.1, 2.1_
  - [x] 1.2 Define battle type interfaces
    - Create BattleCard, BattleLogEntry, BattleState, AttackResult interfaces
    - Define BattlePhase and BattleResult types
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Implement battle service with combat logic

  - [x] 2.1 Create battleService with core functions
    - Implement calculateAttack() - returns AttackResult with damage, isCritical, isKnockout
    - Implement checkBattleEnd() - returns BattleResult based on HP values
    - Implement calculateHpPercentage() and getHpBarColor()
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 8.2_
  - [x] 2.2 Write property test for attack damage calculation
    - **Property 3: Attack Damage Equals ATK**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 2.3 Write property test for HP bar color thresholds
    - **Property 5: HP Bar Color Thresholds**
    - **Validates: Requirements 2.3, 4.1, 4.2, 4.3, 8.3**
  - [x] 2.4 Write property test for victory determination
    - **Property 7: Victory Determination**
    - **Validates: Requirements 5.1**
  - [x] 2.5 Write property test for critical damage threshold
    - **Property 11: Critical Damage Threshold**
    - **Validates: Requirements 8.2**

- [x] 3. Implement battle store with Zustand

  - [x] 3.1 Create battleStore with state and actions
    - Implement selectCard1, selectCard2 with duplicate prevention
    - Implement startBattle, executeAttack, toggleAutoBattle, resetBattle
    - Manage phase transitions: setup → ready → fighting → finished
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.3, 5.4, 7.4_
  - [x] 3.2 Write property test for card selection prevents duplicates
    - **Property 1: Card Selection Prevents Duplicates**
    - **Validates: Requirements 1.4**
  - [x] 3.3 Write property test for battle phase transitions
    - **Property 2: Battle Phase Transitions**
    - **Validates: Requirements 1.2, 1.3, 1.5**
  - [x] 3.4 Write property test for turn alternation
    - **Property 4: Turn Alternation**
    - **Validates: Requirements 3.3**
  - [x] 3.5 Write property test for battle end disables attacks
    - **Property 8: Battle End Disables Attacks**
    - **Validates: Requirements 5.4**
  - [x] 3.6 Write property test for auto-battle stops on victory
    - **Property 10: Auto-Battle Stops on Victory**
    - **Validates: Requirements 7.4**

- [x] 4. Implement formatting utilities

  - [x] 4.1 Create formatters utility functions
    - Implement formatHpDisplay(currentHp, maxHp) → "current / max"
    - Implement formatBattleLogEntry(attacker, defender, damage, remainingHp)
    - Implement formatVictoryLog(winnerName)
    - _Requirements: 4.4, 6.1, 6.2, 6.3_
  - [x] 4.2 Write property test for HP display format
    - **Property 6: HP Display Format**
    - **Validates: Requirements 4.4**
  - [x] 4.3 Write property test for battle log format
    - **Property 9: Battle Log Format**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement HP Bar component

  - [x] 6.1 Create HPBar component with animations
    - Display current/max HP with formatHpDisplay
    - Animate width transition (500ms) when HP changes
    - Color based on getHpBarColor (green/yellow/red)
    - Flash effect on damage received
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement BattleCard component

  - [x] 7.1 Create BattleCard component with visual states
    - Display card image, name, ATK stat
    - Include HPBar component
    - Attack animation (shake/lunge effect 400ms)
    - Damage received animation
    - Danger indicator when HP < 25% (pulsing red border)
    - Winner/Loser visual states
    - _Requirements: 2.1, 3.5, 8.1, 8.3_

- [x] 8. Implement DamageNumber component

  - [x] 8.1 Create floating damage number animation
    - Display damage value with fly-up animation (800ms)
    - Enhanced style for critical damage
    - Position based on defender location
    - _Requirements: 3.4, 8.2_

- [x] 9. Implement Battle Log component

  - [x] 9.1 Create BattleLog component
    - Display list of BattleLogEntry items
    - Auto-scroll to latest entry
    - Different styling for attack/damage/victory entries
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Implement Battle Controls component

  - [x] 10.1 Create BattleControls with action buttons
    - Attack button (enabled only in 'fighting' phase)
    - Auto-battle toggle (Pause/Resume)
    - New Battle button (visible in 'finished' phase)
    - _Requirements: 3.1, 7.1, 7.2, 7.3, 5.5_

- [x] 11. Implement Victory Overlay component

  - [x] 11.1 Create VictoryOverlay with celebration effects
    - Display winner card with "VICTORY" text and glow effect
    - Display loser card with "DEFEATED" text
    - Confetti/particle animation
    - New Battle button
    - _Requirements: 5.2, 5.3, 8.5_

- [x] 12. Implement Card Selector component

  - [x] 12.1 Create CardSelector for match setup
    - Display grid of available cards from existing card store
    - Highlight selected cards
    - Prevent selecting same card twice with warning toast
    - Show selected cards preview with stats
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 13. Implement Battle Setup Page

  - [x] 13.1 Create BattleSetupPage
    - Two CardSelector areas for card1 and card2
    - Display selected cards side by side
    - Start Battle button (enabled when both cards selected)
    - Navigation to BattleArenaPage
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 14. Implement Battle Arena Page

  - [x] 14.1 Create BattleArenaPage with combat UI
    - Layout: Card1 (left) vs Card2 (right)
    - Entrance animation on load
    - BattleControls at bottom
    - BattleLog panel (collapsible sidebar)
    - VictoryOverlay when battle ends
    - _Requirements: 2.1, 8.4_
  - [x] 14.2 Implement auto-battle timer logic
    - useEffect with setInterval for 1.5s delay
    - Clear interval on pause or battle end
    - _Requirements: 7.1, 7.4_

- [ ] 15. Integrate battle feature with app routing

  - [ ] 15.1 Add battle routes to App.tsx
    - /battle/setup → BattleSetupPage
    - /battle/arena → BattleArenaPage
    - Add navigation link to battle from main app
    - _Requirements: 1.1_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
