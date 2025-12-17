import { useNavigate, useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { ArrowLeft, ImageOff, Sword, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layouts";
import { StatIcon } from "../components";
import { useCard } from "../hooks";
import {
  useCardEquipment,
  useWeapon,
  useWeapons,
  useEquipWeapon,
  useUnequipWeapon,
} from "../../weapons/hooks";
import { WeaponSelectorWithActions } from "../../weapons/components/WeaponSelector";
import {
  calculateEffectiveStats,
  calculateEffectiveRange,
} from "../../weapons/services/equipmentService";
import { getStatsByTier, type StatDefinition } from "../types/statConfig";
import type { Card as CardType } from "../types/card";
import type { Weapon } from "../../weapons/types/weapon";
import type { EffectiveCardStats } from "../../weapons/types/equipment";

/**
 * CardDetailPage
 * Display card base stats, equipped weapon info, and effective stats
 * Requirements: 3.1, 3.3, 3.2, 3.4, 3.5
 */
export function CardDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    data: card,
    isLoading: cardLoading,
    error: cardError,
  } = useCard(id || "");
  const { data: equipment, isLoading: equipmentLoading } = useCardEquipment(
    id || "",
  );
  const { data: weapons = [], isLoading: weaponsLoading } = useWeapons();
  const { data: equippedWeapon } = useWeapon(equipment?.weaponId || "", {
    enabled: !!equipment?.weaponId,
  });

  const equipWeapon = useEquipWeapon();
  const unequipWeapon = useUnequipWeapon();

  // Local state for weapon selection before equipping
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  // Calculate effective stats when card and weapon are available
  const effectiveStats = useMemo<EffectiveCardStats | null>(() => {
    if (!card) return null;
    return calculateEffectiveStats(card, equippedWeapon || null);
  }, [card, equippedWeapon]);

  // Calculate effective attack range (base 1 + weapon bonus)
  // Requirements: 2.3
  const effectiveRange = useMemo<number>(() => {
    return calculateEffectiveRange(equippedWeapon || null);
  }, [equippedWeapon]);

  const handleEquip = async () => {
    if (!id || !selectedWeaponId) return;
    await equipWeapon.mutateAsync({ cardId: id, weaponId: selectedWeaponId });
    setSelectedWeaponId(null);
  };

  const handleUnequip = async () => {
    if (!id) return;
    await unequipWeapon.mutateAsync(id);
  };

  const isLoading = cardLoading || equipmentLoading;

  if (isLoading) {
    return (
      <AppLayout
        variant="menu"
        width="default"
        title="Card Details"
        backTo="/cards"
      >
        <CardDetailSkeleton />
      </AppLayout>
    );
  }

  if (cardError || !card) {
    return (
      <AppLayout
        variant="menu"
        width="default"
        title="Card Details"
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
    <AppLayout
      variant="menu"
      width="default"
      title={card.name}
      backTo="/cards"
      headerRight={
        <Button asChild variant="outline">
          <Link to={`/cards/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Card
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Image and Basic Info */}
        <Card>
          <CardContent className="p-0">
            <div className="aspect-square relative bg-muted">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats and Equipment */}
        <div className="space-y-6">
          {/* Base Stats */}
          <StatsCard
            title="Base Stats"
            card={card}
            stats={effectiveStats}
            showEffective={false}
            effectiveRange={effectiveRange}
          />

          {/* Equipped Weapon */}
          <EquippedWeaponCard
            weapon={equippedWeapon || null}
            weapons={weapons}
            selectedWeaponId={selectedWeaponId}
            onSelect={setSelectedWeaponId}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            isLoading={weaponsLoading}
            isEquipping={equipWeapon.isPending}
            isUnequipping={unequipWeapon.isPending}
          />

          {/* Effective Stats (only show when weapon equipped) */}
          {equippedWeapon && effectiveStats && (
            <StatsCard
              title="Effective Stats"
              card={card}
              stats={effectiveStats}
              showEffective={true}
              weapon={equippedWeapon}
              effectiveRange={effectiveRange}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatsCardProps {
  title: string;
  card: CardType;
  stats: EffectiveCardStats | null;
  showEffective: boolean;
  weapon?: Weapon | null;
  effectiveRange?: number;
}

/**
 * StatsCard - Display card stats grouped by tier
 * Shows base stats or effective stats with weapon bonuses highlighted
 */
function StatsCard({
  title,
  card,
  stats,
  showEffective,
  weapon,
  effectiveRange,
}: StatsCardProps) {
  const statsByTier = getStatsByTier();
  const displayStats = showEffective && stats ? stats : card;

  // Calculate weapon attack range bonus for display
  const weaponRangeBonus = weapon?.attackRange ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core Stats */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Core Stats
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {statsByTier.core.map((stat) => (
              <StatRow
                key={stat.key}
                stat={stat}
                effectiveValue={
                  displayStats[stat.key as keyof typeof displayStats] as number
                }
                showBonus={showEffective && weapon !== undefined}
                weaponBonus={weapon ? getWeaponBonus(stat.key, weapon) : 0}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Combat Stats */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Combat Stats
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {statsByTier.combat.map((stat) => (
              <StatRow
                key={stat.key}
                stat={stat}
                effectiveValue={
                  displayStats[stat.key as keyof typeof displayStats] as number
                }
                showBonus={showEffective && weapon !== undefined}
                weaponBonus={weapon ? getWeaponBonus(stat.key, weapon) : 0}
              />
            ))}
          </div>
        </div>

        {/* Attack Range - Requirements: 2.3 */}
        {effectiveRange !== undefined && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Attack Range
              </h4>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium">Effective Range</span>
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <span
                    className={
                      weaponRangeBonus > 0 ? "text-green-600 font-semibold" : ""
                    }
                  >
                    {effectiveRange} cell{effectiveRange !== 1 ? "s" : ""}
                  </span>
                  {weaponRangeBonus > 0 && (
                    <span className="text-xs text-green-600">
                      (+{weaponRangeBonus})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatRowProps {
  stat: StatDefinition;
  effectiveValue: number;
  showBonus: boolean;
  weaponBonus: number;
}

/**
 * StatRow - Display a single stat with optional weapon bonus indicator
 */
function StatRow({
  stat,
  effectiveValue,
  showBonus,
  weaponBonus,
}: StatRowProps) {
  const hasBonus = showBonus && weaponBonus > 0;

  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
      <span className="flex items-center gap-2 text-sm">
        <StatIcon iconName={stat.icon} />
        <span className="font-medium">{stat.shortLabel}</span>
      </span>
      <span className="flex items-center gap-1 text-sm">
        <span className={hasBonus ? "text-green-600 font-semibold" : ""}>
          {formatStatValue(effectiveValue, stat)}
        </span>
        {hasBonus && (
          <span className="text-xs text-green-600">
            (+{formatStatValue(weaponBonus, stat)})
          </span>
        )}
      </span>
    </div>
  );
}

interface EquippedWeaponCardProps {
  weapon: Weapon | null;
  weapons: Weapon[];
  selectedWeaponId: string | null;
  onSelect: (weaponId: string | null) => void;
  onEquip: () => void;
  onUnequip: () => void;
  isLoading: boolean;
  isEquipping: boolean;
  isUnequipping: boolean;
}

/**
 * EquippedWeaponCard - Display equipped weapon and equip/unequip controls
 * Requirements: 3.2, 3.4, 3.5
 */
function EquippedWeaponCard({
  weapon,
  weapons,
  selectedWeaponId,
  onSelect,
  onEquip,
  onUnequip,
  isLoading,
  isEquipping,
  isUnequipping,
}: EquippedWeaponCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sword className="h-5 w-5" />
          Equipped Weapon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Equipped Weapon Display */}
        {weapon ? (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            {weapon.imageUrl ? (
              <img
                src={weapon.imageUrl}
                alt={weapon.name}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                <Sword className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold">{weapon.name}</p>
              <p className="text-sm text-muted-foreground">
                +{weapon.atk} ATK • +{weapon.critChance}% Crit
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/weapons/${weapon.id}/edit`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50 text-center text-muted-foreground">
            <Sword className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No weapon equipped</p>
          </div>
        )}

        <Separator />

        {/* Weapon Selector */}
        <div>
          <h4 className="text-sm font-medium mb-2">
            {weapon ? "Change Weapon" : "Equip a Weapon"}
          </h4>
          <WeaponSelectorWithActions
            weapons={weapons}
            selectedWeaponId={selectedWeaponId}
            onSelect={onSelect}
            onEquip={onEquip}
            onUnequip={onUnequip}
            isLoading={isLoading}
            isEquipping={isEquipping}
            isUnequipping={isUnequipping}
            hasEquippedWeapon={!!weapon}
            placeholder="Select a weapon to equip"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CardDetailSkeleton - Loading state for CardDetailPage
 */
function CardDetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-0">
          <Skeleton className="aspect-square w-full" />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get weapon bonus for a specific stat key
 */
function getWeaponBonus(statKey: string, weapon: Weapon): number {
  const weaponBonusStats: Record<string, keyof Weapon> = {
    atk: "atk",
    critChance: "critChance",
    critDamage: "critDamage",
    armorPen: "armorPen",
    lifesteal: "lifesteal",
  };

  const weaponKey = weaponBonusStats[statKey];
  if (weaponKey && typeof weapon[weaponKey] === "number") {
    return weapon[weaponKey] as number;
  }
  return 0;
}

/**
 * Format stat value based on stat definition
 */
function formatStatValue(value: number, stat: StatDefinition): string {
  if (stat.format === "percentage") {
    return `${value.toFixed(stat.decimalPlaces)}%`;
  }
  return value.toLocaleString();
}
