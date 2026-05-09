"use strict";
/**
 * Test Fixtures & Mocks
 * Mock data and services for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDatabase = exports.MockElectronApp = exports.mockIPCHandlers = exports.mockDatabaseConnections = exports.mockSecurityData = exports.mockAgentData = exports.mockAutomationData = exports.mockVoiceData = exports.mockVisionData = exports.mockMemoryData = exports.mockCalendarData = exports.mockReminderData = exports.mockLocalAIService = exports.mockGeminiService = void 0;
exports.createTestReminder = createTestReminder;
exports.createTestCalendarEvent = createTestCalendarEvent;
exports.createTestGoal = createTestGoal;
exports.createTestWorkflow = createTestWorkflow;
// Mock Gemini AI Service
exports.mockGeminiService = {
    initialize: async () => ({ success: true }),
    enhance: async (text) => `✨ ${text}`,
    generateResponse: async (prompt) => `Response to: ${prompt}`,
};
// Mock Local AI Service
exports.mockLocalAIService = {
    initialize: async () => ({ success: true }),
    generateResponse: async (prompt) => `Local: ${prompt}`,
};
// Mock Reminder Service
exports.mockReminderData = {
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
exports.mockCalendarData = {
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
exports.mockMemoryData = {
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
exports.mockVisionData = {
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
exports.mockVoiceData = {
    wakeWords: ['Shivi', 'Hey Shivi', 'Suno Shivi'],
    transcript: 'Kal ki meeting prepare karo',
    confidence: 0.95,
    language: 'hi-IN',
};
// Mock Automation Service
exports.mockAutomationData = {
    actions: [
        { type: 'click', target: 'message input', coordinates: [100, 200] },
        { type: 'type', text: 'Hello!' },
        { type: 'press', key: 'Enter' },
    ],
};
// Mock Agent System
exports.mockAgentData = {
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
exports.mockSecurityData = {
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
exports.mockDatabaseConnections = {
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
exports.mockIPCHandlers = {
    'shivi:ai:enhance': async (text) => `Enhanced: ${text}`,
    'shivi:reminder:create': async (data) => ({ id: '1', ...data }),
    'shivi:calendar:list': async () => exports.mockCalendarData.events,
    'shivi:memory:retrieve': async (query) => exports.mockMemoryData,
    'shivi:vision:screenshot': async () => exports.mockVisionData,
    'shivi:automation:execute': async (actions) => ({ success: true, actions }),
    'shivi:agent:executeGoal': async (goal) => exports.mockAgentData.workflow,
};
class MockElectronApp {
    constructor() {
        this.handlers = new Map();
    }
    registerHandler(channel, handler) {
        this.handlers.set(channel, handler);
    }
    async invoke(channel, ...args) {
        const handler = this.handlers.get(channel);
        if (!handler) {
            throw new Error(`No handler for channel: ${channel}`);
        }
        return handler(...args);
    }
    getPreload() {
        return {
            shiviAPI: {
                invoke: this.invoke.bind(this),
                on: (channel, callback) => { },
                send: (channel, data) => { },
            },
        };
    }
}
exports.MockElectronApp = MockElectronApp;
class MockDatabase {
    constructor() {
        this.data = new Map();
    }
    async connect() {
        // Mock connection
    }
    async query(sql, params = []) {
        // Mock query
        return [];
    }
    async execute(sql, params = []) {
        // Mock execute
        return { changes: 1 };
    }
}
exports.MockDatabase = MockDatabase;
// Test Data Helpers
function createTestReminder(overrides) {
    return {
        id: 'test-reminder-1',
        title: 'Test Reminder',
        description: 'Test description',
        dueDate: new Date(Date.now() + 86400000),
        isCompleted: false,
        ...overrides,
    };
}
function createTestCalendarEvent(overrides) {
    return {
        id: 'test-event-1',
        title: 'Test Event',
        start: new Date(Date.now() + 3600000),
        end: new Date(Date.now() + 5400000),
        attendees: [],
        ...overrides,
    };
}
function createTestGoal(overrides) {
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
function createTestWorkflow(overrides) {
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
