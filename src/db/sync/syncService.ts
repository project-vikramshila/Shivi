import { dbConfig } from '../config';
import { memoryRepository } from '../repositories/memoryRepository';
import { dbEncryption } from '../security/encryption';

export type SyncQueueItem = {
  id: string;
  itemType: string;
  itemId: string;
  action: string;
  payload: any;
  status: 'pending' | 'failed' | 'complete';
  retryCount: number;
  lastAttempt?: string;
  nextAttempt?: string;
};

export type SyncStatus = {
  queueLength: number;
  lastSync?: string;
  online: boolean;
  state: 'idle' | 'running' | 'error';
};

const isElectron = typeof process !== 'undefined' && !!process.versions?.electron;

class SyncService {
  private queue: SyncQueueItem[] = [];
  private status: SyncStatus = { queueLength: 0, online: false, state: 'idle' };
  private refreshInterval = 1000 * 20;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadQueue();
    if (dbConfig.cloudSyncEnabled && !dbConfig.localOnlyMode) {
      this.startBackgroundSync();
    }
  }

  getStatus(): SyncStatus {
    return { ...this.status, queueLength: this.queue.length };
  }

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount'>) {
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      status: 'pending',
      retryCount: 0,
      lastAttempt: undefined,
      nextAttempt: undefined,
      ...item,
    };

    this.queue.push(queueItem);
    this.status.queueLength = this.queue.length;
    this.persistQueue();

    if (dbConfig.cloudSyncEnabled && !dbConfig.localOnlyMode) {
      await this.processQueue();
    }

    return queueItem;
  }

  async processQueue() {
    if (!dbConfig.cloudSyncEnabled || dbConfig.localOnlyMode) {
      return;
    }

    if (this.status.state === 'running') {
      return;
    }

    this.status.state = 'running';
    this.status.online = await this.checkOnline();

    if (!this.status.online) {
      this.status.state = 'idle';
      return;
    }

    for (const item of [...this.queue]) {
      if (item.status !== 'pending') continue;

      try {
        await this.syncItem(item);
        item.status = 'complete';
      } catch (error) {
        item.status = 'failed';
        item.retryCount += 1;
        item.nextAttempt = new Date(Date.now() + 1000 * 60 * Math.min(item.retryCount + 1, dbConfig.syncRetryLimit)).toISOString();
      }
    }

    this.queue = this.queue.filter((item) => item.status !== 'complete' || item.retryCount < dbConfig.syncRetryLimit);
    this.status.queueLength = this.queue.length;
    this.status.lastSync = new Date().toISOString();
    this.status.state = 'idle';
    this.persistQueue();
  }

  private async syncItem(item: SyncQueueItem) {
    switch (item.itemType) {
      case 'conversation':
        await memoryRepository.createConversation(item.payload.userId, item.payload.sessionId, item.payload);
        break;
      case 'message':
        await memoryRepository.appendMessage(item.payload.conversationId, item.payload.role, item.payload.content, item.payload.metadata, item.payload.sentiment);
        break;
      case 'reminder':
        await memoryRepository.createReminder(item.payload.userId, item.payload);
        break;
      case 'embedding':
        await memoryRepository.createEmbedding(item.payload.memoryType, item.payload.memoryId, item.payload.embedding, item.payload.summary, item.payload.keywords, item.payload.metadata);
        break;
      default:
        throw new Error(`Unsupported sync item type: ${item.itemType}`);
    }

    await memoryRepository.recordAudit(item.payload.userId || null, 'sync', {
      itemType: item.itemType,
      itemId: item.itemId,
      action: item.action,
    }, 'neon');
  }

  private async checkOnline(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.onLine;
    }

    try {
      const dns = await import('dns');
      return new Promise((resolve) => {
        dns.resolve('www.google.com', (err) => {
          resolve(!err);
        });
      });
    } catch {
      return false;
    }
  }

  private persistQueue() {
    try {
      const payload = JSON.stringify(this.queue.map((item) => ({
        ...item,
        payload: dbEncryption.encrypt(JSON.stringify(item.payload)),
      })));

      if (isElectron) {
        const Store = require('electron-store');
        const store = new Store({ name: 'shivi-sync-queue' });
        store.set('queue', payload);
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem('shivi-sync-queue', payload);
      }
    } catch (error) {
      console.warn('Unable to persist sync queue', error);
    }
  }

  private loadQueue() {
    try {
      let raw: string | null = null;
      if (isElectron) {
        const Store = require('electron-store');
        const store = new Store({ name: 'shivi-sync-queue' });
        raw = store.get('queue', null);
      } else if (typeof window !== 'undefined') {
        raw = window.localStorage.getItem('shivi-sync-queue');
      }

      if (!raw) return;

      const items = JSON.parse(raw) as Array<any>;
      this.queue = items.map((item) => ({
        ...item,
        payload: JSON.parse(dbEncryption.decrypt(item.payload)),
      }));
      this.status.queueLength = this.queue.length;
    } catch {
      this.queue = [];
    }
  }

  startBackgroundSync() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.processQueue();
    }, this.refreshInterval);
  }
}

export const syncService = new SyncService();
