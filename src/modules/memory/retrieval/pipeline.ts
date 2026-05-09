/**
 * Shivi AI Memory System - Retrieval Pipeline
 * Orchestrates memory retrieval across all memory types
 */

import { Memory, MemoryQuery, MemorySearchResult } from '../core/types';
import { memoryStorage } from '../storage/database';
import { semanticSearch } from '../semantic/search';
import { emotionalMemory } from '../emotional/engine';

export interface RetrievalContext {
  userMessage: string;
  conversationHistory: string[];
  personalityMode: 'work' | 'care' | 'flirty';
  timeFrame?: 'recent' | 'today' | 'week' | 'month' | 'all';
  emotionalContext?: string;
}

export interface RetrievalResult {
  relevantMemories: Memory[];
  searchResults: MemorySearchResult[];
  emotionalContext: any;
  suggestedResponses: string[];
  confidence: number;
}

export class MemoryRetrievalPipeline {
  private static instance: MemoryRetrievalPipeline;

  private constructor() {}

  static getInstance(): MemoryRetrievalPipeline {
    if (!MemoryRetrievalPipeline.instance) {
      MemoryRetrievalPipeline.instance = new MemoryRetrievalPipeline();
    }
    return MemoryRetrievalPipeline.instance;
  }

  // Main retrieval pipeline
  async retrieve(context: RetrievalContext): Promise<RetrievalResult> {
    const {
      userMessage,
      conversationHistory,
      personalityMode,
      timeFrame = 'all',
      emotionalContext,
    } = context;

    // Step 1: Analyze intent and extract keywords
    const intent = this.analyzeIntent(userMessage);
    const keywords = this.extractKeywords(userMessage);

    // Step 2: Build memory query
    const query = this.buildQuery(intent, keywords, timeFrame);

    // Step 3: Retrieve memories
    const memories = await memoryStorage.query(query);

    // Step 4: Semantic search
    const searchResults = await semanticSearch.searchContextual(
      userMessage,
      conversationHistory,
      10
    );

    // Step 5: Get emotional context
    const currentEmotionalState = emotionalMemory.analyzeEmotionalState(userMessage);
    const emotionalAdaptation = emotionalMemory.getEmotionalAdaptation(currentEmotionalState);

    // Step 6: Rank and filter results
    const rankedMemories = this.rankMemories(memories, searchResults, intent);
    const relevantMemories = rankedMemories.slice(0, 5);

    // Step 7: Generate response suggestions
    const suggestedResponses = this.generateSuggestions(relevantMemories, intent, personalityMode);

    // Step 8: Calculate overall confidence
    const confidence = this.calculateConfidence(relevantMemories, searchResults);

    return {
      relevantMemories,
      searchResults,
      emotionalContext: {
        currentEmotion: currentEmotionalState,
        adaptation: emotionalAdaptation,
      },
      suggestedResponses,
      confidence,
    };
  }

  // Specialized retrieval for specific use cases
  async retrieveConversations(query: string, limit: number = 10): Promise<Memory[]> {
    const searchResults = await semanticSearch.search(query, limit * 2);
    const conversationMemories = searchResults
      .filter(result => result.memory.type === 'conversation')
      .map(result => result.memory);

    return conversationMemories.slice(0, limit);
  }

  async retrieveReminders(activeOnly: boolean = true): Promise<Memory[]> {
    const query: MemoryQuery = {
      type: 'reminder',
      limit: 50,
    };

    const reminders = await memoryStorage.query(query);

    if (activeOnly) {
      return reminders.filter(reminder =>
        reminder.type === 'reminder' && !reminder.completed
      );
    }

    return reminders;
  }

  async retrieveEntities(name: string): Promise<Memory[]> {
    const searchResults = await semanticSearch.search(name, 10);
    return searchResults
      .filter(result => result.memory.type === 'entity')
      .map(result => result.memory);
  }

  async retrieveByTimeframe(hours: number): Promise<Memory[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return memoryStorage.query({
      dateRange: {
        start: startTime.toISOString(),
        end: new Date().toISOString(),
      },
      limit: 50,
    });
  }

