import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layouts";
import { WeaponForm } from "../components";
import { useWeapon, useUpdateWeapon } from "../hooks";
import type { WeaponFormSchemaType } from "../types/schemas";

/**
 * WeaponEditPage
 * WeaponForm pre-filled with weapon data
 * Requirements: 2.2
 */
export function WeaponEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: weapon, isLoading, error } = useWeapon(id || "");
  const updateWeapon = useUpdateWeapon();

  const handleSubmit = async (data: WeaponFormSchemaType) => {
    if (!id) return;

    await updateWeapon.mutateAsync({
      id,
      input: {
        name: data.name,
        image: data.image,
        atk: data.atk,
        critChance: data.critChance,
        critDamage: data.critDamage,
        armorPen: data.armorPen,
        lifesteal: data.lifesteal,
        attackRange: data.attackRange,
      },
    });
    navigate("/weapons");
  };

  if (isLoading) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit Weapon"
        backTo="/weapons"
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

  if (error || !weapon) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit Weapon"
        backTo="/weapons"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Weapon Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The weapon you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/weapons")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Weapons
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Edit Weapon"
      backTo="/weapons"
    >
      <WeaponForm
        mode="edit"
        initialData={weapon}
        onSubmit={handleSubmit}
        isSubmitting={updateWeapon.isPending}
      />
    </AppLayout>
  );
}
