import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layouts";
import { CardForm } from "../components";
import { useCard, useUpdateCard } from "../hooks";
import type { CardFormSchemaType } from "../types/schemas";

/**
 * CardEditPage
 * Fetch card by id from URL params
 * Render CardForm in edit mode with pre-filled data
 * On success navigate to `/cards`
 * Requirements: 3.1, 3.4
 */
export function CardEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: card, isLoading, error } = useCard(id || "");
  const updateCard = useUpdateCard();

  const handleSubmit = async (data: CardFormSchemaType) => {
    if (!id) return;

    await updateCard.mutateAsync({
      id,
      input: {
        name: data.name,
        // Core Stats (Tier 1)
        hp: data.hp,
        atk: data.atk,
        def: data.def,
        spd: data.spd,
        // Combat Stats (Tier 2)
        critChance: data.critChance,
        critDamage: data.critDamage,
        armorPen: data.armorPen,
        lifesteal: data.lifesteal,
        image: data.image,
      },
    });
    navigate("/cards");
  };

  if (isLoading) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit Card"
        backTo="/cards"
      >
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !card) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit Card"
        backTo="/cards"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Card Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The card you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/cards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cards
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout variant="menu" width="narrow" title="Edit Card" backTo="/cards">
      <CardForm
        mode="edit"
        initialData={card}
        onSubmit={handleSubmit}
        isSubmitting={updateCard.isPending}
      />
    </AppLayout>
  );
}
