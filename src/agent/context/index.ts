/**
 * Agent Context Manager
 * Tracks multi-app context, summaries, relationships, and workflow history.
 */

import type { AppContextSnapshot, AgentGoal, AgentWorkflow } from '../core/types';

export class AgentContextManager {
  private appContexts: Map<string, AppContextSnapshot> = new Map();
  private workflowHistory: AgentWorkflow[] = [];
  private goalHistory: AgentGoal[] = [];
  private lastUpdated = Date.now();

  updateAppContext(context: AppContextSnapshot): void {
    this.appContexts.set(context.appId, context);
    this.lastUpdated = Date.now();
  }

  getAppContexts(): AppContextSnapshot[] {
    return Array.from(this.appContexts.values());
  }

  getAppContext(appId: string): AppContextSnapshot | undefined {
    return this.appContexts.get(appId);
  }

  addWorkflow(workflow: AgentWorkflow): void {
    this.workflowHistory.push(workflow);
    this.lastUpdated = Date.now();
  }

  updateWorkflow(workflow: AgentWorkflow): void {
    const index = this.workflowHistory.findIndex((item) => item.id === workflow.id);
    if (index >= 0) {
      this.workflowHistory[index] = workflow;
    } else {
      this.workflowHistory.push(workflow);
    }
    this.lastUpdated = Date.now();
  }

  getWorkflowHistory(limit = 20): AgentWorkflow[] {
    return this.workflowHistory.slice(-limit);
  }

  addGoal(goal: AgentGoal): void {
    this.goalHistory.push(goal);
    this.lastUpdated = Date.now();
  }

  getGoals(limit = 20): AgentGoal[] {
    return this.goalHistory.slice(-limit);
  }

  getSummary(): string {
    const summaries = this.getAppContexts().map((context) => `(${context.appId}: ${context.summary})`);
    return `Active app context: ${summaries.join('; ')}.`;
  }
}

export const agentContextManager = new AgentContextManager();
