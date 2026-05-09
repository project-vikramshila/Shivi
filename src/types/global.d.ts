/**
 * Global window typings for Shivi API
 * Provides a typed, safe contract between preload and renderer
 */
import type { ReminderDates, ReminderQueryResult, ReminderStats, SyncStatus } from '../modules/reminders/core/types';

declare global {
  interface Window {
    shiviApi?: ShiviAPI;
    shiviAPI?: ShiviAPI; // alias for compatibility
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    serviceURI: string;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }
}

export interface NotificationOptions {
  title: string;
  body?: string;
  silent?: boolean;
}

export interface ShiviAPI {
  getVersion(): Promise<string>;
  // Memory
  enqueueSync(item: any): Promise<{ success: boolean }>;
  forceSync(): Promise<{ success: boolean }>;
  getSyncStatus(): Promise<any>;

  // AI
  ai: {
    isGeminiAvailable(): Promise<boolean>;
    enhanceResponse(localResponse: string, request: any): Promise<string | null>;
  };

  // Notifications
  showNotification(opts: NotificationOptions): Promise<{ success: boolean }>;

  reminder: {
    createReminder(payload: any): Promise<ReminderDates>;
    updateReminder(id: string, updates: any): Promise<ReminderDates>;
    deleteReminder(id: string): Promise<{ success: boolean }>;
    getReminder(id: string): Promise<ReminderDates | null>;
    queryReminders(query: any): Promise<ReminderQueryResult>;
    getReminderStats(userId: string): Promise<ReminderStats>;
    completeReminder(id: string): Promise<{ success: boolean }>;
    snoozeReminder(id: string, snoozeUntil: string): Promise<{ success: boolean }>;
    processConversationForReminders(userId: string, conversationId: string, text: string): Promise<ReminderDates[]>;
    generateCalendarAuthUrl(): Promise<string>;
    exchangeCalendarCode(userId: string, code: string): Promise<{ success: boolean }>;
    getSyncStatus(userId: string): Promise<SyncStatus>;
    syncEvents(userId: string): Promise<{ success: boolean }>;
    syncReminderToCalendar(userId: string, reminderId: string): Promise<{ success: boolean }>;
    getCalendars(userId: string): Promise<any[]>;
    getCalendarEvents(userId: string, days: number): Promise<any[]>;
    disconnectCalendar(userId: string): Promise<{ success: boolean }>;
    showNotification(opts: NotificationOptions): Promise<{ success: boolean }>;
    startScheduler(): Promise<{ success: boolean }>;
    stopScheduler(): Promise<{ success: boolean }>;
  };

  agent: {
    createGoal: (payload: any) => Promise<any>;
    listGoals: () => Promise<any[]>;
    executeGoal: (goalId: string) => Promise<any>;
    listActiveWorkflows: () => Promise<any[]>;
    pauseWorkflow: (workflowId: string) => Promise<any>;
    resumeWorkflow: (workflowId: string) => Promise<any>;
    cancelWorkflow: (workflowId: string) => Promise<any>;
  };

  automation: {
    enable(): Promise<{ success: boolean }>;
    disable(): Promise<{ success: boolean }>;
    emergencyStop(): Promise<{ success: boolean }>;
    grantPermission(appName: string, level: string): Promise<{ success: boolean }>;
    revokePermission(appName: string): Promise<{ success: boolean }>;
    getLogs(): Promise<string[]>;
    clearLogs(): Promise<{ success: boolean }>;
    getStatus(): Promise<any>;
    getConfig(): Promise<any>;
    updateConfig(updates: any): Promise<{ success: boolean }>;
    planTask(request: string): Promise<any>;
    executeTask(task: any): Promise<any>;
    getTaskHistory(): Promise<any>;
  };

  voice: {
    initialize(): Promise<{ success: boolean }>;
    startListening(): Promise<{ success: boolean }>;
    stopListening(): Promise<{ success: boolean }>;
    speak(options: any): Promise<{ success: boolean }>;
    stopSpeaking(): Promise<{ success: boolean }>;
    updateConfig(config: any): Promise<{ success: boolean }>;
    getConfig(): Promise<any>;
    getUIState(): Promise<any>;
    getConversationContext(): Promise<any>;
    getConversationHistory(limit?: number): Promise<any[]>;
    saveConversation(memory: any): Promise<{ success: boolean }>;
    clearStoredData(): Promise<{ success: boolean }>;
    enablePrivacyMode(): Promise<{ success: boolean }>;
    disablePrivacyMode(): Promise<{ success: boolean }>;
    emergencyStop(): Promise<{ success: boolean }>;
    on(event: string, callback: (data: any) => void): void;
  };

  // Web Speech API types
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

export {};
// Global window typings for secure preload bridge
import type {
  ReminderPayload,
  ReminderDates,
  ReminderQueryResult,
  ReminderStats,
  SyncStatus,
  NotificationOptions,
  AutomationTask,
  TaskResult,
  VoiceConfig,
  VoiceUIState,
  ConversationContext,
} from '../types';

declare global {
  interface Window {
    shiviApi: {
      // Core
      getVersion: () => Promise<string>;
      sendEvent: (channel: string, data: any) => void;
      onEvent: (channel: string, callback: (data: any) => void) => void;

      // Memory
      enqueueSync: (item: any) => Promise<{ success: boolean }>; 
      forceSync: () => Promise<{ success: boolean }>;
      getSyncStatus: () => Promise<any>;

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
        getConfig: () => Promise<any>;
        updateConfig: (config: any) => Promise<{ success: boolean }>;
        planTask: (request: string) => Promise<{ success: boolean; plan?: AutomationTask }>;
        executeTask: (task: AutomationTask) => Promise<TaskResult>;
        getTaskHistory: () => Promise<{ success: boolean; history: TaskResult[] }>;
      };

      agent: {
        createGoal: (payload: any) => Promise<any>;
        listGoals: () => Promise<any[]>;
        executeGoal: (goalId: string) => Promise<any>;
        listActiveWorkflows: () => Promise<any[]>;
        pauseWorkflow: (workflowId: string) => Promise<any>;
        resumeWorkflow: (workflowId: string) => Promise<any>;
        cancelWorkflow: (workflowId: string) => Promise<any>;
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
    };
  }
}

export {};
