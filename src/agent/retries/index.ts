/**
 * Agent Retry System
 * Intelligent retry logic with exponential backoff, strategy switching, and failure analysis.
 */

import type { AgentTaskStep, AutonomySettings } from '../core/types';

export interface RetryStrategy {
  name: string;
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface RetryResult {
  success: boolean;
  attempts: number;
  totalDelay: number;
  finalError?: string;
  strategyUsed: string;
}

export class AgentRetryManager {
  private strategies: Map<string, RetryStrategy> = new Map([
    ['network', {
      name: 'network',
      maxRetries: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
      maxBackoffMs: 30000,
    }],
    ['timeout', {
      name: 'timeout',
      maxRetries: 2,
      backoffMs: 2000,
      backoffMultiplier: 1.5,
      maxBackoffMs: 15000,
    }],
    ['app_unavailable', {
      name: 'app_unavailable',
      maxRetries: 1,
      backoffMs: 5000,
      backoffMultiplier: 1,
      maxBackoffMs: 5000,
    }],
    ['default', {
      name: 'default',
      maxRetries: 1,
      backoffMs: 1000,
      backoffMultiplier: 1,
      maxBackoffMs: 1000,
    }],
  ]);

  async retryStep(
    step: AgentTaskStep,
    executeFn: () => Promise<{ success: boolean; error?: string }>,
    autonomy: AutonomySettings
  ): Promise<RetryResult> {
    const strategy = this.selectStrategy(step);
    let attempts = 0;
    let totalDelay = 0;
    let lastError = '';

    while (attempts < strategy.maxRetries) {
      attempts++;

      if (attempts > 1) {
        const delay = Math.min(strategy.backoffMs * Math.pow(strategy.backoffMultiplier, attempts - 2), strategy.maxBackoffMs);
        totalDelay += delay;
        await this.delay(delay);
      }

      try {
        const result = await executeFn();
        if (result.success) {
          return {
            success: true,
            attempts,
            totalDelay,
            strategyUsed: strategy.name,
          };
        }
        lastError = result.error || 'Unknown error';
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Execution failed';
      }

      // Check if we should continue retrying based on autonomy
      if (!this.shouldContinueRetry(step, lastError, attempts, autonomy)) {
        break;
      }
    }

    return {
      success: false,
      attempts,
      totalDelay,
      finalError: lastError,
      strategyUsed: strategy.name,
    };
  }

  private selectStrategy(step: AgentTaskStep): RetryStrategy {
    if (step.action.includes('fetch') || step.action.includes('connect')) {
      return this.strategies.get('network')!;
    }
    if (step.action.includes('timeout')) {
      return this.strategies.get('timeout')!;
    }
    if (step.app !== 'core' && step.action.includes('open')) {
      return this.strategies.get('app_unavailable')!;
    }
    return this.strategies.get('default')!;
  }

  private shouldContinueRetry(step: AgentTaskStep, error: string, attempts: number, autonomy: AutonomySettings): boolean {
    // Don't retry sensitive actions in non-autonomous modes
    if (autonomy.mode !== 'autonomous' && ['sendMessage', 'deleteData', 'purchase'].includes(step.action)) {
      return false;
    }

    // Don't retry if error indicates permanent failure
    if (error.includes('permission denied') || error.includes('not authorized')) {
      return false;
    }

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  addStrategy(name: string, strategy: RetryStrategy): void {
    this.strategies.set(name, strategy);
  }

  getStrategy(name: string): RetryStrategy | undefined {
    return this.strategies.get(name);
  }
}

export const agentRetryManager = new AgentRetryManager();