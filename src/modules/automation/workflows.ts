import { AutomationTask, AutomationWorkflowStep, MouseAction, KeyboardAction, WaitAction, AppAction, VisionAction } from './types';

/**
 * Helper class to create properly typed automation actions with required fields
 */
class WorkflowActionFactory {
  private actionIdCounter = 0;

  createMouseAction(
    subtype: MouseAction['subtype'],
    x: number,
    y: number,
    metadata?: Record<string, any>
  ): MouseAction {
    return {
      id: `action_${++this.actionIdCounter}`,
      type: 'mouse',
      subtype,
      x,
      y,
      timestamp: Date.now(),
      status: 'pending',
      metadata: { operationName: metadata?.operationName || `Mouse ${subtype}` },
    };
  }

  createKeyboardAction(
    subtype: KeyboardAction['subtype'],
    input?: { text?: string; key?: string; modifiers?: string[] },
    metadata?: Record<string, any>
  ): KeyboardAction {
    return {
      id: `action_${++this.actionIdCounter}`,
      type: 'keyboard',
      subtype,
      text: input?.text,
      key: input?.key,
      modifiers: input?.modifiers as any,
      timestamp: Date.now(),
      status: 'pending',
      metadata: { operationName: metadata?.operationName || `Keyboard ${subtype}` },
    };
  }

  createWaitAction(duration: number, metadata?: Record<string, any>): WaitAction {
    return {
      id: `action_${++this.actionIdCounter}`,
      type: 'wait',
      duration,
      timestamp: Date.now(),
      status: 'pending',
      metadata: { operationName: metadata?.operationName || `Wait ${duration}ms` },
    };
  }

  createAppAction(
    subtype: AppAction['subtype'],
    appName: string,
    metadata?: Record<string, any>
  ): AppAction {
    return {
      id: `action_${++this.actionIdCounter}`,
      type: 'app',
      subtype,
      appName,
      timestamp: Date.now(),
      status: 'pending',
      metadata: { operationName: metadata?.operationName || `App ${subtype}` },
    };
  }

  createVisionAction(
    subtype: VisionAction['subtype'],
    metadata?: Record<string, any>
  ): VisionAction {
    return {
      id: `action_${++this.actionIdCounter}`,
      type: 'vision',
      subtype,
      timestamp: Date.now(),
      status: 'pending',
      metadata: { operationName: metadata?.operationName || `Vision ${subtype}` },
    };
  }
}

const factory = new WorkflowActionFactory();

/**
 * Workflow templates for common automation tasks
 */
