/**
 * AutomationMonitor - Comprehensive logging and monitoring for automation tasks
 */

export interface AutomationLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  category: string;
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
}

export interface TaskMetrics {
  taskId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  stepsCompleted: number;
  totalSteps: number;
  successRate: number;
  errorsEncountered: number;
  recoveryAttempts: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
}

export interface SystemMetrics {
  activeTasksCount: number;
  totalTasksExecuted: number;
  successRate: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * AutomationMonitor class
 */
export class AutomationMonitor {
  private logs: AutomationLog[] = [];
  private taskMetrics: Map<string, TaskMetrics> = new Map();
  private maxLogs = 1000;
  private startTime = Date.now();
  private activeTasks: Set<string> = new Set();

  constructor() {
    console.log('✅ Automation Monitor initialized');
  }

  /**
   * Log message
   */
  log(
    level: 'info' | 'warn' | 'error' | 'debug' | 'success',
    category: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const log: AutomationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      metadata,
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console with color
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
      success: '✅',
    };

    console.log(`${emoji[level]} [${category}] ${message}`);

    if (metadata) {
      console.log('  Metadata:', metadata);
    }
  }

  /**
   * Log info
   */
  info(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('info', category, message, metadata);
  }

  /**
   * Log warning
   */
  warn(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('warn', category, message, metadata);
  }

  /**
   * Log error
   */
  error(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('error', category, message, metadata);
  }

  /**
   * Log debug
   */
  debug(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('debug', category, message, metadata);
  }

  /**
   * Log success
   */
  success(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('success', category, message, metadata);
  }

  /**
   * Start tracking task
   */
  startTask(taskId: string, totalSteps: number): void {
    const metrics: TaskMetrics = {
      taskId,
      startTime: Date.now(),
      stepsCompleted: 0,
      totalSteps,
      successRate: 0,
      errorsEncountered: 0,
      recoveryAttempts: 0,
      status: 'executing',
    };

    this.taskMetrics.set(taskId, metrics);
    this.activeTasks.add(taskId);

    this.info('Task', `Started task: ${taskId}`, { totalSteps });
  }

