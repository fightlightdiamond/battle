/**
 * ChatMessage Component
 *
 * Displays individual chat messages with role-based styling
 * Uses shadcn/ui Avatar component
 * Supports clickable command suggestions and rich card previews
 */

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "../types";
import type { Card } from "@/features/cards/types/card";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";
import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatCardPreview } from "./ChatCardPreview";

/**
 * Check if message data contains a card for rich preview
 */
interface ShowCardData {
  commandType: "show_card";
  card: Card;
  weapon?: Weapon | null;
  gems?: Gem[];
}

function isShowCardData(data: unknown): data is ShowCardData {
  return (
    typeof data === "object" &&
    data !== null &&
    "commandType" in data &&
    (data as ShowCardData).commandType === "show_card" &&
    "card" in data &&
    typeof (data as ShowCardData).card === "object"
  );
}

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (command: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar using shadcn/ui */}
      <Avatar className={cn(isUser ? "bg-primary" : "bg-muted")}>
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%] min-w-0",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm",
          )}
        >
          <div
            className="text-sm whitespace-pre-wrap wrap-break-word"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            {message.content}
          </div>

          {/* Rich Card Preview */}
          {isShowCardData(message.data) && (
            <ChatCardPreview
              card={message.data.card}
              weapon={message.data.weapon}
              gems={message.data.gems}
              compact
            />
          )}

          {/* Clickable Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  className="h-auto py-1.5 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onSuggestionClick?.(suggestion.command)}
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-2">
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
