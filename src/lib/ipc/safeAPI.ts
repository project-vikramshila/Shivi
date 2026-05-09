/**
 * Safe Shivi API Utility
 * Provides type-safe access to IPC APIs with fallback and error handling
 */

type APIReturnType = Promise<any>;

export class SafeShiviAPI {
  private static instance: SafeShiviAPI;
  private apiCache = new Map<string, { value: any; timestamp: number }>();
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes
  private errorLog: Array<{ error: string; timestamp: Date; stack?: string }> = [];
  private maxLogSize = 100;

  static getInstance(): SafeShiviAPI {
    if (!SafeShiviAPI.instance) {
      SafeShiviAPI.instance = new SafeShiviAPI();
    }
    return SafeShiviAPI.instance;
  }

  /**
   * Safely call an API method with fallback and error handling
   */
  async call<T = any>(
    apiPath: string,
    args: any[] = [],
    fallback?: T
  ): Promise<T> {
    try {
      // Check if API is available
      if (!this.isAPIAvailable()) {
        this.logError(`API not available at ${apiPath}`);
        return fallback !== undefined ? fallback : ({} as T);
      }

      // Check cache
      const cached = this.getFromCache<T>(apiPath);
      if (cached) return cached;

      // Get the API method
      const method = this.getAPIMethod(apiPath);
      if (!method) {
        this.logError(`Method not found: ${apiPath}`);
        return fallback !== undefined ? fallback : ({} as T);
      }

      // Call the method
      const result = await method(...args);

      // Cache the result
      this.setCache(apiPath, result);

      return result as T;
    } catch (error) {
      this.logError(`API call failed: ${apiPath}`, error);
      return fallback !== undefined ? fallback : ({} as T);
    }
  }

  /**
   * Safely listen to API events
   */
  onEvent(
    apiPath: string,
    callback: (data: any) => void,
    fallback?: () => void
  ): void {
    try {
      if (!this.isAPIAvailable()) {
        this.logError(`Event API not available at ${apiPath}`);
        fallback?.();
        return;
      }

      if ((window as any).shiviApi?.voice?.on && apiPath.startsWith('voice:')) {
        (window as any).shiviApi.voice.on(apiPath.replace('voice:', ''), callback);
      } else if ((window as any).shiviApi?.onEvent) {
        (window as any).shiviApi.onEvent(apiPath, callback);
      } else {
        this.logError(`Event listener not found: ${apiPath}`);
        fallback?.();
      }
    } catch (error) {
      this.logError(`Event subscription failed: ${apiPath}`, error);
      fallback?.();
    }
  }

  /**
   * Check if the IPC API bridge is available
   */
  isAPIAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).shiviApi;
  }

  /**
   * Get a nested API method from the API object
   */
  private getAPIMethod(path: string): ((...args: any[]) => APIReturnType) | null {
    try {
      const parts = path.split('.');
      let obj: any = (window as any).shiviApi;

      for (const part of parts) {
        if (!obj || typeof obj !== 'object') {
          return null;
        }
        obj = obj[part];
      }

      return typeof obj === 'function' ? obj.bind((window as any).shiviApi) : null;
    } catch {
      return null;
    }
  }

  /**
   * Reminder API helpers
   */
  reminder = {
    create: async (payload: any, fallback?: any) =>
      this.call('reminder.createReminder', [payload], fallback),
    update: async (id: string, updates: any, fallback?: any) =>
      this.call('reminder.updateReminder', [id, updates], fallback),
    delete: async (id: string, fallback?: any) =>
      this.call('reminder.deleteReminder', [id], fallback),
    get: async (id: string, fallback?: any) =>
      this.call('reminder.getReminder', [id], fallback),
    query: async (query: any, fallback?: any) =>
      this.call('reminder.queryReminders', [query], fallback),
    getStats: async (userId: string, fallback?: any) =>
      this.call('reminder.getReminderStats', [userId], fallback),
    processConversation: async (userId: string, conversationId: string, text: string, fallback?: any) =>
      this.call('reminder.processConversationForReminders', [userId, conversationId, text], fallback || []),
    getSyncStatus: async (userId: string, fallback?: any) =>
      this.call('reminder.getSyncStatus', [userId], fallback),
  };

  /**
   * Automation API helpers
   */
  automation = {
    planTask: async (request: string, fallback?: any) =>
      this.call('automation.planTask', [request], fallback),
    executeTask: async (task: any, fallback?: any) =>
      this.call('automation.executeTask', [task], fallback),
    getStatus: async (fallback?: any) =>
      this.call('automation.getStatus', [], fallback),
    getTaskHistory: async (fallback?: any) =>
      this.call('automation.getTaskHistory', [], fallback || { history: [] }),
  };

  /**
   * Voice API helpers
   */
  voice = {
    initialize: async (fallback?: any) =>
      this.call('voice.initialize', [], fallback),
    startListening: async (fallback?: any) =>
      this.call('voice.startListening', [], fallback),
    stopListening: async (fallback?: any) =>
      this.call('voice.stopListening', [], fallback),
    speak: async (options: any, fallback?: any) =>
      this.call('voice.speak', [options], fallback),
    getStatus: async (fallback?: any) =>
      this.call('voice.getUIState', [], fallback),
  };

  /**
   * Memory API helpers
   */
  memory = {
    enqueueSync: async (item: any, fallback?: any) =>
      this.call('enqueueSync', [item], fallback),
    getSyncStatus: async (fallback?: any) =>
      this.call('getSyncStatus', [], fallback),
  };

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      return cached.value as T;
    }
    this.apiCache.delete(key);
    return null;
  }

  private setCache(key: string, value: any): void {
    this.apiCache.set(key, { value, timestamp: Date.now() });
  }

  clearCache(): void {
    this.apiCache.clear();
  }

  /**
   * Error logging
   */
  private logError(message: string, error?: any): void {
    const errorEntry = {
      error: message + (error ? `: ${String(error)}` : ''),
      timestamp: new Date(),
      stack: error?.stack,
    };
    this.errorLog.push(errorEntry);

    // Limit error log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in debug mode
    if (process.env.DEBUG_WEBPACK === 'true' || process.env.NODE_ENV === 'development') {
      console.warn('[ShiviAPI]', message, error);
    }
  }

  getErrorLog(): Array<{ error: string; timestamp: Date }> {
    return this.errorLog.map(({ error, timestamp }) => ({ error, timestamp }));
  }
}

export const safeApi = SafeShiviAPI.getInstance();