  // Context-aware retrieval for conversation continuity
  async retrieveContextual(userMessage: string, recentHistory: string[]): Promise<RetrievalResult> {
    const context: RetrievalContext = {
      userMessage,
      conversationHistory: recentHistory,
      personalityMode: 'care', // Default, will be updated by personality engine
      timeFrame: 'recent',
    };

    return this.retrieve(context);
  }

  private analyzeIntent(message: string): 'recall' | 'remind' | 'question' | 'general' {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('yaad') || lowerMessage.includes('recall') ||
        lowerMessage.includes('last time') || lowerMessage.includes('previously')) {
      return 'recall';
    }

    if (lowerMessage.includes('remind') || lowerMessage.includes('reminder') ||
        lowerMessage.includes('yaad dilana')) {
      return 'remind';
    }

    if (lowerMessage.includes('?') || lowerMessage.includes('kya') ||
        lowerMessage.includes('kaise') || lowerMessage.includes('why')) {
      return 'question';
    }

    return 'general';
  }

  private extractKeywords(message: string): string[] {
    const lowerMessage = message.toLowerCase();

    // Remove common Hindi/English stop words
    const stopWords = ['hai', 'hoon', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

    const words = lowerMessage
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter(word => !word.includes('?') && !word.includes('!'));

    // Extract proper nouns (capitalized words) and important terms
    const keywords: string[] = [];
    words.forEach(word => {
      if (word.length > 3 || /^[A-Z]/.test(word)) {
        keywords.push(word);
      }
    });

    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  private buildQuery(intent: string, keywords: string[], timeFrame: string): MemoryQuery {
    const query: MemoryQuery = {
      limit: 20,
    };

    // Add keywords as tags
    if (keywords.length > 0) {
      query.tags = keywords;
    }

    // Add time-based filtering
    if (timeFrame !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeFrame) {
        case 'recent':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
          break;
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      query.dateRange = {
        start: startDate.toISOString(),
        end: now.toISOString(),
      };
    }

    return query;
  }

  private rankMemories(
    memories: Memory[],
    searchResults: MemorySearchResult[],
    intent: string
  ): Memory[] {
    const scoredMemories = memories.map(memory => {
      let score = memory.confidence;

      // Boost based on search relevance
      const searchResult = searchResults.find(result => result.memory.id === memory.id);
      if (searchResult) {
        score += searchResult.relevance * 0.3;
      }

      // Boost based on recency
      const ageInHours = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyBoost = Math.max(0, 1 - ageInHours / 168); // 168 hours = 1 week
      score += recencyBoost * 0.2;

      // Intent-based boosting
      switch (intent) {
        case 'recall':
          if (memory.type === 'conversation') score += 0.3;
          break;
        case 'remind':
          if (memory.type === 'reminder') score += 0.4;
          break;
        case 'question':
          if (memory.type === 'semantic') score += 0.2;
          break;
      }

      return { memory, score };
    });

    return scoredMemories
      .sort((a, b) => b.score - a.score)
      .map(item => item.memory);
  }

  private generateSuggestions(
    memories: Memory[],
    intent: string,
    personalityMode: 'work' | 'care' | 'flirty'
  ): string[] {
    const suggestions: string[] = [];

    for (const memory of memories.slice(0, 3)) {
      switch (memory.type) {
        case 'conversation':
          if (intent === 'recall') {
            suggestions.push(`Last time we talked about ${memory.topics.slice(0, 2).join(', ')}`);
          }
          break;
        case 'reminder':
          if (intent === 'remind') {
            suggestions.push(`You have a reminder: ${memory.title}`);
          }
          break;
        case 'entity':
          suggestions.push(`${memory.name} was mentioned recently`);
          break;
      }
    }

    return suggestions.slice(0, 3);
  }

  private calculateConfidence(memories: Memory[], searchResults: MemorySearchResult[]): number {
    if (memories.length === 0) return 0;

    const avgMemoryConfidence = memories.reduce((sum, mem) => sum + mem.confidence, 0) / memories.length;
    const avgSearchRelevance = searchResults.length > 0
      ? searchResults.reduce((sum, result) => sum + result.relevance, 0) / searchResults.length
      : 0;

    return Math.min(1.0, (avgMemoryConfidence * 0.6 + avgSearchRelevance * 0.4));
  }
}

// Export singleton instance
export const memoryRetrieval = MemoryRetrievalPipeline.getInstance();