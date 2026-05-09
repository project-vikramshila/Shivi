// Shivi AI Reminder Engine - Core Implementation
// Emotionally intelligent reminder management system

import { PrismaClient } from '@prisma/client';
import {
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderQuery,
  ReminderStats,
  RecurrenceRule,
  ReminderSchedule
} from './types';
import { memoryStorage } from '../../memory';

export class ReminderEngine {
  private prisma: PrismaClient;
  private static instance: ReminderEngine;

  constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): ReminderEngine {
    if (!ReminderEngine.instance) {
      ReminderEngine.instance = new ReminderEngine();
    }
    return ReminderEngine.instance;
  }

  async createReminder(request: CreateReminderRequest): Promise<Reminder> {
    try {
      const reminder = await this.prisma.reminder.create({
        data: {
          userId: request.userId,
          conversationId: request.conversationId,
          title: request.title,
          description: request.description,
          dueAt: request.dueAt,
          recurring: request.recurring ? (request.recurring as any) : undefined,
          priority: request.priority || 'medium',
          emotionalPreference: request.emotionalPreference ? JSON.stringify(request.emotionalPreference) : undefined,
        },
      });

      // Create schedule if recurring
      if (request.recurring) {
        await this.createSchedule(reminder.id, request.recurring);
      }

      // Create contexts if provided
      if (request.contexts && request.contexts.length > 0) {
        await this.prisma.reminderContext.createMany({
          data: request.contexts.map(context => ({
            reminderId: reminder.id,
            contextType: context.contextType,
            trigger: context.trigger,
            conditions: context.conditions as any,
            isActive: context.isActive,
          })),
        });
      }

      // Store in memory for quick access
      await this.storeInMemory(reminder);

      return this.transformReminder(reminder);
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw new Error('Failed to create reminder');
    }
  }

  async updateReminder(id: string, updates: UpdateReminderRequest): Promise<Reminder> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.dueAt !== undefined) updateData.dueAt = updates.dueAt;
      if (updates.recurring !== undefined) {
        updateData.recurring = updates.recurring ? (updates.recurring as any) : undefined;
      }
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.emotionalPreference !== undefined) {
        updateData.emotionalPreference = updates.emotionalPreference ? JSON.stringify(updates.emotionalPreference) : undefined;
      }
      if (updates.completed !== undefined) updateData.completed = updates.completed;

      updateData.updatedAt = new Date();

      const reminder = await this.prisma.reminder.update({
        where: { id },
        data: updateData,
      });

      // Update schedule if recurring changed
      if (updates.recurring) {
        await this.updateSchedule(reminder.id, updates.recurring);
      }

      // Update memory
      await this.storeInMemory(reminder);

      return this.transformReminder(reminder);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw new Error('Failed to update reminder');
    }
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      await this.prisma.reminder.delete({
        where: { id },
      });

      // Remove from memory
      await memoryStorage.delete(id);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw new Error('Failed to delete reminder');
    }
  }

  async getReminder(id: string): Promise<Reminder | null> {
    try {
      const reminder = await this.prisma.reminder.findUnique({
        where: { id },
        include: {
          schedules: true,
          notifications: true,
          contexts: true,
        },
      });

      return reminder ? this.transformReminder(reminder) : null;
    } catch (error) {
      console.error('Failed to get reminder:', error);
      return null;
    }
  }

  async queryReminders(query: ReminderQuery): Promise<Reminder[]> {
    try {
      const where: any = {
        userId: query.userId,
      };

      if (query.status) {
        switch (query.status) {
          case 'active':
            where.completed = false;
            where.dueAt = { gte: new Date() };
            break;
          case 'completed':
            where.completed = true;
            break;
          case 'missed':
            where.completed = false;
            where.dueAt = { lt: new Date() };
            break;
        }
      }

      if (query.priority) {
        where.priority = query.priority;
      }

      if (query.dueBefore || query.dueAfter) {
        where.dueAt = {};
        if (query.dueBefore) where.dueAt.lt = query.dueBefore;
        if (query.dueAfter) where.dueAt.gte = query.dueAfter;
      }

      const reminders = await this.prisma.reminder.findMany({
        where,
        include: {
          schedules: true,
          notifications: true,
          contexts: true,
        },
        orderBy: { dueAt: 'asc' },
        take: query.limit || 50,
        skip: query.offset || 0,
      });

      return reminders.map(this.transformReminder);
    } catch (error) {
      console.error('Failed to query reminders:', error);
      return [];
    }
  }

  async getReminderStats(userId: string): Promise<ReminderStats> {
    try {
      const now = new Date();

      const [total, active, completed, missed, upcoming, overdue] = await Promise.all([
        this.prisma.reminder.count({ where: { userId } }),
        this.prisma.reminder.count({
          where: { userId, completed: false, dueAt: { gte: now } }
        }),
        this.prisma.reminder.count({ where: { userId, completed: true } }),
        this.prisma.reminder.count({
          where: { userId, completed: false, dueAt: { lt: now } }
        }),
        this.prisma.reminder.count({
          where: { userId, completed: false, dueAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }
        }),
        this.prisma.reminder.count({
          where: { userId, completed: false, dueAt: { lt: now } }
        }),
      ]);

      return { total, active, completed, missed, upcoming, overdue };
    } catch (error) {
      console.error('Failed to get reminder stats:', error);
      return { total: 0, active: 0, completed: 0, missed: 0, upcoming: 0, overdue: 0 };
    }
  }

  async completeReminder(id: string): Promise<void> {
    await this.updateReminder(id, { completed: true });
  }

  async snoozeReminder(id: string, snoozeUntil: Date): Promise<void> {
    // Create a snooze notification
    await this.prisma.reminderNotification.create({
      data: {
        reminderId: id,
        notificationType: 'inapp',
        status: 'snoozed',
        snoozedUntil: snoozeUntil,
      },
    });
  }

  private async createSchedule(reminderId: string, rule: RecurrenceRule): Promise<void> {
    const nextDueAt = this.calculateNextDueDate(rule);

    await this.prisma.reminderSchedule.create({
      data: {
        reminderId,
        scheduleType: rule.type,
        nextDueAt,
        rule: JSON.stringify(rule),
        timezone: rule.timezone,
      },
    });
  }

  private async updateSchedule(reminderId: string, rule: RecurrenceRule): Promise<void> {
    const nextDueAt = this.calculateNextDueDate(rule);
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
        },
      });
    }
  }

  private calculateNextDueDate(rule: RecurrenceRule): Date | undefined {
    if (rule.type === 'once') return undefined;

    const now = new Date();
    let nextDate = new Date(now);

    switch (rule.type) {
      case 'daily':
        nextDate.setDate(now.getDate() + (rule.interval || 1));
        break;
      case 'weekly':
        const daysUntilNext = (rule.daysOfWeek?.[0] || 1) - now.getDay();
        nextDate.setDate(now.getDate() + (daysUntilNext <= 0 ? 7 + daysUntilNext : daysUntilNext));
        break;
      case 'monthly':
        nextDate.setMonth(now.getMonth() + (rule.interval || 1));
        break;
    }

    return nextDate;
  }

  private async storeInMemory(reminder: any): Promise<void> {
    try {
      const memoryData = {
        type: 'reminder',
        title: reminder.title,
        description: reminder.description,
        dueAt: reminder.dueAt,
        priority: reminder.priority,
        completed: reminder.completed,
        userId: reminder.userId,
      };

      await memoryStorage.store({
        id: reminder.id,
        type: 'reminder',
        title: reminder.title,
        description: reminder.description,
        content: JSON.stringify(memoryData),
        dueDate: reminder.dueAt?.toISOString(),
        completed: reminder.completed,
        priority: reminder.priority,
        relatedEntities: [],
        tags: ['reminder', reminder.priority, reminder.completed ? 'completed' : 'active'],
        createdAt: reminder.createdAt.toISOString(),
        updatedAt: reminder.updatedAt.toISOString(),
        confidence: 1,
      } as any);
    } catch (error) {
      console.warn('Failed to store reminder in memory:', error);
    }
  }

  private transformReminder(reminder: any): Reminder {
    return {
      id: reminder.id,
      userId: reminder.userId,
      conversationId: reminder.conversationId,
      title: reminder.title,
      description: reminder.description,
      dueAt: reminder.dueAt,
      recurring: reminder.recurring ? JSON.parse(reminder.recurring) : undefined,
      completed: reminder.completed,
      priority: reminder.priority,
      emotionalPreference: reminder.emotionalPreference ? JSON.parse(reminder.emotionalPreference) : undefined,
      calendarMetadata: reminder.calendarMetadata ? JSON.parse(reminder.calendarMetadata) : undefined,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      syncedAt: reminder.syncedAt,
      metadata: reminder.metadata ? JSON.parse(reminder.metadata) : undefined,
    };
  }
}

export const reminderEngine = ReminderEngine.getInstance();