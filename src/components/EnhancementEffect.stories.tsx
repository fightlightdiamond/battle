import type { Meta } from "@storybook/react";
import { EnhancementEffect } from "./EnhancementEffect";
import type { EnhancementTier } from "./EnhancementEffect";

const meta: Meta<typeof EnhancementEffect> = {
  title: "Components/EnhancementEffect",
  component: EnhancementEffect,
  argTypes: {
    tier: {
      control: "select",
      options: ["common", "rare", "epic", "legendary", "mythic"],
    },
  },
};

export default meta;

const tiers: EnhancementTier[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export const AllTiers = () => (
  <div style={{ display: "flex", gap: 32, flexWrap: "wrap", padding: 32 }}>
    {tiers.map((tier) => (
      <EnhancementEffect tier={tier} key={tier}>
        <div
          style={{
            width: 180,
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 24,
          }}
        >
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </div>
      </EnhancementEffect>
    ))}
  </div>
);

export const Playground = (args: { tier?: EnhancementTier }) => (
  <EnhancementEffect {...args}>
    <div
      style={{
        width: 180,
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 24,
      }}
    >
      {args.tier
        ? args.tier.charAt(0).toUpperCase() + args.tier.slice(1)
        : "Card"}
    </div>
  </EnhancementEffect>
);
Playground.args = {
  tier: "epic",
};
