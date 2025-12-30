# Requirements Document

## Introduction

Hệ thống Gem Skill Tree cho phép hiển thị và quản lý cây tiến hóa của gems sử dụng React Flow. Người chơi có thể xem các đường tiến hóa từ gem cơ bản đến gem nâng cao, với các nhánh khác nhau tùy thuộc vào skill type. Mỗi gem có thể tiến hóa thành các phiên bản mạnh hơn với stat cao hơn hoặc hiệu ứng bổ sung. Skill Tree được hiển thị dưới dạng đồ thị có hướng với các node là gems và edges là đường tiến hóa.

## Glossary

- **Skill_Tree**: Đồ thị có hướng hiển thị các đường tiến hóa của gems
- **Tree_Node**: Node trong skill tree, đại diện cho một gem hoặc gem tier
- **Tree_Edge**: Cạnh nối giữa các nodes, đại diện cho đường tiến hóa
- **Gem_Tier**: Cấp độ của gem (Basic, Advanced, Master, Legendary)
- **Evolution_Path**: Đường tiến hóa từ gem tier thấp lên tier cao hơn
- **Evolution_Cost**: Chi phí (gold/materials) để tiến hóa gem
- **Prerequisite**: Điều kiện cần có trước khi có thể tiến hóa
- **React_Flow**: Thư viện React để xây dựng node-based editors và diagrams
- **Gem**: Viên đá khảm có skill đặc biệt (từ hệ thống gems hiện tại)
- **Skill_Type**: Loại skill của gem (knockback, retreat, double_move, double_attack, execute, leap_strike)

## Requirements

### Requirement 1: Gem Tier System

**User Story:** As a player, I want gems to have different tiers, so that I can progress and upgrade my gems over time.

#### Acceptance Criteria

1. THE Gem_System SHALL support 4 tiers: Basic, Advanced, Master, Legendary
2. WHEN a gem is created THEN the Gem_System SHALL assign it a tier (default: Basic)
3. WHEN displaying a gem THEN the UI SHALL show the gem's tier with distinct visual styling
4. THE Gem_System SHALL store tier information as part of gem data

### Requirement 2: Evolution Path Definition

**User Story:** As a game designer, I want to define evolution paths between gems, so that players have clear upgrade progressions.

#### Acceptance Criteria

1. WHEN an admin creates an evolution path THEN the Evolution_System SHALL store source gem, target gem, and evolution cost
2. THE Evolution_System SHALL validate that target gem tier is higher than source gem tier
3. WHEN an evolution path is deleted THEN the Evolution_System SHALL remove the path without affecting the gems
4. THE Evolution_System SHALL allow multiple evolution paths from a single source gem (branching)
5. THE Evolution_System SHALL prevent circular evolution paths

### Requirement 3: Skill Tree Visualization

**User Story:** As a player, I want to see a visual skill tree, so that I can understand gem evolution paths at a glance.

#### Acceptance Criteria

1. WHEN a user opens the skill tree page THEN the React_Flow_Component SHALL render all gems as nodes
2. WHEN rendering nodes THEN the React_Flow_Component SHALL position gems by tier (left to right: Basic → Legendary)
3. WHEN rendering edges THEN the React_Flow_Component SHALL draw arrows from source gems to target gems
4. WHEN a user hovers over a node THEN the UI SHALL display gem details (name, skill, stats, tier)
5. WHEN a user clicks a node THEN the UI SHALL show detailed gem information and evolution options
6. THE React_Flow_Component SHALL support pan and zoom interactions

### Requirement 4: Node Styling by State

**User Story:** As a player, I want nodes to show different states visually, so that I can quickly see which gems I own and can evolve.

#### Acceptance Criteria

1. WHEN a player owns a gem THEN the Tree_Node SHALL display with "owned" styling (highlighted border)
2. WHEN a gem can be evolved (player owns source and has resources) THEN the Tree_Node SHALL display with "available" styling (glowing effect)
3. WHEN a gem cannot be evolved (missing prerequisites or resources) THEN the Tree_Node SHALL display with "locked" styling (grayed out)
4. WHEN a gem is not owned THEN the Tree_Node SHALL display with "unowned" styling (semi-transparent)

