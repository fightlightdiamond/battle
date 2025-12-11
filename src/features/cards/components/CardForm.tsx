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
      atk: initialData?.atk ?? 0,
      hp: initialData?.hp ?? 1,
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
                    field.onChange(values.floatValue ?? 0)
                  }
                  thousandSeparator=","
                  allowNegative={false}
                  decimalScale={0}
                  placeholder="0"
                  customInput={Input}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    field.onChange(values.floatValue ?? 1)
                  }
                  thousandSeparator=","
                  allowNegative={false}
                  decimalScale={0}
                  placeholder="1"
                  customInput={Input}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
