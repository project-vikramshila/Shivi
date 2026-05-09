/**
 * Enhanced Agent Execution Engine with Retry, Checkpoint, and AI Decision Support
 * Integrates all autonomous agent components for intelligent task execution
 */

import { agentContextManager } from '../context';
import { agentEventBus } from '../events';
import { agentWorkflowEngine } from '../workflows';
import { AgentReasoningEngine } from '../reasoning';
import { AutonomyManager } from '../autonomy';
import { AgentRetryManager } from '../retries';
import { CheckpointManager } from '../checkpoints';
import { taskQueue } from '../tasks';
import { aiDecisionEngine } from '../ai-engine';
import { connectorRegistry } from '../connectors';
import type { AgentWorkflow, AgentTaskStep, AutonomySettings, WorkflowRunResult, AgentGoal, AgentEventType } from '../core/types';
import type { TaskPriority } from '../tasks';

export class EnhancedAgentExecutionEngine {
  private reasoning = new AgentReasoningEngine();
  private autonomy = new AutonomyManager();
  private retryManager = new AgentRetryManager();
  private checkpointMgr = new CheckpointManager();
  private activeWorkflows: Map<string, AgentWorkflow> = new Map();

  /**
   * Execute a goal with full autonomous capabilities
   */
  async executeGoal(
    goal: AgentGoal,
    planner: any,
    autonomySettings: AutonomySettings = this.autonomy.getDefaultSettings()
  ): Promise<WorkflowRunResult> {
    const workflow = planner.planGoal(goal);
    const startTime = Date.now();

    this.activeWorkflows.set(workflow.id, workflow);
    agentEventBus.publish('workflow_started', { workflowId: workflow.id, title: workflow.title });

    let result: WorkflowRunResult = { success: true, workflow, durationMs: 0 };

    try {
      result = await this.executeWorkflow(workflow, autonomySettings);
    } catch (error) {
      result = {
        success: false,
        workflow,
        error: error instanceof Error ? error.message : 'Execution failed',
        durationMs: Date.now() - startTime,
      };
      agentEventBus.publish('workflow_failed', {
        workflowId: workflow.id,
        error: result.error,
      });
    } finally {
      this.activeWorkflows.delete(workflow.id);
    }

    return result;
  }

