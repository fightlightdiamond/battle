import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropArea } from "react-use";
import { NumericFormat } from "react-number-format";
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
import { cardFormSchema, type CardFormSchemaType } from "../types/schemas";
import { DEFAULT_STATS } from "../types/constants";
import type { Card } from "../types";

interface CardFormProps {
  mode: "create" | "edit";
  initialData?: Card;
  onSubmit: (data: CardFormSchemaType) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * CardForm component
 * Build form with React Hook Form and Zod resolver
 * Add fields: name, ATK, HP, image upload with drag-and-drop
 * Show image preview
 * Display validation errors inline
 * Handle create and edit modes via props
 * Cancel button navigates back to `/cards`
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.3, 3.4, 3.5
 */
export function CardForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: CardFormProps) {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const form = useForm<CardFormSchemaType>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      // Core Stats (Tier 1)
      hp: initialData?.hp ?? DEFAULT_STATS.hp,
      atk: initialData?.atk ?? DEFAULT_STATS.atk,
      def: initialData?.def ?? DEFAULT_STATS.def,
      spd: initialData?.spd ?? DEFAULT_STATS.spd,
      // Combat Stats (Tier 2)
      critChance: initialData?.critChance ?? DEFAULT_STATS.critChance,
      critDamage: initialData?.critDamage ?? DEFAULT_STATS.critDamage,
      armorPen: initialData?.armorPen ?? DEFAULT_STATS.armorPen,
      lifesteal: initialData?.lifesteal ?? DEFAULT_STATS.lifesteal,
      image: null,
    },
  });

  const handleImageChange = useCallback(
    (file: File | null) => {
      form.setValue("image", file, { shouldValidate: true });

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
    [form, initialData?.imageUrl]
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
    form.setValue("image", null);
    setImagePreview(initialData?.imageUrl || null);
  }, [form, initialData?.imageUrl]);

  const handleSubmit = async (data: CardFormSchemaType) => {
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
              <FormLabel>Card Image</FormLabel>
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
                    <div className="relative aspect-[3/4] max-w-[200px] mx-auto">
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
                <Input placeholder="Enter card name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CORE STATS (Tier 1) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Core Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* HP Field */}
            <FormField
              control={form.control}
              name="hp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HP (Hit Points)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? DEFAULT_STATS.hp)
                      }
                      thousandSeparator=","
                      allowNegative={false}
                      decimalScale={0}
                      placeholder={String(DEFAULT_STATS.hp)}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ATK Field */}
            <FormField
              control={form.control}
              name="atk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ATK (Attack)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? DEFAULT_STATS.atk)
                      }
                      thousandSeparator=","
                      allowNegative={false}
                      decimalScale={0}
                      placeholder={String(DEFAULT_STATS.atk)}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DEF Field */}
            <FormField
              control={form.control}
              name="def"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DEF (Defense)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? DEFAULT_STATS.def)
                      }
                      thousandSeparator=","
                      allowNegative={false}
                      decimalScale={0}
                      placeholder={String(DEFAULT_STATS.def)}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SPD Field */}
            <FormField
              control={form.control}
              name="spd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPD (Speed)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? DEFAULT_STATS.spd)
                      }
                      thousandSeparator=","
                      allowNegative={false}
                      decimalScale={0}
                      placeholder={String(DEFAULT_STATS.spd)}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COMBAT STATS (Tier 2) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Combat Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Crit Chance Field */}
            <FormField
              control={form.control}
              name="critChance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crit Chance (%)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(
                          values.floatValue ?? DEFAULT_STATS.critChance
                        )
                      }
                      allowNegative={false}
                      decimalScale={1}
                      placeholder={String(DEFAULT_STATS.critChance)}
                      suffix="%"
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Crit Damage Field */}
            <FormField
              control={form.control}
              name="critDamage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crit Damage (%)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(
                          values.floatValue ?? DEFAULT_STATS.critDamage
                        )
                      }
                      allowNegative={false}
                      decimalScale={0}
                      placeholder={String(DEFAULT_STATS.critDamage)}
                      suffix="%"
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Armor Penetration Field */}
            <FormField
              control={form.control}
              name="armorPen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Armor Pen (%)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(
                          values.floatValue ?? DEFAULT_STATS.armorPen
                        )
                      }
                      allowNegative={false}
                      decimalScale={1}
                      placeholder={String(DEFAULT_STATS.armorPen)}
                      suffix="%"
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lifesteal Field */}
            <FormField
              control={form.control}
              name="lifesteal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lifesteal (%)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) =>
                        field.onChange(
                          values.floatValue ?? DEFAULT_STATS.lifesteal
                        )
                      }
                      allowNegative={false}
                      decimalScale={1}
                      placeholder={String(DEFAULT_STATS.lifesteal)}
                      suffix="%"
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create Card"
              : "Update Card"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/cards")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
