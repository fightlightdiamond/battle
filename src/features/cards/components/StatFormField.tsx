import type { Control, FieldValues, Path } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { StatDefinition } from "../types/statConfig";

interface StatFormFieldProps<T extends FieldValues> {
  /** Stat definition from the registry */
  stat: StatDefinition;
  /** React Hook Form control */
  control: Control<T>;
}

/**
 * StatFormField component
 * Renders a form field for a stat based on its StatDefinition config
 * Uses NumericFormat with correct suffix, decimalPlaces from config
 * Requirements: 2.1, 2.2, 2.3
 */
export function StatFormField<T extends FieldValues>({
  stat,
  control,
}: StatFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={stat.key as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{stat.label}</FormLabel>
          <FormControl>
            <NumericFormat
              value={field.value as number}
              onValueChange={(values) =>
                field.onChange(values.floatValue ?? stat.defaultValue)
              }
              thousandSeparator={stat.format === "number" ? "," : undefined}
              allowNegative={stat.min < 0}
              decimalScale={stat.decimalPlaces}
              placeholder={String(stat.defaultValue)}
              suffix={stat.format === "percentage" ? "%" : undefined}
              customInput={Input}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
