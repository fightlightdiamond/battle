import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layouts";
import { GemForm } from "../components/GemForm";
import { useCreateGem } from "../hooks";
import type { GemFormSchemaType } from "../types/schemas";

/**
 * GemCreatePage
 * GemForm for creating new gem
 * Requirements: 1.1
 */
export function GemCreatePage() {
  const navigate = useNavigate();
  const createGem = useCreateGem();

  const handleSubmit = async (data: GemFormSchemaType) => {
    await createGem.mutateAsync({
      name: data.name,
      description: data.description,
      skillType: data.skillType,
      trigger: data.trigger,
      activationChance: data.activationChance,
      cooldown: data.cooldown,
      effectParams: data.effectParams,
    });
    navigate("/gems");
  };

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Create New Gem"
      backTo="/gems"
    >
      <GemForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createGem.isPending}
      />
    </AppLayout>
  );
}
