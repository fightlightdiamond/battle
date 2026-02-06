/**
 * EnhancementPanel Component
 *
 * Main panel for weapon enhancement with preview and controls
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Shield, AlertTriangle, Check, X } from "lucide-react";
import { useWeaponEnhancement } from "../hooks/useWeaponEnhancement";
import {
  getEnhanceLevelDisplay,
  getEnhanceLevelColor,
} from "../config/enhanceConfig";
import { MATERIAL_INFO } from "../types/enhancement";

export function EnhancementPanel() {
  const {
    selectedWeapon,
    preview,
    lastResult,
    isEnhancing,
    error,
    materials,
    enhance,
    canEnhance,
    canUseProtection,
    clearResult,
  } = useWeaponEnhancement();

  const [useProtection, setUseProtection] = useState(false);

  if (!selectedWeapon) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a weapon to enhance</p>
        </CardContent>
      </Card>
    );
  }

  const handleEnhance = async () => {
    clearResult();
    await enhance(useProtection);
  };

  const currentLevelDisplay = getEnhanceLevelDisplay(
    selectedWeapon.enhanceLevel,
  );
  const currentLevelColor = getEnhanceLevelColor(selectedWeapon.enhanceLevel);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Weapon Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weapon Info */}
        <div className="text-center">
          <div className="relative inline-block">
            {selectedWeapon.imageUrl ? (
              <img
                src={selectedWeapon.imageUrl}
                alt={selectedWeapon.name}
                className="w-32 h-32 object-cover rounded-lg mx-auto"
              />
            ) : (
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center text-6xl mx-auto">
                ⚔️
              </div>
            )}
          </div>
          <h3 className="font-bold text-xl mt-2">
            {selectedWeapon.name}
            {currentLevelDisplay && (
              <span className={cn("ml-2", currentLevelColor)}>
                {currentLevelDisplay}
              </span>
            )}
          </h3>
        </div>

        {/* Enhancement Preview */}
        {preview ? (
          <div className="space-y-4">
            {/* Level Change */}
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span className={getEnhanceLevelColor(preview.currentLevel)}>
                +{preview.currentLevel}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className={getEnhanceLevelColor(preview.targetLevel)}>
                +{preview.targetLevel}
              </span>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span
                  className={cn(
                    "font-bold",
                    preview.successRate >= 70
                      ? "text-green-500"
                      : preview.successRate >= 40
                        ? "text-yellow-500"
                        : "text-red-500",
                  )}
                >
                  {preview.successRate}%
                </span>
              </div>
              <Progress value={preview.successRate} className="h-3" />
            </div>

            {/* Stat Preview */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-sm">Stats After Success</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ATK</span>
                  <span>
                    {preview.currentStats.enhancedAtk} →{" "}
                    <span className="text-green-500">
                      {preview.previewStats.enhancedAtk}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crit%</span>
                  <span>
                    {preview.currentStats.enhancedCritChance} →{" "}
                    <span className="text-green-500">
                      {preview.previewStats.enhancedCritChance}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CritDmg</span>
                  <span>
                    {preview.currentStats.enhancedCritDamage} →{" "}
                    <span className="text-green-500">
                      {preview.previewStats.enhancedCritDamage}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus</span>
                  <span className="text-green-500 font-bold">
                    +{preview.previewStats.totalBonusPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Failure Warning */}
            {preview.failureResult.newLevel < preview.currentLevel && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>
                  On failure: Level drops to +{preview.failureResult.newLevel}
                </span>
              </div>
            )}

            {/* Materials Required */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Materials Required</h4>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {MATERIAL_INFO[preview.requiredMaterial.type].icon}
                </span>
                <span className="flex-1">
                  {MATERIAL_INFO[preview.requiredMaterial.type].name}
                </span>
                <Badge variant={canEnhance() ? "default" : "destructive"}>
                  {materials.find(
                    (m) => m.type === preview.requiredMaterial.type,
                  )?.quantity ?? 0}{" "}
                  / {preview.requiredMaterial.quantity}
                </Badge>
              </div>
            </div>

            {/* Protection Toggle */}
            {preview.failureResult.canUseProtection && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="protection">Use Protection Scroll</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {materials.find((m) => m.type === "protection_scroll")
                      ?.quantity ?? 0}
                  </Badge>
                  <Switch
                    id="protection"
                    checked={useProtection}
                    onCheckedChange={setUseProtection}
                    disabled={!canUseProtection()}
                  />
                </div>
              </div>
            )}

            {/* Enhance Button */}
            <Button
              className="w-full h-12 text-lg"
              size="lg"
              onClick={handleEnhance}
              disabled={!canEnhance() || isEnhancing}
            >
              {isEnhancing ? (
                <span className="animate-pulse">Enhancing...</span>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Enhance
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="font-semibold">Maximum Level Reached!</p>
            <p className="text-sm">This weapon is fully enhanced.</p>
          </div>
        )}

        {/* Result Display */}
        {lastResult && (
          <div
            className={cn(
              "p-4 rounded-lg text-center animate-in fade-in slide-in-from-bottom-2",
              lastResult.success
                ? "bg-green-500/20 text-green-500"
                : "bg-destructive/20 text-destructive",
            )}
          >
            {lastResult.success ? (
              <>
                <Check className="h-8 w-8 mx-auto mb-2" />
                <p className="font-bold text-lg">Enhancement Success!</p>
                <p>
                  +{lastResult.previousLevel} → +{lastResult.newLevel}
                </p>
              </>
            ) : (
              <>
                <X className="h-8 w-8 mx-auto mb-2" />
                <p className="font-bold text-lg">Enhancement Failed</p>
                {lastResult.protectionUsed ? (
                  <p className="text-sm">Protection saved your level!</p>
                ) : lastResult.newLevel < lastResult.previousLevel ? (
                  <p>
                    +{lastResult.previousLevel} → +{lastResult.newLevel}
                  </p>
                ) : (
                  <p className="text-sm">No level change</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm text-center">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
