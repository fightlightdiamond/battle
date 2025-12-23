import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumericFormat } from "react-number-format";
import { ImagePlus, X } from "lucide-react";
import {
  gemFormSchema,
  type GemFormSchemaType,
  ACTIVATION_CHANCE_RANGE,
  COOLDOWN_RANGE,
  EFFECT_PARAM_RANGES,
} from "../types/schemas";
import type { Gem, SkillType, SkillTrigger, GemFormInput } from "../types/gem";

interface GemFormProps {
  mode: "create" | "edit";
  initialData?: Gem;
  onSubmit: (data: GemFormInput) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Skill type options with descriptions
 */
const SKILL_TYPE_OPTIONS: {
  value: SkillType;
  label: string;
  description: string;
  trigger: SkillTrigger;
}[] = [
  {
    value: "knockback",
    label: "Knockback",
    description: "Push enemy 1 cell away after attack",
    trigger: "combat",
  },
  {
    value: "retreat",
    label: "Retreat",
    description: "Move back 1 cell after attack",
    trigger: "combat",
  },
  {
    value: "double_move",
    label: "Double Move",
    description: "Move 2 cells instead of 1",
    trigger: "movement",
  },
  {
    value: "double_attack",
    label: "Double Attack",
    description: "Attack twice in one turn",
    trigger: "combat",
  },
  {
    value: "execute",
    label: "Execute",
    description: "Kill enemy if HP below threshold",
    trigger: "combat",
  },
  {
    value: "leap_strike",
    label: "Leap Strike",
    description: "Jump to enemy and knockback 2 cells",
    trigger: "movement",
  },
];

/**
 * Get default effect params for a skill type
 */
function getDefaultEffectParams(skillType: SkillType) {
  switch (skillType) {
    case "knockback":
    case "retreat":
      return { knockbackDistance: 1 };
    case "double_move":
      return { moveDistance: 2 };
    case "double_attack":
      return { attackCount: 2 };
    case "execute":
      return { executeThreshold: 15 };
    case "leap_strike":
      return { leapRange: 2, leapKnockback: 2 };
    default:
      return {};
  }
}

/**
 * Get trigger type for a skill type
 */
function getTriggerForSkillType(skillType: SkillType): SkillTrigger {
  const option = SKILL_TYPE_OPTIONS.find((opt) => opt.value === skillType);
  return option?.trigger || "combat";
}

/**
 * GemForm component
 * Form for creating/editing gems with all fields
 * Uses Zod validation schema for form validation
 * Requirements: 1.1, 1.3
 */
export function GemForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: GemFormProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );

  const form = useForm<GemFormSchemaType>({
    resolver: zodResolver(gemFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      skillType: initialData?.skillType || "knockback",
      trigger: initialData?.trigger || "combat",
      activationChance: initialData?.activationChance ?? 30,
      cooldown: initialData?.cooldown ?? 0,
      effectParams: initialData?.effectParams || { knockbackDistance: 1 },
    },
  });

  const selectedSkillType = form.watch("skillType");

  // Update trigger and effect params when skill type changes
  const handleSkillTypeChange = (value: SkillType) => {
    form.setValue("skillType", value);
    form.setValue("trigger", getTriggerForSkillType(value));
    form.setValue("effectParams", getDefaultEffectParams(value));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (data: GemFormSchemaType) => {
    await onSubmit({
      ...data,
      image: imageFile,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <FormLabel>Image</FormLabel>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Gem preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleImageRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-8 w-8 mb-1" />
                <span className="text-xs">Add Image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <FormDescription>
            Optional image for the gem (recommended: square, max 512x512)
          </FormDescription>
        </div>

        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter gem name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter gem description (optional)"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skill Type Field */}
        <FormField
          control={form.control}
          name="skillType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skill Type</FormLabel>
              <Select
                onValueChange={(value) =>
                  handleSkillTypeChange(value as SkillType)
                }
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SKILL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Trigger:{" "}
                {getTriggerForSkillType(selectedSkillType) === "combat"
                  ? "Combat (activates on attack)"
                  : "Movement (activates on move)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Activation Chance and Cooldown */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="activationChance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activation Chance</FormLabel>
                <FormControl>
                  <NumericFormat
                    value={field.value}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue ?? 0)
                    }
                    allowNegative={false}
                    decimalScale={0}
                    placeholder="0"
                    suffix="%"
                    isAllowed={(values) => {
                      const { floatValue } = values;
                      if (floatValue === undefined) return true;
                      return (
                        floatValue >= ACTIVATION_CHANCE_RANGE.min &&
                        floatValue <= ACTIVATION_CHANCE_RANGE.max
                      );
                    }}
                    customInput={Input}
                  />
                </FormControl>
                <FormDescription>
                  {ACTIVATION_CHANCE_RANGE.min}-{ACTIVATION_CHANCE_RANGE.max}%
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cooldown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cooldown</FormLabel>
                <FormControl>
                  <NumericFormat
                    value={field.value}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue ?? 0)
                    }
                    allowNegative={false}
                    decimalScale={0}
                    placeholder="0"
                    suffix=" turns"
                    isAllowed={(values) => {
                      const { floatValue } = values;
                      if (floatValue === undefined) return true;
                      return (
                        floatValue >= COOLDOWN_RANGE.min &&
                        floatValue <= COOLDOWN_RANGE.max
                      );
                    }}
                    customInput={Input}
                  />
                </FormControl>
                <FormDescription>
                  0 = no cooldown, max {COOLDOWN_RANGE.max} turns
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Effect Parameters - Dynamic based on skill type */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Effect Parameters
          </h3>

          {/* Knockback/Retreat Distance */}
          {(selectedSkillType === "knockback" ||
            selectedSkillType === "retreat") && (
            <FormField
              control={form.control}
              name="effectParams.knockbackDistance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedSkillType === "knockback"
                      ? "Knockback Distance"
                      : "Retreat Distance"}
                  </FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value ?? 1}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? 1)
                      }
                      allowNegative={false}
                      decimalScale={0}
                      placeholder="1"
                      suffix=" cells"
                      isAllowed={(values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        return (
                          floatValue >=
                            EFFECT_PARAM_RANGES.knockbackDistance.min &&
                          floatValue <=
                            EFFECT_PARAM_RANGES.knockbackDistance.max
                        );
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormDescription>
                    {EFFECT_PARAM_RANGES.knockbackDistance.min}-
                    {EFFECT_PARAM_RANGES.knockbackDistance.max} cells
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Double Move Distance */}
          {selectedSkillType === "double_move" && (
            <FormField
              control={form.control}
              name="effectParams.moveDistance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Move Distance</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value ?? 2}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? 2)
                      }
                      allowNegative={false}
                      decimalScale={0}
                      placeholder="2"
                      suffix=" cells"
                      isAllowed={(values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        return (
                          floatValue >= EFFECT_PARAM_RANGES.moveDistance.min &&
                          floatValue <= EFFECT_PARAM_RANGES.moveDistance.max
                        );
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormDescription>
                    {EFFECT_PARAM_RANGES.moveDistance.min}-
                    {EFFECT_PARAM_RANGES.moveDistance.max} cells
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Double Attack Count */}
          {selectedSkillType === "double_attack" && (
            <FormField
              control={form.control}
              name="effectParams.attackCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attack Count</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value ?? 2}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? 2)
                      }
                      allowNegative={false}
                      decimalScale={0}
                      placeholder="2"
                      suffix=" attacks"
                      isAllowed={(values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        return (
                          floatValue >= EFFECT_PARAM_RANGES.attackCount.min &&
                          floatValue <= EFFECT_PARAM_RANGES.attackCount.max
                        );
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormDescription>
                    {EFFECT_PARAM_RANGES.attackCount.min}-
                    {EFFECT_PARAM_RANGES.attackCount.max} attacks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Execute Threshold */}
          {selectedSkillType === "execute" && (
            <FormField
              control={form.control}
              name="effectParams.executeThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execute Threshold</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value ?? 15}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? 15)
                      }
                      allowNegative={false}
                      decimalScale={0}
                      placeholder="15"
                      suffix="% HP"
                      isAllowed={(values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        return (
                          floatValue >=
                            EFFECT_PARAM_RANGES.executeThreshold.min &&
                          floatValue <= EFFECT_PARAM_RANGES.executeThreshold.max
                        );
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormDescription>
                    Kill enemy if HP below this percentage (
                    {EFFECT_PARAM_RANGES.executeThreshold.min}-
                    {EFFECT_PARAM_RANGES.executeThreshold.max}%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Leap Strike Parameters */}
          {selectedSkillType === "leap_strike" && (
            <>
              <FormField
                control={form.control}
                name="effectParams.leapRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leap Range</FormLabel>
                    <FormControl>
                      <NumericFormat
                        value={field.value ?? 2}
                        onValueChange={(values) =>
                          field.onChange(values.floatValue ?? 2)
                        }
                        allowNegative={false}
                        decimalScale={0}
                        placeholder="2"
                        suffix=" cells"
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          if (floatValue === undefined) return true;
                          return (
                            floatValue >= EFFECT_PARAM_RANGES.leapRange.min &&
                            floatValue <= EFFECT_PARAM_RANGES.leapRange.max
                          );
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormDescription>
                      Detection range for leap (
                      {EFFECT_PARAM_RANGES.leapRange.min}-
                      {EFFECT_PARAM_RANGES.leapRange.max} cells)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectParams.leapKnockback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leap Knockback</FormLabel>
                    <FormControl>
                      <NumericFormat
                        value={field.value ?? 2}
                        onValueChange={(values) =>
                          field.onChange(values.floatValue ?? 2)
                        }
                        allowNegative={false}
                        decimalScale={0}
                        placeholder="2"
                        suffix=" cells"
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          if (floatValue === undefined) return true;
                          return (
                            floatValue >=
                              EFFECT_PARAM_RANGES.leapKnockback.min &&
                            floatValue <= EFFECT_PARAM_RANGES.leapKnockback.max
                          );
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormDescription>
                      Knockback distance after leap (
                      {EFFECT_PARAM_RANGES.leapKnockback.min}-
                      {EFFECT_PARAM_RANGES.leapKnockback.max} cells)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Gem"
                : "Update Gem"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/gems")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
