import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layouts";
import { WeaponForm } from "../components";
import { useCreateWeapon } from "../hooks";
import type { WeaponFormSchemaType } from "../types/schemas";

/**
 * WeaponCreatePage
 * WeaponForm for creating new weapon
 * Requirements: 1.1
 */
export function WeaponCreatePage() {
  const navigate = useNavigate();
  const createWeapon = useCreateWeapon();

  const handleSubmit = async (data: WeaponFormSchemaType) => {
    await createWeapon.mutateAsync({
      name: data.name,
      image: data.image,
      atk: data.atk,
      critChance: data.critChance,
      critDamage: data.critDamage,
      armorPen: data.armorPen,
      lifesteal: data.lifesteal,
      attackRange: data.attackRange,
    });
    navigate("/weapons");
  };

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Create New Weapon"
      backTo="/weapons"
    >
      <WeaponForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createWeapon.isPending}
      />
    </AppLayout>
  );
}
