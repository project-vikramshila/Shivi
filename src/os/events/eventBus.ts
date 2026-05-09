import { EventEmitter } from 'events';

export type OSBusEventName =
  | 'message_received'
  | 'reminder_due'
  | 'app_opened'
  | 'voice_command'
  | 'workflow_completed'
  | 'plugin_registered'
  | 'plugin_enabled'
  | 'service_status_changed'
  | string;

export type OSBusEventPayload = Record<string, any> | any;

export class EventBus extends EventEmitter {
  async publish(event: OSBusEventName, payload: OSBusEventPayload = {}) {
    const listeners = this.listeners(event);
    const promises = listeners.map((listener) => Promise.resolve(listener(payload)));
    await Promise.all(promises);
  }

  subscribe(event: OSBusEventName, callback: (payload: OSBusEventPayload) => Promise<void> | void) {
    this.on(event, callback);
  }

  unsubscribe(event: OSBusEventName, callback: (payload: OSBusEventPayload) => Promise<void> | void) {
    this.off(event, callback);
  }

  getSubscriptions(event: OSBusEventName) {
    return this.listeners(event).length;
  }
}
