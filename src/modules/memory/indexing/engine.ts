/**
 * Shivi AI Memory System - Indexing Engine
 * Fast lookup and indexing for memory retrieval
 */

import { Memory, EntityReference } from '../core/types';
import { memoryStorage } from '../storage/database';

export interface MemoryIndex {
  byType: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
  byEntity: Map<string, Set<string>>;
  byDate: Map<string, Set<string>>;
  byTopic: Map<string, Set<string>>;
  byEmotion: Map<string, Set<string>>;
  reverseIndex: Map<string, Set<string>>; // word -> memory IDs
}

export class MemoryIndexingEngine {
  private static instance: MemoryIndexingEngine;
  private index: MemoryIndex;
  private isIndexing: boolean = false;

  private constructor() {
    this.index = this.initializeIndex();
    this.buildIndex();
  }

  static getInstance(): MemoryIndexingEngine {
    if (!MemoryIndexingEngine.instance) {
      MemoryIndexingEngine.instance = new MemoryIndexingEngine();
    }
    return MemoryIndexingEngine.instance;
  }

  private initializeIndex(): MemoryIndex {
    return {
      byType: new Map(),
      byTag: new Map(),
      byEntity: new Map(),
      byDate: new Map(),
      byTopic: new Map(),
      byEmotion: new Map(),
      reverseIndex: new Map(),
    };
  }

