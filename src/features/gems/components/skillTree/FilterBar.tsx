// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

import { useSkillTreeConfig } from "../../hooks/useSkillTreeConfig";
import type { SkillType } from "../../types/gem";

/**
 * All available skill types for filtering
 */
const ALL_SKILL_TYPES: SkillType[] = [
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
];

interface FilterBarProps {
  selectedSkillType: SkillType | null;
  onFilterChange: (skillType: SkillType | null) => void;
}

/**
 * FilterBar - Component for filtering skill tree by skill type
 *
 * Features:
 * - Renders filter buttons for each skill type
 * - Shows skill type icon and label
 * - Highlights selected filter
 * - Allows clearing filter by clicking selected button again
 *
 * Requirements: 6.4
 */
export function FilterBar({
  selectedSkillType,
  onFilterChange,
}: FilterBarProps) {
  const config = useSkillTreeConfig();

  const handleFilterClick = (skillType: SkillType) => {
    // Toggle filter - if already selected, clear it
    if (selectedSkillType === skillType) {
      onFilterChange(null);
    } else {
      onFilterChange(skillType);
    }
  };

  const handleClearFilter = () => {
    onFilterChange(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <span className="text-sm font-medium text-gray-700 mr-2">
        Filter by skill:
      </span>

      {ALL_SKILL_TYPES.map((skillType) => {
        const skillConfig = config.skillTypes[skillType];
        const isSelected = selectedSkillType === skillType;

        return (
          <button
            key={skillType}
            onClick={() => handleFilterClick(skillType)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 ease-in-out
              ${
                isSelected
                  ? "ring-2 ring-offset-1 shadow-md"
                  : "hover:shadow-sm hover:scale-105"
              }
            `}
            style={{
              backgroundColor: isSelected
                ? skillConfig.color
                : `${skillConfig.color}20`,
              color: isSelected ? "white" : skillConfig.color,
              borderColor: skillConfig.color,
              boxShadow: isSelected
                ? `0 0 0 2px white, 0 0 0 4px ${skillConfig.color}`
                : undefined,
            }}
            title={`Filter by ${skillConfig.label}`}
          >
            <span className="text-base">{skillConfig.icon}</span>
            <span>{skillConfig.label}</span>
          </button>
        );
      })}

      {/* Clear filter button - only show when a filter is active */}
      {selectedSkillType && (
        <button
          onClick={handleClearFilter}
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
            bg-gray-100 text-gray-600 hover:bg-gray-200
            transition-all duration-200 ease-in-out
            ml-2
          "
          title="Clear filter"
        >
          <span>✕</span>
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
