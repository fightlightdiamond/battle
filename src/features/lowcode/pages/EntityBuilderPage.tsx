import { useEffect } from "react";
import { Plus, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layouts";
import { FieldEditor } from "../components/FieldEditor";
import { CodePreview } from "../components/CodePreview";
import { DynamicForm } from "../components/DynamicForm";
import { SavedEntitiesList } from "../components/SavedEntitiesList";
import { ExportPanel } from "../components/ExportPanel";
import { PresetSelector } from "../components/PresetSelector";
import {
  useEntityStore,
  selectCurrentEntity,
  selectFields,
  selectEntityName,
  selectError,
} from "../store/entityStore";

/**
 * EntityBuilderPage - Main page for the Low-Code Builder
 * Three-column layout on large screens: Editor (left) | Preview (center) | Export (right)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1, 5.2, 5.3
 */
export function EntityBuilderPage() {
  const currentEntity = useEntityStore(selectCurrentEntity);
  const fields = useEntityStore(selectFields);
  const entityName = useEntityStore(selectEntityName);
  const error = useEntityStore(selectError);

  const setEntityName = useEntityStore((state) => state.setEntityName);
  const addField = useEntityStore((state) => state.addField);
  const updateField = useEntityStore((state) => state.updateField);
  const removeField = useEntityStore((state) => state.removeField);
  const saveEntity = useEntityStore((state) => state.saveEntity);
  const resetCurrentEntity = useEntityStore(
    (state) => state.resetCurrentEntity,
  );
  const loadSavedEntities = useEntityStore((state) => state.loadSavedEntities);

  // Load saved entities on mount
  useEffect(() => {
    loadSavedEntities();
  }, [loadSavedEntities]);

  const handleSave = () => {
    if (!entityName.trim()) {
      return;
    }
    saveEntity();
  };

  const canSave = entityName.trim().length > 0;

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Low-Code Builder"
      subtitle="Define entities and generate TypeScript code"
      headerRight={
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetCurrentEntity}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Entity Name Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Entity Definition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">Entity Name</Label>
                <Input
                  id="entity-name"
                  placeholder="MyEntity (PascalCase)"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                />
                {!entityName.trim() && (
                  <p className="text-sm text-muted-foreground">
                    Enter a name for your entity (e.g., User, Product, Order)
                  </p>
                )}
              </div>

              {/* Preset Selector - Requirements: 1.1, 1.2 */}
              <PresetSelector />

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {/* Field List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Fields</CardTitle>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No fields defined. Click "Add Field" to start.
                </p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onChange={(updates) => updateField(field.id, updates)}
                      onRemove={() => removeField(field.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Entities List */}
          <SavedEntitiesList />
        </div>

        {/* Center Column - Code Preview */}
        <div className="space-y-6">
          <CodePreview entityDefinition={currentEntity} />
          <DynamicForm entityDefinition={currentEntity} />
        </div>

        {/* Right Column - Export */}
        <div className="space-y-6">
          <ExportPanel entityDefinition={currentEntity} />
        </div>
      </div>
    </AppLayout>
  );
}
