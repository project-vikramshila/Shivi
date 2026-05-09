/**
 * Agent Event Bus
 * Provides lightweight publish / subscribe messaging for agent modules.
 */

import { EventEmitter } from 'events';
import type { AgentEventPayload, AgentEventType } from '../core/types';

export class AgentEventBus extends EventEmitter {
  publish(eventType: AgentEventType, payload: any): void {
    const event: AgentEventPayload = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    this.emit(eventType, event);
  }

  subscribe(eventType: AgentEventType, listener: (event: AgentEventPayload) => void): void {
    this.on(eventType, listener);
  }

  unsubscribe(eventType: AgentEventType, listener: (event: AgentEventPayload) => void): void {
    this.off(eventType, listener);
  }
}

export const agentEventBus = new AgentEventBus();
