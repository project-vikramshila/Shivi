/**
 * Shivi AI Memory System - Semantic Search Engine
 * Intelligent meaning-based memory retrieval
 */

import { Memory, MemorySearchResult, SemanticMemory } from '../core/types';
import { memoryStorage } from '../storage/database';

export class SemanticSearch {
  private static instance: SemanticSearch;

  private constructor() {}

  static getInstance(): SemanticSearch {
    if (!SemanticSearch.instance) {
      SemanticSearch.instance = new SemanticSearch();
    }
    return SemanticSearch.instance;
  }

  // Simple semantic search (in production, use proper embeddings like OpenAI or local models)
  async search(query: string, limit: number = 10): Promise<MemorySearchResult[]> {
    const allMemories = await memoryStorage.query({ limit: 1000 });
    const results: MemorySearchResult[] = [];

    for (const memory of allMemories) {
      const relevance = this.calculateRelevance(query, memory);
      if (relevance > 0.1) { // Minimum relevance threshold
        const highlights = this.extractHighlights(query, memory);
        results.push({
          memory,
          relevance,
          highlights,
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return results.slice(0, limit);
  }

  private calculateRelevance(query: string, memory: Memory): number {
    const queryLower = query.toLowerCase();
    const content = this.extractSearchableContent(memory).toLowerCase();

    // Exact phrase match (highest weight)
    if (content.includes(queryLower)) {
      return 1.0;
    }

    // Word-level matching
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const contentWords = content.split(/\s+/);

    let wordMatches = 0;
    let totalWords = queryWords.length;

    for (const queryWord of queryWords) {
      // Exact word match
      if (contentWords.includes(queryWord)) {
        wordMatches += 1;
      }
      // Partial match (fuzzy)
      else if (contentWords.some(word => word.includes(queryWord) || queryWord.includes(word))) {
        wordMatches += 0.7;
      }
    }

    const wordRelevance = totalWords > 0 ? wordMatches / totalWords : 0;

    // Boost for recent memories
    const ageInDays = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 1 - ageInDays / 30); // Boost recent memories

    // Boost for high confidence memories
    const confidenceBoost = memory.confidence;

    // Type-specific boosts
    let typeBoost = 1.0;
    switch (memory.type) {
      case 'conversation':
        typeBoost = 0.8; // Conversations are very relevant
        break;
      case 'reminder':
        typeBoost = 1.2; // Reminders are important
        break;
      case 'entity':
        typeBoost = 0.9; // Entities are useful for context
        break;
      case 'emotional':
        typeBoost = 0.7; // Emotional context is supportive
        break;
    }

    return (wordRelevance * 0.6 + recencyBoost * 0.2 + confidenceBoost * 0.1 + typeBoost * 0.1);
  }

  private extractSearchableContent(memory: Memory): string {
    switch (memory.type) {
      case 'conversation':
        return `${memory.userMessage} ${memory.shiviResponse} ${memory.topics.join(' ')}`;
      case 'reminder':
        return `${memory.title} ${memory.description || ''}`;
      case 'entity':
        return `${memory.name} ${memory.aliases.join(' ')} ${memory.context}`;
      case 'preference':
        return `${memory.key} ${memory.value} ${memory.context || ''}`;
      case 'emotional':
        return `${memory.pattern.primaryEmotion} ${memory.triggers.join(' ')}`;
      case 'semantic':
        return `${memory.content} ${memory.keywords.join(' ')} ${memory.summary}`;
      default:
        return '';
    }
  }

  private extractHighlights(query: string, memory: Memory): string[] {
    const content = this.extractSearchableContent(memory);
    const highlights: string[] = [];
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);

    for (const word of queryWords) {
      const index = content.toLowerCase().indexOf(word);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(content.length, index + word.length + 20);
        const highlight = content.substring(start, end);
        highlights.push(highlight);
      }
    }

    return highlights.slice(0, 3); // Limit to 3 highlights
  }

  // Find related memories based on content similarity
  async findRelated(memory: Memory, limit: number = 5): Promise<Memory[]> {
    const content = this.extractSearchableContent(memory);
    const results = await this.search(content, limit + 1); // +1 to exclude self

    return results
      .filter(result => result.memory.id !== memory.id)
      .map(result => result.memory);
  }

  // Contextual search for conversation continuity
  async searchContextual(query: string, conversationHistory: string[], limit: number = 5): Promise<MemorySearchResult[]> {
    // Combine query with recent conversation context
    const contextualQuery = `${query} ${conversationHistory.slice(-3).join(' ')}`;
    return this.search(contextualQuery, limit);
  }

  // Time-based search
  async searchByTimeframe(query: string, hoursBack: number, limit: number = 10): Promise<MemorySearchResult[]> {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const memories = await memoryStorage.query({
      dateRange: {
        start: startTime.toISOString(),
        end: new Date().toISOString(),
      },
      limit: 100,
    });

    const results: MemorySearchResult[] = [];
    for (const memory of memories) {
      const relevance = this.calculateRelevance(query, memory);
      if (relevance > 0.1) {
        const highlights = this.extractHighlights(query, memory);
        results.push({
          memory,
          relevance,
          highlights,
        });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, limit);
  }
}

// Export singleton instance
export const semanticSearch = SemanticSearch.getInstance();