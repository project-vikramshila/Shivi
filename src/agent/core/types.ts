/**
 * Multi-app Agent Core Types
 * Shared agent types for workflows, context, permissions, and app connectors
 */

export type AppConnectorId = 'whatsapp' | 'instagram' | 'browser' | 'calendar' | 'email' | 'files' | 'notes';

export interface AgentGoal {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  targetApps: AppConnectorId[];
  priority: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface AgentTaskStep {
  id: string;
  name: string;
  description: string;
  app: AppConnectorId | 'core';
  action: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

export interface AgentWorkflow {
  id: string;
  goalId: string;
  title: string;
  steps: AgentTaskStep[];
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  checkpoints: Record<string, AgentTaskStep>;
  metadata?: Record<string, any>;
}

export interface AppContextSnapshot {
  appId: AppConnectorId;
  lastUpdated: number;
  summary: string;
  unseenCount: number;
  recentItems: Array<{ id: string; title: string; snippet: string; timestamp: number }>;
  metadata?: Record<string, any>;
}

export interface AgentEventPayload {
  type: AgentEventType;
  payload: any;
  timestamp: number;
}

export type AgentEventType =
  | 'message_received'
  | 'reminder_due'
  | 'app_opened'
  | 'voice_command'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'summary_ready'
  | 'proactive_alert';

export interface AppConnector {
  id: AppConnectorId;
  displayName: string;
  enabled: boolean;
  lastSync: number;
  fetchContext(): Promise<AppContextSnapshot>;
  search(query: string): Promise<string[]>;
  summarizeRecentActivity(limit?: number): Promise<string>;
}

export interface WorkflowRunResult {
  success: boolean;
  workflow: AgentWorkflow;
  error?: string;
  durationMs: number;
}

export interface AutonomySettings {
  mode: 'observe' | 'suggest' | 'assist' | 'autonomous';
  requireConfirmationFor: string[];
  proactiveEnabled: boolean;
  privacyLevel: 'strict' | 'moderate' | 'relaxed';
}

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  permissions: Array<'context' | 'workflow' | 'automation' | 'memory' | 'voice' | 'vision'>;
}
