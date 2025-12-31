import { Trash2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type {
  FieldDefinition,
  FieldType,
  SelectChoice,
} from "../types/entityDefinition";

interface FieldEditorProps {
  field: FieldDefinition;
  onChange: (updates: Partial<FieldDefinition>) => void;
  onRemove: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "boolean", label: "Boolean" },
];

/**
 * FieldEditor component for editing a single field definition
 * Provides inputs for key, label, type, required toggle, and type-specific options
 * Requirements: 1.3, 1.4, 1.5
 */
export function FieldEditor({ field, onChange, onRemove }: FieldEditorProps) {
  const handleTypeChange = (type: FieldType) => {
    // Reset options when type changes
    const newOptions =
      type === "select" ? { choices: [{ value: "", label: "" }] } : undefined;
    onChange({ type, options: newOptions });
  };

  const handleChoiceChange = (
    index: number,
    updates: Partial<SelectChoice>,
  ) => {
    const choices = [...(field.options?.choices || [])];
    choices[index] = { ...choices[index], ...updates };
    onChange({ options: { ...field.options, choices } });
  };

  const addChoice = () => {
    const choices = [
      ...(field.options?.choices || []),
      { value: "", label: "" },
    ];
    onChange({ options: { ...field.options, choices } });
  };

  const removeChoice = (index: number) => {
    const choices = (field.options?.choices || []).filter(
      (_, i) => i !== index,
    );
    onChange({ options: { ...field.options, choices } });
  };

  return (
    <Card className="py-4">
      <CardContent className="space-y-4">
        {/* Main field inputs row */}
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Key input */}
          <div className="col-span-3 space-y-1.5">
            <Label htmlFor={`field-key-${field.id}`}>Key</Label>
            <Input
              id={`field-key-${field.id}`}
              placeholder="fieldKey"
              value={field.key}
              onChange={(e) => onChange({ key: e.target.value })}
            />
          </div>

          {/* Label input */}
          <div className="col-span-3 space-y-1.5">
            <Label htmlFor={`field-label-${field.id}`}>Label</Label>
            <Input
              id={`field-label-${field.id}`}
              placeholder="Field Label"
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </div>

          {/* Type selector */}
          <div className="col-span-2 space-y-1.5">
            <Label>Type</Label>
            <Select value={field.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required toggle */}
          <div className="col-span-2 space-y-1.5">
            <Label>Required</Label>
            <div className="flex items-center h-9">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onChange({ required: checked })}
              />
            </div>
          </div>

          {/* Remove button */}
          <div className="col-span-2 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemove}
              aria-label="Remove field"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Type-specific options */}
        {field.type === "text" && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label htmlFor={`field-minLength-${field.id}`}>Min Length</Label>
              <Input
                id={`field-minLength-${field.id}`}
                type="number"
                min={0}
                placeholder="0"
                value={field.options?.minLength ?? ""}
                onChange={(e) =>
                  onChange({
                    options: {
                      ...field.options,
                      minLength: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`field-maxLength-${field.id}`}>Max Length</Label>
              <Input
                id={`field-maxLength-${field.id}`}
                type="number"
                min={0}
                placeholder="100"
                value={field.options?.maxLength ?? ""}
                onChange={(e) =>
                  onChange({
                    options: {
                      ...field.options,
                      maxLength: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {field.type === "number" && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label htmlFor={`field-min-${field.id}`}>Min</Label>
              <Input
                id={`field-min-${field.id}`}
                type="number"
                placeholder="0"
                value={field.options?.min ?? ""}
                onChange={(e) =>
                  onChange({
                    options: {
                      ...field.options,
                      min: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`field-max-${field.id}`}>Max</Label>
              <Input
                id={`field-max-${field.id}`}
                type="number"
                placeholder="100"
                value={field.options?.max ?? ""}
                onChange={(e) =>
                  onChange({
                    options: {
                      ...field.options,
                      max: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`field-step-${field.id}`}>Step</Label>
              <Input
                id={`field-step-${field.id}`}
                type="number"
                placeholder="1"
                value={field.options?.step ?? ""}
                onChange={(e) =>
                  onChange({
                    options: {
                      ...field.options,
                      step: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {field.type === "select" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Choices</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChoice}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Choice
              </Button>
            </div>
            <div className="space-y-2">
              {(field.options?.choices || []).map((choice, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="value"
                    value={choice.value}
                    onChange={(e) =>
                      handleChoiceChange(index, { value: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Label"
                    value={choice.label}
                    onChange={(e) =>
                      handleChoiceChange(index, { label: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChoice(index)}
                    disabled={(field.options?.choices?.length || 0) <= 1}
                    aria-label="Remove choice"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
