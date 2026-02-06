/**
 * VFX Stories - Visual Effects Storybook
 */

import type { Meta, StoryObj } from "@storybook/react";
import {
  EnhancementVFX,
  SuccessVFX,
  FailVFX,
  AttackPrepVFX,
  DamageVFX,
  HealVFX,
  CriticalHitVFX,
  MovingVFX,
  DashVFX,
  BuffVFX,
  DebuffVFX,
  VFXWrapper,
  getVFXPreset,
  type EnhancementTier,
  type VFXVariant,
} from "./index";

// ============================================================================
// META
// ============================================================================

const meta: Meta<typeof VFXWrapper> = {
  title: "Components/VFX",
  component: VFXWrapper,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1a1a2e" }],
    },
  },
};

export default meta;

// ============================================================================
// SAMPLE CARD COMPONENT
// ============================================================================

const SampleCard = ({
  label,
  color = "#2d2d44",
}: {
  label: string;
  color?: string;
}) => (
  <div
    style={{
      width: 180,
      height: 240,
      background: color,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      color: "#fff",
      fontWeight: 700,
      fontSize: 18,
      gap: 8,
    }}
  >
    <div
      style={{
        width: 60,
        height: 60,
        background: "rgba(255,255,255,0.1)",
        borderRadius: 12,
      }}
    />
    <span>{label}</span>
  </div>
);

// ============================================================================
// ENHANCEMENT TIERS
// ============================================================================

const tiers: EnhancementTier[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export const EnhancementTiers: StoryObj = {
  name: "Enhancement Tiers",
  render: () => (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", padding: 48 }}>
      {tiers.map((tier) => (
        <EnhancementVFX key={tier} tier={tier}>
          <SampleCard label={tier.charAt(0).toUpperCase() + tier.slice(1)} />
        </EnhancementVFX>
      ))}
    </div>
  ),
};

// ============================================================================
// RESULT EFFECTS
// ============================================================================

export const ResultEffects: StoryObj = {
  name: "Success / Fail",
  render: () => (
    <div style={{ display: "flex", gap: 48, padding: 48 }}>
      <SuccessVFX>
        <SampleCard label="SUCCESS!" color="#1a3a1a" />
      </SuccessVFX>
      <FailVFX>
        <SampleCard label="FAILED" color="#3a1a1a" />
      </FailVFX>
    </div>
  ),
};

// ============================================================================
// COMBAT EFFECTS
// ============================================================================

export const CombatEffects: StoryObj = {
  name: "Combat Effects",
  render: () => (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", padding: 48 }}>
      <div style={{ textAlign: "center" }}>
        <AttackPrepVFX>
          <SampleCard label="Attack Prep" color="#3a3a1a" />
        </AttackPrepVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Charging...</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <DamageVFX>
          <SampleCard label="Damage!" color="#3a1a1a" />
        </DamageVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Hit received</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <HealVFX>
          <SampleCard label="Heal" color="#1a3a2a" />
        </HealVFX>
        <p style={{ color: "#888", marginTop: 8 }}>HP restored</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <CriticalHitVFX>
          <SampleCard label="CRITICAL!" color="#3a2a1a" />
        </CriticalHitVFX>
        <p style={{ color: "#888", marginTop: 8 }}>2x damage!</p>
      </div>
    </div>
  ),
};

// ============================================================================
// MOVEMENT EFFECTS
// ============================================================================

export const MovementEffects: StoryObj = {
  name: "Movement Effects",
  render: () => (
    <div style={{ display: "flex", gap: 48, padding: 48 }}>
      <div style={{ textAlign: "center" }}>
        <MovingVFX>
          <SampleCard label="Moving" color="#1a2a3a" />
        </MovingVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Normal move</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <DashVFX>
          <SampleCard label="Dash!" color="#1a2a3a" />
        </DashVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Quick dash</p>
      </div>
    </div>
  ),
};

// ============================================================================
// STATUS EFFECTS
// ============================================================================

export const StatusEffects: StoryObj = {
  name: "Buff / Debuff",
  render: () => (
    <div style={{ display: "flex", gap: 48, padding: 48 }}>
      <div style={{ textAlign: "center" }}>
        <BuffVFX>
          <SampleCard label="ATK UP" color="#1a3a2a" />
        </BuffVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Positive buff</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <DebuffVFX>
          <SampleCard label="POISONED" color="#2a1a2a" />
        </DebuffVFX>
        <p style={{ color: "#888", marginTop: 8 }}>Negative effect</p>
      </div>
    </div>
  ),
};

// ============================================================================
// ALL EFFECTS GALLERY
// ============================================================================

const allVariants: VFXVariant[] = [
  "enhancement-common",
  "enhancement-rare",
  "enhancement-epic",
  "enhancement-legendary",
  "enhancement-mythic",
  "success",
  "fail",
  "attack-prep",
  "damage-received",
  "heal-received",
  "critical-hit",
  "moving",
  "dash",
  "buff",
  "debuff",
];

export const AllEffectsGallery: StoryObj = {
  name: "All Effects Gallery",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 32,
        padding: 48,
      }}
    >
      {allVariants.map((variant) => (
        <div key={variant} style={{ textAlign: "center" }}>
          <VFXWrapper config={getVFXPreset(variant)}>
            <SampleCard
              label={variant
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
              color="#2d2d44"
            />
          </VFXWrapper>
          <p style={{ color: "#666", marginTop: 8, fontSize: 12 }}>{variant}</p>
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// INTERACTIVE PLAYGROUND
// ============================================================================

type Story = StoryObj<typeof VFXWrapper>;

export const Playground: Story = {
  args: {
    config: getVFXPreset("enhancement-legendary"),
  },
  argTypes: {
    config: {
      control: "object",
    },
  },
  render: (args) => (
    <div style={{ padding: 48 }}>
      <VFXWrapper {...args}>
        <SampleCard label="Playground" />
      </VFXWrapper>
    </div>
  ),
};
