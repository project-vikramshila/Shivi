// Shivi AI Reminder Notifications - Multi-channel Notification System
// Desktop notifications, in-app alerts, and future voice notifications

import { PrismaClient } from '@prisma/client';
import { NotificationSettings } from '../core/types';

export class ReminderNotifications {
  private prisma: PrismaClient;
  private static instance: ReminderNotifications;

  constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): ReminderNotifications {
    if (!ReminderNotifications.instance) {
      ReminderNotifications.instance = new ReminderNotifications();
    }
    return ReminderNotifications.instance;
  }

  async sendNotification(
    reminderId: string,
    type: 'desktop' | 'inapp' | 'voice',
    title: string,
    message: string,
    settings?: NotificationSettings
  ): Promise<void> {
    let notification: any = null;
    try {
      // Check if notifications are enabled
      if (settings && !this.shouldSendNotification(type, settings)) {
        return;
      }

      // Create notification record
      notification = await this.prisma.reminderNotification.create({
        data: {
          reminderId,
          notificationType: type,
          status: 'pending',
        },
      });

      // Send the actual notification
      await this.deliverNotification(type, title, message, settings);

      // Mark as sent
      await this.prisma.reminderNotification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

    } catch (error) {
      console.error('Failed to send notification:', error);

      if (notification) {
        try {
          await this.prisma.reminderNotification.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
            },
          });
        } catch (updateError) {
          console.error('Failed to update notification status:', updateError);
        }
      }
    }
  }

  private shouldSendNotification(
    type: 'desktop' | 'inapp' | 'voice',
    settings: NotificationSettings
  ): boolean {
    // Check quiet hours
    if (settings.quietHours.enabled && this.isQuietHour(settings.quietHours)) {
      return false;
    }

    switch (type) {
      case 'desktop':
        return settings.desktop;
      case 'inapp':
        return settings.inApp;
      case 'voice':
        return settings.voice;
      default:
        return false;
    }
  }

  private isQuietHour(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const startTime = this.parseTime(quietHours.start);
    const endTime = this.parseTime(quietHours.end);

    if (startTime < endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private async deliverNotification(
    type: 'desktop' | 'inapp' | 'voice',
    title: string,
    message: string,
    settings?: NotificationSettings
  ): Promise<void> {
    switch (type) {
      case 'desktop':
        await this.sendDesktopNotification(title, message, settings);
        break;
      case 'inapp':
        await this.sendInAppNotification(title, message);
        break;
      case 'voice':
        await this.sendVoiceNotification(message);
        break;
    }
  }

  private async sendDesktopNotification(
    title: string,
    message: string,
    settings?: NotificationSettings
  ): Promise<void> {
    try {
      // In Electron main process
      if (typeof window !== 'undefined' && (window as any).shiviApi?.showNotification) {
        (window as any).shiviApi.showNotification({
          title: this.emotionalizeTitle(title),
          body: this.emotionalizeMessage(message),
          icon: '/icon.png',
          sound: settings?.sound,
          silent: !settings?.sound,
        });
      } else {
        // Fallback for non-Electron environments
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(this.emotionalizeTitle(title), {
            body: this.emotionalizeMessage(message),
            icon: '/icon.png',
          });
        }
      }
    } catch (error) {
      console.error('Failed to send desktop notification:', error);
    }
  }

  private async sendInAppNotification(title: string, message: string): Promise<void> {
    try {
      // Emit event for in-app notification system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shivi-reminder', {
          detail: {
            title: this.emotionalizeTitle(title),
            message: this.emotionalizeMessage(message),
            type: 'reminder',
          },
        }));
      }
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  }

  private async sendVoiceNotification(message: string): Promise<void> {
    try {
      // Future implementation for voice notifications
      // This would integrate with speech synthesis
      console.log('🎤 Voice notification:', this.emotionalizeMessage(message));

      // For now, just log it
      // In future: integrate with Web Speech API or external TTS
    } catch (error) {
      console.error('Failed to send voice notification:', error);
    }
  }

  private emotionalizeTitle(title: string): string {
    // Add emotional warmth to titles
    const prefixes = ['💖', '🔔', '🌟', '😊', '💕'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${randomPrefix} ${title}`;
  }

  private emotionalizeMessage(message: string): string {
    // Add emotional warmth to messages
    const suffixes = ['😌', '💕', '🌸', '✨', '💫'];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${message} ${randomSuffix}`;
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      const prefs = user?.preferences as any || {};

      return {
        desktop: prefs.notifications?.desktop ?? true,
        inApp: prefs.notifications?.inApp ?? true,
        voice: prefs.notifications?.voice ?? false,
        sound: prefs.notifications?.sound ?? true,
        vibration: prefs.notifications?.vibration ?? false,
        quietHours: prefs.notifications?.quietHours || {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        desktop: true,
        inApp: true,
        voice: false,
        sound: true,
        vibration: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    }
  }

  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      const currentPrefs = (user?.preferences as any) || {};
      const updatedPrefs = {
        ...currentPrefs,
        notifications: {
          ...currentPrefs.notifications,
          ...settings,
        },
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          preferences: updatedPrefs,
        },
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  async snoozeNotification(notificationId: string, snoozeUntil: Date): Promise<void> {
    try {
      await this.prisma.reminderNotification.update({
        where: { id: notificationId },
        data: {
          status: 'snoozed',
          snoozedUntil: snoozeUntil,
        },
      });
    } catch (error) {
      console.error('Failed to snooze notification:', error);
      throw new Error('Failed to snooze notification');
    }
  }

  async getPendingNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await this.prisma.reminderNotification.findMany({
        where: {
          reminder: { userId },
          status: 'pending',
        },
        include: {
          reminder: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }
}

export const reminderNotifications = ReminderNotifications.getInstance();