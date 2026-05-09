import { ipcMain, Notification } from 'electron';
import {
  reminderEngine,
  reminderScheduler,
  reminderNotifications,
  googleCalendar,
  contextualReminders,
} from '../modules/reminders/backend';

// Reminder operations
ipcMain.handle('reminder:create', async (_event, payload) => {
  return await reminderEngine.createReminder(payload);
});

ipcMain.handle('reminder:update', async (_event, id, updates) => {
  return await reminderEngine.updateReminder(id, updates);
});

ipcMain.handle('reminder:delete', async (_event, id) => {
  return await reminderEngine.deleteReminder(id);
});

ipcMain.handle('reminder:get', async (_event, id) => {
  return await reminderEngine.getReminder(id);
});

ipcMain.handle('reminder:query', async (_event, query) => {
  return await reminderEngine.queryReminders(query);
});

ipcMain.handle('reminder:get-stats', async (_event, userId) => {
  return await reminderEngine.getReminderStats(userId);
});

ipcMain.handle('reminder:complete', async (_event, id) => {
  return await reminderEngine.completeReminder(id);
});

ipcMain.handle('reminder:snooze', async (_event, id, snoozeUntil) => {
  return await reminderEngine.snoozeReminder(id, new Date(snoozeUntil));
});

ipcMain.handle('reminder:process-conversation', async (_event, userId, conversationId, text) => {
  return await contextualReminders.processConversationForReminders(userId, conversationId, text);
});

// Google Calendar operations
ipcMain.handle('reminder:generate-calendar-auth-url', async () => {
  return googleCalendar.generateAuthUrl();
});

ipcMain.handle('reminder:exchange-calendar-code', async (_event, userId, code) => {
  const tokens = await googleCalendar.exchangeCodeForTokens(code);
  await googleCalendar.saveTokens(userId, tokens);
  return { success: true };
});

ipcMain.handle('reminder:get-sync-status', async (_event, userId) => {
  return await googleCalendar.getSyncStatus(userId);
});

ipcMain.handle('reminder:sync-events', async (_event, userId) => {
  await googleCalendar.syncEventsToReminders(userId);
  return { success: true };
});

ipcMain.handle('reminder:sync-reminder-to-calendar', async (_event, userId, reminderId) => {
  await googleCalendar.syncReminderToCalendar(userId, reminderId);
  return { success: true };
});

ipcMain.handle('reminder:get-calendars', async (_event, userId) => {
  return await googleCalendar.getCalendars(userId);
});

ipcMain.handle('reminder:get-calendar-events', async (_event, userId, days) => {
  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + days * 24 * 60 * 60 * 1000);
  return await googleCalendar.getEvents(userId, 'primary', timeMin, timeMax);
});

ipcMain.handle('reminder:disconnect-calendar', async (_event, userId) => {
  await googleCalendar.disconnect(userId);
  return { success: true };
});

ipcMain.handle('reminder:show-notification', async (_event, options) => {
  try {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent,
    });
    notification.show();
    return { success: true };
  } catch (error) {
    console.error('Failed to show notification:', error);
    return { success: false, error: String(error) };
  }
});

// Scheduler management
ipcMain.handle('reminder:start-scheduler', async () => {
  reminderScheduler.start();
  return { success: true };
});

ipcMain.handle('reminder:stop-scheduler', async () => {
  reminderScheduler.stop();
  return { success: true };
});
