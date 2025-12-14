# Requirements Document

## Introduction

Hệ thống Matchup Betting cho phép tách biệt quá trình tạo cặp đấu (matchup) và đặt cược (betting). Admin/System tạo các cặp đấu và lưu vào json-server. Người chơi xem danh sách các cặp đấu đang chờ và đặt cược vào card họ nghĩ sẽ thắng. Người chơi có thể hủy hoặc cập nhật bet của mình trước khi trận đấu bắt đầu. Sau khi trận đấu kết thúc, hệ thống tự động trả thưởng cho người thắng cược.

## Glossary

- **Matchup_System**: Hệ thống quản lý các cặp đấu giữa hai card
- **Matchup**: Một cặp đấu bao gồm hai card, trạng thái và kết quả
- **Matchup_Status**: Trạng thái của cặp đấu (pending, in_progress, completed, cancelled)
- **Betting_System**: Hệ thống quản lý việc đặt cược vào kết quả matchup
- **Active_Bet**: Một lượt đặt cược đang chờ kết quả (chưa resolved)
- **Bet_Status**: Trạng thái của bet (active, won, lost, cancelled, refunded)
- **Gold**: Đơn vị tiền tệ trong game
- **Payout_Multiplier**: Hệ số nhân thưởng khi thắng cược (x2)

## Requirements

### Requirement 1

**User Story:** As an admin, I want to create matchups between two cards, so that players can bet on the outcome.

#### Acceptance Criteria

1. WHEN an admin selects two different cards and confirms creation THEN the Matchup_System SHALL create a new matchup with status "pending" and persist it to json-server
2. WHEN a matchup is created THEN the Matchup_System SHALL record card1Id, card2Id, card1Name, card2Name, createdAt timestamp, and status
3. WHEN an admin attempts to create a matchup with the same card for both positions THEN the Matchup_System SHALL reject the creation and display an error message
4. WHEN serializing matchup records THEN the Matchup_System SHALL encode them using JSON format
5. WHEN deserializing matchup records THEN the Matchup_System SHALL parse them from JSON format and validate the structure

### Requirement 2

**User Story:** As a player, I want to view all pending matchups, so that I can decide which matchup to bet on.

#### Acceptance Criteria

1. WHEN a player navigates to the matchup list page THEN the Matchup_System SHALL display all matchups with status "pending" sorted by createdAt descending
2. WHEN displaying a matchup THEN the Matchup_System SHALL show both card names, card images, card stats, and total bets placed on each side
3. WHEN no pending matchups exist THEN the Matchup_System SHALL display an appropriate empty state message
4. WHEN loading matchup list THEN the Matchup_System SHALL fetch records from the json-server

### Requirement 3

**User Story:** As a player, I want to place a bet on a pending matchup, so that I can earn gold if I predict correctly.

#### Acceptance Criteria

1. WHEN a player selects a card in a pending matchup and enters a bet amount THEN the Betting_System SHALL create an active bet with matchupId, selectedCardId, and betAmount
2. WHEN a player attempts to place a bet exceeding their current gold balance THEN the Betting_System SHALL reject the bet and display an insufficient funds message
3. WHEN a player attempts to place a bet with zero or negative amount THEN the Betting_System SHALL reject the bet and maintain the current state
4. WHEN a valid bet is placed THEN the Betting_System SHALL deduct the bet amount from the player's gold balance immediately
5. WHEN a valid bet is placed THEN the Betting_System SHALL persist the bet record to json-server with status "active"
6. WHEN a matchup status is not "pending" THEN the Betting_System SHALL prevent new bets from being placed on that matchup

### Requirement 4

**User Story:** As a player, I want to update or cancel my bet before the matchup starts, so that I can change my mind.

#### Acceptance Criteria

1. WHEN a player has an active bet on a pending matchup and requests to cancel THEN the Betting_System SHALL refund the bet amount to the player's gold balance
2. WHEN a bet is cancelled THEN the Betting_System SHALL update the bet status to "cancelled" in json-server
3. WHEN a player has an active bet on a pending matchup and submits a new bet amount THEN the Betting_System SHALL update the bet with the new amount
4. WHEN updating a bet with a higher amount THEN the Betting_System SHALL deduct the difference from the player's gold balance
5. WHEN updating a bet with a lower amount THEN the Betting_System SHALL refund the difference to the player's gold balance
6. WHEN a matchup status changes from "pending" to "in_progress" THEN the Betting_System SHALL prevent any bet modifications or cancellations

### Requirement 5

**User Story:** As an admin, I want to start a matchup battle, so that the outcome can be determined.

#### Acceptance Criteria

1. WHEN an admin triggers a matchup to start THEN the Matchup_System SHALL update the matchup status to "in_progress"
2. WHEN a matchup starts THEN the Matchup_System SHALL execute the battle using the existing battle engine
3. WHEN the battle completes THEN the Matchup_System SHALL update the matchup with winnerId, winnerName, and status "completed"
4. WHEN the matchup is completed THEN the Matchup_System SHALL trigger the payout resolution process

### Requirement 6

**User Story:** As a player, I want to receive my payout automatically when the matchup I bet on completes, so that I get rewarded for correct predictions.

#### Acceptance Criteria

1. WHEN a matchup completes and a player's bet matches the winner THEN the Betting_System SHALL credit the player with 2x the original bet amount
2. WHEN a matchup completes and a player's bet does not match the winner THEN the Betting_System SHALL update the bet status to "lost" (gold already deducted)
3. WHEN payout is calculated THEN the Betting_System SHALL update the player's gold balance immediately
4. WHEN a winning bet is resolved THEN the Betting_System SHALL update the bet status to "won" and record the payout amount
5. WHEN a matchup is cancelled THEN the Betting_System SHALL refund all active bets and update their status to "refunded"

### Requirement 7

**User Story:** As a player, I want to view my betting history on matchups, so that I can track my wins and losses.

#### Acceptance Criteria

1. WHEN a player navigates to the bet history page THEN the Betting_System SHALL display all bets sorted by timestamp descending
2. WHEN displaying a bet record THEN the Betting_System SHALL show matchup info, bet amount, selected card, result, payout, and status
3. WHEN the bet history is empty THEN the Betting_System SHALL display an appropriate empty state message
4. WHEN loading bet history THEN the Betting_System SHALL fetch records from the json-server

### Requirement 8

**User Story:** As a player, I want to view the battle replay of completed matchups, so that I can see how the battle unfolded.

#### Acceptance Criteria

1. WHEN a matchup battle completes THEN the Matchup_System SHALL save the battle history record to json-server
2. WHEN a player views a completed matchup THEN the Matchup_System SHALL display a link to view the battle replay
3. WHEN a player clicks on the replay link THEN the Matchup_System SHALL navigate to the battle replay page with the recorded battle data
4. WHEN displaying battle history THEN the Matchup_System SHALL show turn-by-turn combat log, damage dealt, and final outcome

### Requirement 9

**User Story:** As a player, I want to see my current gold balance at all times, so that I know how much I can bet.

#### Acceptance Criteria

1. WHEN the application loads THEN the Betting_System SHALL display the current gold balance in the UI header
2. WHEN the gold balance changes (bet placed, bet cancelled, payout received) THEN the Betting_System SHALL update the displayed balance immediately
3. WHEN persisting gold balance THEN the Betting_System SHALL store it in local storage for offline access