  /**
   * Record step completion
   */
  recordStepCompletion(taskId: string, stepNo: number, success = true, duration?: number): void {
    const metrics = this.taskMetrics.get(taskId);

    if (!metrics) {
      this.warn('Task', `Task metrics not found: ${taskId}`);
      return;
    }

    metrics.stepsCompleted = Math.max(metrics.stepsCompleted, stepNo + 1);
    metrics.successRate = (metrics.stepsCompleted / metrics.totalSteps) * 100;

    if (duration) {
      this.debug('Task', `Step ${stepNo + 1}/${metrics.totalSteps} completed`, {
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Record error
   */
  recordError(taskId: string, stepNo: number, error: Error): void {
    const metrics = this.taskMetrics.get(taskId);

    if (metrics) {
      metrics.errorsEncountered++;
      this.error('Task', `Error at step ${stepNo + 1}: ${error.message}`, { taskId });
    }
  }

  /**
   * Record recovery attempt
   */
  recordRecoveryAttempt(taskId: string, stepNo: number, strategy: string, success: boolean): void {
    const metrics = this.taskMetrics.get(taskId);

    if (metrics) {
      metrics.recoveryAttempts++;
      const result = success ? 'succeeded' : 'failed';
      this.info('Recovery', `Recovery ${result} (${strategy}) at step ${stepNo + 1}`, { taskId });
    }
  }

  /**
   * Complete task
   */
  completeTask(taskId: string, success = true): void {
    const metrics = this.taskMetrics.get(taskId);

    if (!metrics) {
      this.warn('Task', `Task metrics not found: ${taskId}`);
      return;
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = success ? 'completed' : 'failed';
    metrics.successRate = (metrics.stepsCompleted / metrics.totalSteps) * 100;

    this.activeTasks.delete(taskId);

    this.success('Task', `Task completed: ${taskId}`, {
      duration: `${metrics.duration}ms`,
      steps: `${metrics.stepsCompleted}/${metrics.totalSteps}`,
      errors: metrics.errorsEncountered,
      recoveries: metrics.recoveryAttempts,
    });
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string, reason?: string): void {
    const metrics = this.taskMetrics.get(taskId);

    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.status = 'cancelled';
    }

    this.activeTasks.delete(taskId);
    this.warn('Task', `Task cancelled: ${taskId}`, { reason });
  }

  /**
   * Get task metrics
   */
  getTaskMetrics(taskId: string): TaskMetrics | undefined {
    return this.taskMetrics.get(taskId);
  }

  /**
   * Get all task metrics
   */
  getAllTaskMetrics(): TaskMetrics[] {
    return Array.from(this.taskMetrics.values());
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const allMetrics = Array.from(this.taskMetrics.values());
    const completedTasks = allMetrics.filter((m) => m.status === 'completed' || m.status === 'failed');

    let totalSuccessful = 0;
    let totalDuration = 0;
    let totalErrorsInCompleted = 0;

    completedTasks.forEach((m) => {
      if (m.status === 'completed') {
        totalSuccessful++;
      }
      if (m.duration) {
        totalDuration += m.duration;
      }
      totalErrorsInCompleted += m.errorsEncountered;
    });

    const successRate =
      completedTasks.length > 0 ? (totalSuccessful / completedTasks.length) * 100 : 0;
    const avgDuration = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;

    return {
      activeTasksCount: this.activeTasks.size,
      totalTasksExecuted: allMetrics.length,
      successRate: Math.round(successRate),
      averageExecutionTime: Math.round(avgDuration),
      totalExecutionTime: totalDuration,
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000, // ms
    };
  }

  /**
   * Get logs since timestamp
   */
  getLogsSince(timestamp: number, limit = 100): AutomationLog[] {
    return this.logs
      .filter((log) => log.timestamp >= timestamp)
      .slice(-limit);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string, limit = 50): AutomationLog[] {
    return this.logs
      .filter((log) => log.category === category)
      .slice(-limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: string, limit = 50): AutomationLog[] {
    return this.logs
      .filter((log) => log.level === level)
      .slice(-limit);
  }

  /**
   * Get all logs
   */
  getAllLogs(limit = 50): AutomationLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Export logs as JSON
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        logs: this.logs,
        metrics: this.getSystemMetrics(),
      },
      null,
      2
    );
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['timestamp', 'level', 'category', 'message'];
    const rows = this.logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.level,
      log.category,
      log.message.replace(/"/g, '""'),
    ]);

    const csv = [
      headers.filter(h => h).join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('🗑️ Logs cleared');
  }

  /**
   * Get summary
   */
  getSummary(): string {
    const metrics = this.getSystemMetrics();

    return `
╔════════════════════════════════════════╗
║  AUTOMATION MONITOR SUMMARY            ║
╠════════════════════════════════════════╣
║ Active Tasks:        ${String(metrics.activeTasksCount).padEnd(18)} ║
║ Total Tasks:         ${String(metrics.totalTasksExecuted).padEnd(18)} ║
║ Success Rate:        ${String(metrics.successRate + '%').padEnd(18)} ║
║ Avg Execution:       ${String(metrics.averageExecutionTime + 'ms').padEnd(18)} ║
║ Total Duration:      ${String((metrics.totalExecutionTime / 1000).toFixed(1) + 's').padEnd(18)} ║
║ Uptime:              ${String((metrics.uptime / 1000).toFixed(1) + 's').padEnd(18)} ║
║ Memory Usage:        ${String(metrics.memoryUsage.toFixed(1) + 'MB').padEnd(18)} ║
╚════════════════════════════════════════╝
    `;
  }
}

// Export singleton
export const automationMonitor = new AutomationMonitor();
