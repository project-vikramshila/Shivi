// Shivi AI Reminder Renderer Facade - safe browser/Electron renderer API access

import type {
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderQuery,
  ReminderStats,
  NotificationSettings,
} from '../core/types';

const invokeReminderApi = async (method: string, ...args: any[]) => {
  try {
    if (typeof window !== 'undefined' && (window as any).shiviApi?.reminder?.[method]) {
      return await (window as any).shiviApi.reminder[method](...args);
    }
    console.warn(`Reminder API unavailable in renderer: ${method}`);
    return null;
  } catch (error) {
    console.error(`Reminder API invocation failed for ${method}:`, error);
    return null;
  }
};

export const createReminder = async (request: CreateReminderRequest): Promise<Reminder | null> => {
  return await invokeReminderApi('createReminder', request);
};

export const updateReminder = async (id: string, updates: UpdateReminderRequest): Promise<Reminder | null> => {
  return (await invokeReminderApi('updateReminder', id, updates)) || null;
};

export const deleteReminder = async (id: string): Promise<void> => {
  return invokeReminderApi('deleteReminder', id);
};

export const getReminder = async (id: string): Promise<Reminder | null> => {
  return invokeReminderApi('getReminder', id);
};

export const queryReminders = async (query: ReminderQuery): Promise<Reminder[]> => {
  return (await invokeReminderApi('queryReminders', query)) || [];
};

export const getReminderStats = async (userId: string): Promise<ReminderStats> => {
  return (
    await invokeReminderApi('getReminderStats', userId)
  ) || { total: 0, active: 0, completed: 0, missed: 0, upcoming: 0, overdue: 0 };
};

export const completeReminder = async (id: string): Promise<void> => {
  return invokeReminderApi('completeReminder', id);
};

export const snoozeReminder = async (id: string, snoozeUntil: Date): Promise<void> => {
  return invokeReminderApi('snoozeReminder', id, snoozeUntil);
};

export const processConversationForReminders = async (
  userId: string,
  conversationId: string,
  text: string
): Promise<any> => {
  return invokeReminderApi('processConversationForReminders', userId, conversationId, text);
};

export const generateCalendarAuthUrl = async (): Promise<string> => {
  return (await invokeReminderApi('generateCalendarAuthUrl')) || '';
};

export const exchangeCalendarCode = async (userId: string, code: string): Promise<void> => {
  return invokeReminderApi('exchangeCalendarCode', userId, code);
};

export const getSyncStatus = async (userId: string): Promise<any> => {
  return (await invokeReminderApi('getSyncStatus', userId)) || { connected: false };
};

export const syncEvents = async (userId: string): Promise<void> => {
  return invokeReminderApi('syncEvents', userId);
};

export const syncReminderToCalendar = async (userId: string, reminderId: string): Promise<void> => {
  return invokeReminderApi('syncReminderToCalendar', userId, reminderId);
};

export const disconnectCalendar = async (userId: string): Promise<void> => {
  return invokeReminderApi('disconnectCalendar', userId);
};

export const getCalendars = async (userId: string): Promise<any[]> => {
  return (await invokeReminderApi('getCalendars', userId)) || [];
};

export const getCalendarEvents = async (userId: string, days: number = 7): Promise<any[]> => {
  return (await invokeReminderApi('getCalendarEvents', userId, days)) || [];
};
