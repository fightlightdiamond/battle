# Implementation Tasks

## Task 1: Create Preset Types and Definitions

**Status:** not started

**Requirements:** 1.2, 2.1-2.4, 3.1-3.5, 4.1-4.4

**Description:**
Tạo type definitions và preset data cho Card, Gem, Weapon presets.

### Sub-tasks:

- [x] 1.1: Create `src/features/lowcode/types/presets.ts` with PresetType and PresetDefinition types
- [x] 1.2: Create `src/features/lowcode/presets/cardPreset.ts` with Card-like preset definition
- [x] 1.3: Create `src/features/lowcode/presets/gemPreset.ts` with Gem-like preset definition
- [x] 1.4: Create `src/features/lowcode/presets/weaponPreset.ts` with Weapon-like preset definition
- [x] 1.5: Create `src/features/lowcode/presets/index.ts` with presetRegistry functions

### Files to create:

- `src/features/lowcode/types/presets.ts`
- `src/features/lowcode/presets/cardPreset.ts`
- `src/features/lowcode/presets/gemPreset.ts`
- `src/features/lowcode/presets/weaponPreset.ts`
- `src/features/lowcode/presets/index.ts`

---

## Task 2: Update Entity Store for Presets

**Status:** not started

**Requirements:** 1.3, 1.4, 6.1-6.4

**Description:**
Thêm state và actions vào entityStore để hỗ trợ preset selection và application.

### Sub-tasks:

- [x] 2.1: Add `currentPreset: PresetType` to entityStore state
- [x] 2.2: Add `applyPreset(type: PresetType)` action
- [x] 2.3: Add `clearPreset()` action
- [x] 2.4: Update `resetCurrentEntity()` to also reset preset

### Files to modify:

- `src/features/lowcode/store/entityStore.ts`

---

## Task 3: Create PresetSelector Component

**Status:** not started

**Requirements:** 1.1, 1.2

**Description:**
Tạo UI component cho phép user chọn preset từ dropdown.

### Sub-tasks:

- [x] 3.1: Create `src/features/lowcode/components/PresetSelector.tsx`
- [x] 3.2: Show all preset options with labels and descriptions
- [x] 3.3: Highlight currently selected preset
- [x] 3.4: Call store action when preset is selected

### Files to create:

- `src/features/lowcode/components/PresetSelector.tsx`

---

## Task 4: Integrate PresetSelector into EntityBuilderPage

**Status:** not started

**Requirements:** 1.1, 1.3, 1.4

**Description:**
Thêm PresetSelector vào EntityBuilderPage UI.

### Sub-tasks:

- [x] 4.1: Import and add PresetSelector to Entity Definition card
- [x] 4.2: Position below entity name input
- [x] 4.3: Connect to entityStore for preset state

### Files to modify:

- `src/features/lowcode/pages/EntityBuilderPage.tsx`

---

## Task 5: Write Unit Tests for Presets

**Status:** not started

**Requirements:** All

**Description:**
Viết unit tests cho preset system.

### Sub-tasks:

- [x] 5.1: Test preset definitions have correct fields
- [x] 5.2: Test presetRegistry functions
- [x] 5.3: Test entityStore preset actions
- [x] 5.4: Test PresetSelector component renders correctly

### Files to create:

- `src/features/lowcode/presets/presets.test.ts`
- `src/features/lowcode/components/PresetSelector.test.tsx`

---

## Notes

- Start with Task 1 (types and definitions) as foundation
- Task 2 depends on Task 1
- Task 3 depends on Task 1 and Task 2
- Task 4 depends on Task 3
- Task 5 can be done incrementally after each task
- Follow existing lowcode patterns for consistency
- Use shadcn/ui components (Select, RadioGroup) for PresetSelector