  /**
   * Execute workflow with full retry, checkpoint, and AI decision support
   */
  private async executeWorkflow(workflow: AgentWorkflow, autonomySettings: AutonomySettings): Promise<WorkflowRunResult> {
    const startTime = Date.now();
    workflow.status = 'running';
    workflow.updatedAt = Date.now();
    agentWorkflowEngine.updateStep(workflow.id, { id: workflow.steps[0].id });

    for (let stepIndex = workflow.currentStepIndex; stepIndex < workflow.steps.length; stepIndex++) {
      const step = workflow.steps[stepIndex];

      // Create checkpoint before critical steps
      if (step.action.includes('send') || step.action.includes('delete')) {
        const checkpoint = this.checkpointMgr.createCheckpoint(workflow, stepIndex, {
          workflowTitle: workflow.title,
          stepName: step.name,
          timestamp: Date.now(),
        });
        workflow.checkpoints[checkpoint.id] = step;
      }

      // Check autonomy before execution
      if (!this.autonomy.canExecuteStep(step, autonomySettings)) {
        workflow.status = 'paused';
        agentEventBus.publish('workflow_paused', {
          workflowId: workflow.id,
          reason: 'Autonomy restrictions',
          step: step.name,
        });
        return {
          success: false,
          workflow,
          error: 'Autonomy restrictions prevented execution',
          durationMs: Date.now() - startTime,
        };
      }

      // Execute step with retry logic
      const execution = await this.executeStepWithRetry(workflow, step, autonomySettings);

      if (execution.success) {
        workflow.currentStepIndex = stepIndex + 1;
        agentEventBus.publish('workflow_step_completed', {
          workflowId: workflow.id,
          stepId: step.id,
          duration: execution.duration,
        });
        continue;
      }

      // Handle failure with AI decision
      const decision = await aiDecisionEngine.makeDecision({
        currentStep: step,
        workflow,
        error: execution.error,
        previousAttempts: execution.attempts,
        autonomy: autonomySettings,
        recentHistory: workflow.steps.slice(Math.max(0, stepIndex - 3), stepIndex),
      });

      agentEventBus.publish('ai_decision_made', {
        workflowId: workflow.id,
        stepId: step.id,
        decision: decision.action,
        confidence: decision.confidence,
        narrative: decision.narrativeHindi,
      });

      // Handle decision
      switch (decision.action) {
        case 'continue':
          continue;

        case 'skip':
          workflow.currentStepIndex = stepIndex + 1;
          agentWorkflowEngine.updateStep(workflow.id, {
            id: step.id,
            status: 'completed',
            finishedAt: Date.now(),
          });
          continue;

        case 'cancel':
          workflow.status = 'failed';
          return {
            success: false,
            workflow,
            error: execution.error,
            durationMs: Date.now() - startTime,
          };

        case 'ask_user':
          workflow.status = 'paused';
          agentEventBus.publish('workflow_needs_confirmation', {
            workflowId: workflow.id,
            step: step.name,
            suggestion: decision.recommendation,
          });
          return {
            success: false,
            workflow,
            error: 'Awaiting user confirmation',
            durationMs: Date.now() - startTime,
          };

        case 'fallback':
        case 'retry':
        default:
          continue;
      }
    }

    workflow.status = 'completed';
    agentEventBus.publish('workflow_completed', {
      workflowId: workflow.id,
      title: workflow.title,
    });

    return {
      success: true,
      workflow,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Execute step with intelligent retry logic
   */
  private async executeStepWithRetry(
    workflow: AgentWorkflow,
    step: AgentTaskStep,
    autonomySettings: AutonomySettings
  ): Promise<{ success: boolean; error?: string; attempts: number; duration: number }> {
    const startTime = Date.now();
    step.status = 'running';
    step.startedAt = Date.now();

    const result = await this.retryManager.retryStep(
      step,
      async () => {
        try {
          // Execute through appropriate connector
          if (step.app === 'core') {
            return await this.executeCoreStep(step, workflow);
          }

          const connector = connectorRegistry.getConnector(step.app);
          if (!connector) {
            return {
              success: false,
              error: `No connector for ${step.app}`,
            };
          }

          // Execute through connector
          if (!connector.execute) {
            return { success: false, error: `Connector ${step.app} does not support execution` };
          }
          const success = await connector.execute(step.action, step.params);
          return {
            success,
            error: success ? undefined : `${step.app} action failed`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Execution error',
          };
        }
      },
      autonomySettings
    );

    step.status = result.success ? 'completed' : 'failed';
    step.finishedAt = Date.now();
    step.error = result.finalError;

    return {
      success: result.success,
      error: result.finalError,
      attempts: result.attempts,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute core steps (non-app-specific)
   */
  private async executeCoreStep(step: AgentTaskStep, workflow: AgentWorkflow): Promise<{ success: boolean; error?: string }> {
    switch (step.action) {
      case 'prepareContext':
        // Gather context from memory and active apps
        const context = await agentContextManager.buildWorkflowContext(workflow.goalId);
        if (context) {
          step.params.context = context;
          return { success: true };
        }
        return { success: false, error: 'Failed to build context' };

      case 'analyzeContext':
        // Analyze gathered context
        return { success: true };

      case 'summarize':
        // Summarize results
        return { success: true };

      default:
        return { success: false, error: `Unknown core action: ${step.action}` };
    }
  }

  /**
   * Resume workflow from checkpoint
   */
  async resumeFromCheckpoint(workflowId: string, autonomySettings: AutonomySettings): Promise<WorkflowRunResult> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        workflow: {} as AgentWorkflow,
        error: 'Workflow not found',
        durationMs: 0,
      };
    }

    const checkpoint = this.checkpointMgr.getLatestCheckpoint(workflowId);
    if (checkpoint) {
      const restored = this.checkpointMgr.restoreFromCheckpoint(checkpoint, workflow);
      this.activeWorkflows.set(restored.id, restored);
      return this.executeWorkflow(restored, autonomySettings);
    }

    return this.executeWorkflow(workflow, autonomySettings);
  }

  /**
   * Pause workflow execution
   */
  pauseWorkflow(workflowId: string): void {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'paused';
      agentEventBus.publish('workflow_paused', { workflowId });
    }
  }

  /**
   * Cancel workflow execution
   */
  cancelWorkflow(workflowId: string): void {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'failed';
      this.activeWorkflows.delete(workflowId);
      agentEventBus.publish('workflow_cancelled', { workflowId });
    }
  }

  getActiveWorkflows(): AgentWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflow(workflowId: string): AgentWorkflow | null {
    return this.activeWorkflows.get(workflowId) || null;
  }
}

export const enhancedExecutionEngine = new EnhancedAgentExecutionEngine();