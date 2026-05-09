/**
 * Shivi AI Memory System - Security & Encryption
 * Privacy-first local encryption for all memory data
 */

import CryptoJS from 'crypto-js';

export class MemorySecurity {
  private static instance: MemorySecurity;
  private encryptionKey: string;
  private store: any;

  private constructor() {
    // Only use electron-store in main process
    if (typeof process !== 'undefined' && process.type === 'browser') {
      const Store = require('electron-store');
      this.store = new Store({ name: 'shivi-memory-security' });
    }
    // Generate a secure encryption key or load from secure storage
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  static getInstance(): MemorySecurity {
    if (!MemorySecurity.instance) {
      MemorySecurity.instance = new MemorySecurity();
    }
    return MemorySecurity.instance;
  }

  private getOrCreateEncryptionKey(): string {
    // In production, this should use a secure key derivation function
    // For now, we'll use a device-specific key stored securely
    const storedKey = this.getStoredKey();
    if (storedKey) {
      return storedKey;
    }

    // Generate a new key
    const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
    this.storeKey(newKey);
    return newKey;
  }

  private getStoredKey(): string | null {
    try {
      // Check if we're in Electron main process
      if (typeof process !== 'undefined' && process.type === 'browser') {
        // Main process - use electron-store
        const stored = this.store.get('encryption-key') as string;
        if (stored) {
          return CryptoJS.AES.decrypt(stored, this.getDeviceFingerprint()).toString(CryptoJS.enc.Utf8);
        }
      } else if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        // Renderer process - use IPC
        const { ipcRenderer } = require('electron');
        return ipcRenderer.invoke('get-encryption-key');
      } else if (typeof window !== 'undefined') {
        // Browser environment - use localStorage
        const stored = localStorage.getItem('shivi-memory-key');
        if (stored) {
          return CryptoJS.AES.decrypt(stored, this.getDeviceFingerprint()).toString(CryptoJS.enc.Utf8);
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve encryption key:', error);
    }
    return null;
  }

  private storeKey(key: string): void {
    try {
      // Check if we're in Electron main process
      if (typeof process !== 'undefined' && process.type === 'browser') {
        // Main process - use electron-store
        const encrypted = CryptoJS.AES.encrypt(key, this.getDeviceFingerprint()).toString();
        this.store.set('encryption-key', encrypted);
      } else if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        // Renderer process - use IPC
        const { ipcRenderer } = require('electron');
        ipcRenderer.invoke('store-encryption-key', key);
      } else if (typeof window !== 'undefined') {
        // Browser environment
        const encrypted = CryptoJS.AES.encrypt(key, this.getDeviceFingerprint()).toString();
        localStorage.setItem('shivi-memory-key', encrypted);
      }
    } catch (error) {
      console.error('Failed to store encryption key:', error);
    }
  }

  private getDeviceFingerprint(): string {
    // Create a device-specific fingerprint for additional security
    if (typeof process !== 'undefined' && process.type === 'browser') {
      // Main process - use Node.js crypto
      const crypto = require('crypto');
      const os = require('os');
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const data = `${hostname}-${platform}-${arch}`;
      return crypto.createHash('sha256').update(data).digest('hex');
    } else if (typeof document !== 'undefined') {
      // Browser/renderer environment
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx?.fillText('fingerprint', 10, 10);
      return canvas.toDataURL();
    }
    // Fallback
    return 'shivi-default-fingerprint';
  }

  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  // Secure key rotation
  rotateKey(): void {
    const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
    // In a real implementation, you'd need to re-encrypt all existing data
    this.encryptionKey = newKey;
    this.storeKey(newKey);
  }

  // Validate data integrity
  validateIntegrity(data: string, expectedHash: string): boolean {
    return this.hash(data) === expectedHash;
  }

  // Generate secure random ID
  generateSecureId(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }
}

// Export singleton instance
export const memorySecurity = MemorySecurity.getInstance();