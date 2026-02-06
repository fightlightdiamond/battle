import type { Meta, StoryObj } from "@storybook/react";
import { EnhanceGlowWrapper } from "../components/EnhanceGlowWrapper";

const meta: Meta<typeof EnhanceGlowWrapper> = {
  title: "Weapons/EnhanceGlowWrapper",
  component: EnhanceGlowWrapper,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1a1a2e" },
        { name: "darker", value: "#0a0a0f" },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    level: {
      control: { type: "range", min: 0, max: 15, step: 1 },
      description: "Enhancement level (0-15)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof EnhanceGlowWrapper>;

// Demo Card Component để test
const DemoCard = ({ title = "Demo Card" }: { title?: string }) => (
  <div className="w-48 h-64 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-4 border border-slate-700">
    <div className="w-16 h-16 bg-slate-700 rounded-lg mb-4" />
    <h3 className="text-white font-bold">{title}</h3>
    <p className="text-slate-400 text-sm">Test content</p>
  </div>
);

// Level 0 - Không có hiệu ứng
export const NoEnhancement: Story = {
  args: {
    level: 0,
    children: <DemoCard title="No Enhancement" />,
  },
};

// Tier 1: Green (+1 to +5)
export const Tier1_Level1: Story = {
  args: {
    level: 1,
    children: <DemoCard title="+1 Green" />,
  },
};

export const Tier1_Level3: Story = {
  args: {
    level: 3,
    children: <DemoCard title="+3 Green" />,
  },
};

export const Tier1_Level5: Story = {
  args: {
    level: 5,
    children: <DemoCard title="+5 Green" />,
  },
};

// Tier 2: Blue/Cyan (+6 to +10)
export const Tier2_Level6: Story = {
  args: {
    level: 6,
    children: <DemoCard title="+6 Blue" />,
  },
};

export const Tier2_Level8: Story = {
  args: {
    level: 8,
    children: <DemoCard title="+8 Blue" />,
  },
};

export const Tier2_Level10: Story = {
  args: {
    level: 10,
    children: <DemoCard title="+10 Blue" />,
  },
};

// Tier 3: Purple/Gold (+11 to +15)
export const Tier3_Level11: Story = {
  args: {
    level: 11,
    children: <DemoCard title="+11 Purple" />,
  },
};

export const Tier3_Level13: Story = {
  args: {
    level: 13,
    children: <DemoCard title="+13 Legendary" />,
  },
};

export const Tier3_Level15: Story = {
  args: {
    level: 15,
    children: <DemoCard title="+15 MAX" />,
  },
};

// Interactive playground
export const Interactive: Story = {
  args: {
    level: 10,
    children: <DemoCard title="Drag level" />,
  },
};

// All tiers side by side
export const AllTiersComparison: Story = {
  render: () => (
    <div className="flex gap-8 flex-wrap justify-center p-8">
      <div className="text-center">
        <EnhanceGlowWrapper level={0}>
          <DemoCard title="No Enhance" />
        </EnhanceGlowWrapper>
        <p className="text-slate-400 mt-2">Level 0</p>
      </div>
      <div className="text-center">
        <EnhanceGlowWrapper level={3}>
          <DemoCard title="Tier 1" />
        </EnhanceGlowWrapper>
        <p className="text-green-400 mt-2">Level +3</p>
      </div>
      <div className="text-center">
        <EnhanceGlowWrapper level={8}>
          <DemoCard title="Tier 2" />
        </EnhanceGlowWrapper>
        <p className="text-cyan-400 mt-2">Level +8</p>
      </div>
      <div className="text-center">
        <EnhanceGlowWrapper level={15}>
          <DemoCard title="Tier 3" />
        </EnhanceGlowWrapper>
        <p className="text-purple-400 mt-2">Level +15</p>
      </div>
    </div>
  ),
};

// Animation showcase
export const AnimationShowcase: Story = {
  render: () => (
    <div className="flex gap-12 p-8">
      <div className="text-center">
        <p className="text-white mb-4 font-bold">Slow Pulse (Tier 1)</p>
        <EnhanceGlowWrapper level={5}>
          <DemoCard title="+5" />
        </EnhanceGlowWrapper>
      </div>
      <div className="text-center">
        <p className="text-white mb-4 font-bold">Medium Pulse (Tier 2)</p>
        <EnhanceGlowWrapper level={10}>
          <DemoCard title="+10" />
        </EnhanceGlowWrapper>
      </div>
      <div className="text-center">
        <p className="text-white mb-4 font-bold">Fast Pulse (Tier 3)</p>
        <EnhanceGlowWrapper level={15}>
          <DemoCard title="+15" />
        </EnhanceGlowWrapper>
      </div>
    </div>
  ),
};
