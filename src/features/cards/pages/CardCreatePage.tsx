import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardForm } from "../components";
import { useCreateCard } from "../hooks";
import type { CardFormSchemaType } from "../types/schemas";

/**
 * CardCreatePage
 * Render CardForm in create mode
 * On success navigate to `/cards`
 * Requirements: 2.1, 2.6
 */
export function CardCreatePage() {
  const navigate = useNavigate();
  const createCard = useCreateCard();

  const handleSubmit = async (data: CardFormSchemaType) => {
    await createCard.mutateAsync({
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
    });
    navigate("/cards");
  };

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
          <h1 className="text-3xl font-bold">Create New Card</h1>
        </div>

        {/* Form */}
        <CardForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createCard.isPending}
        />
      </div>
    </div>
  );
}
