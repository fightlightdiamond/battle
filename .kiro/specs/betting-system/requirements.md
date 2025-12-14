# Requirements Document

## Introduction

Hệ thống Betting cho phép người chơi đặt cược gold vào đội chiến thắng trong các trận battle. Người chơi nhận 1000 gold miễn phí mỗi ngày (lần đầu đăng nhập trong ngày). Nếu đặt cược đúng đội thắng, người chơi nhận x2 số gold đã đặt. Lịch sử đặt cược được lưu trữ trong json-api và có thể xem lại.

## Glossary

- **Betting_System**: Hệ thống quản lý việc đặt cược gold vào kết quả trận battle
- **Gold**: Đơn vị tiền tệ trong game, dùng để đặt cược
- **Daily_Bonus**: Phần thưởng 1000 gold nhận được lần đầu tiên đăng nhập mỗi ngày
- **Bet**: Một lượt đặt cược bao gồm số gold và đội được chọn
- **Bet_History**: Lịch sử các lượt đặt cược của người chơi
- **Payout_Multiplier**: Hệ số nhân thưởng khi thắng cược (x2)

## Requirements

### Requirement 1

**User Story:** As a player, I want to receive 1000 gold on my first login each day, so that I have currency to place bets.

#### Acceptance Criteria

1. WHEN a player opens the application for the first time in a calendar day THEN the Betting_System SHALL credit 1000 gold to the player's balance
2. WHEN a player has already received the Daily_Bonus today THEN the Betting_System SHALL prevent additional Daily_Bonus claims until the next calendar day
3. WHEN the Daily_Bonus is credited THEN the Betting_System SHALL persist the claim timestamp to local storage immediately
4. WHEN a player receives the Daily_Bonus THEN the Betting_System SHALL display a notification confirming the gold amount received

### Requirement 2

**User Story:** As a player, I want to place a bet on which card will win the battle, so that I can earn more gold if I predict correctly.

#### Acceptance Criteria

1. WHEN a player selects a card to bet on before battle starts THEN the Betting_System SHALL record the bet with the selected card ID and bet amount
2. WHEN a player attempts to place a bet exceeding their current gold balance THEN the Betting_System SHALL reject the bet and display an insufficient funds message
3. WHEN a player attempts to place a bet with zero or negative amount THEN the Betting_System SHALL reject the bet and maintain the current state
4. WHEN a valid bet is placed THEN the Betting_System SHALL deduct the bet amount from the player's gold balance immediately
5. WHEN a battle is in progress THEN the Betting_System SHALL prevent new bets from being placed until the battle concludes

### Requirement 3

**User Story:** As a player, I want to receive double my bet amount when I win and lose my bet when I lose, so that betting has meaningful risk and reward.

#### Acceptance Criteria

1. WHEN a battle ends and the player's bet matches the winner THEN the Betting_System SHALL credit the player with 2x the original bet amount (net profit = bet amount)
2. WHEN a battle ends and the player's bet does not match the winner THEN the Betting_System SHALL forfeit the bet amount (player loses the gold already deducted)
3. WHEN payout is calculated THEN the Betting_System SHALL update the player's gold balance immediately after battle conclusion
4. WHEN a winning bet is resolved THEN the Betting_System SHALL display the payout amount to the player

### Requirement 4

**User Story:** As a player, I want my bet history saved to the server, so that my betting records are preserved.

#### Acceptance Criteria

1. WHEN a bet is resolved (win or lose) THEN the Betting_System SHALL persist the bet record to the json-api server
2. WHEN persisting a bet record THEN the Betting_System SHALL include bet ID, battle ID, bet amount, selected card ID, winner card ID, payout amount, and timestamp
3. WHEN the json-api server is unavailable THEN the Betting_System SHALL queue the bet record for retry and notify the player of the sync status
4. WHEN serializing bet records THEN the Betting_System SHALL encode them using JSON format
5. WHEN deserializing bet records THEN the Betting_System SHALL parse them from JSON format and validate the structure

### Requirement 5

**User Story:** As a player, I want to view my betting history, so that I can track my wins and losses over time.

#### Acceptance Criteria

1. WHEN a player navigates to the bet history page THEN the Betting_System SHALL display a list of all past bets sorted by timestamp descending
2. WHEN displaying a bet record THEN the Betting_System SHALL show bet amount, selected card name, winner card name, payout amount, and result (win/lose)
3. WHEN the bet history is empty THEN the Betting_System SHALL display an appropriate empty state message
4. WHEN loading bet history THEN the Betting_System SHALL fetch records from the json-api server

### Requirement 6

**User Story:** As a player, I want to see my current gold balance at all times, so that I know how much I can bet.

#### Acceptance Criteria

1. WHEN the application loads THEN the Betting_System SHALL display the current gold balance in the UI header
2. WHEN the gold balance changes (bet placed, payout received, daily bonus) THEN the Betting_System SHALL update the displayed balance immediately
3. WHEN persisting gold balance THEN the Betting_System SHALL store it in local storage for offline access
