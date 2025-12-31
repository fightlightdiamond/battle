import { Trash2, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useEntityStore,
  selectSavedEntities,
  selectIsLoading,
  selectCurrentEntity,
} from "../store/entityStore";

/**
 * SavedEntitiesList component displays a list of saved entity definitions
 * Provides load and delete buttons for each entity
 * Requirements: 4.2, 4.3, 4.4
 */
export function SavedEntitiesList() {
  const savedEntities = useEntityStore(selectSavedEntities);
  const isLoading = useEntityStore(selectIsLoading);
  const currentEntity = useEntityStore(selectCurrentEntity);
  const loadEntity = useEntityStore((state) => state.loadEntity);
  const deleteEntity = useEntityStore((state) => state.deleteEntity);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Saved Entities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Saved Entities</CardTitle>
      </CardHeader>
      <CardContent>
        {savedEntities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved entities yet. Create and save your first entity.
          </p>
        ) : (
          <div className="space-y-2">
            {savedEntities.map((entity) => {
              const isActive = entity.id === currentEntity.id;
              return (
                <div
                  key={entity.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entity.name || "Unnamed Entity"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entity.fields.length} field
                      {entity.fields.length !== 1 ? "s" : ""} •{" "}
                      {formatDate(entity.updatedAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => loadEntity(entity.id)}
                      disabled={isActive}
                      aria-label={`Load ${entity.name}`}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEntity(entity.id)}
                      aria-label={`Delete ${entity.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
