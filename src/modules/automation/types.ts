/**
 * UI Automation Types & Interfaces
 * Core data structures for desktop automation
 */

export type AutomationPermissionLevel = 'observe' | 'read' | 'assist' | 'full';

export interface AutomationAction {
  id: string;
  type: 'mouse' | 'keyboard' | 'wait' | 'app' | 'window' | 'vision';
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface MouseAction extends AutomationAction {
  type: 'mouse';
  subtype: 'move' | 'click' | 'double-click' | 'drag' | 'scroll';
  x: number;
  y: number;
  duration?: number;
  button?: 'left' | 'right' | 'middle';
  targetOffsetX?: number;
  targetOffsetY?: number;
}

export interface KeyboardAction extends AutomationAction {
  type: 'keyboard';
  subtype: 'type' | 'press' | 'hotkey';
  text?: string;
  key?: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'cmd')[];
  delay?: number;
}

export interface WaitAction extends AutomationAction {
  type: 'wait';
  duration: number;
  condition?: () => Promise<boolean>;
  timeout?: number;
}

export interface AppAction extends AutomationAction {
  type: 'app';
  subtype: 'launch' | 'close' | 'focus';
  appName: string;
  appPath?: string;
}

export interface WindowAction extends AutomationAction {
  type: 'window';
  subtype: 'switch' | 'maximize' | 'minimize' | 'close' | 'detect';
  windowTitle?: string;
  windowId?: string;
}

export interface VisionAction extends AutomationAction {
  type: 'vision';
  subtype: 'screenshot' | 'detect-element' | 'extract-text' | 'verify-state';
  description?: string;
  confidenceThreshold?: number;
}

export type AutomationWorkflowStep = 
  | MouseAction 
  | KeyboardAction 
  | WaitAction 
  | AppAction 
  | WindowAction 
  | VisionAction;

export interface AutomationTask {
  id: string;
  description: string;
  steps: AutomationWorkflowStep[];
  maxRetries: number;
  timeout: number;
  requiredPermission: AutomationPermissionLevel;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
}

export interface AutomationTaskResult {
  taskId: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  executionTime: number;
  error?: string;
  logs: string[];
  extractedData?: any;
}

export interface AutomationState {
  isActive: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused' | 'error';
  currentTask?: AutomationTask;
  currentAction?: AutomationWorkflowStep;
  actionQueue: AutomationWorkflowStep[];
  lastScreenshot?: Buffer;
  lastError?: string;
  lastSuccessfulAction?: number;
  permissionLevel: AutomationPermissionLevel;
  safeMode: boolean;
}

export interface AutomationPermission {
  id: string;
  appName: string;
  permission: AutomationPermissionLevel;
  granted: boolean;
  grantedAt?: number;
  expiresAt?: number;
  notes?: string;
}

export interface AutomationConfig {
  enabled: boolean;
  defaultPermission: AutomationPermissionLevel;
  safeMode: boolean;
  maxConcurrentTasks: number;
  actionTimeout: number;
  mouseSmoothness: number; // 0-1, higher = smoother but slower
  keyboardDelay: number; // ms between key presses
  defaultWaitDuration: number;
  screenshotOnError: boolean;
  logAllActions: boolean;
}

export interface UIElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  ariaLabel?: string;
  parentId?: string;
  children?: UIElement[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  executionTime: number;
  stepsCompleted: number;
  totalSteps: number;
  error?: string;
  extractedData?: any;
  screenshots: string[];
}
