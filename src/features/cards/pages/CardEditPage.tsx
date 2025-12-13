import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cards")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Card</h1>
        </div>

        {/* Form */}
        <CardForm
          mode="edit"
          initialData={card}
          onSubmit={handleSubmit}
          isSubmitting={updateCard.isPending}
        />
      </div>
    </div>
  );
}
