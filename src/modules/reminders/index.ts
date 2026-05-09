// Shivi AI Reminder System - Main Exports
// Complete reminder ecosystem with emotional intelligence

import { reminderEngine } from './core/engine';
import { reminderScheduler } from './scheduler/engine';
import { reminderNotifications } from './notifications/engine';
import { googleCalendar } from './google/integration';
import { contextualReminders } from './context/engine';

// Core Engine
export { reminderEngine } from './core/engine';
export type {
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderQuery,
  ReminderStats,
  RecurrenceRule,
  ReminderSchedule,
  ReminderNotification,
  ReminderContext,
  ContextCondition,
  EmotionalStyle,
  CalendarMetadata,
  NotificationSettings,
} from './core/types';

// Scheduler
export { reminderScheduler } from './scheduler/engine';

// Notifications
export { reminderNotifications } from './notifications/engine';

// Google Calendar Integration
export { googleCalendar } from './google/integration';

// Contextual Reminders
export { contextualReminders } from './context/engine';

// UI Components
export {
  ReminderDashboard,
  QuickCreateReminder,
  GoogleCalendarConnect,
} from './ui/components';

// Utility Functions
export const createEmotionalReminder = async (
  userId: string,
  title: string,
  emotionalStyle: 'warm' | 'playful' | 'gentle' = 'warm'
) => {
  const emotionalTitles = {
    warm: `💖 ${title}`,
    playful: `😊 ${title}`,
    gentle: `🌸 ${title}`,
  };

  const emotionalDescriptions = {
    warm: 'Taking care of what matters to you 💕',
    playful: 'Just a friendly reminder! 😉',
    gentle: 'A gentle nudge in the right direction 🌟',
  };

  return reminderEngine.createReminder({
    userId,
    title: emotionalTitles[emotionalStyle],
    description: emotionalDescriptions[emotionalStyle],
    priority: 'medium',
    emotionalPreference: {
      tone: emotionalStyle,
      personality: 'caring',
      language: 'casual',
      emojis: true,
    },
  });
};

export const quickReminder = async (
  userId: string,
  text: string,
  delayMinutes: number = 15
) => {
  const dueAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  return reminderEngine.createReminder({
    userId,
    title: text,
    dueAt,
    priority: 'medium',
  });
};

// Integration helpers for chat
export const processChatForReminders = async (
  userId: string,
  conversationId: string,
  message: string
) => {
  return contextualReminders.processConversationForReminders(
    userId,
    conversationId,
    message
  );
};

// Notification helpers
export const sendEmotionalNotification = async (
  reminderId: string,
  type: 'desktop' | 'inapp' | 'voice',
  title: string,
  message: string,
  userId: string
) => {
  const settings = await reminderNotifications.getNotificationSettings(userId);
  return reminderNotifications.sendNotification(
    reminderId,
    type,
    title,
    message,
    settings
  );
};

// Calendar helpers
export const syncReminderWithCalendar = async (userId: string, reminderId: string) => {
  return googleCalendar.syncReminderToCalendar(userId, reminderId);
};

export const getCalendarEvents = async (userId: string, days: number = 7) => {
  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + days * 24 * 60 * 60 * 1000);

  return googleCalendar.getEvents(userId, 'primary', timeMin, timeMax);
};

// Scheduler helpers
export const startReminderScheduler = () => {
  reminderScheduler.start();
};

export const stopReminderScheduler = () => {
  reminderScheduler.stop();
};

// Complete reminder system initialization
export const initializeReminderSystem = () => {
  // Start the scheduler
  reminderScheduler.start();

  console.log('🔔 Shivi Reminder System initialized with emotional intelligence 💖');
};

// Cleanup
export const shutdownReminderSystem = () => {
  reminderScheduler.stop();
  console.log('🔔 Shivi Reminder System shut down gracefully');
};