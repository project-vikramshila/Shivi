/**
 * Electron Shivi API Type Definitions
 * Provides type safety for IPC-exposed APIs
 */

// Reminder types
interface ReminderPayload {
  title: string;
  description?: string;
  time?: Date | string;
  date?: Date | string;
  repeat?: string;
  userId: string;
  tags?: string[];
}

interface ReminderDates {
  id: string;
  title: string;
  description?: string;
  time: Date;
  completed: boolean;
  [key: string]: any;
}

interface ReminderQueryResult {
  reminders: ReminderDates[];
  total: number;
}

interface ReminderStats {
  total: number;
  completed: number;
  pending: number;
  [key: string]: any;
}

interface SyncStatus {
  syncing: boolean;
  lastSync?: Date;
  status: string;
  [key: string]: any;
}

// Automation types
interface AutomationAction {
  type: string;
  subtype: string;
  [key: string]: any;
}

interface AutomationConfig {
  enabled: boolean;
  [key: string]: any;
}

interface AutomationTask {
  id: string;
  description: string;
  steps: AutomationAction[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  [key: string]: any;
}

interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  [key: string]: any;
}

// Voice types
interface VoiceConfig {
  enabled: boolean;
  language: string;
  wakeWords: string[];
  [key: string]: any;
}

interface VoiceUIState {
  isListening: boolean;
  isSpeaking: boolean;
  [key: string]: any;
}

interface ConversationContext {
  id: string;
  [key: string]: any;
}

// Memory types
interface MemorySyncItem {
  type: string;
  content: any;
  timestamp: number;
}

interface SyncStatusResponse {
  syncing: boolean;
  lastSync?: number;
  queueSize: number;
  [key: string]: any;
}

// Notification
interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  [key: string]: any;
}

// Shivi API interface
interface ShiviAPI {
  // Core
  getVersion: () => Promise<string>;
  sendEvent: (channel: string, data: any) => void;
  onEvent: (channel: string, callback: (event: any, data: any) => void) => void;

  // Memory
  enqueueSync: (item: MemorySyncItem) => Promise<{ success: boolean; error?: string }>;
  forceSync: () => Promise<{ success: boolean; error?: string }>;
  getSyncStatus: () => Promise<SyncStatusResponse>;

  // AI
  getGeminiApiKey: () => Promise<string | null>;

  // Notifications
  showNotification: (options: NotificationOptions) => Promise<{ success: boolean }>;

  // Reminders
  reminder: {
    createReminder: (payload: ReminderPayload) => Promise<ReminderDates>;
    updateReminder: (id: string, updates: Partial<ReminderPayload>) => Promise<ReminderDates>;
    deleteReminder: (id: string) => Promise<{ success: boolean }>;
    getReminder: (id: string) => Promise<ReminderDates | null>;
    queryReminders: (query: any) => Promise<ReminderQueryResult>;
    getReminderStats: (userId: string) => Promise<ReminderStats>;
    completeReminder: (id: string) => Promise<{ success: boolean }>;
    snoozeReminder: (id: string, snoozeUntil: Date) => Promise<{ success: boolean }>;
    processConversationForReminders: (userId: string, conversationId: string, text: string) => Promise<ReminderDates[]>;
    generateCalendarAuthUrl: () => Promise<string>;
    exchangeCalendarCode: (userId: string, code: string) => Promise<{ success: boolean }>;
    getSyncStatus: (userId: string) => Promise<SyncStatus>;
    syncEvents: (userId: string) => Promise<{ success: boolean }>;
    syncReminderToCalendar: (userId: string, reminderId: string) => Promise<{ success: boolean }>;
    getCalendars: (userId: string) => Promise<any[]>;
    getCalendarEvents: (userId: string, days: number) => Promise<any[]>;
    disconnectCalendar: (userId: string) => Promise<{ success: boolean }>;
    showNotification: (options: NotificationOptions) => Promise<{ success: boolean }>;
    startScheduler: () => Promise<{ success: boolean }>;
    stopScheduler: () => Promise<{ success: boolean }>;
  };

  // Automation
  automation: {
    enable: () => Promise<{ success: boolean }>;
    disable: () => Promise<{ success: boolean }>;
    emergencyStop: () => Promise<{ success: boolean }>;
    grantPermission: (appName: string, level: string) => Promise<{ success: boolean }>;
    revokePermission: (appName: string) => Promise<{ success: boolean }>;
    getLogs: () => Promise<string[]>;
    clearLogs: () => Promise<{ success: boolean }>;
    getStatus: () => Promise<any>;
    getConfig: () => Promise<AutomationConfig>;
    updateConfig: (config: Partial<AutomationConfig>) => Promise<{ success: boolean }>;
    planTask: (request: string) => Promise<{ success: boolean; plan?: AutomationTask }>;
    executeTask: (task: AutomationTask) => Promise<TaskResult>;
    getTaskHistory: () => Promise<{ success: boolean; history: TaskResult[] }>;
  };

  // Voice
  voice: {
    initialize: () => Promise<{ success: boolean }>;
    startListening: () => Promise<{ success: boolean }>;
    stopListening: () => Promise<{ success: boolean }>;
    speak: (options: any) => Promise<{ success: boolean }>;
    stopSpeaking: () => Promise<{ success: boolean }>;
    updateConfig: (config: Partial<VoiceConfig>) => Promise<{ success: boolean }>;
    getConfig: () => Promise<VoiceConfig>;
    getUIState: () => Promise<VoiceUIState>;
    getConversationContext: () => Promise<ConversationContext>;
    getConversationHistory: (limit?: number) => Promise<any[]>;
    saveConversation: (memory: any) => Promise<{ success: boolean }>;
    clearStoredData: () => Promise<{ success: boolean }>;
    enablePrivacyMode: () => Promise<{ success: boolean }>;
    disablePrivacyMode: () => Promise<{ success: boolean }>;
    emergencyStop: () => Promise<{ success: boolean }>;
    on: (event: string, callback: (data: any) => void) => void;
  };
}

declare global {
  interface Window {
    shiviApi: ShiviAPI;
  }
}

export type { ShiviAPI };
