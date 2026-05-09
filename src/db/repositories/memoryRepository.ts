import prisma from '../client';

export type MemoryRow = {
  id: string;
  payload: any;
};

export const memoryRepository = {
  async createUser(externalId: string, displayName?: string, email?: string) {
    return prisma.user.upsert({
      where: { externalId },
      update: {
        displayName,
        email,
        updatedAt: new Date(),
      },
      create: {
        externalId,
        displayName,
        email,
      },
    });
  },

  async createConversation(userId: string, sessionId: string, payload: any) {
    return prisma.conversation.create({
      data: {
        userId,
        sessionId,
        title: payload.title,
        personalityMode: payload.personalityMode,
        emotionalContext: payload.emotionalContext,
        topics: payload.topics || [],
        entities: payload.entities || {},
        sentiment: payload.sentiment || {},
      },
    });
  },

  async appendMessage(conversationId: string, role: string, content: string, metadata?: any, sentiment?: number) {
    return prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata || {},
        sentiment,
      },
    });
  },

  async createReminder(userId: string, reminder: any) {
    return prisma.reminder.create({
      data: {
        userId,
        title: reminder.title,
        description: reminder.description,
        dueAt: reminder.dueDate ? new Date(reminder.dueDate) : null,
        recurring: reminder.recurring || {},
        completed: reminder.completed || false,
        priority: reminder.priority || 'medium',
        emotionalPreference: reminder.emotionalPreference,
        calendarMetadata: reminder.calendarMetadata || {},
        metadata: reminder.metadata || {},
      },
    });
  },

  async fetchActiveReminders(userId: string) {
    return prisma.reminder.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: {
        dueAt: 'asc',
      },
      take: 50,
    });
  },

  async upsertSetting(userId: string, key: string, value: any) {
    return prisma.setting.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: {
        value,
        updatedAt: new Date(),
      },
      create: {
        userId,
        key,
        value,
      },
    });
  },

  async createEmbedding(memoryType: string, memoryId: string, embedding: number[], summary?: string, keywords?: string[], metadata?: any) {
    return prisma.memoryEmbedding.create({
      data: {
        memoryType,
        memoryId,
        embedding,
        summary,
        keywords: keywords || [],
        metadata: metadata || {},
      },
    });
  },

  async findEmbeddingsByMemory(memoryType: string, memoryId: string) {
    return prisma.memoryEmbedding.findMany({
      where: {
        memoryType,
        memoryId,
      },
    });
  },

  async searchMessagesByText(userId: string, query: string, limit = 15) {
    return prisma.message.findMany({
      where: {
        conversation: {
          userId,
        },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  async recordAudit(userId: string | null, action: string, details: any, source?: string) {
    return prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action,
        details: details || {},
        source,
      },
    });
  },

  async enqueueSyncItem(item: any) {
    return prisma.syncQueueItem.create({
      data: {
        itemType: item.itemType,
        itemId: item.itemId,
        action: item.action,
        payload: item.payload,
        status: 'pending',
      },
    });
  },

  async fetchPendingSyncItems(limit = 20) {
    return prisma.syncQueueItem.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  },

  async updateSyncItemStatus(id: string, status: string, retryCount: number, nextAttempt?: Date) {
    return prisma.syncQueueItem.update({
      where: { id },
      data: {
        status,
        retryCount,
        nextAttempt,
        lastAttempt: new Date(),
      },
    });
  },
};
