/**
 * Agent Workflow Execution Engine
 * Executes workflows with checkpoints, retries, and state tracking.
 */

import { agentContextManager } from '../context';
import { agentEventBus } from '../events';
import type { AgentWorkflow, AgentTaskStep, WorkflowRunResult } from '../core/types';

export class AgentWorkflowEngine {
  private workflows: Map<string, AgentWorkflow> = new Map();

  startWorkflow(workflow: AgentWorkflow): WorkflowRunResult {
    workflow.status = 'running';
    workflow.updatedAt = Date.now();
    this.workflows.set(workflow.id, workflow);
    agentContextManager.addWorkflow(workflow);
    agentEventBus.publish('workflow_started', { workflowId: workflow.id, title: workflow.title });

    return { success: true, workflow, durationMs: 0 };
  }

  updateStep(workflowId: string, stepUpdate: Partial<AgentTaskStep> & { id: string }): AgentWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    const stepIndex = workflow.steps.findIndex((step) => step.id === stepUpdate.id);
    if (stepIndex === -1) return workflow;

    workflow.steps[stepIndex] = { ...workflow.steps[stepIndex], ...stepUpdate, finishedAt: stepUpdate.status === 'completed' ? Date.now() : workflow.steps[stepIndex].finishedAt };
    workflow.updatedAt = Date.now();
    workflow.checkpoints[stepUpdate.id] = workflow.steps[stepIndex];
    this.workflows.set(workflowId, workflow);

    if (workflow.steps.every((step) => step.status === 'completed')) {
      workflow.status = 'completed';
      agentEventBus.publish('workflow_completed', { workflowId, title: workflow.title });
    }

    if (workflow.steps.some((step) => step.status === 'failed')) {
      workflow.status = 'failed';
      agentEventBus.publish('workflow_failed', { workflowId, title: workflow.title });
    }

    return workflow;
  }

  getWorkflow(workflowId: string): AgentWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  pauseWorkflow(workflowId: string): AgentWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    workflow.status = 'paused';
    workflow.updatedAt = Date.now();
    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  resumeWorkflow(workflowId: string): AgentWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    workflow.status = 'running';
    workflow.updatedAt = Date.now();
    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  cancelWorkflow(workflowId: string): AgentWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    workflow.status = 'failed';
    workflow.updatedAt = Date.now();
    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  getActiveWorkflows(): AgentWorkflow[] {
    return Array.from(this.workflows.values()).filter((workflow) => workflow.status === 'running' || workflow.status === 'pending');
  }
}

export const agentWorkflowEngine = new AgentWorkflowEngine();
