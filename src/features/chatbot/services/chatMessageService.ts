/**
 * ChatMessageService - CRUD operations for chat messages using json-server REST API
 *
 * Provides persistence for chatbot conversation history to json-server.
 * Supports loading, saving, and clearing message history.
 */

import type { ChatMessage } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * ChatMessageService - Manages chat message persistence
 */
export const chatMessageService = {
  /**
   * Fetch all chat messages from the server
   * @returns Array of chat messages sorted by timestamp
   */
  async getAll(): Promise<ChatMessage[]> {
    const response = await fetch(
      `${API_BASE_URL}/chatMessages?_sort=timestamp`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch chat messages");
    }
    return response.json();
  },

  /**
   * Fetch recent chat messages (last N messages)
   * @param limit Number of messages to fetch
   * @returns Array of recent chat messages
   */
  async getRecent(limit: number = 50): Promise<ChatMessage[]> {
    const response = await fetch(
      `${API_BASE_URL}/chatMessages?_sort=timestamp&_order=desc&_limit=${limit}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch recent chat messages");
    }
    const messages: ChatMessage[] = await response.json();
    // Return in chronological order (oldest first)
    return messages.reverse();
  },

  /**
   * Save a single chat message to the server
   * @param message Chat message to save
   * @returns The saved message with ID
   */
  async save(message: ChatMessage): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/chatMessages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      throw new Error("Failed to save chat message");
    }
    return response.json();
  },

  /**
   * Save multiple chat messages to the server
   * @param messages Array of chat messages to save
   * @returns Array of saved messages
   */
  async saveMany(messages: ChatMessage[]): Promise<ChatMessage[]> {
    const savedMessages: ChatMessage[] = [];
    for (const message of messages) {
      const saved = await this.save(message);
      savedMessages.push(saved);
    }
    return savedMessages;
  },

  /**
   * Delete a chat message by ID
   * @param id Message ID to delete
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chatMessages/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete chat message");
    }
  },

  /**
   * Clear all chat messages from the server
   */
  async clearAll(): Promise<void> {
    const messages = await this.getAll();
    for (const message of messages) {
      await this.delete(message.id);
    }
  },
};

export default chatMessageService;
