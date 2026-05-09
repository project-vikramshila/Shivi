/**
 * ErrorRecovery - Handles automation failures and recovery strategies
 */

export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  ESCALATE = 'escalate',
  ABORT = 'abort',
  SKIP = 'skip',
  MANUAL = 'manual',
}

export interface AutomationError {
  id: string;
  timestamp: number;
  step: number;
  stepName?: string;
  error: Error;
  errorType: string;
  actionAttempted: any;
  recoveryAttempts: number;
  recovered: boolean;
  recoveryStrategy?: RecoveryStrategy;
  message: string;
}

export interface RecoveryAction {
  strategy: RecoveryStrategy;
  action: () => Promise<boolean>;
  timeout?: number;
  description: string;
}

/**
 * ErrorRecovery class
 */
export class ErrorRecovery {
  private errorHistory: AutomationError[] = [];
  private maxHistorySize = 100;
  private recoveryStrategies: Map<string, RecoveryStrategy[]> = new Map();

  constructor() {
    this.setupDefaultStrategies();
  }

  /**
   * Setup default recovery strategies for common error types
   */
  private setupDefaultStrategies(): void {
    // Network/timeout errors
    this.registerErrorStrategy('TimeoutError', [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.SKIP,
      RecoveryStrategy.ESCALATE,
    ]);

    // Element not found errors
    this.registerErrorStrategy('ElementNotFound', [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.FALLBACK,
      RecoveryStrategy.SKIP,
    ]);

    // Application/window errors
    this.registerErrorStrategy('ApplicationError', [
      RecoveryStrategy.FALLBACK,
      RecoveryStrategy.ABORT,
      RecoveryStrategy.MANUAL,
    ]);

    // Mouse/keyboard errors
    this.registerErrorStrategy('InputError', [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.ESCALATE,
      RecoveryStrategy.ABORT,
    ]);

    // Permission errors
    this.registerErrorStrategy('PermissionError', [
      RecoveryStrategy.ESCALATE,
      RecoveryStrategy.MANUAL,
      RecoveryStrategy.ABORT,
    ]);
  }

  /**
   * Register recovery strategies for error type
   */
  registerErrorStrategy(errorType: string, strategies: RecoveryStrategy[]): void {
    this.recoveryStrategies.set(errorType, strategies);
    console.log(`📝 Registered recovery strategies for ${errorType}`);
  }

  /**
   * Log an error
   */
  logError(
    step: number,
    error: Error,
    actionAttempted?: any,
    stepName?: string
  ): AutomationError {
    const autoError: AutomationError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      step,
      stepName,
      error,
      errorType: error.constructor.name,
      actionAttempted,
      recoveryAttempts: 0,
      recovered: false,
      message: error.message,
    };

    this.errorHistory.push(autoError);

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    console.error(`❌ Error at step ${step}: ${error.message}`);

    return autoError;
  }

  /**
   * Analyze error and suggest recovery strategy
   */
  analyzeError(autoError: AutomationError): RecoveryStrategy {
    const strategies = this.recoveryStrategies.get(autoError.errorType) || [];

    // Select best strategy based on context
    if (strategies.length === 0) {
      return RecoveryStrategy.ESCALATE;
    }

    // First attempt: try retry
    if (autoError.recoveryAttempts === 0 && strategies.includes(RecoveryStrategy.RETRY)) {
      return RecoveryStrategy.RETRY;
    }

    // After retries: try fallback
    if (autoError.recoveryAttempts > 0 && strategies.includes(RecoveryStrategy.FALLBACK)) {
      return RecoveryStrategy.FALLBACK;
    }

    // Last resort: escalate
    if (strategies.includes(RecoveryStrategy.ESCALATE)) {
      return RecoveryStrategy.ESCALATE;
    }

    return strategies[0] || RecoveryStrategy.ABORT;
  }

  /**
   * Attempt recovery
   */
  async attemptRecovery(
    autoError: AutomationError,
    recoveryActions: RecoveryAction[]
  ): Promise<boolean> {
    const strategy = this.analyzeError(autoError);
    autoError.recoveryAttempts++;
    autoError.recoveryStrategy = strategy;

    console.log(`🔧 Attempting recovery with strategy: ${strategy}`);

    const action = recoveryActions.find((ra) => ra.strategy === strategy);

    if (!action) {
      console.warn(`⚠️ No action found for strategy: ${strategy}`);
      return false;
    }

    try {
      const timeout = action.timeout || 30000;
      const result = await Promise.race([action.action(), this.createTimeout(timeout)]);

      if (result) {
        autoError.recovered = true;
        console.log(`✅ Recovery succeeded: ${action.description}`);
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Recovery action failed: ${error}`);
    }

    return false;
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Recovery timeout')), ms)
    );
  }

  /**
   * Retry action with exponential backoff
   */
  async retryWithBackoff<T>(
    action: () => Promise<T>,
    maxAttempts = 3,
    initialDelayMs = 500,
    backoffMultiplier = 2
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${maxAttempts}`);
        return await action();
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.delay(delay);
          delay = Math.min(delay * backoffMultiplier, 30000); // Cap at 30s
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Validate UI state after action
   */
  async validateState(
    expectedState: string | string[],
    maxWaitMs = 5000,
    validateFn: () => Promise<boolean>
  ): Promise<boolean> {
    const startTime = Date.now();
    const states = Array.isArray(expectedState) ? expectedState : [expectedState];

    console.log(`✓ Validating state: ${states.join(', ')}`);

    while (Date.now() - startTime < maxWaitMs) {
      try {
        if (await validateFn()) {
          console.log(`✅ State validated successfully`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ Validation check failed: ${error}`);
      }

      await this.delay(200);
    }

    console.error(`❌ State validation timeout`);
    return false;
  }

  /**
   * Create fallback action
   */
  createFallbackAction(primaryAction: RecoveryAction, fallbackAction: RecoveryAction): RecoveryAction {
    return {
      strategy: RecoveryStrategy.FALLBACK,
      description: `${primaryAction.description} (fallback to: ${fallbackAction.description})`,
      action: async () => {
        try {
          return await primaryAction.action();
        } catch (error) {
          console.log(`⚠️ Primary action failed, trying fallback...`);
          return await fallbackAction.action();
        }
      },
    };
  }

  /**
   * Create safe action wrapper
   */
  createSafeAction(
    action: () => Promise<void>,
    timeout = 30000,
    onError?: (error: Error) => Promise<void>
  ): RecoveryAction {
    return {
      strategy: RecoveryStrategy.RETRY,
      description: 'Safe action with error handling',
      timeout,
      action: async () => {
        try {
          await Promise.race([
            action(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
          ]);
          return true;
        } catch (error) {
          console.error(`❌ Action failed: ${error}`);
          if (onError) {
            await onError(error as Error);
          }
          return false;
        }
      },
    };
  }

  /**
   * Get error history
   */
  getErrorHistory(limit = 50): AutomationError[] {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    recovered: number;
    recoveryRate: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.errorHistory.length,
      recovered: this.errorHistory.filter((e) => e.recovered).length,
      recoveryRate: 0,
      byType: {} as Record<string, number>,
    };

    stats.recoveryRate = stats.total > 0 ? (stats.recovered / stats.total) * 100 : 0;

    this.errorHistory.forEach((e) => {
      stats.byType[e.errorType] = (stats.byType[e.errorType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    console.log('🗑️ Error history cleared');
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const errorRecovery = new ErrorRecovery();
