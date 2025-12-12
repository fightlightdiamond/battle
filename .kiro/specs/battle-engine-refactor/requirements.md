# Requirements Document

## Introduction

Xây dựng AFK Battle Engine - một game engine chuyên biệt cho thể loại AFK/Idle game. Engine xử lý combat tự động, progression hệ thống, wave enemies, và có khả năng simulate nhanh cho offline rewards. Kiến trúc tách biệt hoàn toàn khỏi UI layer, dễ mở rộng và tối ưu performance cho việc chạy nhiều battle đồng thời.

## Glossary

- **AFK_Battle_Engine**: Core engine xử lý toàn bộ combat logic cho AFK game
- **Combat_Simulator**: Module simulate battle nhanh cho tính toán offline rewards
- **AFKCombatant**: Entity đại diện cho hero hoặc monster trong battle
- **Formation**: Cách sắp xếp vị trí các combatant trong đội hình
- **Stage**: Một màn chơi với enemies
- **AFK_Skill**: Skill tự động kích hoạt theo điều kiện (cooldown, HP threshold...)
- **Buff_System**: Hệ thống quản lý buffs/debuffs tự động
- **Stage_Scaling**: Công thức scale stats theo stage number
- **Offline_Rewards**: Phần thưởng tính toán khi player offline
- **Combat_Logger**: Module ghi log battle cho debug và replay

## Requirements

### Requirement 1: AFK Battle State Management

**User Story:** As a developer, I want an immutable battle state optimized for AFK gameplay, so that I can track battles and calculate offline progress.

#### Acceptance Criteria

1. WHEN the AFK_Battle_Engine initializes THEN the Engine SHALL create an AFKBattleState containing combatants, formation, current wave, and battle progress
2. WHEN any combat action occurs THEN the Engine SHALL produce a new state instead of mutating existing state
3. WHEN serializing AFKBattleState THEN the Engine SHALL produce a JSON-compatible representation for save/load
4. WHEN deserializing AFKBattleState THEN the Engine SHALL reconstruct the exact battle state from JSON
5. WHEN battle state changes THEN the Engine SHALL emit state change events for UI synchronization

### Requirement 2: Auto Combat System

**User Story:** As a player, I want battles to run automatically, so that I can progress without manual input.

#### Acceptance Criteria

1. WHEN a battle starts THEN the Auto_Combat_System SHALL automatically select targets based on formation position
2. WHEN a combatant's turn arrives THEN the Auto_Combat_System SHALL execute basic attack or skill based on AI rules
3. WHEN calculating damage THEN the Auto_Combat_System SHALL use the formula: damage = ATK \* (1 - DEF/(DEF + 100))
4. WHEN a combatant is defeated THEN the Auto_Combat_System SHALL remove them from active combat
5. WHEN all enemies in a wave are defeated THEN the Auto_Combat_System SHALL proceed to next wave or end battle

### Requirement 3: Formation System

**User Story:** As a player, I want to arrange my heroes in formation, so that positioning affects battle strategy.

#### Acceptance Criteria

1. WHEN setting up battle THEN the Formation_System SHALL arrange combatants in a grid (front/back rows)
2. WHEN selecting attack target THEN the Formation_System SHALL prioritize front row enemies
3. WHEN front row is empty THEN the Formation_System SHALL allow targeting back row
4. WHEN a hero is placed in front row THEN the Formation_System SHALL increase their threat level
5. WHEN querying formation THEN the Formation_System SHALL return positions of all combatants

### Requirement 4: Skill Auto System

**User Story:** As a player, I want skills to activate automatically based on conditions, so that battles feel dynamic without manual control.

#### Acceptance Criteria

1. WHEN a skill's cooldown reaches zero THEN the Skill_Auto_System SHALL queue the skill for execution
2. WHEN a combatant's HP drops below skill threshold THEN the Skill_Auto_System SHALL trigger conditional skills
3. WHEN executing a skill THEN the Skill_Auto_System SHALL apply skill effects and start cooldown
4. WHEN multiple skills are ready THEN the Skill_Auto_System SHALL prioritize by skill priority value
5. WHEN a skill targets multiple enemies THEN the Skill_Auto_System SHALL apply effects to all valid targets

### Requirement 5: Buff System

**User Story:** As a developer, I want a flexible buff/debuff system, so that I can implement various status effects.

#### Acceptance Criteria

1. WHEN a buff is applied THEN the Buff_System SHALL add it to combatant's active buffs list
2. WHEN calculating stats THEN the Buff_System SHALL apply all active buff modifiers
3. WHEN a buff duration expires THEN the Buff_System SHALL remove it and recalculate stats
4. WHEN stacking buffs of same type THEN the Buff_System SHALL follow stack rules (replace, add, or max)
5. WHEN a combatant is defeated THEN the Buff_System SHALL clear all their active buffs

### Requirement 6: Stage Scaling and Progression

**User Story:** As a developer, I want enemy stats to scale with stage number, so that difficulty increases progressively.

#### Acceptance Criteria

1. WHEN generating enemy stats THEN the Stage*Scaling SHALL apply formula: stat = baseStat * (1 + stageNumber \_ 0.1)
2. WHEN player completes a stage THEN the Stage_Progression SHALL unlock the next stage
3. WHEN player fails a stage THEN the Stage_Progression SHALL allow retry without penalty
4. WHEN querying max stage THEN the Stage_Progression SHALL return highest completed stage + 1
5. WHEN calculating rewards THEN the Stage_Progression SHALL scale rewards based on stage number

### Requirement 7: Combat Simulator for Offline

**User Story:** As a player, I want to receive rewards for time spent offline, so that I can progress even when not playing.

#### Acceptance Criteria

1. WHEN player returns after being offline THEN the Combat_Simulator SHALL calculate battles that could have occurred
2. WHEN simulating battles THEN the Combat_Simulator SHALL use simplified calculations for performance
3. WHEN simulation completes THEN the Combat_Simulator SHALL return total rewards earned
4. WHEN offline time exceeds cap THEN the Combat_Simulator SHALL limit rewards to maximum offline duration
5. WHEN simulating THEN the Combat_Simulator SHALL process at minimum 1000 battles per second

### Requirement 8: Damage Calculator

**User Story:** As a developer, I want centralized damage calculations, so that combat math is consistent and tunable.

#### Acceptance Criteria

1. WHEN calculating physical damage THEN the Damage*Calculator SHALL use formula: ATK * skillMultiplier \_ (1 - DEF/(DEF + 100))
2. WHEN calculating critical hit THEN the Damage_Calculator SHALL multiply damage by critDamage if random < critRate
3. WHEN damage is calculated THEN the Damage_Calculator SHALL apply element effectiveness multipliers
4. WHEN minimum damage is reached THEN the Damage_Calculator SHALL ensure at least 1 damage is dealt
5. WHEN calculating healing THEN the Damage_Calculator SHALL use formula: healPower \* (1 + healBonus)

### Requirement 9: Combat Logger

**User Story:** As a developer, I want detailed combat logs, so that I can debug and display battle history.

#### Acceptance Criteria

1. WHEN any combat action occurs THEN the Combat_Logger SHALL record the action with timestamp
2. WHEN logging damage THEN the Combat_Logger SHALL include attacker, defender, damage amount, and damage type
3. WHEN logging skill use THEN the Combat_Logger SHALL include skill name, targets, and effects applied
4. WHEN battle ends THEN the Combat_Logger SHALL summarize total damage dealt by each combatant
5. WHEN querying logs THEN the Combat_Logger SHALL return logs filtered by combatant or action type
