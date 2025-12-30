# Implementation Plan: Gem Skill Tree

## Overview

Triển khai hệ thống Gem Skill Tree sử dụng React Flow để hiển thị cây tiến hóa của gems. Implementation theo config-driven approach với dữ liệu lưu trữ qua json-server.

## Tasks

- [x] 1. Setup React Flow và cấu trúc thư mục
  - [x] 1.1 Cài đặt reactflow package
    - Chạy `npm install reactflow`
    - _Requirements: 3.1_
  - [x] 1.2 Tạo cấu trúc thư mục cho skill tree
    - Tạo `src/features/gems/types/gemTier.ts`
    - Tạo `src/features/gems/types/evolutionPath.ts`
    - Tạo `src/features/gems/types/skillTree.ts`
    - Tạo `src/features/gems/config/skillTreeConfig.ts`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Implement Gem Tier Types và Config
  - [x] 2.1 Implement GemTier types và TIER_ORDER constant
    - Định nghĩa GemTier type với 4 tiers
    - Định nghĩa TIER_ORDER mapping
    - Extend Gem interface thành TieredGem
    - _Requirements: 1.1, 1.4_
  - [x] 2.2 Write property test cho Gem Tier
    - **Property 1: Gem Tier Default Assignment**
    - **Property 2: Gem Tier Persistence Round Trip**
    - **Validates: Requirements 1.2, 1.4**
  - [x] 2.3 Implement SkillTreeConfig với default values
    - Định nghĩa TierConfig, NodeStyleConfig, EdgeStyleConfig, LayoutConfig
    - Tạo defaultSkillTreeConfig object
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 3. Implement Evolution Path Types và Service
  - [x] 3.1 Implement EvolutionPath types
    - Định nghĩa EvolutionCost interface
    - Định nghĩa EvolutionPath interface
    - Định nghĩa EvolutionPathInput interface
    - _Requirements: 2.1_
  - [x] 3.2 Implement evolutionService với json-server API
    - Implement getAllPaths, getPathById, createPath, updatePath, deletePath
    - Implement validatePath cho tier validation
    - Implement checkCircularPath
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1_
  - [x] 3.3 Write property tests cho Evolution Path
    - **Property 3: Evolution Path Round Trip**
    - **Property 4: Evolution Path Tier Validation**
    - **Property 5: Evolution Path Deletion Isolation**
    - **Property 6: Multiple Evolution Paths from Source**
    - **Property 7: Circular Path Prevention**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Layout Engine
  - [x] 5.1 Implement calculateNodePositions function
    - Group gems by tier
    - Calculate x-position based on tier
    - Distribute y-positions evenly within tier
    - _Requirements: 9.1, 9.2, 9.4_
  - [x] 5.2 Implement gemsToNodes function
    - Convert TieredGem array to GemFlowNode array
    - Apply positions from calculateNodePositions
    - _Requirements: 3.1, 3.2_
  - [x] 5.3 Implement getNodeState function
    - Determine node state based on ownership và available evolutions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.4 Implement pathsToEdges function
    - Convert EvolutionPath array to EvolutionFlowEdge array
    - Calculate canAfford based on player resources
    - _Requirements: 3.3, 7.1, 7.3, 7.4_
  - [x] 5.5 Write property tests cho Layout Engine
    - **Property 8: Node Generation Count**
    - **Property 9: Node Position by Tier**
    - **Property 10: Edge Source/Target Mapping**
    - **Property 11: Node State Determination**
    - **Property 15: Edge Cost Affordability**
    - **Property 16: Layout Tier Grouping**
    - **Property 17: Layout Vertical Distribution**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.1-4.4, 7.3, 7.4, 9.1, 9.2, 9.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement React Flow Components
  - [x] 7.1 Implement GemNode component
    - Render gem với tier badge, name, skill type, activation chance
    - Apply styling từ config based on node state
    - Add React Flow handles
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4_
  - [x] 7.2 Implement EvolutionEdge component
    - Render edge với bezier path
    - Display cost label on edge
    - Color based on canAfford
    - _Requirements: 3.3, 7.1, 7.3, 7.4_
  - [x] 7.3 Implement useSkillTreeConfig hook
    - Provide config context to components
    - _Requirements: 10.5_
  - [x] 7.4 Implement useSkillTreeData hook
    - Fetch gems và evolution paths từ json-server
    - Apply filtering logic
    - Generate nodes và edges
    - _Requirements: 6.1, 6.2, 6.3, 8.3_
  - [x] 7.5 Write property test cho Filtering
    - **Property 14: Skill Type Filtering**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Implement Skill Tree Canvas và Page
  - [x] 8.1 Implement SkillTreeCanvas component
    - Setup ReactFlow với nodes, edges, nodeTypes, edgeTypes
    - Add Background, Controls, MiniMap
    - Handle node click events
    - _Requirements: 3.1, 3.6_
  - [x] 8.2 Implement FilterBar component
    - Render filter buttons cho mỗi skill type
    - Handle filter selection/clearing
    - _Requirements: 6.4_
  - [x] 8.3 Implement GemDetailPanel component
    - Display selected gem details
    - Show available evolutions
    - _Requirements: 3.5_
  - [x] 8.4 Implement SkillTreePage
    - Compose SkillTreeCanvas, FilterBar, GemDetailPanel
    - Manage selected node state
    - _Requirements: 3.1_

- [x] 9. Implement Evolution Execution
  - [x] 9.1 Implement canEvolve function trong evolutionService
    - Check player owns source gem
    - Check player has sufficient gold
    - _Requirements: 5.4_
  - [x] 9.2 Implement executeEvolution function
    - Deduct gold
    - Add target gem to player inventory
    - Remove source gem from player inventory
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 9.3 Implement EvolutionModal component
    - Display evolution details và cost
    - Confirm/cancel buttons
    - _Requirements: 5.1, 5.5_
  - [x] 9.4 Write property tests cho Evolution Execution
    - **Property 12: Evolution Execution Invariants**
    - **Property 13: Evolution Resource Validation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Update Database và Integration
  - [x] 11.1 Update db.json với evolution paths schema
    - Add evolutionPaths collection
    - Add playerGems collection
    - Add sample data
    - _Requirements: 8.1, 8.2_
  - [x] 11.2 Update Gem type để include tier field
    - Modify existing Gem interface
    - Update gemService để handle tier
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 11.3 Add route cho SkillTreePage
    - Add route trong main.tsx hoặc App.tsx
    - Add navigation link
    - _Requirements: 3.1_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Sử dụng fast-check cho property-based testing
- Config-driven approach cho phép thay đổi styling mà không cần sửa code
