/**
 * ChatbotStore - Zustand store for chatbot state management
 *
 * Manages message history, processing state, and command execution.
 * Integrates with CommandParser for command processing and CommandContext
 * for conversation state tracking.
 *
 * Requirements: 8.1, 10.1
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChatMessage, ChatbotStore } from "../types";
import { commandParser } from "../services/CommandParser";
import { useCommandContextStore } from "./commandContextStore";
import { chatMessageService } from "../services/chatMessageService";
import { getImageUrl } from "@/features/cards/services/imageStorage";
import type { Card } from "@/features/cards/types/card";

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create welcome message
 */
function createWelcomeMessage(): ChatMessage {
  return {
    id: generateMessageId(),
    role: "assistant",
    content: `🎮 **Xin chào! Tôi là Game Assistant**

Tôi có thể giúp bạn:
• Quản lý thẻ bài (tạo, xem, xóa)
• Bắt đầu trận đấu giữa các thẻ
• Trang bị vũ khí và ngọc

**Thử ngay:**
→ \`list cards\` - Xem danh sách thẻ
→ \`help\` - Xem hướng dẫn đầy đủ`,
    timestamp: Date.now(),
  };
}

/**
 * Chatbot store implementation
 */
export const useChatbotStore = create<ChatbotStore>()(
  devtools(
    (set, get) => ({
      // State
      messages: [createWelcomeMessage()],
      context: useCommandContextStore.getState(),
      isProcessing: false,

      // Actions
      addMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
        // Persist message to json-server (fire and forget)
        chatMessageService.save(message).catch((error) => {
          console.error("Failed to persist chat message:", error);
        });
      },

      loadMessages: async () => {
        try {
          const messages = await chatMessageService.getRecent(100);
          if (messages.length > 0) {
            // Refresh imageUrl for cards in messages (blob URLs from old sessions are invalid)
            const refreshedMessages = await Promise.all(
              messages.map(async (msg) => {
                if (
                  msg.data &&
                  typeof msg.data === "object" &&
                  "commandType" in msg.data &&
                  (msg.data as { commandType: string }).commandType ===
                    "show_card" &&
                  "card" in msg.data
                ) {
                  const card = (msg.data as { card: Card }).card;
                  if (card.imagePath) {
                    const freshImageUrl = await getImageUrl(card.imagePath);
                    return {
                      ...msg,
                      data: {
                        ...msg.data,
                        card: {
                          ...card,
                          imageUrl: freshImageUrl ?? card.imageUrl,
                        },
                      },
                    };
                  }
                }
                return msg;
              }),
            );
            set({ messages: refreshedMessages });
          } else {
            // No history, show welcome message
            set({ messages: [createWelcomeMessage()] });
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          // On error, just use welcome message
          set({ messages: [createWelcomeMessage()] });
        }
      },

      processCommand: async (input: string) => {
        const state = get();

        // Don't process if already processing
        if (state.isProcessing) {
          return;
        }

        // Set processing state
        set({ isProcessing: true });

        try {
          // Add user message
          const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: "user",
            content: input,
            timestamp: Date.now(),
          };
          state.addMessage(userMessage);

          // Get current context from context store
          const context = useCommandContextStore.getState();

          // Process command through pipeline
          const responseMessage = await commandParser.processCommand(
            input,
            context,
          );

          // Add assistant response
          state.addMessage(responseMessage);
        } catch (error) {
          // Handle unexpected errors
          const errorMessage: ChatMessage = {
            id: generateMessageId(),
            role: "assistant",
            content:
              error instanceof Error
                ? `Lỗi: ${error.message}`
                : "Đã xảy ra lỗi không xác định",
            timestamp: Date.now(),
          };
          state.addMessage(errorMessage);
        } finally {
          // Clear processing state
          set({ isProcessing: false });
        }
      },

      clearMessages: async () => {
        // Clear from server first
        try {
          await chatMessageService.clearAll();
        } catch (error) {
          console.error("Failed to clear chat history from server:", error);
        }
        // Then reset local state with welcome message
        const welcomeMessage = createWelcomeMessage();
        set({ messages: [welcomeMessage] });
        // Save welcome message to server
        chatMessageService.save(welcomeMessage).catch((error) => {
          console.error("Failed to save welcome message:", error);
        });
      },

      clearContext: () => {
        useCommandContextStore.getState().clear();
      },
    }),
    { name: "chatbot-store" },
  ),
);

// Selectors for optimized re-renders
export const selectMessages = (state: ChatbotStore) => state.messages;
export const selectIsProcessing = (state: ChatbotStore) => state.isProcessing;
export const selectLastMessage = (state: ChatbotStore) =>
  state.messages[state.messages.length - 1];
