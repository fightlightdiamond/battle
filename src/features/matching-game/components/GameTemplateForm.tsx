/**
 * GameTemplateForm - Form for creating/editing game templates
 */

import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GameTemplate, GameTemplateFormInput, GameConfig } from "../types";

interface GameTemplateFormProps {
  gameTemplate?: GameTemplate;
  onSubmit: (data: GameTemplateFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const defaultConfig: GameConfig = {
  pairsPerRound: 5,
  timeLimit: 120,
  showHints: true,
  allowRetry: true,
  shuffleCards: true,
};

export function GameTemplateForm({
  gameTemplate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: GameTemplateFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<GameTemplateFormInput>({
    defaultValues: {
      name: gameTemplate?.name ?? "",
      description: gameTemplate?.description ?? "",
      coverImage: gameTemplate?.coverImage ?? "",
      config: gameTemplate?.config ?? defaultConfig,
      isActive: gameTemplate?.isActive ?? true,
    },
  });

  const isActive = useWatch({ control, name: "isActive" });
  const showHints = useWatch({ control, name: "config.showHints" });
  const allowRetry = useWatch({ control, name: "config.allowRetry" });
  const shuffleCards = useWatch({ control, name: "config.shuffleCards" });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {gameTemplate ? "Sửa Game Template" : "Tạo Game Template mới"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Thông tin cơ bản</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Tên game *</Label>
              <Input
                id="name"
                placeholder="VD: Cặp đôi trời sinh - Ẩm thực"
                {...register("name", { required: "Tên game là bắt buộc" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về game..."
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Ảnh bìa (URL)</Label>
              <Input
                id="coverImage"
                placeholder="/images/game-cover.jpg"
                {...register("coverImage")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Kích hoạt game</Label>
            </div>
          </div>

          {/* Game Config */}
          <div className="space-y-4">
            <h3 className="font-semibold">Cấu hình game</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pairsCount">Số cặp câu</Label>
                <Input
                  id="pairsCount"
                  type="number"
                  min={2}
                  max={20}
                  {...register("config.pairsPerRound", {
                    valueAsNumber: true,
                    min: { value: 2, message: "Tối thiểu 2 cặp" },
                    max: { value: 20, message: "Tối đa 20 cặp" },
                  })}
                />
                {errors.config?.pairsPerRound && (
                  <p className="text-sm text-red-500">
                    {errors.config.pairsPerRound.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Thời gian (giây)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={30}
                  max={600}
                  {...register("config.timeLimit", {
                    valueAsNumber: true,
                    min: { value: 30, message: "Tối thiểu 30 giây" },
                    max: { value: 600, message: "Tối đa 600 giây" },
                  })}
                />
                {errors.config?.timeLimit && (
                  <p className="text-sm text-red-500">
                    {errors.config.timeLimit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showHints"
                  checked={showHints}
                  onCheckedChange={(checked) =>
                    setValue("config.showHints", checked)
                  }
                />
                <Label htmlFor="showHints">Hiển thị gợi ý</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allowRetry"
                  checked={allowRetry}
                  onCheckedChange={(checked) =>
                    setValue("config.allowRetry", checked)
                  }
                />
                <Label htmlFor="allowRetry">Cho phép chơi lại</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="shuffleCards"
                  checked={shuffleCards}
                  onCheckedChange={(checked) =>
                    setValue("config.shuffleCards", checked)
                  }
                />
                <Label htmlFor="shuffleCards">Xáo trộn thẻ bài</Label>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Đang lưu..."
              : gameTemplate
                ? "Cập nhật"
                : "Tạo mới"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
