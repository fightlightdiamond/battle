# Requirements Document

## Introduction

Hệ thống Battle History cho phép lưu trữ chi tiết từng trận đấu vào json-server và cung cấp trang History để xem lại. Mỗi trận đấu được lưu với đầy đủ thông tin để có thể tái hiện lại hoàn toàn như đang xem replay: thông tin card tham chiến (tên, ảnh, full stats), từng turn với damage breakdown cực kỳ chi tiết (base damage, có crit không, crit bonus bao nhiêu, armor pen, effective defense, lifesteal %), HP trước/sau mỗi đòn đánh của cả attacker và defender, và kết quả cuối cùng.

## Glossary

- **Battle Record**: Object chứa toàn bộ thông tin một trận đấu đã hoàn thành, đủ để replay
- **Turn Record**: Object chứa chi tiết một lượt đánh: ai đánh ai, damage breakdown, HP changes
- **Combatant Snapshot**: Snapshot đầy đủ stats của card tại thời điểm bắt đầu trận (name, image, hp, atk, def, spd, critChance, critDamage, armorPen, lifesteal)
- **Damage Breakdown**: Chi tiết tính damage: baseDamage, isCrit, critMultiplier, critBonus, armorPen%, effectiveDef, finalDamage
- **HP State**: Trạng thái HP của cả 2 card tại một thời điểm: challengerHp, opponentHp
- **Replay Data**: Dữ liệu đủ để vẽ lại trận đấu từng frame

## Requirements

### Requirement 1

**User Story:** As a player, I want battle records saved automatically when a battle ends, so that I can review my battle history later.

#### Acceptance Criteria

1. WHEN a battle ends with a winner THEN the system SHALL create a BattleRecord with unique ID and timestamp
2. WHEN saving a battle record THEN the system SHALL include both combatant snapshots with full stats at battle start
3. WHEN saving a battle record THEN the system SHALL persist the record to json-server at /battleHistory endpoint
4. THE BattleRecord SHALL include: id, startedAt, endedAt, winnerId, winnerName, totalTurns, challenger snapshot, opponent snapshot

### Requirement 2

**User Story:** As a player, I want detailed turn-by-turn logs saved, so that I can replay and understand exactly what happened in each turn.

#### Acceptance Criteria

1. WHEN an attack occurs THEN the system SHALL record a TurnRecord with: turnNumber, attackerId, attackerName, defenderId, defenderName
2. THE TurnRecord SHALL include full damage breakdown: baseDamage (trước crit), isCrit (boolean), critMultiplier (e.g. 1.5), critBonus (damage thêm từ crit), armorPenPercent, defenderOriginalDef, effectiveDefense (sau armor pen), finalDamage
3. THE TurnRecord SHALL include lifesteal detail: attackerLifestealPercent, lifestealAmount (HP hồi), attackerHpBefore, attackerHpAfter (sau khi hồi)
4. THE TurnRecord SHALL include defender HP state: defenderHpBefore, defenderHpAfter, defenderMaxHp, isKnockout
5. THE TurnRecord SHALL include timestamp of the action for replay timing
6. WHEN saving turn records THEN the system SHALL preserve the exact order of turns (turnNumber sequential from 1)

### Requirement 3

**User Story:** As a player, I want to view a list of my past battles, so that I can select which battle to review.

#### Acceptance Criteria

1. WHEN user navigates to Battle History page THEN the system SHALL fetch and display all battle records from json-server
2. THE battle list SHALL display: date/time, challenger name vs opponent name, winner name, total turns, battle duration
3. WHEN user clicks on a battle record THEN the system SHALL navigate to battle detail view
4. THE battle list SHALL be sorted by date descending (newest first)
5. THE system SHALL support pagination with 10 battles per page

### Requirement 4

**User Story:** As a player, I want to see detailed battle replay data, so that I can analyze the battle turn by turn.

#### Acceptance Criteria

1. WHEN viewing battle detail THEN the system SHALL display both combatant cards with their battle-start stats
2. WHEN viewing battle detail THEN the system SHALL display turn-by-turn timeline with full damage breakdown
3. THE turn timeline SHALL show: turn number, attacker name, damage dealt, crit indicator, lifesteal heal, HP changes
4. THE battle detail SHALL display final result: winner, total turns, battle duration
5. THE system SHALL highlight critical hits and lifesteal events with visual indicators

### Requirement 5

**User Story:** As a developer, I want battle history data structured for easy replay, so that future replay feature can use this data.

#### Acceptance Criteria

1. THE BattleRecord SHALL include hpTimeline array tracking both combatants' HP after each action for easy chart/animation
2. THE hpTimeline entry SHALL contain: turnNumber, challengerHp, challengerMaxHp, opponentHp, opponentMaxHp, timestamp
3. WHEN battle ends THEN the system SHALL calculate and store battleDurationMs (endedAt - startedAt)
4. THE data structure SHALL be serializable to JSON and deserializable without data loss (round-trip)
5. THE system SHALL export TypeScript interfaces for BattleRecord, TurnRecord, CombatantSnapshot, DamageBreakdown
6. THE BattleRecord SHALL include initialState with both combatants' HP at turn 0 (before any attack)

### Requirement 6

**User Story:** As a player, I want to replay a battle with animations, so that I can watch the battle unfold step by step like watching a recording.

#### Acceptance Criteria

1. WHEN user clicks "Replay" on battle detail THEN the system SHALL play back the battle using saved TurnRecords
2. THE replay SHALL show damage numbers, crit indicators, lifesteal heals animated on the cards
3. THE replay SHALL update HP bars progressively based on hpTimeline data
4. THE replay SHALL support play/pause controls
5. THE replay SHALL support speed control (1x, 2x, 4x)
6. WHEN auto-battle runs THEN the system SHALL compute all turns first, save BattleRecord, then replay the animation from saved data
