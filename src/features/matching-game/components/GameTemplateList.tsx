/**
 * GameTemplateList - Display list of game templates with actions
 */

import { Pencil, Trash2, Eye, EyeOff, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { GameTemplate } from "../types";

interface GameTemplateWithCount extends GameTemplate {
  sentenceCount?: number;
}

interface GameTemplateListProps {
  templates: GameTemplateWithCount[];
  onEdit: (template: GameTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onManageSentences: (templateId: string) => void;
  onPlay: (templateId: string) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function GameTemplateList({
  templates,
  onEdit,
  onDelete,
  onToggleActive,
  onManageSentences,
  onPlay,
  isDeleting = false,
  isToggling = false,
}: GameTemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Chưa có game template nào.</p>
        <p className="text-sm">Tạo game template đầu tiên để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={!template.isActive ? "opacity-60" : ""}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>
                  {template.description || "Không có mô tả"}
                </CardDescription>
              </div>
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "Hoạt động" : "Tạm dừng"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{template.sentenceCount ?? 0} câu</span>
              </div>
              <div className="text-muted-foreground">
                {template.config.pairsPerRound} cặp / lượt
              </div>
              <div className="text-muted-foreground">
                ⏱ {template.config.timeLimit}s
              </div>
              <div className="text-muted-foreground">
                {template.config.showHints ? "📖 Có gợi ý" : "📖 Không gợi ý"}
              </div>
            </div>

            {/* Config badges */}
            <div className="flex flex-wrap gap-1">
              {template.config.allowRetry && (
                <Badge variant="outline" className="text-xs">
                  Chơi lại ✓
                </Badge>
              )}
              {template.config.shuffleCards && (
                <Badge variant="outline" className="text-xs">
                  Xáo trộn ✓
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onPlay(template.id)}
              disabled={!template.isActive || (template.sentenceCount ?? 0) < 2}
              title={
                (template.sentenceCount ?? 0) < 2
                  ? "Cần ít nhất 2 câu để chơi"
                  : "Chơi game"
              }
            >
              <Play className="h-4 w-4 mr-1" />
              Chơi
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onManageSentences(template.id)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Câu
            </Button>

            <Button size="sm" variant="ghost" onClick={() => onEdit(template)}>
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleActive(template.id)}
              disabled={isToggling}
            >
              {template.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa game "{template.name}"? Hành động
                    này không thể hoàn tác. Các câu thuộc game này sẽ không bị
                    xóa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(template.id)}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
