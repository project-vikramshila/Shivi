/**
 * Shivi AI Memory System - Main Memory Engine
 * Central orchestrator for all memory operations
 */

import {
  Memory,
  ConversationMemory,
  ReminderMemory,
  EntityMemory,
  PreferenceMemory,
  MemoryStats,
  MemoryConfig,
} from './types';
import { RetrievalResult } from '../retrieval/pipeline';
import { memoryStorage } from '../storage/database';
import { memoryRetrieval } from '../retrieval/pipeline';
import { semanticSearch } from '../semantic/search';
import { emotionalMemory } from '../emotional/engine';
import { memoryIndexing } from '../indexing/engine';
import { memorySecurity } from '../security/encryption';
import { enqueueRemoteMemorySync } from '../sync/rendererSync';

export class MemoryEngine {
  private static instance: MemoryEngine;
  private config: MemoryConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): MemoryEngine {
    if (!MemoryEngine.instance) {
      MemoryEngine.instance = new MemoryEngine();
    }
    return MemoryEngine.instance;
  }

  private loadConfig(): MemoryConfig {
    try {
      const stored = this.getStoredConfig();
      if (stored) {
        return { ...this.getDefaultConfig(), ...JSON.parse(memorySecurity.decrypt(stored)) };
      }
    } catch (error) {
      console.warn('Failed to load memory config:', error);
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): MemoryConfig {
    return {
      enabled: true,
      encryptionKey: memorySecurity.generateSecureId(),
      maxStorageSize: 100 * 1024 * 1024, // 100MB
      retentionDays: 365,
      autoBackup: true,
      semanticSearchEnabled: true,
      emotionalLearningEnabled: true,
      cloudSyncEnabled: false,
      localOnlyMode: true,
      syncRetryLimit: 5,
      neonSyncMode: 'async',
    };
  }

  private getStoredConfig(): string | null {
    try {
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        const { ipcRenderer } = require('electron');
        return ipcRenderer.invoke('get-memory-config');
      } else {
        return localStorage.getItem('shivi-memory-config');
      }
    } catch {
      return null;
    }
  }

  private saveConfig(): void {
    try {
      const encrypted = memorySecurity.encrypt(JSON.stringify(this.config));
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        const { ipcRenderer } = require('electron');
        ipcRenderer.invoke('save-memory-config', encrypted);
      } else {
        localStorage.setItem('shivi-memory-config', encrypted);
      }
    } catch (error) {
      console.error('Failed to save memory config:', error);
    }
  }

  // Core memory operations
  async storeMemory(memory: Memory): Promise<void> {
    if (!this.config.enabled) return;

    await memoryStorage.store(memory);
    memoryIndexing.indexMemory(memory);

    if (this.config.cloudSyncEnabled && !this.config.localOnlyMode) {
      await enqueueRemoteMemorySync({
        itemType: memory.type,
        itemId: memory.id,
        action: 'upsert',
        payload: memory,
      });
    }

    // Clean up old memories if needed
    await this.cleanupOldMemories();
  }

  async retrieveMemory(id: string): Promise<Memory | null> {
    return memoryStorage.retrieve(id);
  }

  async searchMemories(query: string, limit: number = 10): Promise<Memory[]> {
    if (!this.config.semanticSearchEnabled) {
      return [];
    }

    const searchResults = await semanticSearch.search(query, limit);
    return searchResults.map((result: any) => result.memory);
  }

  async deleteMemory(id: string): Promise<boolean> {
    const deleted = await memoryStorage.delete(id);
    if (deleted) {
      memoryIndexing.removeFromIndex(id);
    }
    return deleted;
  }

  // Conversation memory
  async storeConversation(
    sessionId: string,
    userMessage: string,
    shiviResponse: string,
    personalityMode: 'work' | 'care' | 'flirty',
    topics: string[] = [],
    entities: any[] = []
  ): Promise<void> {
    const conversationMemory: ConversationMemory = {
      id: memorySecurity.generateSecureId(),
      type: 'conversation',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['conversation', personalityMode, ...topics],
      emotionalContext: emotionalMemory.analyzeEmotionalState(userMessage),
      confidence: 0.9,
      sessionId,
      userMessage,
      shiviResponse,
      personalityMode,
      topics,
      entities,
      sentiment: {
        user: this.analyzeSentiment(userMessage),
        shivi: this.analyzeSentiment(shiviResponse),
      },
    };

    await this.storeMemory(conversationMemory);

    // Record emotional interaction
    await emotionalMemory.recordEmotionalInteraction(
      userMessage,
      shiviResponse,
      conversationMemory.emotionalContext!,
      personalityMode,
      true // Assume helpful for now
    );
  }

  // Reminder memory
  async storeReminder(
    title: string,
    description?: string,
    dueDate?: string,
    recurring?: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    const reminderMemory: ReminderMemory = {
      id: memorySecurity.generateSecureId(),
      type: 'reminder',
      priority: priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['reminder', priority],
      confidence: 0.95,
      title,
      description,
      content: JSON.stringify({ title, description, dueDate, recurring, priority }),
      dueDate,
      recurring,
      completed: false,
      relatedEntities: [],
    };

    await this.storeMemory(reminderMemory);
    return reminderMemory.id;
  }

  async getActiveReminders(): Promise<ReminderMemory[]> {
    const reminders = await memoryRetrieval.retrieveReminders(true);
    return reminders.filter((r: any) => r.type === 'reminder') as ReminderMemory[];
  }

  async completeReminder(id: string): Promise<boolean> {
    const reminder = await this.retrieveMemory(id);
    if (reminder && reminder.type === 'reminder') {
      reminder.completed = true;
      reminder.updatedAt = new Date().toISOString();
      await this.storeMemory(reminder);
      return true;
    }
    return false;
  }

  // Entity/Person memory
  async storeEntity(
    name: string,
    entityType: 'person' | 'place' | 'organization' | 'topic' | 'object',
    aliases: string[] = [],
    context: string = '',
    relationships: any[] = []
  ): Promise<string> {
    const entityMemory: EntityMemory = {
      id: memorySecurity.generateSecureId(),
      type: 'entity',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['entity', entityType, name.toLowerCase()],
      confidence: 0.85,
      name,
      entityType,
      aliases,
      relationships,
      lastMentioned: new Date().toISOString(),
      mentionCount: 1,
      context,
    };

    await this.storeMemory(entityMemory);
    return entityMemory.id;
  }

  async updateEntityMention(name: string): Promise<void> {
    const entities = await memoryRetrieval.retrieveEntities(name);
    if (entities.length > 0) {
      const entity = entities[0] as EntityMemory;
      entity.lastMentioned = new Date().toISOString();
      entity.mentionCount += 1;
      entity.updatedAt = new Date().toISOString();
      await this.storeMemory(entity);
    }
  }

  // Preference memory
  async storePreference(
    category: string,
    key: string,
    value: any,
    context?: string
  ): Promise<void> {
    const preferenceMemory: PreferenceMemory = {
      id: memorySecurity.generateSecureId(),
      type: 'preference',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['preference', category, key],
      confidence: 0.95,
      category: category as any,
      key,
      value,
      context,
    };

    await this.storeMemory(preferenceMemory);
  }

  async getPreference(category: string, key: string): Promise<any> {
    const preferences = await memoryStorage.query({
      type: 'preference',
      tags: [category, key],
      limit: 1,
    });

    if (preferences.length > 0 && preferences[0].type === 'preference') {
      return preferences[0].value;
    }

    return null;
  }

  // Intelligent retrieval
  async retrieveContextual(
    userMessage: string,
    conversationHistory: string[],
    personalityMode: 'work' | 'care' | 'flirty'
  ): Promise<RetrievalResult> {
    return memoryRetrieval.retrieveContextual(userMessage, conversationHistory);
  }

  // Memory maintenance
  async cleanupOldMemories(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldMemories = await memoryStorage.query({
      dateRange: {
        start: '2020-01-01T00:00:00.000Z', // Very old date
        end: cutoffDate.toISOString(),
      },
      limit: 1000,
    });

    for (const memory of oldMemories) {
      if (memory.priority !== 'critical') { // Keep critical memories
        await this.deleteMemory(memory.id);
      }
    }
  }

  async exportMemories(): Promise<string> {
    const allMemories = await memoryStorage.query({ limit: 10000 });
    return memorySecurity.encrypt(JSON.stringify({
      memories: allMemories,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }));
  }

  async importMemories(encryptedData: string): Promise<number> {
    try {
      const decrypted = memorySecurity.decrypt(encryptedData);
      const data = JSON.parse(decrypted);

      if (data.memories && Array.isArray(data.memories)) {
        let importedCount = 0;
        for (const memory of data.memories) {
          await this.storeMemory(memory);
          importedCount++;
        }
        return importedCount;
      }
    } catch (error) {
      console.error('Failed to import memories:', error);
    }
    return 0;
  }

  // Statistics and monitoring
  getStats(): MemoryStats {
    return memoryStorage.getStats();
  }

  getIndexStats() {
    return memoryIndexing.getIndexStats();
  }

  // Configuration
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  // Utility methods
  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis (in production, use proper NLP)
    const positiveWords = ['khush', 'acha', 'great', 'love', 'awesome', 'good', 'happy'];
    const negativeWords = ['sad', 'bad', 'angry', 'hate', 'terrible', 'awful', 'upset'];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.2;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.2;
    });

    return Math.max(-1, Math.min(1, score));
  }
}

// Export singleton instance
export const memoryEngine = MemoryEngine.getInstance();