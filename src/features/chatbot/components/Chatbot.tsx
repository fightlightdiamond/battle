/**
 * Chatbot Component
 *
 * Main chatbot interface using shadcn/ui Sheet component
 * Provides a slide-in panel for chat interactions
 */

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";
import {
  useChatbotStore,
  selectMessages,
  selectIsProcessing,
} from "../store/chatbotStore";

interface ChatbotProps {
  initialOpen?: boolean;
}

export function Chatbot({ initialOpen = false }: ChatbotProps) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const messages = useChatbotStore(selectMessages);
  const isProcessing = useChatbotStore(selectIsProcessing);
  const processCommand = useChatbotStore((state) => state.processCommand);
  const loadMessages = useChatbotStore((state) => state.loadMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput("");
    await processCommand(command);
  };

  /**
   * Handle clicking on a suggestion button
   */
  const handleSuggestionClick = async (command: string) => {
    if (isProcessing) return;
    await processCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
              "hover:scale-110 transition-transform duration-200",
            )}
            onClick={() => setOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Open chatbot</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Mở chatbot (Ctrl+K)</p>
        </TooltipContent>
      </Tooltip>

      {/* Chatbot Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col h-full"
        >
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Game Assistant
            </SheetTitle>
            <SheetDescription>
              Gõ lệnh để quản lý thẻ, trận đấu, và trang bị
            </SheetDescription>
          </SheetHeader>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
          >
            <div className="space-y-4 min-w-0">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}

              {/* Loading indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Đang xử lý...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-background shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Gõ lệnh... (vd: create card Dragon)"
                disabled={isProcessing}
                className="flex-1 min-w-0"
                autoFocus
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send message</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gửi (Enter)</p>
                </TooltipContent>
              </Tooltip>
            </form>

            {/* Help hint */}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <HelpCircle className="h-3 w-3" />
              <span>Gõ "help" để xem hướng dẫn</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
