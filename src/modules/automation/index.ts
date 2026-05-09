/**
 * Automation Module Index
 * Exports all automation engines and utilities
 *
 * Complete UI Automation Engine for Shivi AI
 * - Mouse/Keyboard control
 * - Window management
 * - App launching
 * - Task planning
 * - Vision integration
 * - Error recovery
 * - Monitoring & logging
 */

// Core Engines
export { MouseEngine, mouseEngine } from './mouse';
export { KeyboardEngine, keyboardEngine } from './keyboard';
export { SafetyFramework, safetyFramework } from './safety';
export { AutomationExecutor, automationExecutor } from './executor';
export { TaskPlanner, taskPlanner } from './planner';

// OS Integration
export { OSInputSimulator, osInput } from './osinput';
export { WindowManager } from './window';

// Application Management
export { AppLauncher, appLauncher } from './appLauncher';

// Workflows
export { WorkflowBuilder, workflowBuilder } from './workflows';

// Vision Integration
export { VisionIntegration, visionIntegration } from './visionIntegration';

// Error Handling & Recovery
export { ErrorRecovery, errorRecovery } from './errorRecovery';

// Monitoring
export { AutomationMonitor, automationMonitor } from './monitor';

// Type Definitions
export * from './types';

/**
 * Unified Automation API
 * Single entry point for all automation operations
 */
export class AutomationAPI {
  private static instance: AutomationAPI;
  private enabled = false;
  private executionLogs: any[] = [];

  static getInstance(): AutomationAPI {
    if (!AutomationAPI.instance) {
      AutomationAPI.instance = new AutomationAPI();
    }
    return AutomationAPI.instance;
  }

  /**
   * Get full automation state
   */
  getState() {
    const { automationExecutor } = require('./executor');
    return automationExecutor.getState();
  }

  /**
   * Enable automation with specific permission level
   */
  enableAutomation(permissionLevel: 'observe' | 'read' | 'assist' | 'full' = 'assist') {
    const { safetyFramework } = require('./safety');
    safetyFramework.updateConfig({ enabled: true });
    this.enabled = true;
    return { enabled: true, permissionLevel };
  }

  /**
   * Disable automation
   */
  disableAutomation() {
    const { safetyFramework } = require('./safety');
    safetyFramework.updateConfig({ enabled: false });
    this.enabled = false;
    return { enabled: false };
  }

  /**
   * Activate emergency stop
   */
  emergencyStop() {
    const { safetyFramework } = require('./safety');
    safetyFramework.activateEmergencyStop();
    return { stopped: true };
  }

  /**
   * Get execution logs
   */
  getLogs() {
    const { automationExecutor } = require('./executor');
    return automationExecutor.getExecutionLogs();
  }

  /**
   * Plan a task from a user request
   */
  planTask(userRequest: string) {
    const { taskPlanner } = require('./planner');
    return taskPlanner.planTask({ userRequest });
  }

  /**
   * Execute a full automation task
   */
  async executeTask(task: any) {
    const { automationExecutor } = require('./executor');
    return await automationExecutor.executeTask(task);
  }

  /**
   * Get task history
   */
  getTaskHistory() {
    const { automationExecutor } = require('./executor');
    return automationExecutor.getTaskHistory();
  }

  /**
   * Clear execution logs
   */
  clearLogs() {
    const { automationExecutor } = require('./executor');
    automationExecutor.clearLogs();
    this.executionLogs = [];
    return { cleared: true };
  }

  /**
   * Get permissions
   */
  getPermissions() {
    const { safetyFramework } = require('./safety');
    return safetyFramework.getAllPermissions();
  }

  /**
   * Grant app permission
   */
  grantPermission(appName: string, level: 'observe' | 'read' | 'assist' | 'full') {
    const { safetyFramework } = require('./safety');
    return safetyFramework.grantAppPermission(appName, level);
  }

  /**
   * Revoke app permission
   */
  revokePermission(appName: string) {
    const { safetyFramework } = require('./safety');
    safetyFramework.revokeAppPermission(appName);
    return { revoked: true };
  }

  /**
   * Get configuration
   */
  getConfig() {
    const { safetyFramework } = require('./safety');
    return safetyFramework.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(updates: any) {
    const { safetyFramework } = require('./safety');
    safetyFramework.updateConfig(updates);
    return { updated: true };
  }

  /**
   * Get status
   */
  getStatus() {
    const { automationExecutor } = require('./executor');
    const state = automationExecutor.getState();
    return {
      enabled: this.enabled,
      executing: state.status === 'running',
      status: state.status,
      currentTask: state.currentTask,
      currentAction: state.currentAction,
      isActive: state.isActive,
      timestamp: Date.now(),
    };
  }
}

export const automationAPI = AutomationAPI.getInstance();

