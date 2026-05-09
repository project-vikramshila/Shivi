import type { AgentTaskStep, AutonomySettings } from '../core/types';

const sensitiveActions = new Set(['deleteData', 'sendMessage', 'purchase', 'executeScript']);

export class AutonomyManager {
  canExecuteStep(step: AgentTaskStep, settings: AutonomySettings): boolean {
    if (settings.mode === 'observe') {
      return false;
    }
    if (settings.mode === 'suggest' && sensitiveActions.has(step.action)) {
      return false;
    }
    return true;
  }

  requiresConfirmation(step: AgentTaskStep, settings: AutonomySettings): boolean {
    if (settings.mode !== 'autonomous' && sensitiveActions.has(step.action)) {
      return true;
    }
    if (settings.requireConfirmationFor.includes(step.action)) {
      return true;
    }
    return false;
  }

  getDefaultSettings(): AutonomySettings {
    return {
      mode: 'assist',
      requireConfirmationFor: ['deleteData', 'sendMessage', 'purchase'],
      proactiveEnabled: true,
      privacyLevel: 'moderate',
    };
  }
}
