/**
 * GameTemplatesAdminPage - Admin page for managing game templates
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameTemplateForm } from "../components/GameTemplateForm";
import { GameTemplateList } from "../components/GameTemplateList";
import {
  useGameTemplatesWithCounts,
  useCreateGameTemplate,
  useUpdateGameTemplate,
  useDeleteGameTemplate,
  useToggleGameTemplateActive,
} from "../hooks/useGameTemplates";
import type { GameTemplate, GameTemplateFormInput } from "../types";

type ViewMode = "list" | "create" | "edit";

export function GameTemplatesAdminPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTemplate, setEditingTemplate] = useState<GameTemplate | null>(
    null,
  );

  // Queries & Mutations
  const { data: templates = [], isLoading } = useGameTemplatesWithCounts();
  const createMutation = useCreateGameTemplate();
  const updateMutation = useUpdateGameTemplate();
  const deleteMutation = useDeleteGameTemplate();
  const toggleMutation = useToggleGameTemplateActive();

  // Handlers
  const handleCreate = (data: GameTemplateFormInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setViewMode("list");
      },
    });
  };

  const handleUpdate = (data: GameTemplateFormInput) => {
    if (!editingTemplate) return;

    updateMutation.mutate(
      { id: editingTemplate.id, input: data },
      {
        onSuccess: () => {
          setViewMode("list");
          setEditingTemplate(null);
        },
      },
    );
  };

  const handleEdit = (template: GameTemplate) => {
    setEditingTemplate(template);
    setViewMode("edit");
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleManageSentences = (templateId: string) => {
    navigate(`/admin/matching-game/templates/${templateId}/sentences`);
  };

  const handlePlay = (templateId: string) => {
    navigate(`/matching-game/play/${templateId}`);
  };

  const handleCancel = () => {
    setViewMode("list");
    setEditingTemplate(null);
  };

  // Render
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quản lý Game Templates</h1>
            <p className="text-muted-foreground">
              Tạo và quản lý các phiên bản game "Cặp đôi trời sinh"
            </p>
          </div>
        </div>

        {viewMode === "list" && (
          <Button onClick={() => setViewMode("create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Game mới
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === "list" && (
        <GameTemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onManageSentences={handleManageSentences}
          onPlay={handlePlay}
          isDeleting={deleteMutation.isPending}
          isToggling={toggleMutation.isPending}
        />
      )}

      {viewMode === "create" && (
        <div className="flex justify-center">
          <GameTemplateForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {viewMode === "edit" && editingTemplate && (
        <div className="flex justify-center">
          <GameTemplateForm
            gameTemplate={editingTemplate}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
