/**
 * WeaponEnhanceCard Storybook Stories
 *
 * Stories demonstrating weapon enhancement visual effects:
 * - No enhancement (+0)
 * - Tier 1: +1 to +5 (Green glow)
 * - Tier 2: +6 to +10 (Blue electric)
 * - Tier 3: +11 to +15 (Legendary purple/gold)
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { WeaponEnhanceCard } from "../components/WeaponEnhanceCard";
import type { Weapon } from "../types/weapon";

const meta: Meta<typeof WeaponEnhanceCard> = {
  title: "Features/Weapons/WeaponEnhanceCard",
  component: WeaponEnhanceCard,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1a1a2e" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selected: {
      control: "boolean",
      description: "Whether the card is selected",
    },
    showStats: {
      control: "boolean",
      description: "Show detailed stats",
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[300px] flex items-center justify-center">
        <div className="w-48">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeaponEnhanceCard>;

// Base weapon factory
const createWeapon = (overrides: Partial<Weapon> = {}): Weapon => ({
  id: "test-weapon-1",
  name: "Dragon Blade",
  weaponType: "sword_shield",
  atk: 150,
  critChance: 15,
  critDamage: 180,
  armorPen: 10,
  lifesteal: 5,
  attackRange: 1,
  enhanceLevel: 0,
  enhanceHistory: [],
  imagePath: null,
  imageUrl: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// ============================================================================
// NO ENHANCEMENT
// ============================================================================

/**
 * No Enhancement (+0)
 * Basic weapon with no visual effects
 */
export const NoEnhancement: Story = {
  name: "+0 No Enhancement",
  args: {
    weapon: createWeapon({ name: "Iron Sword", enhanceLevel: 0 }),
    selected: false,
    showStats: false,
  },
};

// ============================================================================
// TIER 1: +1 to +5 (GREEN GLOW)
// ============================================================================

/**
 * Tier 1 Level +1
 * Subtle green glow effect
 */
export const Tier1Level1: Story = {
  name: "+1 Green Glow",
  args: {
    weapon: createWeapon({ name: "Steel Sword", enhanceLevel: 1 }),
    selected: false,
  },
};

/**
 * Tier 1 Level +3
 * Medium green glow
 */
export const Tier1Level3: Story = {
  name: "+3 Green Glow",
  args: {
    weapon: createWeapon({ name: "Steel Sword", enhanceLevel: 3 }),
    selected: false,
  },
};

/**
 * Tier 1 Level +5
 * Maximum Tier 1 green glow
 */
export const Tier1Level5: Story = {
  name: "+5 Green Glow (Max Tier 1)",
  args: {
    weapon: createWeapon({ name: "Steel Sword", enhanceLevel: 5 }),
    selected: false,
  },
};

// ============================================================================
// TIER 2: +6 to +10 (BLUE ELECTRIC)
// ============================================================================

/**
 * Tier 2 Level +6
 * Blue electric effect begins
 */
export const Tier2Level6: Story = {
  name: "+6 Blue Electric",
  args: {
    weapon: createWeapon({ name: "Mithril Blade", enhanceLevel: 6 }),
    selected: false,
  },
};

/**
 * Tier 2 Level +8
 * Intense blue electric
 */
export const Tier2Level8: Story = {
  name: "+8 Blue Electric",
  args: {
    weapon: createWeapon({ name: "Mithril Blade", enhanceLevel: 8 }),
    selected: false,
  },
};

/**
 * Tier 2 Level +10
 * Maximum Tier 2 blue electric
 */
export const Tier2Level10: Story = {
  name: "+10 Blue Electric (Max Tier 2)",
  args: {
    weapon: createWeapon({ name: "Mithril Blade", enhanceLevel: 10 }),
    selected: false,
  },
};

// ============================================================================
// TIER 3: +11 to +15 (LEGENDARY PURPLE/GOLD)
// ============================================================================

/**
 * Tier 3 Level +11
 * Legendary effect begins - Purple/Gold with sparkles
 */
export const Tier3Level11: Story = {
  name: "+11 Legendary (Entry)",
  args: {
    weapon: createWeapon({ name: "Excalibur", enhanceLevel: 11 }),
    selected: false,
  },
};

/**
 * Tier 3 Level +13
 * Intense legendary effect
 */
export const Tier3Level13: Story = {
  name: "+13 Legendary (Mid)",
  args: {
    weapon: createWeapon({ name: "Excalibur", enhanceLevel: 13 }),
    selected: false,
  },
};

/**
 * Tier 3 Level +15
 * Maximum legendary effect - Full power
 */
