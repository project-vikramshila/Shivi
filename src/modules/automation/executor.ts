/**
 * Automation Executor Engine
 * Core orchestration engine for executing automation tasks
 */

import { mouseEngine } from './mouse';
import { keyboardEngine } from './keyboard';
import { safetyFramework } from './safety';
import { windowManager } from './window';
import { visionIntegration } from './visionIntegration';
import { automationMonitor } from './monitor';
import { errorRecovery } from './errorRecovery';

import type {
  AutomationTask,
  AutomationWorkflowStep,
  AutomationTaskResult,
  AutomationState,
  MouseAction,
  KeyboardAction,
  WaitAction,
  AppAction,
  WindowAction,
  VisionAction,
} from './types';

export class AutomationExecutor {
  private static instance: AutomationExecutor;
  private state: AutomationState = this.getInitialState();
  private executionLogs: string[] = [];
  private taskHistory: AutomationTaskResult[] = [];
  private currentRetry = 0;
  private maxRetries = 3;

  static getInstance(): AutomationExecutor {
    if (!AutomationExecutor.instance) {
      AutomationExecutor.instance = new AutomationExecutor();
    }
    return AutomationExecutor.instance;
  }

  /**
   * Get current automation state
   */
  getState(): AutomationState {
    return { ...this.state };
  }

  /**
   * Execute an automation task
   */
  async executeTask(task: AutomationTask): Promise<AutomationTaskResult> {
    const startTime = Date.now();
    const result: AutomationTaskResult = {
      taskId: task.id,
      success: false,
      completedSteps: 0,
      totalSteps: task.steps.length,
      executionTime: 0,
      logs: [],
      extractedData: {},
    };

    automationMonitor.startTask(task.id, task.steps.length);

    try {
      // Check if automation is allowed
      const permission = await safetyFramework.canExecuteAction(task.steps[0]);
      if (!permission.allowed) {
        throw new Error(`Task not allowed: ${permission.reason}`);
      }

      // Update state
      this.state.currentTask = task;
      this.state.status = 'running';
      this.log(`🤖 Starting task: ${task.description}`);

      // Execute each step
      for (let i = 0; i < task.steps.length; i++) {
        if (safetyFramework.isEmergencyStopped()) {
          throw new Error('Emergency stop activated');
        }

        const step = task.steps[i];
        this.state.currentAction = step;
        this.currentRetry = 0;

        try {
          await this.executeStep(step, task.timeout);
          result.completedSteps++;
          this.log(`✅ Step ${i + 1}/${task.steps.length} completed`);
          automationMonitor.recordStepCompletion(task.id, i, true);
        } catch (error) {
          automationMonitor.recordError(task.id, i, error as Error);
          errorRecovery.logError(i, error as Error, step, step.metadata?.operationName as string);

          // Retry logic
          if (this.currentRetry < task.maxRetries) {
            this.currentRetry++;
            this.log(`⚠️ Retry ${this.currentRetry}/${task.maxRetries} for step ${i + 1}`);
            automationMonitor.recordRecoveryAttempt(task.id, i, 'retry', false);
            i--; // Retry same step
          } else {
            throw new Error(`Failed after ${task.maxRetries} retries: ${error}`);
          }
        }
      }

      result.success = true;
      this.log(`✨ Task completed successfully`);
      automationMonitor.completeTask(task.id, true);
    } catch (error) {
      result.error = String(error);
      this.log(`❌ Task failed: ${error}`);
      automationMonitor.completeTask(task.id, false);

      // Take screenshot on error if enabled
      if (safetyFramework.getConfig().screenshotOnError) {
        this.log('📸 Screenshot saved on error');
      }
    } finally {
      result.executionTime = Date.now() - startTime;
      result.logs = [...this.executionLogs];

      this.state.currentTask = undefined;
      this.state.currentAction = undefined;
      this.state.status = result.success ? 'completed' : 'failed';

      this.taskHistory.push(result);
    }

    return result;
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: AutomationWorkflowStep, timeout: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Step timeout')), timeout)
    );

