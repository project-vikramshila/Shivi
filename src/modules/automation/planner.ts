/**
 * Task Planner Engine
 * Converts high-level user requests into executable automation workflows
 */

import type {
  AutomationTask,
  AutomationWorkflowStep,
  MouseAction,
  KeyboardAction,
  WaitAction,
  AppAction,
  VisionAction,
} from './types';

export interface PlanningRequest {
  userRequest: string;
  context?: Record<string, any>;
  targetApp?: string;
  requiresVision?: boolean;
}

export interface AutomationPlan {
  taskId: string;
  description: string;
  steps: AutomationWorkflowStep[];
  estimatedDuration: number;
  requiredPermission: string;
  explanation: string;
  warnings: string[];
}

export class TaskPlanner {
  private static instance: TaskPlanner;
  private workflowTemplates = this.initializeTemplates();

  static getInstance(): TaskPlanner {
    if (!TaskPlanner.instance) {
      TaskPlanner.instance = new TaskPlanner();
    }
    return TaskPlanner.instance;
  }

  /**
   * Plan an automation task from a user request
   */
  async planTask(request: PlanningRequest): Promise<AutomationPlan> {
    const taskId = `task_${Date.now()}`;

    // Analyze the request
    const analysis = this.analyzeRequest(request.userRequest);

    // Get matching workflow template
    const template = this.findMatchingTemplate(analysis);

    if (!template) {
      return this.createCustomPlan(taskId, request, analysis);
    }

    // Generate steps from template
    const steps = this.generateSteps(template, analysis);

    return {
      taskId,
      description: request.userRequest,
      steps,
      estimatedDuration: this.estimateDuration(steps),
      requiredPermission: 'assist',
      explanation: `Planned ${steps.length} steps to ${analysis.action}`,
      warnings: this.identifyWarnings(steps),
    };
  }

  /**
   * Analyze the user request
   */
  private analyzeRequest(request: string): {
    action: string;
    target: string;
    parameters: Record<string, any>;
  } {
    const lowerRequest = request.toLowerCase();

    // Extract action keywords
    let action = '';
    if (lowerRequest.includes('open') || lowerRequest.includes('launch') || lowerRequest.includes('start')) {
      action = 'launch_app';
    } else if (lowerRequest.includes('whatsapp') && (lowerRequest.includes('message') || lowerRequest.includes('msg'))) {
      action = 'send_whatsapp';
    } else if (lowerRequest.includes('instagram') && (lowerRequest.includes('check') || lowerRequest.includes('message'))) {
      action = 'check_instagram';
    } else if (lowerRequest.includes('gmail') || (lowerRequest.includes('email') && lowerRequest.includes('check'))) {
      action = 'open_gmail';
    } else if (lowerRequest.includes('calendar') && (lowerRequest.includes('create') || lowerRequest.includes('event'))) {
      action = 'create_calendar_event';
    } else if (lowerRequest.includes('search') || lowerRequest.includes('google')) {
      action = 'search_web';
    } else if (lowerRequest.includes('file') || lowerRequest.includes('explorer') || lowerRequest.includes('folder')) {
      action = 'open_file_explorer';
    } else if (lowerRequest.includes('copy') || lowerRequest.includes('paste')) {
      action = 'copy_paste_text';
    } else if (lowerRequest.includes('type') || lowerRequest.includes('write') || lowerRequest.includes('enter')) {
      action = 'type_text';
    } else if (lowerRequest.includes('screenshot') || lowerRequest.includes('capture')) {
      action = 'take_screenshot';
    } else {
      action = 'generic_interaction';
    }

    return {
      action,
      target: this.extractTarget(request),
      parameters: this.extractParameters(request),
    };
  }

  /**
   * Find matching workflow template
   */
  private findMatchingTemplate(analysis: any): any {
    return this.workflowTemplates[analysis.action];
  }

  /**
   * Generate workflow steps from template
   */
  private generateSteps(template: any, analysis: any): AutomationWorkflowStep[] {
    const steps: AutomationWorkflowStep[] = [];

    for (const step of template.steps) {
      const generatedStep = this.instantiateStep(step, analysis);
      if (generatedStep) {
        steps.push(generatedStep);
      }
    }

    return steps;
  }

  /**
   * Instantiate a step template with actual values
   */
  private instantiateStep(template: any, analysis: any): AutomationWorkflowStep | null {
    const step: any = JSON.parse(JSON.stringify(template));

    // Replace placeholders with actual values
    if (step.type === 'keyboard' && step.text) {
      step.text = step.text.replace('{target}', analysis.target);
    }

    return step as AutomationWorkflowStep;
  }

