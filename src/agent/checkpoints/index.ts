/**
 * Agent Checkpoint System
 * Enables workflow persistence, recovery, and resumption from saved states.
 */

import type { AgentWorkflow, AgentTaskStep } from '../core/types';

export interface Checkpoint {
  id: string;
  workflowId: string;
  stepIndex: number;
  step: AgentTaskStep;
  context: Record<string, any>;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class CheckpointManager {
  private checkpoints: Map<string, Checkpoint[]> = new Map();
  private maxCheckpointsPerWorkflow = 50;

  createCheckpoint(workflow: AgentWorkflow, stepIndex: number, context: Record<string, any>): Checkpoint {
    const checkpoint: Checkpoint = {
      id: `checkpoint-${workflow.id}-${stepIndex}-${Date.now()}`,
      workflowId: workflow.id,
      stepIndex,
      step: workflow.steps[stepIndex],
      context,
      timestamp: Date.now(),
    };

    if (!this.checkpoints.has(workflow.id)) {
      this.checkpoints.set(workflow.id, []);
    }

    const workflowCheckpoints = this.checkpoints.get(workflow.id)!;
    workflowCheckpoints.push(checkpoint);

    // Maintain max checkpoint limit
    if (workflowCheckpoints.length > this.maxCheckpointsPerWorkflow) {
      workflowCheckpoints.shift();
    }

    return checkpoint;
  }

  getLatestCheckpoint(workflowId: string): Checkpoint | null {
    const checkpoints = this.checkpoints.get(workflowId);
    return checkpoints && checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }

  getCheckpointAt(workflowId: string, stepIndex: number): Checkpoint | null {
    const checkpoints = this.checkpoints.get(workflowId);
    if (!checkpoints) return null;

    return checkpoints.find(cp => cp.stepIndex === stepIndex) || null;
  }

  restoreFromCheckpoint(checkpoint: Checkpoint, workflow: AgentWorkflow): AgentWorkflow {
    const restored = { ...workflow };
    restored.currentStepIndex = checkpoint.stepIndex;
    restored.status = 'running';
    restored.updatedAt = Date.now();

    // Reset steps from checkpoint onward to pending
    for (let i = checkpoint.stepIndex + 1; i < restored.steps.length; i++) {
      restored.steps[i].status = 'pending';
      restored.steps[i].startedAt = undefined;
      restored.steps[i].finishedAt = undefined;
      restored.steps[i].error = undefined;
    }

    return restored;
  }

  getAllCheckpoints(workflowId: string): Checkpoint[] {
    return this.checkpoints.get(workflowId) || [];
  }

  clearCheckpoints(workflowId: string): void {
    this.checkpoints.delete(workflowId);
  }

  clearAllCheckpoints(): void {
    this.checkpoints.clear();
  }

  getCheckpointStats(workflowId: string) {
    const checkpoints = this.checkpoints.get(workflowId) || [];
    if (checkpoints.length === 0) {
      return { totalCheckpoints: 0, lastCheckpoint: null, averageContextSize: 0 };
    }

    const totalSize = checkpoints.reduce((sum, cp) => sum + JSON.stringify(cp.context).length, 0);
    const averageContextSize = totalSize / checkpoints.length;

    return {
      totalCheckpoints: checkpoints.length,
      lastCheckpoint: checkpoints[checkpoints.length - 1].timestamp,
      averageContextSize,
    };
  }
}

export const checkpointManager = new CheckpointManager();