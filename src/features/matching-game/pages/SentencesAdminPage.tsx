/**
 * SentencesAdminPage - Admin page for managing sentences
 * Supports filtering by game template ID
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SentenceList } from "../components/SentenceList";
import { SentenceForm } from "../components/SentenceForm";
import {
  useSentences,
  useCreateSentence,
  useUpdateSentence,
  useDeleteSentence,
} from "../hooks";
import { useGameTemplate } from "../hooks/useGameTemplates";
import type { Sentence, SentenceFormInput } from "../types";

export function SentencesAdminPage() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);

  // Load game template info
  const { data: template } = useGameTemplate(templateId);

  // Queries - filter by templateId if provided
  const { data: sentences = [], isLoading } = useSentences(
    templateId ? { gameTemplateId: templateId } : undefined,
  );
  const createMutation = useCreateSentence();
  const updateMutation = useUpdateSentence();
  const deleteMutation = useDeleteSentence();

  const handleCreate = () => {
    setEditingSentence(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xóa câu thành công");
      },
      onError: () => {
        toast.error("Không thể xóa câu");
      },
    });
  };

  const handleSubmit = (data: SentenceFormInput) => {
    // If we're in a template context, add the templateId
    const inputData = templateId
      ? { ...data, gameTemplateId: templateId }
      : data;

    if (editingSentence) {
      updateMutation.mutate(
        { id: editingSentence.id, input: inputData },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật câu thành công");
            setIsDialogOpen(false);
            setEditingSentence(null);
          },
          onError: () => {
            toast.error("Không thể cập nhật câu");
          },
        },
      );
    } else {
      createMutation.mutate(inputData, {
        onSuccess: () => {
          toast.success("Đã tạo câu mới thành công");
          setIsDialogOpen(false);
        },
        onError: () => {
          toast.error("Không thể tạo câu mới");
        },
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingSentence(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with back button for template context */}
      {templateId && (
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/matching-game/templates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách game
          </Button>
          {template && (
            <div className="mt-2">
              <h2 className="text-xl font-semibold">{template.name}</h2>
              <p className="text-sm text-muted-foreground">
                Quản lý các câu thuộc game này
              </p>
            </div>
          )}
        </div>
      )}

      <SentenceList
        sentences={sentences}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSentence ? "Sửa câu" : "Tạo câu mới"}
            </DialogTitle>
          </DialogHeader>
          <SentenceForm
            sentence={editingSentence || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
