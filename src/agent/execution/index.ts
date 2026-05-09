import { agentContextManager } from '../context';
import { agentEventBus } from '../events';
import { agentWorkflowEngine } from '../workflows';
import { AgentReasoningEngine } from '../reasoning';
import type { AgentWorkflow, AgentTaskStep, AutonomySettings, WorkflowRunResult, AgentEventType, AppConnectorId } from '../core/types';
import { AutonomyManager } from '../autonomy';
import { connectorRegistry } from '../connectors';

export class AgentExecutionEngine {
  private reasoning = new AgentReasoningEngine();
  private autonomy = new AutonomyManager();

  async executeWorkflow(workflow: AgentWorkflow, autonomySettings: AutonomySettings): Promise<WorkflowRunResult> {
    const startTime = Date.now();
    const activeWorkflow = agentWorkflowEngine.startWorkflow(workflow);
    let result: WorkflowRunResult = activeWorkflow;

    for (let index = workflow.currentStepIndex; index < workflow.steps.length; index += 1) {
      const step = workflow.steps[index];
      if (workflow.status !== 'running') break;

      if (!this.autonomy.canExecuteStep(step, autonomySettings)) {
        workflow.status = 'paused';
        workflow.updatedAt = Date.now();
        agentWorkflowEngine.updateStep(workflow.id, { id: step.id, status: 'failed' as const, error: 'Autonomy restrictions prevented execution' });
        result = { success: false, workflow, durationMs: Date.now() - startTime, error: 'Autonomy restrictions prevented execution' };
        break;
      }

      workflow.currentStepIndex = index;
      const runningStep = { ...step, status: 'running' as const, startedAt: Date.now() };
      agentWorkflowEngine.updateStep(workflow.id, runningStep);
      agentEventBus.publish('workflow_step_started', { workflowId: workflow.id, step: runningStep });

      const execution = await this.executeStep(runningStep, autonomySettings);
      if (execution.success) {
        agentWorkflowEngine.updateStep(workflow.id, { id: step.id, status: 'completed' as const, finishedAt: Date.now() });
        agentEventBus.publish('workflow_step_completed', { workflowId: workflow.id, stepId: step.id });
        agentContextManager.updateWorkflow(workflow);
        continue;
      }

      const advice = this.reasoning.assessFailure(step, autonomySettings, execution.error);
      if (advice.shouldRetry && step.status !== 'failed') {
        agentEventBus.publish('workflow_step_retry', { workflowId: workflow.id, stepId: step.id, reason: advice.reason });
        const retryResult = await this.retryStep(workflow, step, autonomySettings, advice);
        if (retryResult.success) {
          continue;
        }
      }

      if (advice.fallbackAction) {
        workflow = await this.applyFallback(workflow, step, advice.fallbackAction, autonomySettings);
        if (workflow.status === 'completed') {
          continue;
        }
      }

      agentWorkflowEngine.updateStep(workflow.id, { id: step.id, status: 'failed', error: execution.error });
      workflow.status = 'failed';
      workflow.updatedAt = Date.now();
      agentEventBus.publish('workflow_failed', { workflowId: workflow.id, stepId: step.id, error: execution.error });
      result = { success: false, workflow, durationMs: Date.now() - startTime, error: execution.error };
      break;
    }

    if (workflow.steps.every((s) => s.status === 'completed')) {
      result = { success: true, workflow, durationMs: Date.now() - startTime };
      agentEventBus.publish('workflow_completed', { workflowId: workflow.id, title: workflow.title });
    }

    return result;
  }

  private async executeStep(step: AgentTaskStep, autonomySettings: AutonomySettings): Promise<{ success: boolean; error?: string }> {
    try {
      if (step.app !== 'core') {
        const connector = connectorRegistry.getConnector(step.app);
        if (!connector) {
          return { success: false, error: `No connector found for ${step.app}` };
        }

        if (step.action === 'fetchContext') {
          const snapshot = await connector.fetchContext();
          agentContextManager.updateAppContext(snapshot);
          return { success: true };
        }

        if (step.action === 'search') {
          await connector.search(step.params.query || step.params.goal);
          return { success: true };
        }

        if (step.action === 'summarizeRecentActivity') {
          await connector.summarizeRecentActivity(step.params.limit || 5);
          return { success: true };
        }

        return { success: true };
      }

      const contextSummary = agentContextManager.getSummary();
      switch (step.action) {
        case 'prepareContext':
          agentContextManager.updateAppContext({ appId: 'core', lastUpdated: Date.now(), summary: `Prepared context for ${step.params.goal}. ${contextSummary}`, unseenCount: 0, recentItems: [] });
          return { success: true };
        case 'analyzeContext':
          return { success: true };
        case 'generateActionPlan':
          return { success: true };
        case 'executeFollowup':
          return { success: true };
        case 'createSummary':
          return { success: true };
        default:
          return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async retryStep(workflow: AgentWorkflow, step: AgentTaskStep, autonomySettings: AutonomySettings, advice: { retries: number; reason: string }): Promise<{ success: boolean }> {
    let attempt = 0;
    while (attempt < advice.retries) {
      attempt += 1;
      const retryResult = await this.executeStep(step, autonomySettings);
      if (retryResult.success) {
        agentWorkflowEngine.updateStep(workflow.id, { id: step.id, status: 'completed', finishedAt: Date.now() });
        return { success: true };
      }
    }
    return { success: false };
  }

  private async applyFallback(workflow: AgentWorkflow, step: AgentTaskStep, fallbackAction: string, autonomySettings: AutonomySettings): Promise<AgentWorkflow> {
    const fallbackStep: AgentTaskStep = {
      id: `${step.id}-fallback`,
      name: `Fallback: ${fallbackAction}`,
      description: `Attempt fallback strategy for failed step ${step.name}`,
      app: 'core',
      action: fallbackAction,
      params: step.params,
      status: 'pending',
    };
    workflow.steps.splice(workflow.currentStepIndex + 1, 0, fallbackStep);
    workflow.updatedAt = Date.now();
    await this.executeStep(fallbackStep, autonomySettings);
    return workflow;
  }
}
