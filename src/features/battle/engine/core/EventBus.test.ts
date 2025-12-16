/**
 * Unit tests for EventBus
 * Tests subscribe/unsubscribe functionality and event delivery
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "./EventBus";
import type { GameEvent } from "./types";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("subscribe", () => {
    it("should add a subscriber for an event type", () => {
      const handler = vi.fn();
      eventBus.subscribe("battle_start", handler);

      expect(eventBus.getSubscriberCount("battle_start")).toBe(1);
    });

    it("should allow multiple subscribers for the same event type", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.subscribe("attack", handler1);
      eventBus.subscribe("attack", handler2);
      eventBus.subscribe("attack", handler3);

      expect(eventBus.getSubscriberCount("attack")).toBe(3);
    });

    it("should return an unsubscribe function", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe("damage_dealt", handler);

      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("unsubscribe", () => {
    it("should remove subscriber when unsubscribe is called", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe("battle_end", handler);

      expect(eventBus.getSubscriberCount("battle_end")).toBe(1);

      unsubscribe();

      expect(eventBus.getSubscriberCount("battle_end")).toBe(0);
    });

    it("should only remove the specific subscriber", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = eventBus.subscribe("turn_start", handler1);
      eventBus.subscribe("turn_start", handler2);

      expect(eventBus.getSubscriberCount("turn_start")).toBe(2);

      unsubscribe1();

      expect(eventBus.getSubscriberCount("turn_start")).toBe(1);
    });

    it("should be safe to call unsubscribe multiple times", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe("state_changed", handler);

      unsubscribe();
      unsubscribe(); // Should not throw

      expect(eventBus.getSubscriberCount("state_changed")).toBe(0);
    });
  });

  describe("emit", () => {
    it("should call all subscribers for the emitted event type", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.subscribe("attack", handler1);
      eventBus.subscribe("attack", handler2);

      const event: GameEvent = {
        type: "attack",
        timestamp: Date.now(),
        payload: { damage: 50 },
      };

      eventBus.emit(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it("should not call subscribers of different event types", () => {
      const attackHandler = vi.fn();
      const battleEndHandler = vi.fn();

      eventBus.subscribe("attack", attackHandler);
      eventBus.subscribe("battle_end", battleEndHandler);

      const event: GameEvent = {
        type: "attack",
        timestamp: Date.now(),
        payload: {},
      };

      eventBus.emit(event);

      expect(attackHandler).toHaveBeenCalledTimes(1);
      expect(battleEndHandler).not.toHaveBeenCalled();
    });

    it("should handle emit when no subscribers exist", () => {
      const event: GameEvent = {
        type: "combatant_defeated",
        timestamp: Date.now(),
        payload: {},
      };

      // Should not throw
      expect(() => eventBus.emit(event)).not.toThrow();
    });

    it("should pass the correct event payload to handlers", () => {
      const handler = vi.fn();
      eventBus.subscribe("damage_dealt", handler);

      const payload = {
        attackerId: "card-1",
        defenderId: "card-2",
        damage: 100,
      };

      const event: GameEvent<typeof payload> = {
        type: "damage_dealt",
        timestamp: 1234567890,
        payload,
      };

      eventBus.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
      const receivedEvent = handler.mock.calls[0][0] as GameEvent<
        typeof payload
      >;
      expect(receivedEvent.payload).toEqual(payload);
    });

    it("should not call unsubscribed handlers", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe("turn_end", handler);

      unsubscribe();

      const event: GameEvent = {
        type: "turn_end",
        timestamp: Date.now(),
        payload: {},
      };

      eventBus.emit(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("should remove all subscribers", () => {
      eventBus.subscribe("attack", vi.fn());
      eventBus.subscribe("attack", vi.fn());
      eventBus.subscribe("battle_start", vi.fn());
      eventBus.subscribe("battle_end", vi.fn());

      eventBus.clear();

      expect(eventBus.getSubscriberCount("attack")).toBe(0);
      expect(eventBus.getSubscriberCount("battle_start")).toBe(0);
      expect(eventBus.getSubscriberCount("battle_end")).toBe(0);
    });

    it("should allow new subscriptions after clear", () => {
      eventBus.subscribe("attack", vi.fn());
      eventBus.clear();

      const newHandler = vi.fn();
      eventBus.subscribe("attack", newHandler);

      expect(eventBus.getSubscriberCount("attack")).toBe(1);

      const event: GameEvent = {
        type: "attack",
        timestamp: Date.now(),
        payload: {},
      };

      eventBus.emit(event);

      expect(newHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSubscriberCount", () => {
    it("should return 0 for event types with no subscribers", () => {
      expect(eventBus.getSubscriberCount("battle_start")).toBe(0);
    });

    it("should return correct count after subscriptions", () => {
      eventBus.subscribe("attack", vi.fn());
      eventBus.subscribe("attack", vi.fn());

      expect(eventBus.getSubscriberCount("attack")).toBe(2);
    });
  });
});