export const Tier3Level15: Story = {
  name: "+15 Legendary (MAX)",
  args: {
    weapon: createWeapon({ name: "Excalibur", enhanceLevel: 15 }),
    selected: false,
  },
};

// ============================================================================
// COMPARISON VIEWS
// ============================================================================

/**
 * All Tiers Comparison
 * Side by side comparison of all enhancement tiers
 */
export const AllTiersComparison: Story = {
  name: "All Tiers Comparison",
  decorators: [
    () => (
      <div className="p-8 grid grid-cols-4 gap-8">
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-400">+0 (None)</p>
          <WeaponEnhanceCard
            weapon={createWeapon({ name: "Basic", enhanceLevel: 0 })}
          />
        </div>
        <div className="space-y-2">
          <p className="text-center text-sm text-green-400">+5 (Tier 1)</p>
          <WeaponEnhanceCard
            weapon={createWeapon({ name: "Green", enhanceLevel: 5 })}
          />
        </div>
        <div className="space-y-2">
          <p className="text-center text-sm text-blue-400">+10 (Tier 2)</p>
          <WeaponEnhanceCard
            weapon={createWeapon({ name: "Blue", enhanceLevel: 10 })}
          />
        </div>
        <div className="space-y-2">
          <p className="text-center text-sm text-purple-400">+15 (Tier 3)</p>
          <WeaponEnhanceCard
            weapon={createWeapon({ name: "Legendary", enhanceLevel: 15 })}
          />
        </div>
      </div>
    ),
  ],
};

/**
 * Tier Progression
 * Shows the progression from +0 to +15
 */
export const TierProgression: Story = {
  name: "Full Progression (+0 to +15)",
  decorators: [
    () => (
      <div className="p-8 space-y-8">
        <h2 className="text-xl font-bold text-white text-center mb-4">
          Enhancement Level Progression
        </h2>

        {/* Tier 0 */}
        <div className="space-y-2">
          <h3 className="text-gray-400 text-sm">No Enhancement</h3>
          <div className="flex gap-4">
            <div className="w-32">
              <WeaponEnhanceCard
                weapon={createWeapon({ name: "Sword", enhanceLevel: 0 })}
              />
            </div>
          </div>
        </div>

        {/* Tier 1 */}
        <div className="space-y-2">
          <h3 className="text-green-400 text-sm">
            Tier 1: Green Glow (+1 to +5)
          </h3>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="w-32">
                <WeaponEnhanceCard
                  weapon={createWeapon({
                    name: `+${level}`,
                    enhanceLevel: level,
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2 */}
        <div className="space-y-2">
          <h3 className="text-blue-400 text-sm">
            Tier 2: Blue Electric (+6 to +10)
          </h3>
          <div className="flex gap-4">
            {[6, 7, 8, 9, 10].map((level) => (
              <div key={level} className="w-32">
                <WeaponEnhanceCard
                  weapon={createWeapon({
                    name: `+${level}`,
                    enhanceLevel: level,
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tier 3 */}
        <div className="space-y-2">
          <h3 className="text-purple-400 text-sm">
            Tier 3: Legendary (+11 to +15)
          </h3>
          <div className="flex gap-4">
            {[11, 12, 13, 14, 15].map((level) => (
              <div key={level} className="w-32">
                <WeaponEnhanceCard
                  weapon={createWeapon({
                    name: `+${level}`,
                    enhanceLevel: level,
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  ],
};

// ============================================================================
// INTERACTIVE STATES
// ============================================================================

/**
 * Selected State
 * Shows the selected ring effect combined with enhancement glow
 */
export const SelectedState: Story = {
  name: "Selected (+10)",
  args: {
    weapon: createWeapon({ name: "Selected Blade", enhanceLevel: 10 }),
    selected: true,
  },
};

/**
 * With Stats Display
 * Shows weapon with full stats visible
 */
export const WithStats: Story = {
  name: "With Stats (+15)",
  args: {
    weapon: createWeapon({
      name: "Stats Blade",
      enhanceLevel: 15,
      atk: 200,
      critChance: 25,
      critDamage: 250,
    }),
    selected: false,
    showStats: true,
  },
};

/**
 * With Image
 * Weapon with actual image
 */
export const WithImage: Story = {
  name: "With Image (+12)",
  args: {
    weapon: createWeapon({
      name: "Dragon Bow",
      enhanceLevel: 12,
      imageUrl:
        "http://localhost:3001/images/550e8400-e29b-41d4-a716-446655440001.jpeg",
    }),
    selected: false,
  },
};
