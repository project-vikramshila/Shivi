import type { AgentTaskStep, AutonomySettings } from '../core/types';

export class AgentReasoningEngine {
  assessFailure(step: AgentTaskStep, error?: string, autonomy: AutonomySettings) {
    const failureMessage = error || 'Unknown failure';
    const retries = this.shouldRetry(step, failureMessage) ? 2 : 0;
    const fallbackAction = this.selectFallback(step, failureMessage);

    return {
      shouldRetry: retries > 0,
      retries,
      reason: failureMessage,
      fallbackAction,
      narrative: this.narrativeForFailure(step, failureMessage, autonomy),
    };
  }

  shouldRetry(step: AgentTaskStep, error: string): boolean {
    const retryable = ['timeout', 'not available', 'failed to fetch', 'network'].some((fragment) => error.toLowerCase().includes(fragment));
    return retryable && step.status !== 'failed';
  }

  selectFallback(step: AgentTaskStep, error: string): string | null {
    if (step.action === 'fetchContext' && error.includes('No connector')) {
      return 'analyzeContext';
    }
    if (error.includes('timeout')) {
      return 'prepareContext';
    }
    return null;
  }

  narrativeForFailure(step: AgentTaskStep, error: string, autonomy: AutonomySettings): string {
    if (autonomy.mode === 'autonomous') {
      return `Step “${step.name}” failed due to ${error}. Main alternative strategy lagayi ja rahi hai.`;
    }
    return `Step “${step.name}” ko retry karne ka attempt karungi, lekin agar problem barqarar rahe to tumse puchhungi.`;
  }
}