  private async buildIndex(): Promise<void> {
    if (this.isIndexing) return;

    this.isIndexing = true;
    try {
      const allMemories = await memoryStorage.query({ limit: 10000 }); // Get all memories

      for (const memory of allMemories) {
        this.doIndexMemory(memory);
      }
    } catch (error) {
      console.error('Failed to build memory index:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  private doIndexMemory(memory: Memory): void {
    const id = memory.id;

    // Index by type
    this.addToIndex(this.index.byType, memory.type, id);

    // Index by tags
    if (memory.tags && Array.isArray(memory.tags)) {
      memory.tags.forEach(tag => {
        this.addToIndex(this.index.byTag, tag, id);
      });
    }

    // Index by date (YYYY-MM-DD format)
    try {
      const createdAt = memory.createdAt || new Date().toISOString();
      if (!Number.isNaN(Date.parse(createdAt))) {
        const date = new Date(createdAt).toISOString().split('T')[0];
        this.addToIndex(this.index.byDate, date, id);
      }
    } catch (error) {
      console.warn(`Invalid date for memory ${id}:`, memory.createdAt);
    }

    // Index by emotional context
    if (memory.emotionalContext) {
      this.addToIndex(this.index.byEmotion, memory.emotionalContext, id);
    }

    // Type-specific indexing
    switch (memory.type) {
      case 'conversation':
        // Index topics
        memory.topics.forEach(topic => {
          this.addToIndex(this.index.byTopic, topic, id);
        });

        // Index entities
        memory.entities.forEach(entity => {
          this.addToIndex(this.index.byEntity, entity.name, id);
        });

        // Build reverse index for conversation content
        this.buildReverseIndex(memory.userMessage + ' ' + memory.shiviResponse, id);
        break;

      case 'reminder':
        // Index reminder content
        this.buildReverseIndex(memory.title + ' ' + (memory.description || ''), id);
        break;

      case 'entity':
        // Index entity information
        this.buildReverseIndex(
          memory.name + ' ' + memory.aliases.join(' ') + ' ' + memory.context,
          id
        );
        break;

      case 'semantic':
        // Index semantic content
        this.buildReverseIndex(
          memory.content + ' ' + memory.keywords.join(' ') + ' ' + memory.summary,
          id
        );
        break;
    }
  }

  private addToIndex(indexMap: Map<string, Set<string>>, key: string, memoryId: string): void {
    if (!indexMap.has(key)) {
      indexMap.set(key, new Set());
    }
    indexMap.get(key)!.add(memoryId);
  }

  private buildReverseIndex(text: string, memoryId: string): void {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
      .filter(word => word.length > 0);

    words.forEach(word => {
      this.addToIndex(this.index.reverseIndex, word, memoryId);
    });
  }

  // Query the index
  queryIndex(query: {
    type?: string;
    tags?: string[];
    entities?: string[];
    topics?: string[];
    emotions?: string[];
    dateRange?: { start: string; end: string };
    keywords?: string[];
  }): Set<string> {
    let resultIds = new Set<string>();

    // Start with all memories if no filters
    if (!query.type && !query.tags && !query.entities && !query.topics && !query.emotions && !query.keywords) {
      // Get all indexed IDs
      const allIds = new Set<string>();
      this.index.byType.forEach(typeSet => {
        typeSet.forEach(id => allIds.add(id));
      });
      resultIds = allIds;
    }

    // Apply type filter
    if (query.type) {
      const typeIds = this.index.byType.get(query.type) || new Set();
      if (resultIds.size === 0) {
        resultIds = new Set(typeIds);
      } else {
        resultIds = new Set([...resultIds].filter(id => typeIds.has(id)));
      }
    }

    // Apply tag filters
    if (query.tags && query.tags.length > 0) {
      const tagIds = new Set<string>();
      query.tags.forEach(tag => {
        const tagSet = this.index.byTag.get(tag) || new Set();
        tagSet.forEach(id => tagIds.add(id));
      });

      if (resultIds.size === 0) {
        resultIds = tagIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => tagIds.has(id)));
      }
    }

    // Apply entity filters
    if (query.entities && query.entities.length > 0) {
      const entityIds = new Set<string>();
      query.entities.forEach(entity => {
        const entitySet = this.index.byEntity.get(entity) || new Set();
        entitySet.forEach(id => entityIds.add(id));
      });

      if (resultIds.size === 0) {
        resultIds = entityIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => entityIds.has(id)));
      }
    }

    // Apply topic filters
    if (query.topics && query.topics.length > 0) {
      const topicIds = new Set<string>();
      query.topics.forEach(topic => {
        const topicSet = this.index.byTopic.get(topic) || new Set();
        topicSet.forEach(id => topicIds.add(id));
      });

      if (resultIds.size === 0) {
        resultIds = topicIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => topicIds.has(id)));
      }
    }

    // Apply emotion filters
    if (query.emotions && query.emotions.length > 0) {
      const emotionIds = new Set<string>();
      query.emotions.forEach(emotion => {
        const emotionSet = this.index.byEmotion.get(emotion) || new Set();
        emotionSet.forEach(id => emotionIds.add(id));
      });

      if (resultIds.size === 0) {
        resultIds = emotionIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => emotionIds.has(id)));
      }
    }

    // Apply keyword filters using reverse index
    if (query.keywords && query.keywords.length > 0) {
      const keywordIds = new Set<string>();
      query.keywords.forEach(keyword => {
        const keywordSet = this.index.reverseIndex.get(keyword.toLowerCase()) || new Set();
        keywordSet.forEach(id => keywordIds.add(id));
      });

      if (resultIds.size === 0) {
        resultIds = keywordIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => keywordIds.has(id)));
      }
    }

    // Apply date range filter
    if (query.dateRange) {
      const startDate = new Date(query.dateRange.start);
      const endDate = new Date(query.dateRange.end);
      const dateIds = new Set<string>();

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dateSet = this.index.byDate.get(dateStr) || new Set();
        dateSet.forEach(id => dateIds.add(id));
      }

      if (resultIds.size === 0) {
        resultIds = dateIds;
      } else {
        resultIds = new Set([...resultIds].filter(id => dateIds.has(id)));
      }
    }

    return resultIds;
  }

  // Add new memory to index
  indexMemory(memory: Memory): void {
    this.doIndexMemory(memory);
  }

  // Remove memory from index
  removeFromIndex(memoryId: string): void {
    // Remove from all index sets
    Object.values(this.index).forEach(indexMap => {
      indexMap.forEach((set: Set<string>) => {
        set.delete(memoryId);
      });
    });
  }

  // Rebuild index (expensive operation)
  async rebuildIndex(): Promise<void> {
    this.index = this.initializeIndex();
    await this.buildIndex();
  }

  // Get index statistics
  getIndexStats(): {
    totalIndexedMemories: number;
    typesCount: number;
    tagsCount: number;
    entitiesCount: number;
    topicsCount: number;
    emotionsCount: number;
    reverseIndexSize: number;
  } {
    const allIds = new Set<string>();
    this.index.byType.forEach(typeSet => {
      typeSet.forEach(id => allIds.add(id));
    });

    return {
      totalIndexedMemories: allIds.size,
      typesCount: this.index.byType.size,
      tagsCount: this.index.byTag.size,
      entitiesCount: this.index.byEntity.size,
      topicsCount: this.index.byTopic.size,
      emotionsCount: this.index.byEmotion.size,
      reverseIndexSize: this.index.reverseIndex.size,
    };
  }
}

// Export singleton instance
export const memoryIndexing = MemoryIndexingEngine.getInstance();