### Requirement 5: Evolution Execution

**User Story:** As a player, I want to evolve my gems through the skill tree, so that I can upgrade my gems to stronger versions.

#### Acceptance Criteria

1. WHEN a player clicks evolve on an available evolution THEN the Evolution_System SHALL deduct the evolution cost
2. WHEN evolution cost is deducted THEN the Evolution_System SHALL create the target gem in player's inventory
3. WHEN evolution completes THEN the Evolution_System SHALL remove the source gem from player's inventory
4. IF player lacks required resources THEN the Evolution_System SHALL reject the evolution and display error message
5. WHEN evolution succeeds THEN the UI SHALL update the skill tree to reflect new ownership state

### Requirement 6: Skill Tree Filtering

**User Story:** As a player, I want to filter the skill tree by skill type, so that I can focus on specific gem categories.

#### Acceptance Criteria

1. WHEN a user selects a skill type filter THEN the React_Flow_Component SHALL highlight nodes matching that skill type
2. WHEN a user selects a skill type filter THEN the React_Flow_Component SHALL dim nodes not matching that skill type
3. WHEN a user clears the filter THEN the React_Flow_Component SHALL restore all nodes to normal visibility
4. THE Filter_UI SHALL provide options for all skill types: knockback, retreat, double_move, double_attack, execute, leap_strike

### Requirement 7: Evolution Cost Display

**User Story:** As a player, I want to see evolution costs clearly, so that I can plan my gem upgrades.

#### Acceptance Criteria

1. WHEN displaying an edge THEN the UI SHALL show the evolution cost on or near the edge
2. WHEN a player hovers over an edge THEN the UI SHALL display detailed cost breakdown
3. WHEN player has insufficient resources THEN the Cost_Display SHALL show missing resources in red
4. WHEN player has sufficient resources THEN the Cost_Display SHALL show resources in green

### Requirement 8: Skill Tree Data Persistence

**User Story:** As a developer, I want skill tree data to be persisted via json-server, so that evolution paths and player progress are saved.

#### Acceptance Criteria

1. WHEN evolution paths are created THEN the Data_Service SHALL persist them to json-server database (db.json)
2. WHEN player evolves a gem THEN the Data_Service SHALL update player's gem inventory via json-server API
3. WHEN loading skill tree THEN the Data_Service SHALL retrieve all evolution paths and player ownership data from json-server
4. THE Data_Service SHALL use RESTful API calls to json-server for all CRUD operations

### Requirement 10: Config-Driven Skill Tree

**User Story:** As a game designer, I want the skill tree structure to be config-driven, so that I can easily modify evolution paths without code changes.

#### Acceptance Criteria

1. THE Skill_Tree_Config SHALL define tier names, colors, and ordering in a configuration object
2. THE Skill_Tree_Config SHALL define node styling (size, colors, borders) for each state (owned, available, locked, unowned)
3. THE Skill_Tree_Config SHALL define edge styling (colors, arrow types, label positions)
4. THE Skill_Tree_Config SHALL define layout parameters (tier spacing, node spacing, canvas size)
5. WHEN config values change THEN the React_Flow_Component SHALL re-render with updated styling without code changes

### Requirement 9: Skill Tree Layout Algorithm

**User Story:** As a player, I want the skill tree to be automatically laid out, so that it's easy to read without manual positioning.

#### Acceptance Criteria

1. WHEN rendering the skill tree THEN the Layout_Algorithm SHALL arrange nodes in columns by tier
2. WHEN multiple nodes exist in same tier THEN the Layout_Algorithm SHALL distribute them vertically with even spacing
3. WHEN edges cross THEN the Layout_Algorithm SHALL minimize edge crossings where possible
4. THE Layout_Algorithm SHALL maintain consistent spacing between nodes
