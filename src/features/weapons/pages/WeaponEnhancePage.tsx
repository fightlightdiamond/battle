/**
 * WeaponEnhancePage
 *
 * Page for weapon enhancement with weapon selection and enhancement panel
 * Uses AppLayout for consistent navigation
 */

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layouts";
import { useWeapons } from "../hooks/useWeapons";
import { useCreateWeapon } from "../hooks/useCreateWeapon";
import {
  useEnhancementStore,
  setEnhancementQueryClient,
} from "../store/enhancementStore";
import { WeaponEnhanceCard } from "../components/WeaponEnhanceCard";
import { EnhancementPanel } from "../components/EnhancementPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Package, History, Search, Plus } from "lucide-react";
import { MaterialService } from "../services/materialService";
import {
  MATERIAL_INFO,
  type EnhanceMaterial,
  type EnhanceMaterialType,
} from "../types/enhancement";
import type { Weapon } from "../types/weapon";

export function WeaponEnhancePage() {
  const queryClient = useQueryClient();
  const { data: weapons = [], isLoading } = useWeapons();
  const { mutate: createWeapon, isPending: isCreating } = useCreateWeapon();
  const { selectWeapon, selectedWeapon, clearResult } = useEnhancementStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<EnhanceMaterial[]>([]);

  // Set queryClient for cache invalidation
  useEffect(() => {
    setEnhancementQueryClient(queryClient);
  }, [queryClient]);

  // Load materials from API
  useEffect(() => {
    // Initial load
    MaterialService.initializeAsync().then(() => {
      setMaterials(MaterialService.getAll());
    });

    // Periodic refresh
    const interval = setInterval(() => {
      setMaterials(MaterialService.getAll());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter weapons
  const filteredWeapons = weapons.filter((w: Weapon) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectWeapon = (weaponId: string) => {
    const weapon = weapons.find((w: Weapon) => w.id === weaponId);
    if (weapon) {
      clearResult();
      selectWeapon(weapon);
    }
  };

  // Create sample weapons for testing
  const createSampleWeapons = () => {
    const sampleWeapons = [
      {
        name: "Iron Sword",
        weaponType: "sword_shield" as const,
        image: null,
        atk: 50,
        critChance: 5,
        critDamage: 150,
      },
      {
        name: "Steel Spear",
        weaponType: "spear" as const,
        image: null,
        atk: 75,
        critChance: 8,
        critDamage: 160,
      },
      {
        name: "Magic Bow",
        weaponType: "bow" as const,
        image: null,
        atk: 100,
        critChance: 12,
        critDamage: 180,
      },
    ];
    sampleWeapons.forEach((weapon) => createWeapon(weapon));
  };

  if (isLoading) {
    return (
      <AppLayout
        variant="menu"
        width="full"
        title="Weapon Enhancement"
        backTo="/weapons"
        backLabel="Weapons"
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading weapons...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Weapon Enhancement"
      backTo="/weapons"
      backLabel="Weapons"
      headerRight={
        <div className="flex items-center gap-4">
          {/* Material Summary in Header */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {(
              [
                "enhancement_stone_basic",
                "enhancement_stone_intermediate",
                "enhancement_stone_advanced",
                "protection_scroll",
              ] as const
            ).map((type) => {
              const info = MATERIAL_INFO[type];
              const material = materials.find((m) => m.type === type);
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className="gap-1"
                  title={info.name}
                >
                  <span>{info.icon}</span>
                  <span>{material?.quantity ?? 0}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      }
    >
      <Tabs defaultValue="enhance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enhance" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enhance
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhance" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weapon Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Select Weapon</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search weapons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredWeapons.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No weapons found</p>
                      <p className="text-sm mb-6">
                        Create weapons first to enhance them
                      </p>
                      <Button
                        onClick={createSampleWeapons}
                        disabled={isCreating}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isCreating ? "Creating..." : "Create Sample Weapons"}
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredWeapons.map((weapon) => (
                          <WeaponEnhanceCard
                            key={weapon.id}
                            weapon={weapon}
                            selected={selectedWeapon?.id === weapon.id}
                            onClick={() => handleSelectWeapon(weapon.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhancement Panel */}
            <div className="lg:col-span-1">
              <EnhancementPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Enhancement Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(
                  [
                    "enhancement_stone_basic",
                    "enhancement_stone_intermediate",
                    "enhancement_stone_advanced",
                    "protection_scroll",
                  ] as const
                ).map((type: EnhanceMaterialType) => {
                  const info = MATERIAL_INFO[type];
                  const material = materials.find((m) => m.type === type);
                  return (
                    <Card
                      key={type}
                      className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{info.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">{info.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {info.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              (material?.quantity ?? 0) > 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-lg px-3"
                          >
                            {material?.quantity ?? 0}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">📖 Material Usage Guide</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Basic Stone</strong>: Used for +0 to +5
                    enhancement
                  </li>
                  <li>
                    • <strong>Intermediate Stone</strong>: Used for +6 to +10
                    enhancement
                  </li>
                  <li>
                    • <strong>Advanced Stone</strong>: Used for +11 to +15
                    enhancement
                  </li>
                  <li>
                    • <strong>Protection Scroll</strong>: Prevents level loss on
                    failed enhancement (+5 and above)
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Enhancement History
                {selectedWeapon && (
                  <Badge variant="outline" className="ml-2">
                    {selectedWeapon.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedWeapon?.enhanceHistory &&
              selectedWeapon.enhanceHistory.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {[...selectedWeapon.enhanceHistory]
                      .reverse()
                      .map((attempt, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            attempt.success
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                attempt.success ? "default" : "destructive"
                              }
                            >
                              {attempt.success ? "✓ Success" : "✗ Failed"}
                            </Badge>
                            <span className="font-mono">
                              +{attempt.fromLevel} → +{attempt.toLevel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {attempt.protectionUsed && (
                              <Badge variant="outline">🛡️ Protected</Badge>
                            )}
                            <span>
                              {new Date(attempt.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No enhancement history</p>
                  <p className="text-sm">
                    {selectedWeapon
                      ? "This weapon hasn't been enhanced yet"
                      : "Select a weapon to view its history"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
