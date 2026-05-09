import { contextBridge, ipcRenderer } from 'electron';
import * as path from 'path';

const ipcChannelsPath = path.join(__dirname, '../lib/ipc/channels');
const { IPC_CHANNELS } = require(ipcChannelsPath);

// Safe invoke wrapper
const safeInvoke = async (channel: string, ...args: any[]) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    // Log error in renderer console for debugging; main process should record serious errors
    // Do NOT leak secrets here
    console.warn('[shivi-preload] ipc invoke error', channel, error);
    return null;
  }
};

const shiviAPI = {
  getVersion: async () => safeInvoke(IPC_CHANNELS.CORE.GET_VERSION),

  // Memory
  enqueueSync: async (item: any) => safeInvoke(IPC_CHANNELS.MEMORY.ENQUEUE_SYNC, item),
  forceSync: async () => safeInvoke(IPC_CHANNELS.MEMORY.FORCE_SYNC),
  getSyncStatus: async () => safeInvoke(IPC_CHANNELS.MEMORY.GET_SYNC_STATUS),

  // AI - do NOT expose API keys to renderer; only expose availability
  ai: {
    isGeminiAvailable: async () => {
      const res = await safeInvoke(IPC_CHANNELS.AI.HAS_KEY);
      return !!res;
    },
  },

  // Notifications
  showNotification: async (options: any) => safeInvoke(IPC_CHANNELS.REMINDER.SHOW_NOTIFICATION, options),

  reminder: {
    createReminder: async (payload: any) => safeInvoke(IPC_CHANNELS.REMINDER.CREATE, payload),
    updateReminder: async (id: string, updates: any) => safeInvoke(IPC_CHANNELS.REMINDER.UPDATE, id, updates),
    deleteReminder: async (id: string) => safeInvoke(IPC_CHANNELS.REMINDER.DELETE, id),
    getReminder: async (id: string) => safeInvoke(IPC_CHANNELS.REMINDER.GET, id),
    queryReminders: async (query: any) => safeInvoke(IPC_CHANNELS.REMINDER.QUERY, query),
    getReminderStats: async (userId: string) => safeInvoke(IPC_CHANNELS.REMINDER.GET_STATS, userId),
    completeReminder: async (id: string) => safeInvoke(IPC_CHANNELS.REMINDER.COMPLETE, id),
    snoozeReminder: async (id: string, snoozeUntil: string) => safeInvoke(IPC_CHANNELS.REMINDER.SNOOZE, id, snoozeUntil),
    processConversationForReminders: async (userId: string, conversationId: string, text: string) => safeInvoke(IPC_CHANNELS.REMINDER.PROCESS_CONVERSATION, userId, conversationId, text),
    generateCalendarAuthUrl: async () => safeInvoke(IPC_CHANNELS.REMINDER.GENERATE_CALENDAR_AUTH_URL),
    exchangeCalendarCode: async (userId: string, code: string) => safeInvoke(IPC_CHANNELS.REMINDER.EXCHANGE_CALENDAR_CODE, userId, code),
    getSyncStatus: async (userId: string) => safeInvoke(IPC_CHANNELS.REMINDER.GET_SYNC_STATUS, userId),
    syncEvents: async (userId: string) => safeInvoke(IPC_CHANNELS.REMINDER.SYNC_EVENTS, userId),
    syncReminderToCalendar: async (userId: string, reminderId: string) => safeInvoke(IPC_CHANNELS.REMINDER.SYNC_REMINDER_TO_CALENDAR, userId, reminderId),
    getCalendars: async (userId: string) => safeInvoke(IPC_CHANNELS.REMINDER.GET_CALENDARS, userId),
    getCalendarEvents: async (userId: string, days: number) => safeInvoke(IPC_CHANNELS.REMINDER.GET_CALENDAR_EVENTS, userId, days),
    disconnectCalendar: async (userId: string) => safeInvoke(IPC_CHANNELS.REMINDER.DISCONNECT_CALENDAR, userId),
    showNotification: async (options: any) => safeInvoke(IPC_CHANNELS.REMINDER.SHOW_NOTIFICATION, options),
    startScheduler: async () => safeInvoke(IPC_CHANNELS.REMINDER.START_SCHEDULER),
    stopScheduler: async () => safeInvoke(IPC_CHANNELS.REMINDER.STOP_SCHEDULER),
  },

  automation: {
    enable: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.ENABLE),
    disable: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.DISABLE),
    emergencyStop: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.EMERGENCY_STOP),
    grantPermission: async (appName: string, permissionLevel: string) => safeInvoke(IPC_CHANNELS.AUTOMATION.GRANT_PERMISSION, appName, permissionLevel),
    revokePermission: async (appName: string) => safeInvoke(IPC_CHANNELS.AUTOMATION.REVOKE_PERMISSION, appName),
    getLogs: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.GET_LOGS),
    clearLogs: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.CLEAR_LOGS),
    getStatus: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.GET_STATUS),
    getConfig: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.GET_CONFIG),
    updateConfig: async (updates: any) => safeInvoke(IPC_CHANNELS.AUTOMATION.UPDATE_CONFIG, updates),
    planTask: async (userRequest: string) => safeInvoke(IPC_CHANNELS.AUTOMATION.PLAN_TASK, userRequest),
    executeTask: async (task: any) => safeInvoke(IPC_CHANNELS.AUTOMATION.EXECUTE_TASK, task),
    getTaskHistory: async () => safeInvoke(IPC_CHANNELS.AUTOMATION.GET_LOGS),
  },

  voice: {
    initialize: async () => safeInvoke(IPC_CHANNELS.VOICE.INITIALIZE),
    startListening: async () => safeInvoke(IPC_CHANNELS.VOICE.START_LISTENING),
    stopListening: async () => safeInvoke(IPC_CHANNELS.VOICE.STOP_LISTENING),
    speak: async (options: any) => safeInvoke(IPC_CHANNELS.VOICE.SPEAK, options),
    stopSpeaking: async () => safeInvoke(IPC_CHANNELS.VOICE.STOP_SPEAKING),
    updateConfig: async (config: any) => safeInvoke(IPC_CHANNELS.VOICE.UPDATE_CONFIG, config),
    getConfig: async () => safeInvoke(IPC_CHANNELS.VOICE.GET_CONFIG),
    getUIState: async () => safeInvoke(IPC_CHANNELS.VOICE.GET_UI_STATE),
    getConversationContext: async () => safeInvoke(IPC_CHANNELS.VOICE.GET_CONVERSATION_CONTEXT),
    getConversationHistory: async (limit?: number) => safeInvoke(IPC_CHANNELS.VOICE.GET_CONVERSATION_HISTORY, limit),
    saveConversation: async (memory: any) => safeInvoke(IPC_CHANNELS.VOICE.SAVE_CONVERSATION, memory),
    clearStoredData: async () => safeInvoke(IPC_CHANNELS.VOICE.CLEAR_STORED_DATA),
    enablePrivacyMode: async () => safeInvoke(IPC_CHANNELS.VOICE.ENABLE_PRIVACY_MODE),
    disablePrivacyMode: async () => safeInvoke(IPC_CHANNELS.VOICE.DISABLE_PRIVACY_MODE),
    on: (event: string, callback: (data: any) => void) => {
      ipcRenderer.on(`voice:${event}`, (_evt, data) => callback(data));
    },
  },

  os: {
    getStatus: async () => safeInvoke(IPC_CHANNELS.OS.GET_STATUS),
  },

  plugins: {
    list: async () => safeInvoke(IPC_CHANNELS.PLUGIN.LIST),
    enable: async (pluginId: string) => safeInvoke(IPC_CHANNELS.PLUGIN.ENABLE, pluginId),
    disable: async (pluginId: string) => safeInvoke(IPC_CHANNELS.PLUGIN.DISABLE, pluginId),
    get: async (pluginId: string) => safeInvoke(IPC_CHANNELS.PLUGIN.GET, pluginId),
  },

  workflows: {
    list: async () => safeInvoke(IPC_CHANNELS.WORKFLOW.LIST),
    execute: async (workflowId: string) => safeInvoke(IPC_CHANNELS.WORKFLOW.EXECUTE, workflowId),
  },

  agent: {
    createGoal: async (payload: any) => safeInvoke(IPC_CHANNELS.AGENT.CREATE_GOAL, payload),
    listGoals: async () => safeInvoke(IPC_CHANNELS.AGENT.LIST_GOALS),
    executeGoal: async (goalId: string) => safeInvoke(IPC_CHANNELS.AGENT.EXECUTE_GOAL, goalId),
    listActiveWorkflows: async () => safeInvoke(IPC_CHANNELS.AGENT.LIST_ACTIVE_WORKFLOWS),
    pauseWorkflow: async (workflowId: string) => safeInvoke(IPC_CHANNELS.AGENT.PAUSE_WORKFLOW, workflowId),
    resumeWorkflow: async (workflowId: string) => safeInvoke(IPC_CHANNELS.AGENT.RESUME_WORKFLOW, workflowId),
    cancelWorkflow: async (workflowId: string) => safeInvoke(IPC_CHANNELS.AGENT.CANCEL_WORKFLOW, workflowId),
  },

  skills: {
    list: async () => safeInvoke(IPC_CHANNELS.SKILL.LIST),
    execute: async (skillId: string, input: any) => safeInvoke(IPC_CHANNELS.SKILL.EXECUTE, skillId, input),
  },

  events: {
    publish: async (eventName: string, payload: any) => safeInvoke(IPC_CHANNELS.EVENT.PUBLISH, eventName, payload),
    subscribe: async (eventName: string, callback: (payload: any) => void) => {
      const channel = `os:event:${eventName}`;
      ipcRenderer.on(channel, (_event, payload) => callback(payload));
      return safeInvoke(IPC_CHANNELS.EVENT.SUBSCRIBE, eventName);
    },
    unsubscribe: async (eventName: string) => safeInvoke(IPC_CHANNELS.EVENT.UNSUBSCRIBE, eventName),
  },
};

// Expose both old and new names for compatibility. Avoid exposing raw ipcRenderer.
contextBridge.exposeInMainWorld('shiviApi', shiviAPI);
contextBridge.exposeInMainWorld('shiviAPI', shiviAPI);

