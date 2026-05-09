// Shivi AI Contextual Reminders - Smart Reminder Suggestions
// Detects reminder opportunities from conversation and context

import { PrismaClient } from '@prisma/client';
import { reminderEngine } from '../core/engine';
import { ReminderContext, ContextCondition } from '../core/types';

export class ContextualReminders {
  private prisma: PrismaClient;
  private static instance: ContextualReminders;

  constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): ContextualReminders {
    if (!ContextualReminders.instance) {
      ContextualReminders.instance = new ContextualReminders();
    }
    return ContextualReminders.instance;
  }

  // Intent Detection
  async detectReminderIntent(text: string, userId: string): Promise<any | null> {
    try {
      const lowerText = text.toLowerCase();

      // Common Hindi/English reminder patterns
      const patterns = [
        // Hindi patterns
        /(?:kal|आज|परसों|अगले हफ्ते|अगले महीने)\s+(?:को|पर|में)\s+(.+?)(?:करना|है|था|थी|थे|होना)/i,
        /(?:मुझे|मुज्हे)\s+याद\s+दिलाना\s+(.+)/i,
        /(?:reminder|रिमाइंडर)\s+(?:lagao|लगाओ|set|सेट)\s+(.+)/i,
        /(?:न भूलना|मत भूलना|याद रखना)\s+(.+)/i,

        // English patterns
        /(?:remind me|reminder|don't forget)\s+(?:to|about)\s+(.+)/i,
        /(?:set a reminder|create reminder)\s+(?:for|about)\s+(.+)/i,
        /(?:tomorrow|today|next week|next month)\s+(?:at|on)\s+(.+)/i,
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const extractedTask = match[1].trim();
          return {
            intent: 'create_reminder',
            task: extractedTask,
            confidence: 0.8,
            suggestedTime: this.extractTimeFromText(text),
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to detect reminder intent:', error);
      return null;
    }
  }

  private extractTimeFromText(text: string): Date | null {
    const lowerText = text.toLowerCase();

    // Time patterns
    if (lowerText.includes('kal') || lowerText.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    if (lowerText.includes('आज') || lowerText.includes('today')) {
      return new Date();
    }

    if (lowerText.includes('परसों')) {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      return dayAfter;
    }

    // Time of day patterns
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे)/i);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const isPM = timeMatch[3]?.toLowerCase() === 'pm';

      const now = new Date();
      let targetTime = new Date(now);
      targetTime.setHours(isPM ? hours + 12 : hours, minutes, 0, 0);

      // If time has passed today, move to tomorrow
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      return targetTime;
    }

    return null;
  }

  // Contextual Reminder Creation
  async createContextualReminder(
    userId: string,
    conversationId: string,
    intent: any,
    contextType: 'conversation' | 'location' | 'time' | 'activity' = 'conversation'
  ): Promise<string> {
    try {
      const reminderData = {
        userId,
        conversationId,
        title: intent.task,
        description: `Contextual reminder from conversation`,
        dueAt: intent.suggestedTime,
        priority: 'medium' as const,
        contexts: [{
          contextType,
          trigger: intent.task,
          conditions: [{
            type: 'keyword' as const,
            value: intent.task,
            operator: 'contains' as const,
          }],
          isActive: true,
        }],
      };

      const reminder = await reminderEngine.createReminder(reminderData);

      // Log the contextual creation
      await this.logContextualAction(userId, conversationId, 'created', intent);

      return reminder.id;
    } catch (error) {
      console.error('Failed to create contextual reminder:', error);
      throw new Error('Failed to create contextual reminder');
    }
  }

  // Context Monitoring
  async checkContextualTriggers(userId: string, currentContext: any): Promise<any[]> {
    try {
      const activeContexts = await this.prisma.reminderContext.findMany({
        where: {
          reminder: { userId },
          isActive: true,
        },
        include: {
          reminder: true,
        },
      });

      const triggeredReminders = [];

      for (const context of activeContexts) {
        const conditions = Array.isArray(context.conditions)
          ? (context.conditions as unknown as ContextCondition[])
          : [];

        if (this.evaluateContextConditions(conditions, currentContext)) {
          triggeredReminders.push({
            reminder: context.reminder,
            context,
            triggerReason: this.getTriggerReason(context, currentContext),
          });
        }
      }

      return triggeredReminders;
    } catch (error) {
      console.error('Failed to check contextual triggers:', error);
      return [];
    }
  }

  private evaluateContextConditions(conditions: ContextCondition[], context: any): boolean {
    return conditions.every(condition => {
      const contextValue = this.getContextValue(context, condition.type);

      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'contains':
          return String(contextValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater':
          return Number(contextValue) > Number(condition.value);
        case 'less':
          return Number(contextValue) < Number(condition.value);
        case 'between':
          const [min, max] = String(condition.value).split('-').map(Number);
          return Number(contextValue) >= min && Number(contextValue) <= max;
        default:
          return false;
      }
    });
  }

  private getContextValue(context: any, type: string): any {
    switch (type) {
      case 'keyword':
        return context.text || '';
      case 'sentiment':
        return context.sentiment || 0;
      case 'time':
        return context.timestamp || Date.now();
      case 'location':
        return context.location || '';
      case 'activity':
        return context.activity || '';
      default:
        return '';
    }
  }

  private getTriggerReason(context: any, currentContext: any): string {
    const conditions = context.conditions as ContextCondition[];
    const reasons = conditions.map(condition => {
      const value = this.getContextValue(currentContext, condition.type);
      return `${condition.type}: ${value}`;
    });

    return reasons.join(', ');
  }

  // Follow-up Reminders
  async suggestFollowUpReminder(
    userId: string,
    originalReminderId: string,
    context: any
  ): Promise<any | null> {
    try {
      const originalReminder = await reminderEngine.getReminder(originalReminderId);
      if (!originalReminder) return null;

      // Analyze context to suggest follow-up
      const suggestions = [
        {
          condition: context.sentiment < -0.3,
          suggestion: {
            title: `Follow up on: ${originalReminder.title}`,
            description: 'Checking if everything went well',
            delay: 24 * 60 * 60 * 1000, // 24 hours
          },
        },
        {
          condition: context.keywords?.includes('urgent') || context.keywords?.includes('important'),
          suggestion: {
            title: `Important follow-up: ${originalReminder.title}`,
            description: 'Ensuring this important task was completed',
            delay: 2 * 60 * 60 * 1000, // 2 hours
          },
        },
        {
          condition: context.activity === 'completed_task',
          suggestion: {
            title: `Celebrate completion: ${originalReminder.title}`,
            description: 'Great job! How did it go?',
            delay: 30 * 60 * 1000, // 30 minutes
          },
        },
      ];

      const matchingSuggestion = suggestions.find(s => s.condition);
      if (matchingSuggestion) {
        return {
          ...matchingSuggestion.suggestion,
          dueAt: new Date(Date.now() + matchingSuggestion.suggestion.delay),
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to suggest follow-up reminder:', error);
      return null;
    }
  }

  // Smart Scheduling
  async suggestOptimalTime(
    userId: string,
    task: string,
    preferences?: any
  ): Promise<Date | null> {
    try {
      // Analyze user's patterns and suggest optimal time
      const userReminders = await reminderEngine.queryReminders({
        userId,
        limit: 100,
      });

      // Simple heuristic: suggest time based on task type
      const lowerTask = task.toLowerCase();

      if (lowerTask.includes('morning') || lowerTask.includes('सुबह')) {
        return this.getNextTime(9, 0); // 9 AM
      }

      if (lowerTask.includes('evening') || lowerTask.includes('शाम')) {
        return this.getNextTime(18, 0); // 6 PM
      }

      if (lowerTask.includes('lunch') || lowerTask.includes('दोपहर')) {
        return this.getNextTime(13, 0); // 1 PM
      }

      if (lowerTask.includes('work') || lowerTask.includes('काम')) {
        return this.getNextTime(10, 0); // 10 AM
      }

      // Default to 2 hours from now
      return new Date(Date.now() + 2 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Failed to suggest optimal time:', error);
      return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }
  }

  private getNextTime(hours: number, minutes: number): Date {
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, move to tomorrow
    if (targetTime < now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    return targetTime;
  }

  // Learning and Adaptation
  async learnFromUserFeedback(
    userId: string,
    reminderId: string,
    feedback: 'good_time' | 'bad_time' | 'too_early' | 'too_late' | 'completed' | 'dismissed'
  ): Promise<void> {
    try {
      // Store feedback for future suggestions
      const reminder = await reminderEngine.getReminder(reminderId);
      if (!reminder) return;

      const feedbackData = {
        reminderId,
        feedback,
        timestamp: new Date(),
        context: {
          dueAt: reminder.dueAt,
          completed: reminder.completed,
          priority: reminder.priority,
        },
      };

      // In a full implementation, this would update user preferences
      // and improve future suggestions
      console.log('📚 Learned from user feedback:', feedbackData);
    } catch (error) {
      console.error('Failed to learn from user feedback:', error);
    }
  }

  private async logContextualAction(
    userId: string,
    _conversationId: string,
    action: string,
    intent: any
  ): Promise<void> {
    try {
      await this.prisma.interactionHistory.create({
        data: {
          userId,
          activityType: 'reminder_context',
          action,
          referenceId: intent.task,
          userInput: JSON.stringify(intent),
          metadata: {
            contextual: true,
            confidence: intent.confidence,
          },
        },
      });
    } catch (error) {
      console.warn('Failed to log contextual action:', error);
    }
  }

  // Public API
  async processConversationForReminders(
    userId: string,
    conversationId: string,
    text: string,
    context: any = {}
  ): Promise<any> {
    try {
      const intent = await this.detectReminderIntent(text, userId);

      if (intent) {
        const reminderId = await this.createContextualReminder(
          userId,
          conversationId,
          intent,
          'conversation'
        );

        return {
          detected: true,
          reminderId,
          intent,
          message: `🔔 Reminder laga diya: "${intent.task}" ${intent.suggestedTime ? `for ${intent.suggestedTime.toLocaleString()}` : ''}`,
        };
      }

      return { detected: false };
    } catch (error) {
      console.error('Failed to process conversation for reminders:', error);
      return { detected: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export const contextualReminders = ContextualReminders.getInstance();