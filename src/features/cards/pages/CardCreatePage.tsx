import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layouts";
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
    <AppLayout
      variant="menu"
      width="narrow"
      title="Create New Card"
      backTo="/cards"
    >
      <CardForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createCard.isPending}
      />
    </AppLayout>
  );
}
