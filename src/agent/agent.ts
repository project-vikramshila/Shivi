import type { AgentGoal, AgentWorkflow, AutonomySettings, WorkflowRunResult } from './core/types';
import { agentPlanner } from './planner';
import { agentContextManager } from './context';
import { AgentExecutionEngine } from './execution';
import { agentWorkflowEngine } from './workflows';
import { AutonomyManager } from './autonomy';
import { agentEventBus } from './events';

const createGoalId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class AgentCore {
  private goals: Map<string, AgentGoal> = new Map();
  private executionEngine = new AgentExecutionEngine();
  private autonomyManager = new AutonomyManager();

  createGoal(goal: Omit<AgentGoal, 'createdAt' | 'status' | 'id'> & { id?: string }): AgentGoal {
    const fullGoal: AgentGoal = {
      ...goal,
      id: goal.id || createGoalId(),
      createdAt: Date.now(),
      status: 'pending',
    };
    this.goals.set(fullGoal.id, fullGoal);
    agentContextManager.addGoal(fullGoal);
    agentEventBus.publish('goal_created', { goal: fullGoal });
    return fullGoal;
  }

  getGoal(goalId: string): AgentGoal | null {
    return this.goals.get(goalId) || null;
  }

  getGoals(): AgentGoal[] {
    return Array.from(this.goals.values());
  }

  async executeGoal(goalId: string, autonomySettings?: AutonomySettings): Promise<WorkflowRunResult> {
    const goal = this.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const settings = autonomySettings ?? this.autonomyManager.getDefaultSettings();
    goal.status = 'in-progress';
    this.goals.set(goal.id, goal);

    const workflow = agentPlanner.planGoal(goal);
    agentContextManager.addWorkflow(workflow);
    agentEventBus.publish('goal_started', { goalId: goal.id, workflowId: workflow.id });

    const result = await this.executionEngine.executeWorkflow(workflow, settings);
    goal.status = result.success ? 'completed' : 'failed';
    this.goals.set(goal.id, goal);
    agentEventBus.publish('goal_finished', { goalId: goal.id, success: result.success });

    return result;
  }

  listActiveWorkflows() {
    return agentWorkflowEngine.getActiveWorkflows();
  }

  pauseWorkflow(workflowId: string) {
    return agentWorkflowEngine.pauseWorkflow(workflowId);
  }

  resumeWorkflow(workflowId: string) {
    return agentWorkflowEngine.resumeWorkflow(workflowId);
  }

  cancelWorkflow(workflowId: string) {
    return agentWorkflowEngine.cancelWorkflow(workflowId);
  }

  getAutonomySettings() {
    return this.autonomyManager.getDefaultSettings();
  }
}

export const agentCore = new AgentCore();