  /**
   * Create a custom plan for unrecognized requests
   */
  private createCustomPlan(
    taskId: string,
    request: PlanningRequest,
    analysis: any
  ): AutomationPlan {
    const steps: AutomationWorkflowStep[] = [];

    // Generic fallback: Take screenshot, wait, take another screenshot
    steps.push({
      id: `step_${Date.now()}_1`,
      type: 'vision',
      subtype: 'screenshot',
      status: 'pending',
      timestamp: Date.now(),
    } as VisionAction);

    steps.push({
      id: `step_${Date.now()}_2`,
      type: 'wait',
      duration: 1000,
      status: 'pending',
      timestamp: Date.now(),
    } as WaitAction);

    return {
      taskId,
      description: request.userRequest,
      steps,
      estimatedDuration: 2000,
      requiredPermission: 'observe',
      explanation: 'Unable to plan automatically. Consider providing more specific instructions.',
      warnings: ['This is a generic plan', 'Manual verification recommended'],
    };
  }

  /**
   * Estimate total duration of workflow
   */
  private estimateDuration(steps: AutomationWorkflowStep[]): number {
    let total = 0;

    for (const step of steps) {
      if (step.type === 'wait') {
        total += (step as WaitAction).duration;
      } else if (step.type === 'mouse') {
        total += 300; // Estimated click time
      } else if (step.type === 'keyboard') {
        const keyStep = step as KeyboardAction;
        if (keyStep.subtype === 'type' && keyStep.text) {
          total += keyStep.text.length * (keyStep.delay || 50);
        } else {
          total += 100;
        }
      } else {
        total += 500; // Generic action time
      }
    }

    return total;
  }

  /**
   * Identify warnings for the plan
   */
  private identifyWarnings(steps: AutomationWorkflowStep[]): string[] {
    const warnings: string[] = [];

    if (steps.length > 20) {
      warnings.push('Complex workflow with many steps - may take some time');
    }

    const hasMouseClicks = steps.some((s) => s.type === 'mouse');
    const hasKeyboard = steps.some((s) => s.type === 'keyboard');

    if (hasMouseClicks && hasKeyboard) {
      warnings.push('Mix of mouse and keyboard - ensure proper timing');
    }

    return warnings;
  }

  /**
   * Extract target from request
   */
  private extractTarget(request: string): string {
    // Look for named entities or specific targets
    const targets = [
      'rahul', 'priya', 'mom', 'dad', 'brother', 'sister',
      'whatsapp', 'instagram', 'gmail', 'calendar', 'chrome', 'firefox', 'edge',
      'browser', 'explorer', 'files', 'documents', 'downloads',
      'meeting', 'appointment', 'reminder', 'task',
      'search', 'google', 'web',
    ];

    const lowerRequest = request.toLowerCase();

    for (const target of targets) {
      if (lowerRequest.includes(target)) {
        return target;
      }
    }

    // Extract quoted text as target
    const quotedMatch = request.match(/"([^"]+)"/) || request.match(/'([^']+)'/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Extract text after keywords
    const keywords = ['message to', 'open', 'launch', 'search for', 'type'];
    for (const keyword of keywords) {
      if (lowerRequest.includes(keyword)) {
        const parts = lowerRequest.split(keyword);
        if (parts.length > 1) {
          return parts[1].trim().split(' ')[0];
        }
      }
    }

