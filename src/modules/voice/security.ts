/**
 * Voice Security & Privacy
 * Privacy-first voice processing with permission controls
 */

import type { PrivacySettings } from './types';

export class VoiceSecurityManager {
  private privacySettings: PrivacySettings;
  private temporaryStorage: Map<string, ArrayBuffer> = new Map();
  private permissionGranted = false;
  private isRecording = false;

  constructor() {
    this.privacySettings = {
      allowRecording: false,
      allowStorage: false,
      allowCloudProcessing: false,
      retentionPeriod: 0, // No retention by default
      anonymizeData: true,
    };
  }

  async initialize(): Promise<void> {
    // Load privacy settings from secure storage
    await this.loadPrivacySettings();

    // Check microphone permission status
    await this.checkMicrophonePermission();
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        // Fallback for browsers without permissions API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        this.permissionGranted = true;
        return true;
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.permissionGranted = permission.state === 'granted';
      return this.permissionGranted;

    } catch (error) {
      console.warn('Failed to check microphone permission:', error);
      this.permissionGranted = false;
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      this.permissionGranted = true;
      return true;

    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.permissionGranted = false;
      return false;
    }
  }

  hasMicrophonePermission(): boolean {
    return this.permissionGranted;
  }

  async encryptAudioData(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.privacySettings.allowStorage) {
      throw new Error('Audio storage not permitted by privacy settings');
    }

    // Simple XOR encryption for demonstration
    // In production, use proper encryption like AES-GCM
    const key = await this.generateEncryptionKey();
    const encrypted = new ArrayBuffer(data.byteLength);
    const dataView = new Uint8Array(data);
    const encryptedView = new Uint8Array(encrypted);
    const keyView = new Uint8Array(key);

    for (let i = 0; i < dataView.length; i++) {
      encryptedView[i] = dataView[i] ^ keyView[i % keyView.length];
    }

    return encrypted;
  }

  async decryptAudioData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Same process for XOR decryption
    return this.encryptAudioData(data);
  }

  private async generateEncryptionKey(): Promise<ArrayBuffer> {
    // Generate a simple key from user-specific data
    // In production, use proper key derivation
    const keyData = 'shivi-voice-privacy-key-' + Date.now().toString();
    const encoder = new TextEncoder();
    return encoder.encode(keyData).buffer;
  }

  async storeAudioData(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.privacySettings.allowStorage) {
      throw new Error('Audio storage not permitted by privacy settings');
    }

    if (this.privacySettings.anonymizeData) {
      // Remove any identifiable information
      // In practice, this would strip metadata, timestamps, etc.
    }

    const encrypted = await this.encryptAudioData(data);
    this.temporaryStorage.set(key, encrypted);

    // Schedule automatic cleanup
    if (this.privacySettings.retentionPeriod > 0) {
      setTimeout(() => {
        this.temporaryStorage.delete(key);
      }, this.privacySettings.retentionPeriod * 60 * 1000); // Convert minutes to ms
    }
  }

  async retrieveAudioData(key: string): Promise<ArrayBuffer | null> {
    const encrypted = this.temporaryStorage.get(key);
    if (!encrypted) return null;

    return this.decryptAudioData(encrypted);
  }

  async clearStoredData(): Promise<void> {
    this.temporaryStorage.clear();
  }

  async clearExpiredData(): Promise<void> {
    // In a real implementation, this would check timestamps
    // For now, clear all temporary data
    await this.clearStoredData();
  }

  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };

    // If storage is disabled, clear existing data
    if (!settings.allowStorage) {
      this.clearStoredData();
    }

    // Save settings to persistent storage
    this.savePrivacySettings();
  }

  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  validatePrivacySettings(): boolean {
    // Validate that settings are consistent and secure
    const settings = this.privacySettings;

    // If cloud processing is disabled, ensure no cloud features are enabled
    if (!settings.allowCloudProcessing) {
      // Additional validation could go here
    }

    // If retention is 0, ensure no storage
    if (settings.retentionPeriod === 0 && settings.allowStorage) {
      return false; // Inconsistent settings
    }

    return true;
  }

  // Privacy monitoring
  startPrivacyMonitoring(): void {
    // Monitor for privacy violations
    setInterval(() => {
      this.checkPrivacyCompliance();
    }, 60000); // Check every minute
  }

  private async checkPrivacyCompliance(): Promise<void> {
    // Check if we're complying with privacy settings

    // Clear expired data
    await this.clearExpiredData();

    // Check storage size limits
    const storageSize = this.calculateStorageSize();
    if (storageSize > 50 * 1024 * 1024) { // 50MB limit
      console.warn('Voice storage size limit exceeded, clearing old data');
      await this.clearStoredData();
    }

    // Validate settings
    if (!this.validatePrivacySettings()) {
      console.error('Privacy settings are inconsistent');
      // Reset to secure defaults
      this.resetToSecureDefaults();
    }
  }

  private calculateStorageSize(): number {
    let totalSize = 0;
    for (const data of this.temporaryStorage.values()) {
      totalSize += data.byteLength;
    }
    return totalSize;
  }

  private resetToSecureDefaults(): void {
    this.privacySettings = {
      allowRecording: false,
      allowStorage: false,
      allowCloudProcessing: false,
      retentionPeriod: 0,
      anonymizeData: true,
    };
  }

  private async loadPrivacySettings(): Promise<void> {
    try {
      // Load from secure storage (placeholder)
      const stored = localStorage.getItem('shivi-voice-privacy');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.privacySettings = { ...this.privacySettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load privacy settings:', error);
    }
  }

  private async savePrivacySettings(): Promise<void> {
    try {
      localStorage.setItem('shivi-voice-privacy', JSON.stringify(this.privacySettings));
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  // Recording state management
  setRecordingState(recording: boolean): void {
    this.isRecording = recording;
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  // Privacy audit logging
  logPrivacyEvent(event: string, details?: any): void {
    const logEntry = {
      timestamp: Date.now(),
      event,
      details,
      privacyCompliant: this.validatePrivacySettings(),
    };

    console.log('Privacy Event:', logEntry);

    // In production, this would be stored securely
  }
}

export const voiceSecurity = new VoiceSecurityManager();