export class WorkflowBuilder {
  /**
   * Build WhatsApp messaging workflow
   */
  static buildWhatsAppMessage(recipientName: string, message: string): AutomationTask {
    return {
      id: `whatsapp_msg_${Date.now()}`,
      description: `Send WhatsApp message to ${recipientName}`,
      steps: [
        factory.createAppAction('launch', 'whatsapp', { operationName: 'Launch WhatsApp' }),
        factory.createWaitAction(3000, { operationName: 'Wait for WhatsApp to load' }),
        factory.createVisionAction('screenshot', { operationName: 'Analyze WhatsApp UI' }),
        factory.createMouseAction('click', 400, 400, { operationName: 'Click search box' }),
        factory.createKeyboardAction('type', { text: recipientName }, { operationName: `Search for ${recipientName}` }),
        factory.createWaitAction(1500, { operationName: 'Wait for search results' }),
        factory.createKeyboardAction('press', { key: 'Return' }, { operationName: 'Open chat' }),
        factory.createWaitAction(2000, { operationName: 'Wait for chat to open' }),
        factory.createMouseAction('click', 400, 800, { operationName: 'Click message input' }),
        factory.createKeyboardAction('type', { text: message }, { operationName: 'Type message' }),
        factory.createKeyboardAction('hotkey', { key: 'Return', modifiers: ['ctrl'] }, { operationName: 'Send message' }),
        factory.createWaitAction(1000, { operationName: 'Wait for send' }),
      ] as AutomationWorkflowStep[],
      maxRetries: 3,
      timeout: 60000,
      requiredPermission: 'full',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build Instagram DM checking workflow
   */
  static buildCheckInstagramDMs(): AutomationTask {
    return {
      id: `instagram_check_dms_${Date.now()}`,
      description: 'Check Instagram direct messages',
      steps: [
        factory.createAppAction('launch', 'chrome', { operationName: 'Launch Chrome' }),
        factory.createWaitAction(3000, { operationName: 'Wait for load' }),
        factory.createVisionAction('screenshot', { operationName: 'Analyze page' }),
        factory.createVisionAction('extract-text', { operationName: 'Extract messages' }),
      ] as AutomationWorkflowStep[],
      maxRetries: 2,
      timeout: 30000,
      requiredPermission: 'read',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build Google Calendar event creation workflow
   */
  static buildCreateCalendarEvent(
    title: string,
    date: string,
    time: string,
    description?: string
  ): AutomationTask {
    const steps: AutomationWorkflowStep[] = [
      factory.createAppAction('launch', 'chrome', { operationName: 'Launch Google Calendar' }),
      factory.createWaitAction(3000, { operationName: 'Wait for load' }),
      factory.createMouseAction('click', 100, 100, { operationName: 'Click create' }),
      factory.createWaitAction(500, { operationName: 'Wait for form' }),
      factory.createKeyboardAction('type', { text: title }, { operationName: 'Enter title' }),
      factory.createKeyboardAction('press', { key: 'Tab' }, { operationName: 'To date field' }),
      factory.createKeyboardAction('type', { text: date }, { operationName: 'Enter date' }),
      factory.createKeyboardAction('press', { key: 'Tab' }, { operationName: 'To time field' }),
      factory.createKeyboardAction('type', { text: time }, { operationName: 'Enter time' }),
    ];

    if (description) {
      steps.push(factory.createKeyboardAction('press', { key: 'Tab' }, { operationName: 'To description' }));
      steps.push(factory.createKeyboardAction('type', { text: description }, { operationName: 'Enter description' }));
    }

    steps.push(factory.createKeyboardAction('hotkey', { key: 's', modifiers: ['ctrl'] }, { operationName: 'Save' }));
    steps.push(factory.createWaitAction(1000, { operationName: 'Wait for save' }));

    return {
      id: `calendar_event_${Date.now()}`,
      description: `Create calendar event: ${title}`,
      steps,
      maxRetries: 2,
      timeout: 45000,
      requiredPermission: 'full',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build screenshot and extract text workflow
   */
  static buildScreenshotAndExtract(): AutomationTask {
    return {
      id: `screenshot_extract_${Date.now()}`,
      description: 'Take screenshot and extract text (OCR)',
      steps: [
        factory.createVisionAction('screenshot', { operationName: 'Capture screen' }),
        factory.createVisionAction('extract-text', { operationName: 'Extract text' }),
      ] as AutomationWorkflowStep[],
      maxRetries: 1,
      timeout: 10000,
      requiredPermission: 'observe',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build browser navigation workflow
   */
  static buildNavigateBrowser(url: string, extractData = false): AutomationTask {
    const steps: AutomationWorkflowStep[] = [
      factory.createAppAction('launch', 'chrome', { operationName: 'Open URL' }),
      factory.createWaitAction(3000, { operationName: 'Wait for load' }),
      factory.createVisionAction('screenshot', { operationName: 'Analyze page' }),
    ];

    if (extractData) {
      steps.push(factory.createVisionAction('extract-text', { operationName: 'Extract text' }));
    }

    return {
      id: `browser_nav_${Date.now()}`,
      description: `Navigate to ${url}${extractData ? ' and extract data' : ''}`,
      steps,
      maxRetries: 2,
      timeout: 30000,
      requiredPermission: extractData ? 'read' : 'observe',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build file operation workflow
   */
  static buildFileOperation(operation: 'open' | 'create' | 'copy', filePath: string): AutomationTask {
    const keyMap = { open: 'o', create: 'n', copy: 'c' };

    return {
      id: `file_op_${Date.now()}`,
      description: `${operation === 'open' ? 'Open' : operation === 'create' ? 'Create' : 'Copy'} file: ${filePath}`,
      steps: [
        factory.createKeyboardAction('hotkey', { key: keyMap[operation], modifiers: ['ctrl'] }, { operationName: `${operation} command` }),
        factory.createWaitAction(500, { operationName: 'Wait for dialog' }),
        factory.createKeyboardAction('type', { text: filePath }, { operationName: 'Enter path' }),
        factory.createKeyboardAction('press', { key: 'Return' }, { operationName: 'Confirm' }),
        factory.createWaitAction(1000, { operationName: 'Wait for op' }),
      ] as AutomationWorkflowStep[],
      maxRetries: 2,
      timeout: 20000,
      requiredPermission: 'full',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Build custom workflow from steps
   */
  static buildCustomWorkflow(description: string, steps: AutomationWorkflowStep[]): AutomationTask {
    return {
      id: `custom_workflow_${Date.now()}`,
      description,
      steps,
      maxRetries: 2,
      timeout: 60000,
      requiredPermission: 'full',
      createdAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Parse user request and build matching workflow
   */
  static buildFromUserRequest(userRequest: string): AutomationTask | null {
    const lowerRequest = userRequest.toLowerCase();

    // WhatsApp workflows
    if (lowerRequest.includes('whatsapp') && lowerRequest.includes('message')) {
      const match = userRequest.match(/to\s+([^:]+):\s*(.+)/i) || userRequest.match(/send\s+message\s+to\s+([^:]+)/i);
      if (match) {
        return this.buildWhatsAppMessage(match[1], match[2] || 'Hi!');
      }
      return this.buildWhatsAppMessage('Unknown', userRequest);
    }

    // Instagram workflows
    if (lowerRequest.includes('instagram') && lowerRequest.includes('dm')) {
      return this.buildCheckInstagramDMs();
    }

    // Calendar workflows
    if (lowerRequest.includes('calendar') && lowerRequest.includes('event')) {
      return this.buildCreateCalendarEvent('New Event', 'tomorrow', '10:00 AM');
    }

    // Screenshot/extract workflows
    if (lowerRequest.includes('screenshot') || lowerRequest.includes('screen')) {
      return this.buildScreenshotAndExtract();
    }

    // Browser navigation
    if (lowerRequest.includes('open') && (lowerRequest.includes('browser') || lowerRequest.includes('website'))) {
      const match = userRequest.match(/open\s+(?:browser\s+)?(?:to\s+)?(.+)/i);
      if (match) {
        return this.buildNavigateBrowser(match[1]);
      }
    }

    return null;
  }
}

export const workflowBuilder = WorkflowBuilder;
