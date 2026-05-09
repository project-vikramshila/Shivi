import { EventBus } from '../events/eventBus';

export type WorkflowTrigger = {
  type: 'event' | 'timer' | 'manual';
  eventName?: string;
  cron?: string;
};

export type WorkflowStep = {
  id: string;
  description: string;
  type: 'plugin_action' | 'automation' | 'voice' | 'memory' | 'custom';
  target?: string;
  action: string;
  params?: Record<string, any>;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
};

export class WorkflowEngine {
  private workflows: Record<string, WorkflowDefinition> = {};
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.eventBus.subscribe('workflow_completed', async (payload) => {
      // default hook for workflow completion; plugins may also subscribe
      console.debug('[workflow] completed', payload);
    });
  }

  registerWorkflow(workflow: WorkflowDefinition) {
    this.workflows[workflow.id] = workflow;
    if (workflow.enabled && workflow.trigger.type === 'event' && workflow.trigger.eventName) {
      this.eventBus.subscribe(workflow.trigger.eventName, async () => {
        await this.executeWorkflow(workflow.id);
      });
    }
  }

  listWorkflows() {
    return Object.values(this.workflows);
  }

  getWorkflow(id: string) {
    return this.workflows[id] || null;
  }

  async executeWorkflow(id: string) {
    const workflow = this.workflows[id];
    if (!workflow || !workflow.enabled) {
      throw new Error(`Workflow not found or disabled: ${id}`);
    }

    for (const step of workflow.steps) {
      await this.executeStep(step);
    }

    await this.eventBus.publish('workflow_completed', { workflowId: workflow.id, name: workflow.name });
    return { success: true, workflowId: workflow.id };
  }

  private async executeStep(step: WorkflowStep) {
    if (step.type === 'plugin_action' && step.target) {
      await this.eventBus.publish('plugin_action', { pluginId: step.target, action: step.action, params: step.params });
      return;
    }

    await this.eventBus.publish('workflow_step', { step });
  }
}
