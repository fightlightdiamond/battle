/**
 * GameSelectionPage - Player selects a game template to play
 */

import { useNavigate } from "react-router-dom";
import { Play, Clock, FileText } from "lucide-react";
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
import { useGameTemplates } from "../hooks/useGameTemplates";
import { useSentences } from "../hooks/useSentences";

export function GameSelectionPage() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useGameTemplates(true); // only active

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Đang tải danh sách game...</div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Cặp đôi trời sinh</h1>
        <p className="text-muted-foreground">
          Chưa có game nào được tạo. Vui lòng liên hệ admin.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎮 Cặp đôi trời sinh</h1>
        <p className="text-muted-foreground">
          Chọn một game để bắt đầu thử thách ghép câu Anh - Việt
        </p>
      </div>

      {/* Game Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {templates.map((template) => (
          <GameCard
            key={template.id}
            template={template}
            onPlay={() => navigate(`/matching-game/play/${template.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface GameCardProps {
  template: {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    config: {
      pairsPerRound: number;
      timeLimit: number;
      showHints?: boolean;
    };
  };
  onPlay: () => void;
}

function GameCard({ template, onPlay }: GameCardProps) {
  // Fetch sentence count for this template
  const { data: sentences = [] } = useSentences({
    gameTemplateId: template.id,
  });

  const canPlay = sentences.length >= template.config.pairsPerRound;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      {template.coverImage && (
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl">🎯</span>
        </div>
      )}
      {!template.coverImage && (
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl">🎯</span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>
          {template.description || "Ghép câu tiếng Anh với bản dịch tiếng Việt"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {template.config.pairsPerRound} cặp
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.config.timeLimit}s
          </Badge>
          {template.config.showHints && (
            <Badge variant="secondary">Có gợi ý</Badge>
          )}
        </div>

        {!canPlay && (
          <p className="text-sm text-muted-foreground mt-3">
            ⚠️ Game này chưa có đủ câu hỏi ({sentences.length}/
            {template.config.pairsPerRound})
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={onPlay} disabled={!canPlay}>
          <Play className="h-4 w-4 mr-2" />
          Chơi ngay
        </Button>
      </CardFooter>
    </Card>
  );
}
