/**
 * Agent Planner
 * Breaks goals into executable workflow steps across multiple apps.
 */

import type { AgentGoal, AgentWorkflow, AgentTaskStep, AppConnectorId } from '../core/types';

const createId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `agent-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class AgentPlanner {
  planGoal(goal: AgentGoal): AgentWorkflow {
    const steps: AgentTaskStep[] = this.decomposeGoal(goal);
    return {
      id: createId(),
      goalId: goal.id,
      title: goal.title,
      steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
      currentStepIndex: 0,
      checkpoints: {},
      metadata: {
        targetApps: goal.targetApps,
      },
    };
  }

  private decomposeGoal(goal: AgentGoal): AgentTaskStep[] {
    const steps: AgentTaskStep[] = [];
    const appTargets: AppConnectorId[] = goal.targetApps.length ? goal.targetApps : ['browser'];

    steps.push({
      id: `${goal.id}-step-prepare`,
      name: 'Prepare agent context',
      description: 'Build a memory-aware context summary from past goals and recent app activity',
      app: 'core',
      action: 'prepareContext',
      params: { goal: goal.description },
      status: 'pending',
    });

    appTargets.forEach((app, index) => {
      steps.push({
        id: `${goal.id}-step-${index + 1}`,
        name: `Gather ${app} context`,
        description: `Collect recent activity and relevant items from ${app}`,
        app,
        action: 'fetchContext',
        params: { goal: goal.description },
        status: 'pending',
      });
    });

    steps.push({
      id: `${goal.id}-step-analyze`,
      name: 'Analyze collected context',
      description: 'Extract key information and identify high-value tasks',
      app: 'core',
      action: 'analyzeContext',
      params: { goal: goal.description },
      status: 'pending',
    });

    steps.push({
      id: `${goal.id}-step-plan`,
      name: 'Plan next actions',
      description: 'Create a sequence of follow-up tasks, reminders, and notes based on analysis',
      app: 'core',
      action: 'generateActionPlan',
      params: { goal: goal.description },
      status: 'pending',
    });

    steps.push({
      id: `${goal.id}-step-execute`,
      name: 'Execute prioritized actions',
      description: 'Apply the selected actions across apps and workflows',
      app: 'core',
      action: 'executeFollowup',
      params: { goal: goal.description },
      status: 'pending',
    });

    return steps;
  }
}

export const agentPlanner = new AgentPlanner();
