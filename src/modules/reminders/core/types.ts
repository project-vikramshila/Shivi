// Shivi AI Reminder System - Core Types
// Emotionally intelligent, privacy-first reminder architecture

export interface Reminder {
  id: string;
  userId: string;
  conversationId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
  recurring?: RecurrenceRule;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  emotionalPreference?: EmotionalStyle;
  calendarMetadata?: CalendarMetadata;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  metadata?: Record<string, any>;
}

export interface RecurrenceRule {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  daysOfMonth?: number[]; // 1-31
  endDate?: Date;
  count?: number; // max occurrences
  timezone: string;
}

export interface ReminderSchedule {
  id: string;
  reminderId: string;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  nextDueAt?: Date;
  lastTriggered?: Date;
  rule?: RecurrenceRule;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderNotification {
  id: string;
  reminderId: string;
  notificationType: 'desktop' | 'inapp' | 'voice';
  status: 'pending' | 'sent' | 'failed' | 'snoozed';
  sentAt?: Date;
  snoozedUntil?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ReminderContext {
  id: string;
  reminderId: string;
  contextType: 'conversation' | 'location' | 'time' | 'activity';
  trigger: string;
  conditions?: ContextCondition[];
  isActive: boolean;
  createdAt: Date;
}

export interface ContextCondition {
  type: 'keyword' | 'sentiment' | 'time' | 'location' | 'activity';
  value: string | number;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
}

export interface EmotionalStyle {
  tone: 'warm' | 'playful' | 'gentle' | 'firm' | 'cheerful';
  personality: 'caring' | 'funny' | 'professional' | 'motivational';
  language: 'formal' | 'casual' | 'poetic';
  emojis: boolean;
}

export interface CalendarMetadata {
  googleEventId?: string;
  calendarId?: string;
  lastSynced?: Date;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface ReminderQuery {
  userId: string;
  status?: 'active' | 'completed' | 'missed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueBefore?: Date;
  dueAfter?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateReminderRequest {
  userId: string;
  conversationId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
  recurring?: RecurrenceRule;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  emotionalPreference?: EmotionalStyle;
  contexts?: Omit<ReminderContext, 'id' | 'reminderId' | 'createdAt'>[];
}

export interface UpdateReminderRequest {
  title?: string;
  description?: string;
  dueAt?: Date;
  recurring?: RecurrenceRule;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  emotionalPreference?: EmotionalStyle;
  completed?: boolean;
}

export interface NotificationSettings {
  desktop: boolean;
  inApp: boolean;
  voice: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface ReminderStats {
  total: number;
  active: number;
  completed: number;
  missed: number;
  upcoming: number;
  overdue: number;
}