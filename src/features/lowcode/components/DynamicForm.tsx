import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import type {
  Control,
  ControllerRenderProps,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  EntityDefinition,
  FieldDefinition,
} from "../types/entityDefinition";
import { createRuntimeSchema } from "../services/codeGenerator";

interface DynamicFormProps {
  entityDefinition: EntityDefinition;
  onSubmit?: (data: Record<string, unknown>) => void;
}

/**
 * DynamicForm component renders a form dynamically based on EntityDefinition
 * Uses react-hook-form with runtime Zod schema for validation
 * Displays validation errors and submitted data
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function DynamicForm({ entityDefinition, onSubmit }: DynamicFormProps) {
  const [submittedData, setSubmittedData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Create runtime schema from entity definition
  const schema = useMemo(
    () => createRuntimeSchema(entityDefinition),
    [entityDefinition],
  );

  // Build default values based on field types
  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const field of entityDefinition.fields) {
      switch (field.type) {
        case "text":
          values[field.key] = "";
          break;
        case "number":
          values[field.key] = field.options?.min ?? 0;
          break;
        case "boolean":
          values[field.key] = false;
          break;
        case "select":
          values[field.key] = field.options?.choices?.[0]?.value ?? "";
          break;
      }
    }
    return values;
  }, [entityDefinition]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    setSubmittedData(data);
    onSubmit?.(data);
  };

  // Don't render if no fields
  if (entityDefinition.fields.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Form Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Add fields to see the form preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Form Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {entityDefinition.fields.map((field) => (
              <DynamicFormField
                key={field.id}
                field={field}
                control={form.control}
              />
            ))}

            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>

        {submittedData && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Submitted Data:</h4>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DynamicFormFieldProps {
  field: FieldDefinition;
  control: Control<FieldValues>;
}

/**
 * Renders a single form field based on its type
 */
function DynamicFormField({ field, control }: DynamicFormFieldProps) {
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label || field.key}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>{renderFieldInput(field, formField)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Renders the appropriate input component based on field type
 */
function renderFieldInput(
  field: FieldDefinition,
  formField: ControllerRenderProps<FieldValues, string>,
) {
  switch (field.type) {
    case "text":
      return (
        <Input
          placeholder={`Enter ${field.label || field.key}`}
          {...formField}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          placeholder={`Enter ${field.label || field.key}`}
          min={field.options?.min}
          max={field.options?.max}
          step={field.options?.step}
          {...formField}
          onChange={(e) => {
            const value = e.target.value;
            formField.onChange(value === "" ? undefined : parseFloat(value));
          }}
          value={formField.value ?? ""}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center">
          <Switch
            checked={formField.value}
            onCheckedChange={formField.onChange}
          />
        </div>
      );

    case "select": {
      const choices = field.options?.choices || [];
      if (choices.length === 0) {
        return (
          <Input placeholder="No choices defined" disabled {...formField} />
        );
      }
      return (
        <Select value={formField.value} onValueChange={formField.onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${field.label || field.key}`} />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label || choice.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    default:
      return <Input {...formField} />;
  }
}
