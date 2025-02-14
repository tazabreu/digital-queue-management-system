import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // Publish event
  publish(event: string, data: any): void {
    this.emit(event, data);
  }

  // Subscribe to event
  subscribe(event: string, callback: (data: any) => void): void {
    this.on(event, callback);
  }

  // Unsubscribe from event
  unsubscribe(event: string, callback: (data: any) => void): void {
    this.off(event, callback);
  }
}

export const eventBus = EventBus.getInstance(); 