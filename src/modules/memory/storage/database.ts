/**
 * Shivi AI Memory System - Encrypted Storage Layer
 * Local-first encrypted database for memory persistence
 */

import { Memory, MemoryType, MemoryQuery, MemoryStats } from '../core/types';
import { memorySecurity } from '../security/encryption';

export class MemoryStorage {
  private static instance: MemoryStorage;
  private db: Map<string, string>; // In production, use IndexedDB or SQLite
  private indexes: Map<string, Set<string>>;
  private persistentStore: any;

  private constructor() {
    // Only use electron-store in main process
    if (typeof process !== 'undefined' && process.type === 'browser') {
      const Store = require('electron-store');
      this.persistentStore = new Store({ name: 'shivi-memory-db' });
    }
    this.db = new Map();
    this.indexes = new Map();
    this.initializeIndexes();
    this.loadFromStorage();
  }

  static getInstance(): MemoryStorage {
    if (!MemoryStorage.instance) {
      MemoryStorage.instance = new MemoryStorage();
    }
    return MemoryStorage.instance;
  }

  private initializeIndexes(): void {
    // Initialize indexes for fast lookup
    this.indexes.set('type', new Set());
    this.indexes.set('tags', new Set());
    this.indexes.set('entities', new Set());
    this.indexes.set('date', new Set());
    this.indexes.set('emotional', new Set());
  }

