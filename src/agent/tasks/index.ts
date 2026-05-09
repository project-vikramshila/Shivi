/**
 * Agent Task Manager
 * Manages task queues, scheduling, and execution priorities for long-running operations.
 */

import type { AgentGoal, AgentWorkflow } from '../core/types';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus = 'queued' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  goal: AgentGoal;
  workflow?: AgentWorkflow;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  scheduledFor?: number; // timestamp for scheduled execution
  startedAt?: number;
  completedAt?: number;
  retry?: {
    count: number;
    maxRetries: number;
    nextRetryAt?: number;
  };
  metadata?: Record<string, any>;
}

export class TaskQueue {
  private tasks: Map<string, AgentTask> = new Map();
  private queue: string[] = [];
  private priorityOrder: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  enqueueTask(task: AgentTask): void {
    this.tasks.set(task.id, task);
    task.status = 'queued';
    this.queue.push(task.id);
    this.sortQueue();
  }

  dequeueTask(): AgentTask | null {
    const taskId = this.queue.shift();
    if (!taskId) return null;

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'running';
      task.startedAt = Date.now();
    }

    return task || null;
  }

  scheduleTask(task: AgentTask, delayMs: number): void {
    task.status = 'scheduled';
    task.scheduledFor = Date.now() + delayMs;
    this.tasks.set(task.id, task);
    this.queue.push(task.id);
    this.sortQueue();
  }

  private sortQueue(): void {
    this.queue.sort((aId, bId) => {
      const a = this.tasks.get(aId);
      const b = this.tasks.get(bId);
      if (!a || !b) return 0;

      // Scheduled tasks come after scheduled time
      const now = Date.now();
      const aReady = !a.scheduledFor || a.scheduledFor <= now;
      const bReady = !b.scheduledFor || b.scheduledFor <= now;

      if (aReady !== bReady) {
        return aReady ? -1 : 1;
      }

      // Sort by priority
      return this.priorityOrder[a.priority] - this.priorityOrder[b.priority];
    });
  }

  updateTaskStatus(taskId: string, status: TaskStatus, metadata?: Record<string, any>): AgentTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = status;
    if (status === 'completed') {
      task.completedAt = Date.now();
    }
    if (metadata) {
      task.metadata = { ...task.metadata, ...metadata };
    }

    return task;
  }

  getTask(taskId: string): AgentTask | null {
    return this.tasks.get(taskId) || null;
  }

  getTasks(filter?: { status?: TaskStatus; priority?: TaskPriority }): AgentTask[] {
    const tasks = Array.from(this.tasks.values());

    if (!filter) return tasks;

    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      return true;
    });
  }

  getQueuedTasks(): AgentTask[] {
    return this.queue.map(id => this.tasks.get(id)).filter(Boolean) as AgentTask[];
  }

  cancelTask(taskId: string): AgentTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = 'cancelled';
    this.queue = this.queue.filter(id => id !== taskId);

    return task;
  }

  pauseTask(taskId: string): AgentTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = 'paused';
    return task;
  }

  resumeTask(taskId: string): AgentTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    if (task.status === 'paused') {
      task.status = 'running';
    }

    return task;
  }

  retryTask(taskId: string, delayMs: number = 5000): AgentTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    if (!task.retry) {
      task.retry = { count: 0, maxRetries: 3 };
    }

    if (task.retry.count >= task.retry.maxRetries) {
      task.status = 'failed';
      return task;
    }

    task.retry.count++;
    task.retry.nextRetryAt = Date.now() + delayMs;
    task.status = 'scheduled';
    task.scheduledFor = Date.now() + delayMs;

    // Re-add to queue
    if (!this.queue.includes(taskId)) {
      this.queue.push(taskId);
      this.sortQueue();
    }

    return task;
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      queued: tasks.filter(t => t.status === 'queued').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      byPriority: {
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        normal: tasks.filter(t => t.priority === 'normal').length,
        low: tasks.filter(t => t.priority === 'low').length,
      },
    };
  }

  clearCompleted(): void {
    const toDelete: string[] = [];
    this.tasks.forEach((task, id) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.tasks.delete(id));
  }
}

export const taskQueue = new TaskQueue();