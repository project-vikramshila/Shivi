// Centralized IPC channel names for Shivi
export const IPC_CHANNELS = {
  CORE: {
    GET_VERSION: 'core:get-version',
  },
  AI: {
    GET_GEMINI_KEY: 'ai:get-gemini-api-key',
    HAS_KEY: 'ai:has-key',
    ENHANCE_RESPONSE: 'ai:enhance-response',
  },
  MEMORY: {
    ENQUEUE_SYNC: 'memory:enqueue-sync',
    FORCE_SYNC: 'memory:force-sync',
    GET_SYNC_STATUS: 'memory:get-sync-status',
  },
  REMINDER: {
    CREATE: 'reminder:create',
    UPDATE: 'reminder:update',
    DELETE: 'reminder:delete',
    GET: 'reminder:get',
    QUERY: 'reminder:query',
    GET_STATS: 'reminder:get-stats',
    COMPLETE: 'reminder:complete',
    SNOOZE: 'reminder:snooze',
    PROCESS_CONVERSATION: 'reminder:process-conversation',
    GENERATE_CALENDAR_AUTH_URL: 'reminder:generate-calendar-auth-url',
    EXCHANGE_CALENDAR_CODE: 'reminder:exchange-calendar-code',
    GET_SYNC_STATUS: 'reminder:get-sync-status',
    SYNC_EVENTS: 'reminder:sync-events',
    SYNC_REMINDER_TO_CALENDAR: 'reminder:sync-reminder-to-calendar',
    GET_CALENDARS: 'reminder:get-calendars',
    GET_CALENDAR_EVENTS: 'reminder:get-calendar-events',
    DISCONNECT_CALENDAR: 'reminder:disconnect-calendar',
    SHOW_NOTIFICATION: 'reminder:show-notification',
    START_SCHEDULER: 'reminder:start-scheduler',
    STOP_SCHEDULER: 'reminder:stop-scheduler',
  },
  AUTOMATION: {
    ENABLE: 'automation:enable',
    DISABLE: 'automation:disable',
    EMERGENCY_STOP: 'automation:emergency-stop',
    GRANT_PERMISSION: 'automation:grant-permission',
    REVOKE_PERMISSION: 'automation:revoke-permission',
    GET_LOGS: 'automation:get-logs',
    CLEAR_LOGS: 'automation:clear-logs',
    GET_STATUS: 'automation:get-status',
    GET_CONFIG: 'automation:get-config',
    UPDATE_CONFIG: 'automation:update-config',
    PLAN_TASK: 'automation:plan-task',
    EXECUTE_TASK: 'automation:execute-task',
  },
  VOICE: {
    INITIALIZE: 'voice:initialize',
    START_LISTENING: 'voice:start-listening',
    STOP_LISTENING: 'voice:stop-listening',
    SPEAK: 'voice:speak',
    STOP_SPEAKING: 'voice:stop-speaking',
    UPDATE_CONFIG: 'voice:update-config',
    GET_CONFIG: 'voice:get-config',
    GET_UI_STATE: 'voice:get-ui-state',
    GET_CONVERSATION_CONTEXT: 'voice:get-conversation-context',
    GET_CONVERSATION_HISTORY: 'voice:get-conversation-history',
    SAVE_CONVERSATION: 'voice:save-conversation',
    CLEAR_STORED_DATA: 'voice:clear-stored-data',
    ENABLE_PRIVACY_MODE: 'voice:enable-privacy-mode',
    DISABLE_PRIVACY_MODE: 'voice:disable-privacy-mode',
  },
  OS: {
    GET_STATUS: 'os:get-status',
  },
  PLUGIN: {
    LIST: 'plugin:list',
    ENABLE: 'plugin:enable',
    DISABLE: 'plugin:disable',
    GET: 'plugin:get',
  },
  WORKFLOW: {
    LIST: 'workflow:list',
    EXECUTE: 'workflow:execute',
  },
  SKILL: {
    LIST: 'skill:list',
    EXECUTE: 'skill:execute',
  },
  EVENT: {
    PUBLISH: 'event:publish',
    SUBSCRIBE: 'event:subscribe',
    UNSUBSCRIBE: 'event:unsubscribe',
  },
  AGENT: {
    CREATE_GOAL: 'agent:create-goal',
    LIST_GOALS: 'agent:list-goals',
    EXECUTE_GOAL: 'agent:execute-goal',
    LIST_ACTIVE_WORKFLOWS: 'agent:list-active-workflows',
    PAUSE_WORKFLOW: 'agent:pause-workflow',
    RESUME_WORKFLOW: 'agent:resume-workflow',
    CANCEL_WORKFLOW: 'agent:cancel-workflow',
  }
} as const;