    return 'unknown';
  }

  /**
   * Extract parameters from request
   */
  private extractParameters(request: string): Record<string, any> {
    return {
      fullRequest: request,
      timestamp: Date.now(),
    };
  }

  /**
   * Initialize workflow templates
   */
  private initializeTemplates(): Record<string, any> {
    return {
      launch_app: {
        description: 'Launch an application',
        steps: [
          {
            id: `app_launch_1`,
            type: 'app',
            subtype: 'launch',
            appName: '{target}',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `app_launch_2`,
            type: 'wait',
            duration: 2000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `app_launch_3`,
            type: 'app',
            subtype: 'focus',
            appName: '{target}',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
        ],
      },

      send_whatsapp: {
        description: 'Send a WhatsApp message to a contact',
        steps: [
          {
            id: `whatsapp_1`,
            type: 'app',
            subtype: 'launch',
            appName: 'whatsapp',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `whatsapp_2`,
            type: 'wait',
            duration: 2000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `whatsapp_3`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'f',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `whatsapp_4`,
            type: 'wait',
            duration: 500,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `whatsapp_5`,
            type: 'keyboard',
            subtype: 'type',
            text: '{target}',
            delay: 100,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `whatsapp_6`,
            type: 'wait',
            duration: 1000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `whatsapp_7`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `whatsapp_8`,
            type: 'wait',
            duration: 1000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `whatsapp_9`,
            type: 'keyboard',
            subtype: 'type',
            text: 'Hi {target}! How are you doing?',
            delay: 80,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `whatsapp_10`,
            type: 'keyboard',
            subtype: 'hotkey',
            modifiers: ['shift'],
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `whatsapp_11`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
        ],
      },

      check_instagram: {
        description: 'Check Instagram messages and notifications',
        steps: [
          {
            id: `instagram_1`,
            type: 'app',
            subtype: 'launch',
            appName: 'browser',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `instagram_2`,
            type: 'wait',
            duration: 1000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `instagram_3`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'l',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `instagram_4`,
            type: 'keyboard',
            subtype: 'type',
            text: 'https://www.instagram.com',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `instagram_5`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `instagram_6`,
            type: 'wait',
            duration: 3000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `instagram_7`,
            type: 'vision',
            subtype: 'screenshot',
            description: 'Instagram homepage loaded',
            status: 'pending',
            timestamp: 0,
          } as VisionAction,
        ],
      },

      open_gmail: {
        description: 'Open Gmail and check inbox',
        steps: [
          {
            id: `gmail_1`,
            type: 'app',
            subtype: 'launch',
            appName: 'browser',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `gmail_2`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'l',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `gmail_3`,
            type: 'keyboard',
            subtype: 'type',
            text: 'https://mail.google.com',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `gmail_4`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `gmail_5`,
            type: 'wait',
            duration: 3000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
        ],
      },

      create_calendar_event: {
        description: 'Create a new Google Calendar event',
        steps: [
          {
            id: `calendar_1`,
            type: 'app',
            subtype: 'launch',
            appName: 'browser',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `calendar_2`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'l',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `calendar_3`,
            type: 'keyboard',
            subtype: 'type',
            text: 'https://calendar.google.com',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `calendar_4`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `calendar_5`,
            type: 'wait',
            duration: 3000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `calendar_6`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'c',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
        ],
      },

      type_text: {
        description: 'Type text into active field',
        steps: [
          {
            id: `type_1`,
            type: 'wait',
            duration: 500,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `type_2`,
            type: 'keyboard',
            subtype: 'type',
            text: '{target}',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
        ],
      },

      take_screenshot: {
        description: 'Take a screenshot of current screen',
        steps: [
          {
            id: `screenshot_1`,
            type: 'vision',
            subtype: 'screenshot',
            status: 'pending',
            timestamp: 0,
          } as VisionAction,
        ],
      },

      search_web: {
        description: 'Search the web for information',
        steps: [
          {
            id: `search_1`,
            type: 'app',
            subtype: 'launch',
            appName: 'browser',
            status: 'pending',
            timestamp: 0,
          } as AppAction,
          {
            id: `search_2`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'l',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `search_3`,
            type: 'keyboard',
            subtype: 'type',
            text: 'https://www.google.com',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `search_4`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `search_5`,
            type: 'wait',
            duration: 2000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
          {
            id: `search_6`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'k',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `search_7`,
            type: 'keyboard',
            subtype: 'type',
            text: '{target}',
            delay: 50,
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `search_8`,
            type: 'keyboard',
            subtype: 'press',
            key: 'return',
            status: 'pending',
            timestamp: 0,
          } as KeyboardAction,
        ],
      },

      open_file_explorer: {
        description: 'Open file explorer and navigate to directory',
        steps: [
          {
            id: `explorer_1`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['cmd'] as const,
            key: 'e',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `explorer_2`,
            type: 'wait',
            duration: 1000,
            status: 'pending',
            timestamp: 0,
          } as WaitAction,
        ],
      },

      copy_paste_text: {
        description: 'Copy and paste text',
        steps: [
          {
            id: `copy_1`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'a',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `copy_2`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'c',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
          {
            id: `copy_3`,
            type: 'wait' as const,
            duration: 200,
            status: 'pending' as const,
            timestamp: 0,
          } as WaitAction,
          {
            id: `copy_4`,
            type: 'keyboard' as const,
            subtype: 'hotkey' as const,
            modifiers: ['ctrl'] as const,
            key: 'v',
            status: 'pending' as const,
            timestamp: 0,
          } as KeyboardAction,
        ],
      },
    };
  }
}

export const taskPlanner = TaskPlanner.getInstance();