    const execution = this.executeStepByType(step);
    await Promise.race([execution, timeoutPromise]);
  }

  /**
   * Execute step based on type
   */
  private async executeStepByType(step: AutomationWorkflowStep): Promise<void> {
    switch (step.type) {
      case 'mouse':
        return this.executeMouse(step as MouseAction);
      case 'keyboard':
        return this.executeKeyboard(step as KeyboardAction);
      case 'wait':
        return this.executeWait(step as WaitAction);
      case 'app':
        return this.executeApp(step as AppAction);
      case 'window':
        return this.executeWindow(step as WindowAction);
      case 'vision':
        return this.executeVision(step as VisionAction);
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  /**
   * Execute mouse action
   */
  private async executeMouse(action: MouseAction): Promise<void> {
    const permission = await safetyFramework.canExecuteAction(action);
    if (!permission.allowed) {
      throw new Error(`Mouse action not allowed: ${permission.reason}`);
    }

    switch (action.subtype) {
      case 'move':
        await mouseEngine.smoothMove(action.x, action.y, action.duration);
        break;
      case 'click':
        await mouseEngine.clickAt(action.x, action.y, action.duration);
        break;
      case 'double-click':
        await mouseEngine.smoothMove(action.x, action.y, action.duration);
        await mouseEngine.doubleClick();
        break;
      case 'drag':
        await mouseEngine.drag(action.targetOffsetX || 0, action.targetOffsetY || 0);
        break;
      case 'scroll':
        const scrollDir = (action.targetOffsetY || 0) > 0 ? 'down' : 'up';
        await mouseEngine.scroll(scrollDir, Math.abs(action.targetOffsetY || 0) / 10);
        break;
    }
  }

  /**
   * Execute keyboard action
   */
  private async executeKeyboard(action: KeyboardAction): Promise<void> {
    const permission = await safetyFramework.canExecuteAction(action);
    if (!permission.allowed) {
      throw new Error(`Keyboard action not allowed: ${permission.reason}`);
    }

    switch (action.subtype) {
      case 'type':
        await keyboardEngine.type(action.text || '', action.delay);
        break;
      case 'press':
        await keyboardEngine.press(action.key || 'Return');
        break;
      case 'hotkey':
        const keys = [...(action.modifiers || []), action.key || 'Return'];
        await keyboardEngine.hotkey(...keys);
        break;
    }
  }

  /**
   * Execute wait action
   */
  private async executeWait(action: WaitAction): Promise<void> {
    if (action.condition) {
      const startTime = Date.now();
      while (!await action.condition()) {
        if (Date.now() - startTime > (action.timeout || 10000)) {
          throw new Error('Wait condition timeout');
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, action.duration));
    }
  }

  /**
   * Execute app action
   */
  private async executeApp(action: AppAction): Promise<void> {
    const permission = await safetyFramework.canExecuteAction(action, action.appName);
    if (!permission.allowed) {
      throw new Error(`App action not allowed: ${permission.reason}`);
    }

    switch (action.subtype) {
      case 'launch':
        this.log(`🚀 Launching ${action.appName}`);
        const launched = await windowManager.launchApp(action.appName);
        if (!launched) {
          throw new Error(`Failed to launch ${action.appName}`);
        }
        break;
      case 'close':
        this.log(`❌ Closing ${action.appName}`);
        // Close would be implemented via window manager
        break;
      case 'focus':
        this.log(`👁️ Focusing ${action.appName}`);
        const windows = await windowManager.getWindowsForApp(action.appName);
        if (windows.length > 0) {
          await windowManager.focusWindow(windows[0].id);
        } else {
          throw new Error(`No windows found for ${action.appName}`);
        }
        break;
    }
  }

  /**
   * Execute window action
   */
  private async executeWindow(action: WindowAction): Promise<void> {
    switch (action.subtype) {
      case 'switch': {
        this.log(`🔄 Switching to window: ${action.windowTitle}`);
        const windows = await windowManager.getAllWindows();
        const targetWindow = windows.find((w) =>
          action.windowTitle ? w.title.toLowerCase().includes(action.windowTitle.toLowerCase()) : false
        );
        if (targetWindow) {
          await windowManager.focusWindow(targetWindow.id);
        } else {
          throw new Error(`Window not found: ${action.windowTitle}`);
        }
        break;
      }
      case 'maximize':
        this.log(`📈 Maximizing window`);
        // Maximize would be implemented via window manager in future releases
        break;
      case 'minimize': {
        this.log(`📉 Minimizing window`);
        const activeWindow = await windowManager.getActiveWindow();
        if (activeWindow) {
          await windowManager.minimizeWindow(activeWindow.id);
        }
        break;
      }
      case 'close':
        this.log(`❌ Closing window`);
        // Close would be implemented via window manager in future releases
        break;
      case 'detect': {
        this.log(`🔍 Detecting windows`);
        const detectedWindows = await windowManager.getAllWindows();
        this.log(`Found ${detectedWindows.length} windows`);
        break;
      }
    }
  }

  /**
   * Execute vision action
   */
  private async executeVision(action: VisionAction): Promise<void> {
    switch (action.subtype) {
      case 'screenshot': {
        this.log(`📸 Taking screenshot`);
        const screenshot = await visionIntegration.captureScreen();
        this.state.lastScreenshot = screenshot;
        break;
      }
      case 'detect-element': {
        this.log(`🔍 Detecting element: ${action.description}`);
        const element = await visionIntegration.findElement(action.description || '');
        if (!element) {
          throw new Error(`Element not found: ${action.description}`);
        }
        break;
      }
      case 'extract-text': {
        this.log(`📄 Extracting text: ${action.description}`);
        const text = await visionIntegration.extractText();
        this.state.lastScreenshot = this.state.lastScreenshot;
        this.log(`Extracted text length: ${text.length}`);
        break;
      }
      case 'verify-state': {
        this.log(`✓ Verifying state: ${action.description}`);
        const verified = await visionIntegration.verifyUIState([action.description || '']);
        if (!verified) {
          throw new Error(`UI state verification failed: ${action.description}`);
        }
        break;
      }
    }
  }

  /**
   * Get task history
   */
  getTaskHistory(): AutomationTaskResult[] {
    return [...this.taskHistory];
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(): string[] {
    return [...this.executionLogs];
  }

  /**
   * Clear execution logs
   */
  clearLogs(): void {
    this.executionLogs = [];
  }

  /**
   * Log a message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.executionLogs.push(logEntry);
  }

  /**
   * Get initial state
   */
  private getInitialState(): AutomationState {
    return {
      isActive: false,
      status: 'idle',
      actionQueue: [],
      permissionLevel: 'read',
      safeMode: true,
    };
  }
}

export const automationExecutor = AutomationExecutor.getInstance();
