// Shivi AI Reminder Scheduler - Background Task Management
// Handles recurring reminders, timezone-aware scheduling, and background processing

import { PrismaClient } from '@prisma/client';
import { reminderEngine } from '../core/engine';
import { RecurrenceRule, ReminderSchedule } from '../core/types';
import { dbConfig } from '../../../db/config';

export class ReminderScheduler {
  private prisma: PrismaClient;
  private dbConfig = dbConfig;
  private static instance: ReminderScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler();
    }
    return ReminderScheduler.instance;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔔 Reminder scheduler started');

    // Check every minute for due reminders
    this.intervalId = setInterval(() => {
      this.processDueReminders();
    }, 60 * 1000);

    // Initial check
    this.processDueReminders();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🔔 Reminder scheduler stopped');
  }

  async processDueReminders(): Promise<void> {
    try {
      // Skip if database is not configured (local-only mode)
      if (!this.dbConfig.databaseUrl || this.dbConfig.localOnlyMode) {
        return;
      }

      const now = new Date();

      // Find all active schedules that are due
      const dueSchedules = await this.prisma.reminderSchedule.findMany({
        where: {
          isActive: true,
          nextDueAt: {
            lte: now,
          },
        },
        include: {
          reminder: true,
        },
      });

      for (const schedule of dueSchedules) {
        await this.processSchedule(schedule);
      }
    } catch (error) {
      console.error('Failed to process due reminders:', error);
    }
  }

  private async processSchedule(schedule: any): Promise<void> {
    try {
      const reminder = schedule.reminder;
      const rule: RecurrenceRule = JSON.parse(schedule.rule);

      // Create a new instance of the recurring reminder
      const newDueAt = schedule.nextDueAt;

      // Update the reminder with the new due date
      await this.prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          dueAt: newDueAt,
          updatedAt: new Date(),
        },
      });

      // Calculate next occurrence
      const nextDueAt = this.calculateNextDueDate(rule, newDueAt);

      // Update schedule
      await this.prisma.reminderSchedule.update({
        where: { id: schedule.id },
        data: {
          lastTriggered: newDueAt,
          nextDueAt: nextDueAt,
          updatedAt: new Date(),
        },
      });

      // Trigger notification
      await this.triggerReminderNotification(reminder.id, newDueAt);

      console.log(`🔔 Processed recurring reminder: ${reminder.title}`);
    } catch (error) {
      console.error('Failed to process schedule:', error);
    }
  }

  private calculateNextDueDate(rule: RecurrenceRule, fromDate: Date): Date | null {
    if (!rule || rule.type === 'once') return null;

    let nextDate = new Date(fromDate);

    switch (rule.type) {
      case 'daily':
        nextDate.setDate(fromDate.getDate() + (rule.interval || 1));
        break;

      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const currentDay = fromDate.getDay();
          const targetDays = rule.daysOfWeek.sort((a, b) => a - b);

          // Find next day of week
          let nextDay = targetDays.find(day => day > currentDay);
          if (!nextDay) {
            nextDay = targetDays[0];
            nextDate.setDate(fromDate.getDate() + (7 - currentDay + nextDay));
          } else {
            nextDate.setDate(fromDate.getDate() + (nextDay - currentDay));
          }
        } else {
          nextDate.setDate(fromDate.getDate() + 7 * (rule.interval || 1));
        }
        break;

      case 'monthly':
        if (rule.daysOfMonth && rule.daysOfMonth.length > 0) {
          // Complex monthly logic - for now, just add months
          nextDate.setMonth(fromDate.getMonth() + (rule.interval || 1));
        } else {
          nextDate.setMonth(fromDate.getMonth() + (rule.interval || 1));
        }
        break;

      case 'custom':
        // Custom recurrence - would need more complex logic
        return null;
    }

    // Check end conditions
    if (rule.endDate && nextDate > rule.endDate) return null;
    if (rule.count && rule.count <= 0) return null;

    return nextDate;
  }

  private async triggerReminderNotification(reminderId: string, dueAt: Date): Promise<void> {
    try {
      // Create notification record
      await this.prisma.reminderNotification.create({
        data: {
          reminderId,
          notificationType: 'inapp',
          status: 'pending',
        },
      });

      // In a real implementation, this would trigger the notification system
      console.log(`🔔 Notification triggered for reminder ${reminderId} at ${dueAt}`);
    } catch (error) {
      console.error('Failed to trigger reminder notification:', error);
    }
  }

  async scheduleReminder(reminderId: string, rule: RecurrenceRule): Promise<void> {
    try {
      const nextDueAt = this.calculateNextDueDate(rule, new Date());

      const existingSchedule = await this.prisma.reminderSchedule.findFirst({
        where: { reminderId },
      });

      if (existingSchedule) {
        await this.prisma.reminderSchedule.update({
          where: { id: existingSchedule.id },
          data: {
            scheduleType: rule.type,
            nextDueAt,
            rule: JSON.stringify(rule),
            timezone: rule.timezone,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.reminderSchedule.create({
          data: {
            reminderId,
            scheduleType: rule.type,
            nextDueAt,
            rule: JSON.stringify(rule),
            timezone: rule.timezone,
            isActive: true,
          },
        });
      }
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      throw new Error('Failed to schedule reminder');
    }
  }

  async unscheduleReminder(reminderId: string): Promise<void> {
    try {
      await this.prisma.reminderSchedule.updateMany({
        where: { reminderId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to unschedule reminder:', error);
      throw new Error('Failed to unschedule reminder');
    }
  }

  async getUpcomingReminders(hours: number = 24): Promise<any[]> {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const schedules = await this.prisma.reminderSchedule.findMany({
        where: {
          isActive: true,
          nextDueAt: {
            gte: now,
            lte: future,
          },
        },
        include: {
          reminder: true,
        },
        orderBy: {
          nextDueAt: 'asc',
        },
      });

      return schedules;
    } catch (error) {
      console.error('Failed to get upcoming reminders:', error);
      return [];
    }
  }

  // Recovery method for missed reminders
  async recoverMissedReminders(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find reminders that should have triggered but didn't
      const missedSchedules = await this.prisma.reminderSchedule.findMany({
        where: {
          isActive: true,
          nextDueAt: {
            lt: oneHourAgo,
          },
        },
        include: {
          reminder: true,
        },
      });

      for (const schedule of missedSchedules) {
        // Trigger missed reminder notification
        await this.triggerReminderNotification(schedule.reminder.id, schedule.nextDueAt!);

        // Calculate next occurrence
        const rule: RecurrenceRule = typeof schedule.rule === 'string'
          ? JSON.parse(schedule.rule)
          : (schedule.rule as unknown as RecurrenceRule);
        const nextDueAt = this.calculateNextDueDate(rule, schedule.nextDueAt!);

        // Update schedule
        await this.prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: {
            nextDueAt,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to recover missed reminders:', error);
    }
  }
}

export const reminderScheduler = ReminderScheduler.getInstance();