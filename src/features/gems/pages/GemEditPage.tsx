import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layouts";
import { GemForm } from "../components/GemForm";
import { useGem, useUpdateGem } from "../hooks";
import type { GemFormSchemaType } from "../types/schemas";

/**
 * GemEditPage
 * GemForm pre-filled with gem data
 * Requirements: 1.3
 */
export function GemEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: gem, isLoading, error } = useGem(id || "");
  const updateGem = useUpdateGem();

  const handleSubmit = async (data: GemFormSchemaType) => {
    if (!id) return;

    await updateGem.mutateAsync({
      id,
      input: {
        name: data.name,
        description: data.description,
        skillType: data.skillType,
        trigger: data.trigger,
        activationChance: data.activationChance,
        cooldown: data.cooldown,
        effectParams: data.effectParams,
      },
    });
    navigate("/gems");
  };

  if (isLoading) {
    return (
      <AppLayout variant="menu" width="narrow" title="Edit Gem" backTo="/gems">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !gem) {
    return (
      <AppLayout variant="menu" width="narrow" title="Edit Gem" backTo="/gems">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Gem Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The gem you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/gems")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gems
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout variant="menu" width="narrow" title="Edit Gem" backTo="/gems">
      <GemForm
        mode="edit"
        initialData={gem}
        onSubmit={handleSubmit}
        isSubmitting={updateGem.isPending}
      />
    </AppLayout>
  );
}
