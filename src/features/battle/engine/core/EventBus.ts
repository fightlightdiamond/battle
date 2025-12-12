import type { GameEvent, GameEventType } from "./types";

/**
 * EventBus - Pub/sub event system for battle engine
 *
 * Provides a decoupled communication mechanism between engine components
 * and UI layers through event subscription and emission.
 */

export type EventHandler<T = unknown> = (event: GameEvent<T>) => void;

export class EventBus {
  private subscribers: Map<GameEventType, Set<EventHandler<unknown>>>;

  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Subscribe to a specific event type
   * @param eventType - The type of event to subscribe to
   * @param handler - Callback function to handle the event
   * @returns Unsubscribe function to remove the subscription
   */
  subscribe<T = unknown>(
    eventType: GameEventType,
    handler: EventHandler<T>
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const handlers = this.subscribers.get(eventType)!;
    handlers.add(handler as EventHandler<unknown>);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler<unknown>);
      // Clean up empty sets
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Emit an event to all subscribers of that event type
   * @param event - The event to emit
   */
  emit<T = unknown>(event: GameEvent<T>): void {
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(event as GameEvent<unknown>);
      });
    }
  }

  /**
   * Remove all subscriptions
   */
  clear(): void {
    this.subscribers.clear();
  }

  /**
   * Get the number of subscribers for a specific event type
   * Useful for testing and debugging
   */
  getSubscriberCount(eventType: GameEventType): number {
    return this.subscribers.get(eventType)?.size ?? 0;
  }
}
