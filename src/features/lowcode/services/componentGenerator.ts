/**
 * Component Generator for Low-Code Builder V2
 * Generates React component code from EntityDefinition
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import type {
  EntityDefinition,
  FieldDefinition,
} from "../types/entityDefinition";

/**
 * Converts entity name to lowercase for variable names
 */
function toLowerCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Maps field type to appropriate form input component
 */
function getFormInputForField(field: FieldDefinition): string {
  switch (field.type) {
    case "text":
      return `<Input placeholder="Enter ${field.label.toLowerCase()}" {...field} />`;
    case "number":
      return `<Input type="number" placeholder="Enter ${field.label.toLowerCase()}" {...field} />`;
    case "boolean":
      return `<Switch checked={field.value} onCheckedChange={field.onChange} />`;
    case "select": {
      const choices = field.options?.choices || [];
      const options = choices
        .map(
          (c) =>
            `              <SelectItem value="${c.value}">${c.label}</SelectItem>`,
        )
        .join("\n");
      return `<Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select ${field.label.toLowerCase()}" />
            </SelectTrigger>
            <SelectContent>
${options}
            </SelectContent>
          </Select>`;
    }
    default:
      return `<Input {...field} />`;
  }
}

/**
 * Generates Form component code with react-hook-form + zod
 * Requirements: 1.1, 1.4
 */
export function generateFormComponent(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no form generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  // Generate imports
  const hasSelect = entity.fields.some((f) => f.type === "select");
  const hasSwitch = entity.fields.some((f) => f.type === "boolean");

  let imports = `import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";`;

  if (hasSelect) {
    imports += `
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";`;
  }

  if (hasSwitch) {
    imports += `
import { Switch } from "@/components/ui/switch";`;
  }

  imports += `
import { ${entityName}, ${entityLower}Schema } from "../types/${entityLower}";`;

  // Generate form fields
  const formFields = entity.fields
    .map((field) => {
      const inputComponent = getFormInputForField(field);
      return `        <FormField
          control={form.control}
          name="${field.key}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${field.label}</FormLabel>
              <FormControl>
                ${inputComponent}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`;
    })
    .join("\n\n");

  // Generate default values
  const defaultValues = entity.fields
    .map((field) => {
      switch (field.type) {
        case "text":
        case "select":
          return `      ${field.key}: "",`;
        case "number":
          return `      ${field.key}: 0,`;
        case "boolean":
          return `      ${field.key}: false,`;
        default:
          return `      ${field.key}: undefined,`;
      }
    })
    .join("\n");

  return `${imports}

interface ${entityName}FormProps {
  defaultValues?: Partial<${entityName}>;
  onSubmit: (data: ${entityName}) => void;
  isLoading?: boolean;
}

export function ${entityName}Form({ defaultValues, onSubmit, isLoading }: ${entityName}FormProps) {
  const form = useForm<${entityName}>({
    resolver: zodResolver(${entityLower}Schema),
    defaultValues: defaultValues || {
${defaultValues}
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
${formFields}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
`;
}

/**
 * Maps field type to display format for Card component
 */
function getCardDisplayForField(
  field: FieldDefinition,
  entityLower: string,
): string {
  switch (field.type) {
    case "boolean":
      return `{${entityLower}.${field.key} ? "Yes" : "No"}`;
    default:
      return `{${entityLower}.${field.key}}`;
  }
}

/**
 * Generates Card component code displaying all fields
 * Uses shadcn Card component
 * Requirements: 1.3, 1.4
 */
export function generateCardComponent(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no card generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  // Generate field displays
  const fieldDisplays = entity.fields
    .map((field) => {
      const displayValue = getCardDisplayForField(field, entityLower);
      return `          <div className="flex justify-between">
            <span className="text-muted-foreground">${field.label}</span>
            <span>${displayValue}</span>
          </div>`;
    })
    .join("\n");

  return `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ${entityName} } from "../types/${entityLower}";

interface ${entityName}CardProps {
  ${entityLower}: ${entityName};
}

export function ${entityName}Card({ ${entityLower} }: ${entityName}CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>${entityName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
${fieldDisplays}
      </CardContent>
    </Card>
  );
}
`;
}

/**
 * Generates List component code with mapping over items
 * Includes delete button per item
 * Requirements: 1.2, 1.4
 */
export function generateListComponent(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no list generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  // Get first few fields for display in list (max 3)
  const displayFields = entity.fields.slice(0, 3);
  const fieldDisplays = displayFields
    .map((field) => {
      const displayValue = getCardDisplayForField(field, "item");
      return `              <span className="text-sm">${displayValue}</span>`;
    })
    .join("\n");

  return `import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ${entityName} } from "../types/${entityLower}";

interface ${entityName}ListProps {
  items: ${entityName}[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ${entityName}List({ items, onDelete, isLoading }: ${entityName}ListProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No ${entityLower}s found. Create your first one!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
${fieldDisplays}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
`;
}
