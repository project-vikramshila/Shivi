/**
 * AI Cache Engine - Response Caching for Performance
 * Caches AI responses to reduce API calls and improve latency
 */

interface CacheEntry {
  response: string;
  provider: string;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class AICache {
  private static instance: AICache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache();
    }
    return AICache.instance;
  }

  async getCachedResponse(message: string): Promise<string | null> {
    const key = this.generateKey(message);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  async cacheResponse(message: string, response: string, provider: string, ttl?: number): Promise<void> {
    const key = this.generateKey(message);
    const entry: CacheEntry = {
      response,
      provider,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };

    this.cache.set(key, entry);

    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  private generateKey(message: string): string {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses for real hit rate
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = AICache.getInstance();