import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropArea } from "react-use";
import { X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumericFormat } from "react-number-format";
import { weaponFormSchema, type WeaponFormSchemaType } from "../types/schemas";
import type { Weapon } from "../types/weapon";
import { WEAPON_STAT_RANGES } from "../types/weapon";

interface WeaponFormProps {
  mode: "create" | "edit";
  initialData?: Weapon;
  onSubmit: (data: WeaponFormSchemaType) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Weapon stat field definitions for form rendering
 */
const WEAPON_STAT_FIELDS = [
  { key: "atk", label: "ATK (Attack)", format: "number" as const },
  { key: "critChance", label: "Crit Chance", format: "percentage" as const },
  { key: "critDamage", label: "Crit Damage", format: "percentage" as const },
  {
    key: "armorPen",
    label: "Armor Penetration",
    format: "percentage" as const,
  },
  { key: "lifesteal", label: "Lifesteal", format: "percentage" as const },
  { key: "attackRange", label: "Attack Range", format: "number" as const },
] as const;

/**
 * WeaponForm component
 * Form for creating/editing weapons with name, image, and offensive stats
 * Uses Zod validation schema for form validation
 * Requirements: 1.1, 1.2
 */
export function WeaponForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: WeaponFormProps) {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );

  const form = useForm<WeaponFormSchemaType>({
    resolver: zodResolver(weaponFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: null,
      atk: initialData?.atk ?? 0,
      critChance: initialData?.critChance ?? 0,
      critDamage: initialData?.critDamage ?? 0,
      armorPen: initialData?.armorPen ?? 0,
      lifesteal: initialData?.lifesteal ?? 0,
      attackRange: initialData?.attackRange ?? 0,
    },
  });

  const handleImageChange = useCallback(
    (file: File | null) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue("image", file as any, { shouldValidate: true });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (!initialData?.imageUrl) {
        setImagePreview(null);
      }
    },
    [form, initialData?.imageUrl],
  );

  // Use react-use's useDropArea for drag-and-drop file handling
  const [dropBond, dropState] = useDropArea({
    onFiles: (files) => {
      const file = files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageChange(file);
      }
    },
  });

  const clearImage = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue("image", null as any);
    setImagePreview(initialData?.imageUrl || null);
  }, [form, initialData?.imageUrl]);

  const handleSubmit = async (data: WeaponFormSchemaType) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Image Upload */}
        <FormField
          control={form.control}
          name="image"
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          render={({ field: { onChange: _, ...field } }) => (
            <FormItem>
              <FormLabel>Weapon Image</FormLabel>
              <FormControl>
                <div
                  {...dropBond}
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dropState.over
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-square max-w-[200px] mx-auto">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="absolute -top-2 -right-2"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop an image here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP (max 2MB)
                      </p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageChange(file);
                    }}
                    {...field}
                    value=""
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter weapon name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Offensive Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Offensive Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {WEAPON_STAT_FIELDS.map((stat) => (
              <FormField
                key={stat.key}
                control={form.control}
                name={stat.key as keyof WeaponFormSchemaType}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{stat.label}</FormLabel>
                    <FormControl>
                      <NumericFormat
                        value={field.value as number}
                        onValueChange={(values) =>
                          field.onChange(values.floatValue ?? 0)
                        }
                        thousandSeparator={
                          stat.format === "number" ? "," : undefined
                        }
                        allowNegative={false}
                        decimalScale={0}
                        placeholder="0"
                        suffix={stat.format === "percentage" ? "%" : undefined}
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          if (floatValue === undefined) return true;
                          const range =
                            WEAPON_STAT_RANGES[
                              stat.key as keyof typeof WEAPON_STAT_RANGES
                            ];
                          return (
                            floatValue >= range.min && floatValue <= range.max
                          );
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Weapon"
                : "Update Weapon"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/weapons")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
