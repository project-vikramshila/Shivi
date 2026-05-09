/**
 * Shivi AI Memory System - Core Types and Interfaces
 * Local-first, encrypted, privacy-first memory architecture
 */

export type MemoryType = 'conversation' | 'preference' | 'reminder' | 'emotional' | 'semantic' | 'entity';

export type MemoryPriority = 'low' | 'medium' | 'high' | 'critical';

export type EmotionalState = 'happy' | 'sad' | 'angry' | 'anxious' | 'excited' | 'neutral' | 'stressed' | 'calm';

export type MemoryMetadata = {
  id: string;
  type: MemoryType;
  priority: MemoryPriority;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  tags: string[];
  emotionalContext?: EmotionalState;
  confidence: number; // 0-1, how confident we are in this memory
};

export type ConversationMemory = MemoryMetadata & {
  type: 'conversation';
  sessionId: string;
  userMessage: string;
  shiviResponse: string;
  personalityMode: 'work' | 'care' | 'flirty';
  topics: string[];
  entities: EntityReference[];
  sentiment: {
    user: number; // -1 to 1
    shivi: number; // -1 to 1
  };
};

export type PreferenceMemory = MemoryMetadata & {
  type: 'preference';
  category: 'communication' | 'personality' | 'ui' | 'behavior';
  key: string;
  value: any;
  context?: string;
};

export type ReminderMemory = MemoryMetadata & {
  type: 'reminder';
  title: string;
  description?: string;
  content: string;
  dueDate?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntities: EntityReference[];
};

export type EmotionalMemory = MemoryMetadata & {
  type: 'emotional';
  pattern: EmotionalPattern;
  triggers: string[];
  responses: EmotionalResponse[];
  adaptation: EmotionalAdaptation;
};

export type SemanticMemory = MemoryMetadata & {
  type: 'semantic';
  content: string;
  embeddings: number[]; // Vector embeddings for semantic search
  keywords: string[];
  summary: string;
  relatedMemories: string[]; // IDs of related memories
};

export type EntityMemory = MemoryMetadata & {
  type: 'entity';
  name: string;
  entityType: 'person' | 'place' | 'organization' | 'topic' | 'object';
  aliases: string[];
  relationships: EntityRelationship[];
  lastMentioned: string;
  mentionCount: number;
  context: string;
};

export type EntityReference = {
  id: string;
  name: string;
  type: 'person' | 'place' | 'organization' | 'topic' | 'object';
  confidence: number;
};

export type EntityRelationship = {
  targetId: string;
  type: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'mentioned_with';
  strength: number; // 0-1
};

export type EmotionalPattern = {
  primaryEmotion: EmotionalState;
  intensity: number; // 0-1
  triggers: string[];
  frequency: number; // How often this pattern occurs
  lastObserved: string;
};

export type EmotionalResponse = {
  trigger: string;
  response: string;
  effectiveness: number; // 0-1, how well this response worked
  usedCount: number;
};

export type EmotionalAdaptation = {
  preferredTone: 'work' | 'care' | 'flirty';
  responseStyle: 'concise' | 'detailed' | 'playful';
  reminderStyle: 'gentle' | 'firm' | 'playful';
  lastAdapted: string;
};

export type MemoryQuery = {
  type?: MemoryType;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  emotionalContext?: EmotionalState;
  keywords?: string[];
  entities?: string[];
  limit?: number;
  offset?: number;
};

export type MemorySearchResult = {
  memory: Memory;
  relevance: number;
  highlights: string[];
};

export type Memory = ConversationMemory | PreferenceMemory | ReminderMemory | EmotionalMemory | SemanticMemory | EntityMemory;

export type MemoryStats = {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  storageSize: number;
  lastBackup: string;
  health: 'good' | 'warning' | 'critical';
};

export type MemoryConfig = {
  enabled: boolean;
  encryptionKey: string;
  maxStorageSize: number; // MB
  retentionDays: number;
  autoBackup: boolean;
  semanticSearchEnabled: boolean;
  emotionalLearningEnabled: boolean;
  cloudSyncEnabled: boolean;
  localOnlyMode: boolean;
  syncRetryLimit: number;
  neonSyncMode: 'immediate' | 'async' | 'manual';
};