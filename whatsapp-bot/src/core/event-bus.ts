// ============================================= //
// ✅ EVENT BUS — TYPED PUB/SUB SYSTEM          //
// ============================================= //
// Lightweight, typed event emitter that        //
// decouples all bot components. Any component  //
// can emit events, any component can listen.   //
// ============================================= //

import {
  BotEvent,
  BotEventType,
  EventListener,
  IEventBus,
} from "../types/events";

import { logger } from "./logger";

// ============================================= //
// ✅ EVENT BUS IMPLEMENTATION                  //
// ============================================= //

export class EventBus implements IEventBus {
  private listeners: Map<BotEventType, Set<EventListener>> = new Map();

  /**
   * Emit an event to all registered listeners.
   * Async listeners are awaited — one failing listener
   * does not prevent others from receiving the event.
   */
  emit(event: BotEvent): void {
    const eventListeners = this.listeners.get(event.type);

    if (!eventListeners || eventListeners.size === 0) {
      logger.debug({ eventType: event.type }, "Event emitted — no listeners");
      return;
    }

    logger.debug(
      { eventType: event.type, listenerCount: eventListeners.size },
      "Event emitted"
    );

    for (const listener of eventListeners) {
      try {
        const result = listener(event);
        // If the listener returns a promise, catch errors silently
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error(
              { eventType: event.type, error },
              "Async event listener failed"
            );
          });
        }
      } catch (error) {
        logger.error(
          { eventType: event.type, error },
          "Event listener threw synchronously"
        );
      }
    }
  }

  /**
   * Register a listener for a specific event type.
   * Returns an unsubscribe function for easy cleanup.
   */
  on(eventType: BotEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    logger.debug(
      { eventType, totalListeners: this.listeners.get(eventType)!.size },
      "Listener registered"
    );

    // Return unsubscribe function
    return () => {
      this.off(eventType, listener);
    };
  }

  /**
   * Remove a specific listener for an event type.
   */
  off(eventType: BotEventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);

    if (!eventListeners) return;

    eventListeners.delete(listener);

    if (eventListeners.size === 0) {
      this.listeners.delete(eventType);
    }

    logger.debug(
      { eventType, remainingListeners: eventListeners.size },
      "Listener removed"
    );
  }

  /**
   * Remove all listeners for all event types.
   * Useful for testing and clean shutdown.
   */
  clear(): void {
    const totalListeners = this.listenerCountAll();
    this.listeners.clear();
    logger.debug({ totalListenersCleared: totalListeners }, "Event bus cleared");
  }

  /**
   * Get the number of listeners for a specific event type.
   */
  listenerCount(eventType: BotEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get the total number of listeners across all event types.
   */
  private listenerCountAll(): number {
    let count = 0;
    for (const listeners of this.listeners.values()) {
      count += listeners.size;
    }
    return count;
  }
}

// ============================================= //
// ✅ SINGLETON EXPORT                          //
// ============================================= //

export const eventBus = new EventBus();
