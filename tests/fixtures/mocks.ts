/**
 * Test Fixtures & Mocks
 * Mock data and services for testing
 */

// Mock Gemini AI Service
export const mockGeminiService = {
  initialize: async () => ({ success: true }),
  enhance: async (text: string) => `✨ ${text}`,
  generateResponse: async (prompt: string) => `Response to: ${prompt}`,
};

// Mock Local AI Service
export const mockLocalAIService = {
  initialize: async () => ({ success: true }),
  generateResponse: async (prompt: string) => `Local: ${prompt}`,
};

// Mock Reminder Service
export const mockReminderData = {
  reminders: [
    {
      id: '1',
      title: 'Call Rahul',
      description: 'Kal Rahul ko call karna',
      dueDate: new Date(Date.now() + 86400000),
      isCompleted: false,
      type: 'reminder',
      context: { person: 'Rahul', action: 'call' },
    },
    {
      id: '2',
      title: 'Meeting at 10 AM',
      description: 'Team meeting tomorrow',
      dueDate: new Date(Date.now() + 86400000),
      isCompleted: false,
      recurring: 'daily',
    },
  ],
};

// Mock Calendar Service
export const mockCalendarData = {
  events: [
    {
      id: 'event-1',
      title: 'Team Standup',
      start: new Date(Date.now() + 3600000),
      end: new Date(Date.now() + 5400000),
      description: 'Daily standup',
      attendees: ['user@example.com', 'team@example.com'],
    },
    {
      id: 'event-2',
      title: 'Client Call',
      start: new Date(Date.now() + 86400000),
      end: new Date(Date.now() + 90000000),
      description: 'Q2 planning',
    },
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
};

// Mock Memory Service
export const mockMemoryData = {
  shortTerm: {
    current_context: 'User is planning their day',
    recent_items: ['meeting tomorrow', 'need to call Rahul'],
  },
  longTerm: {
    people: {
      'rahul': { name: 'Rahul', relationship: 'colleague', contact: '+91 9876543210' },
      'priya': { name: 'Priya', relationship: 'friend', contact: 'priya@email.com' },
    },
    preferences: {
      language: 'hindi',
      theme: 'dark',
      autonomy_level: 'assist',
    },
    timeline: [
      { date: '2026-05-08', event: 'Completed project submission' },
      { date: '2026-05-07', event: 'Had meeting with team' },
    ],
  },
};

// Mock Vision Service
export const mockVisionData = {
  screenshotPath: '/tmp/screenshot.png',
  ocrText: 'WhatsApp\nHi there!\nHow are you?',
  detectedObjects: ['phone', 'text messages', 'chat window'],
  unreadCount: 3,
  extractedMessages: [
    { from: 'Rahul', text: 'Hi, how are you?' },
    { from: 'Priya', text: 'See you tomorrow!' },
  ],
};

// Mock Voice Service
export const mockVoiceData = {
  wakeWords: ['Shivi', 'Hey Shivi', 'Suno Shivi'],
  transcript: 'Kal ki meeting prepare karo',
  confidence: 0.95,
  language: 'hi-IN',
};

// Mock Automation Service
export const mockAutomationData = {
  actions: [
    { type: 'click', target: 'message input', coordinates: [100, 200] },
    { type: 'type', text: 'Hello!' },
    { type: 'press', key: 'Enter' },
  ],
};

// Mock Agent System
export const mockAgentData = {
  goal: {
    id: 'goal-1',
    title: 'Prepare meeting',
    description: 'Get ready for tomorrow meeting',
    targetApps: ['calendar', 'email', 'browser'],
    priority: 1,
    status: 'pending',
  },
  workflow: {
    id: 'workflow-1',
    goalId: 'goal-1',
    title: 'Meeting Preparation',
    steps: [
      { id: '1', name: 'Get calendar', app: 'calendar', action: 'fetchContext', status: 'completed' },
      { id: '2', name: 'Get emails', app: 'email', action: 'fetchContext', status: 'running' },
      { id: '3', name: 'Create summary', app: 'core', action: 'summarize', status: 'pending' },
    ],
    status: 'running',
    currentStepIndex: 1,
  },
};

// Mock Security Data
export const mockSecurityData = {
  apiKeys: {
    gemini: 'test-key-xxx',
    calendar: 'test-calendar-key',
  },
  tokens: {
    google: 'test-token-xxx',
  },
  permissions: {
    calendar: 'granted',
    contacts: 'denied',
    microphone: 'granted',
  },
};

// Mock Database Connections
export const mockDatabaseConnections = {
  postgresql: {
    connected: true,
    latency: 15,
    status: 'healthy',
  },
  neon: {
    connected: true,
    latency: 25,
    status: 'healthy',
  },
};

// Mock IPC Handlers
export const mockIPCHandlers = {
  'shivi:ai:enhance': async (text: string) => `Enhanced: ${text}`,
  'shivi:reminder:create': async (data: any) => ({ id: '1', ...data }),
  'shivi:calendar:list': async () => mockCalendarData.events,
  'shivi:memory:retrieve': async (query: string) => mockMemoryData,
  'shivi:vision:screenshot': async () => mockVisionData,
  'shivi:automation:execute': async (actions: any[]) => ({ success: true, actions }),
  'shivi:agent:executeGoal': async (goal: any) => mockAgentData.workflow,
};

export class MockElectronApp {
  private handlers: Map<string, Function> = new Map();

  registerHandler(channel: string, handler: Function): void {
    this.handlers.set(channel, handler);
  }

  async invoke(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler for channel: ${channel}`);
    }
    return handler(...args);
  }

  getPreload(): Record<string, any> {
    return {
      shiviAPI: {
        invoke: this.invoke.bind(this),
        on: (channel: string, callback: Function) => { /* mock */ },
        send: (channel: string, data: any) => { /* mock */ },
      },
    };
  }
}

export class MockDatabase {
  private data: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    // Mock connection
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    // Mock query
    return [];
  }

  async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    // Mock execute
    return { changes: 1 };
  }
}

// Test Data Helpers
export function createTestReminder(overrides?: any) {
  return {
    id: 'test-reminder-1',
    title: 'Test Reminder',
    description: 'Test description',
    dueDate: new Date(Date.now() + 86400000),
    isCompleted: false,
    ...overrides,
  };
}

export function createTestCalendarEvent(overrides?: any) {
  return {
    id: 'test-event-1',
    title: 'Test Event',
    start: new Date(Date.now() + 3600000),
    end: new Date(Date.now() + 5400000),
    attendees: [],
    ...overrides,
  };
}

export function createTestGoal(overrides?: any) {
  return {
    id: 'test-goal-1',
    title: 'Test Goal',
    description: 'Test goal description',
    targetApps: ['calendar'],
    priority: 1,
    status: 'pending',
    ...overrides,
  };
}

export function createTestWorkflow(overrides?: any) {
  return {
    id: 'test-workflow-1',
    goalId: 'test-goal-1',
    title: 'Test Workflow',
    steps: [],
    status: 'pending',
    currentStepIndex: 0,
    checkpoints: {},
    ...overrides,
  };
}