  private loadFromStorage(): void {
    try {
      const stored = this.getFromPersistentStorage('shivi-memory-db');
      if (stored) {
        const decrypted = memorySecurity.decrypt(stored);
        const data = JSON.parse(decrypted);

        // Load memories
        if (data.memories) {
          Object.entries(data.memories).forEach(([id, memory]) => {
            const encrypted = memorySecurity.encrypt(JSON.stringify(memory));
            this.db.set(id, encrypted);
          });
        }

        // Load indexes
        if (data.indexes) {
          Object.entries(data.indexes).forEach(([indexName, indexData]) => {
            this.indexes.set(indexName, new Set(indexData as string[]));
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load memory database:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        memories: Object.fromEntries(this.db),
        indexes: Object.fromEntries(
          Array.from(this.indexes.entries()).map(([key, set]) => [key, Array.from(set)])
        ),
        lastSaved: new Date().toISOString(),
      };

      const encrypted = memorySecurity.encrypt(JSON.stringify(data));
      this.saveToPersistentStorage('shivi-memory-db', encrypted);
    } catch (error) {
      console.error('Failed to save memory database:', error);
    }
  }

  private getFromPersistentStorage(key: string): string | null {
    try {
      if (this.persistentStore && typeof process !== 'undefined' && process.type === 'browser') {
        // Electron main process - use electron-store
        return this.persistentStore.get(key) as string;
      } else if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        // Electron renderer process - use IPC
        const { ipcRenderer } = require('electron');
        return ipcRenderer.invoke('get-memory-data', key);
      } else if (typeof window !== 'undefined') {
        // Browser environment - use localStorage
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('Failed to read from persistent storage:', error);
    }
    return null;
  }

  private saveToPersistentStorage(key: string, data: string): void {
    try {
      if (this.persistentStore && typeof process !== 'undefined' && process.type === 'browser') {
        // Electron main process - use electron-store
        this.persistentStore.set(key, data);
      } else if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        // Electron renderer process
        const { ipcRenderer } = require('electron');
        ipcRenderer.invoke('save-memory-data', key, data);
      } else if (typeof window !== 'undefined') {
        // Browser environment
        localStorage.setItem(key, data);
      }
    } catch (error) {
      console.error('Failed to save to persistent storage:', error);
    }
  }

  async store(memory: Memory): Promise<void> {
    const id = memory.id;
    const encrypted = memorySecurity.encrypt(JSON.stringify(memory));

    this.db.set(id, encrypted);
    this.updateIndexes(memory);

    // Auto-save to persistent storage
    this.saveToStorage();
  }

  async retrieve(id: string): Promise<Memory | null> {
    const encrypted = this.db.get(id);
    if (!encrypted) return null;

    try {
      const decrypted = memorySecurity.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve memory:', error);
      return null;
    }
  }

  async query(query: MemoryQuery): Promise<Memory[]> {
    let candidates = new Set<string>();

    // Start with all memories if no specific filters
    if (!query.type && !query.tags && !query.keywords) {
      candidates = new Set(this.db.keys());
    } else {
      // Apply filters
      if (query.type) {
        const typeMemories = Array.from(this.indexes.get('type') || [])
          .filter(id => {
            const memory = this.retrieveSync(id);
            return memory?.type === query.type;
          });
        candidates = new Set(typeMemories);
      }

      if (query.tags && query.tags.length > 0) {
        const tagMemories = new Set<string>();
        query.tags.forEach(tag => {
          const taggedIds = Array.from(this.indexes.get('tags') || [])
            .filter(id => {
              const memory = this.retrieveSync(id);
              return memory?.tags.includes(tag);
            });
          taggedIds.forEach(id => tagMemories.add(id));
        });

        if (candidates.size > 0) {
          candidates = new Set([...candidates].filter(id => tagMemories.has(id)));
        } else {
          candidates = tagMemories;
        }
      }
    }

    // Apply date range filter
    if (query.dateRange) {
      const start = new Date(query.dateRange.start);
      const end = new Date(query.dateRange.end);

      candidates = new Set(
        Array.from(candidates).filter(id => {
          const memory = this.retrieveSync(id);
          if (!memory) return false;
          const memoryDate = new Date(memory.createdAt);
          return memoryDate >= start && memoryDate <= end;
        })
      );
    }

    // Retrieve and sort results
    const results = await Promise.all(
      Array.from(candidates).map(id => this.retrieve(id))
    );

    const validResults = results.filter((memory): memory is Memory => memory !== null);

    // Sort by relevance/confidence
    validResults.sort((a, b) => b.confidence - a.confidence);

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    return validResults.slice(offset, offset + limit);
  }

  async delete(id: string): Promise<boolean> {
    const existed = this.db.has(id);
    if (existed) {
      this.db.delete(id);
      this.removeFromIndexes(id);
      this.saveToStorage();
    }
    return existed;
  }

  async clear(): Promise<void> {
    this.db.clear();
    this.initializeIndexes();
    this.saveToStorage();
  }

  getStats(): MemoryStats {
    const memories = Array.from(this.db.keys()).map(id => this.retrieveSync(id)).filter(Boolean) as Memory[];

    const byType = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<MemoryType, number>);

    // Estimate storage size (rough calculation)
    const storageSize = JSON.stringify(Object.fromEntries(this.db)).length * 2; // Rough bytes

    return {
      totalMemories: memories.length,
      byType,
      storageSize,
      lastBackup: new Date().toISOString(),
      health: storageSize > 50 * 1024 * 1024 ? 'critical' : storageSize > 10 * 1024 * 1024 ? 'warning' : 'good',
    };
  }

  private retrieveSync(id: string): Memory | null {
    const encrypted = this.db.get(id);
    if (!encrypted) return null;

    try {
      const decrypted = memorySecurity.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  private updateIndexes(memory: Memory): void {
    // Update type index
    this.indexes.get('type')?.add(memory.id);

    // Update tags index
    memory.tags.forEach(tag => {
      this.indexes.get('tags')?.add(memory.id);
    });

    // Update date index (simplified - in production use proper date indexing)
    const dateKey = new Date(memory.createdAt).toDateString();
    this.indexes.get('date')?.add(memory.id);

    // Update emotional index
    if (memory.emotionalContext) {
      this.indexes.get('emotional')?.add(memory.id);
    }
  }

  private removeFromIndexes(id: string): void {
    this.indexes.forEach(index => {
      index.delete(id);
    });
  }
}

// Export singleton instance
export const memoryStorage = MemoryStorage.getInstance();