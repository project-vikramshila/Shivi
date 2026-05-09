// Shivi AI Google Calendar Integration - OAuth & Sync
// Privacy-first calendar integration with user consent

import { PrismaClient } from '@prisma/client';
import { dbEncryption } from '../../../db/security/encryption';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  status: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export class GoogleCalendarIntegration {
  private prisma: PrismaClient;
  private static instance: GoogleCalendarIntegration;
  private oauth2Client: any;

  constructor() {
    this.prisma = new PrismaClient();

    // Initialize OAuth2 client dynamically so TypeScript does not require package types at build time
    const { OAuth2Client } = require('google-auth-library');
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
    );
  }

  static getInstance(): GoogleCalendarIntegration {
    if (!GoogleCalendarIntegration.instance) {
      GoogleCalendarIntegration.instance = new GoogleCalendarIntegration();
    }
    return GoogleCalendarIntegration.instance;
  }

  // OAuth Flow
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  async saveTokens(userId: string, tokens: any): Promise<void> {
    try {
      await this.prisma.googleCalendarToken.upsert({
        where: { userId },
        update: {
          accessToken: dbEncryption.encrypt(tokens.access_token),
          refreshToken: dbEncryption.encrypt(tokens.refresh_token),
          expiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope?.split(' ') || [],
          syncEnabled: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          accessToken: dbEncryption.encrypt(tokens.access_token),
          refreshToken: dbEncryption.encrypt(tokens.refresh_token),
          expiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope?.split(' ') || [],
          syncEnabled: true,
        },
      });
    } catch (error) {
      console.error('Failed to save Google tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  async getTokens(userId: string): Promise<any | null> {
    try {
      const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!tokenRecord) return null;

      const accessToken = dbEncryption.decrypt(tokenRecord.accessToken);
      const refreshToken = dbEncryption.decrypt(tokenRecord.refreshToken);

      // Check if token is expired and refresh if needed
      if (new Date() > tokenRecord.expiresAt) {
        return await this.refreshTokens(userId, refreshToken);
      }

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: tokenRecord.expiresAt.getTime(),
        scope: tokenRecord.scope.join(' '),
      };
    } catch (error) {
      console.error('Failed to get Google tokens:', error);
      return null;
    }
  }

  private async refreshTokens(userId: string, refreshToken: string): Promise<any> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const tokens = credentials;

      // Save refreshed tokens
      await this.saveTokens(userId, tokens);

      return tokens;
    } catch (error) {
      console.error('Failed to refresh Google tokens:', error);
      throw new Error('Failed to refresh authentication tokens');
    }
  }

  async getAuthenticatedClient(userId: string): Promise<any | null> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) return null;

      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      client.setCredentials(tokens);
      return client;
    } catch (error) {
      console.error('Failed to get authenticated client:', error);
      return null;
    }
  }

  // Calendar Operations
  async getCalendars(userId: string): Promise<any[]> {
    try {
      const client = await this.getAuthenticatedClient(userId);
      if (!client) throw new Error('Not authenticated');

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }

  async getEvents(
    userId: string,
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 100
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const client = await this.getAuthenticatedClient(userId);
      if (!client) throw new Error('Not authenticated');

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items || []) as GoogleCalendarEvent[];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async createEvent(
    userId: string,
    calendarId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<any> {
    try {
      const client = await this.getAuthenticatedClient(userId);
      if (!client) throw new Error('Not authenticated');

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<any> {
    try {
      const client = await this.getAuthenticatedClient(userId);
      if (!client) throw new Error('Not authenticated');

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  async deleteEvent(userId: string, calendarId: string, eventId: string): Promise<void> {
    try {
      const client = await this.getAuthenticatedClient(userId);
      if (!client) throw new Error('Not authenticated');

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: client });

      await calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // Sync Operations
  async syncEventsToReminders(userId: string): Promise<void> {
    try {
      const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!tokenRecord || !tokenRecord.syncEnabled) return;

      const calendarId = tokenRecord.calendarId || 'primary';
      const lastSync = tokenRecord.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

      const events = await this.getEvents(userId, calendarId, lastSync);

      for (const event of events) {
        await this.syncEventToReminder(userId, event);
      }

      // Update last sync time
      await this.prisma.googleCalendarToken.update({
        where: { userId },
        data: {
          lastSyncAt: new Date(),
        },
      });

      console.log(`📅 Synced ${events.length} calendar events to reminders`);
    } catch (error) {
      console.error('Failed to sync events to reminders:', error);
    }
  }

  private async syncEventToReminder(userId: string, event: GoogleCalendarEvent): Promise<void> {
    try {
      // Check if event already exists as reminder
      const existingEvent = await this.prisma.googleCalendarEvent.findUnique({
        where: { googleId: event.id },
      });

      if (existingEvent) {
        // Update existing
        await this.prisma.googleCalendarEvent.update({
          where: { googleId: event.id },
          data: {
            summary: event.summary,
            description: event.description,
            startTime: event.start.dateTime ? new Date(event.start.dateTime) :
                       event.start.date ? new Date(event.start.date) : new Date(),
            endTime: event.end.dateTime ? new Date(event.end.dateTime) :
                     event.end.date ? new Date(event.end.date) : new Date(),
            timezone: event.start.timeZone || 'UTC',
            location: event.location,
            status: event.status,
            syncedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new
        await this.prisma.googleCalendarEvent.create({
          data: {
            id: event.id,
            userId,
            googleId: event.id,
            summary: event.summary,
            description: event.description ?? undefined,
            startTime: event.start.dateTime ? new Date(event.start.dateTime) :
                       event.start.date ? new Date(event.start.date) : new Date(),
            endTime: event.end.dateTime ? new Date(event.end.dateTime) :
                     event.end.date ? new Date(event.end.date) : new Date(),
            timezone: event.start.timeZone || 'UTC',
            location: event.location ?? undefined,
            status: event.status,
          },
        });

        // Optionally create a reminder for this event
        // This would depend on user preferences
      }
    } catch (error) {
      console.error('Failed to sync event to reminder:', error);
    }
  }

  async syncReminderToCalendar(userId: string, reminderId: string): Promise<void> {
    try {
      const reminder = await this.prisma.reminder.findUnique({
        where: { id: reminderId },
      });

      if (!reminder || !reminder.dueAt) return;

      const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!tokenRecord || !tokenRecord.syncEnabled) return;

      const calendarId = tokenRecord.calendarId || 'primary';

      const eventData = {
        summary: reminder.title,
        description: reminder.description ?? undefined,
        start: {
          dateTime: reminder.dueAt.toISOString(),
          timeZone: 'Asia/Kolkata', // Default timezone
        },
        end: {
          dateTime: new Date(reminder.dueAt.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: true,
        },
      };

      const createdEvent = await this.createEvent(userId, calendarId, eventData);

      // Update reminder with calendar metadata
      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: {
          calendarMetadata: JSON.stringify({
            googleEventId: createdEvent.id,
            calendarId,
            syncedAt: new Date(),
          }),
          syncedAt: new Date(),
        },
      });

      console.log(`📅 Created calendar event for reminder: ${reminder.title}`);
    } catch (error) {
      console.error('Failed to sync reminder to calendar:', error);
    }
  }

  async disconnect(userId: string): Promise<void> {
    try {
      await this.prisma.googleCalendarToken.delete({
        where: { userId },
      });

      // Also delete synced events
      await this.prisma.googleCalendarEvent.deleteMany({
        where: { userId },
      });

      console.log('📅 Disconnected Google Calendar integration');
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      throw new Error('Failed to disconnect Google Calendar');
    }
  }

  async getSyncStatus(userId: string): Promise<any> {
    try {
      const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!tokenRecord) {
        return { connected: false };
      }

      const eventCount = await this.prisma.googleCalendarEvent.count({
        where: { userId },
      });

      return {
        connected: true,
        syncEnabled: tokenRecord.syncEnabled,
        lastSyncAt: tokenRecord.lastSyncAt,
        calendarId: tokenRecord.calendarId,
        eventCount,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { connected: false };
    }
  }
}

export const googleCalendar = GoogleCalendarIntegration.getInstance();