export type IPCChannels = typeof IPC_CHANNELS;
// Centralized IPC channel names
export const IPC = {
  CORE: {
    GET_VERSION: 'core:get-version',
  },
  AI: {
    PROCESS_MESSAGE: 'ai:process-message',
    // do NOT expose API key to renderer
  },
  REMINDER: {
    CREATE: 'reminder:create',
    UPDATE: 'reminder:update',
    DELETE: 'reminder:delete',
    GET: 'reminder:get',
    QUERY: 'reminder:query',
    GET_STATS: 'reminder:get-stats',
    COMPLETE: 'reminder:complete',
    SNOOZE: 'reminder:snooze',
    PROCESS_CONVERSATION: 'reminder:process-conversation',
    GENERATE_CALENDAR_AUTH_URL: 'reminder:generate-calendar-auth-url',
    EXCHANGE_CALENDAR_CODE: 'reminder:exchange-calendar-code',
    GET_SYNC_STATUS: 'reminder:get-sync-status',
    SYNC_EVENTS: 'reminder:sync-events',
    SYNC_REMINDER_TO_CALENDAR: 'reminder:sync-reminder-to-calendar',
    GET_CALENDARS: 'reminder:get-calendars',
    GET_CALENDAR_EVENTS: 'reminder:get-calendar-events',
    DISCONNECT_CALENDAR: 'reminder:disconnect-calendar',
    SHOW_NOTIFICATION: 'reminder:show-notification',
    START_SCHEDULER: 'reminder:start-scheduler',
    STOP_SCHEDULER: 'reminder:stop-scheduler'
  },
  AUTOMATION: {
    ENABLE: 'automation:enable',
    DISABLE: 'automation:disable',
    EMERGENCY_STOP: 'automation:emergency-stop',
    GRANT_PERMISSION: 'automation:grant-permission',
    REVOKE_PERMISSION: 'automation:revoke-permission',
    GET_LOGS: 'automation:get-logs',
    CLEAR_LOGS: 'automation:clear-logs',
    GET_STATUS: 'automation:get-status',
    GET_CONFIG: 'automation:get-config',
    UPDATE_CONFIG: 'automation:update-config',
    PLAN_TASK: 'automation:plan-task',
    EXECUTE_TASK: 'automation:execute-task',
    GET_TASK_HISTORY: 'automation:get-task-history'
  },
  VOICE: {
    INITIALIZE: 'voice:initialize',
    START_LISTENING: 'voice:start-listening',
    STOP_LISTENING: 'voice:stop-listening',
    SPEAK: 'voice:speak',
    STOP_SPEAKING: 'voice:stop-speaking',
    UPDATE_CONFIG: 'voice:update-config',
    GET_CONFIG: 'voice:get-config',
    GET_UI_STATE: 'voice:get-ui-state',
    GET_CONVERSATION_CONTEXT: 'voice:get-conversation-context',
    GET_CONVERSATION_HISTORY: 'voice:get-conversation-history',
    SAVE_CONVERSATION: 'voice:save-conversation',
    CLEAR_STORED_DATA: 'voice:clear-stored-data',
    ENABLE_PRIVACY_MODE: 'voice:enable-privacy-mode',
    DISABLE_PRIVACY_MODE: 'voice:disable-privacy-mode'
  },
  OS: {
    GET_STATUS: 'os:get-status',
  },
  PLUGIN: {
    LIST: 'plugin:list',
    ENABLE: 'plugin:enable',
    DISABLE: 'plugin:disable',
    GET: 'plugin:get',
  },
  WORKFLOW: {
    LIST: 'workflow:list',
    EXECUTE: 'workflow:execute',
  },
  SKILL: {
    LIST: 'skill:list',
    EXECUTE: 'skill:execute',
  },
  EVENT: {
    PUBLISH: 'event:publish',
    SUBSCRIBE: 'event:subscribe',
    UNSUBSCRIBE: 'event:unsubscribe',
  },
  AGENT: {
    CREATE_GOAL: 'agent:create-goal',
    LIST_GOALS: 'agent:list-goals',
    EXECUTE_GOAL: 'agent:execute-goal',
    LIST_ACTIVE_WORKFLOWS: 'agent:list-active-workflows',
    PAUSE_WORKFLOW: 'agent:pause-workflow',
    RESUME_WORKFLOW: 'agent:resume-workflow',
    CANCEL_WORKFLOW: 'agent:cancel-workflow',
  }
} as const;

export type IPCRendererChannels = typeof IPC;
