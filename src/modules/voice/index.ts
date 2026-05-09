/**
 * Main Voice Engine
 * Orchestrates all voice components for Hindi-first AI assistant
 */

import { EventEmitter } from 'events';
import type {
  VoiceEngine as VoiceEngineInterface,
  VoiceConfig,
  VoiceUIState,
  ConversationContext,
  VoiceMemory,
  VoiceEmotion,
  VoiceMode,
  VoicePipelineEvent,
} from './types';

import { sttEngine } from './stt';
import { ttsEngine } from './tts';
import { wakeWordEngine } from './wakeword';
import { audioProcessor } from './audio';
import { conversationManager } from './context';
import { voiceSecurity } from './security';

export class VoiceEngine extends EventEmitter implements VoiceEngineInterface {
  private config: VoiceConfig;
  private uiState: VoiceUIState;
  private isInitialized = false;

  constructor() {
    super();

    // Default configuration
    this.config = {
      enabled: true,
      language: 'hi-IN',
      wakeWords: ['शिवी', 'hey shivi', 'सुनो शिवी'],
      ttsVoice: 'hi-IN',
      ttsRate: 1.0,
      ttsPitch: 1.0,
      ttsVolume: 0.8,
      sttContinuous: true,
      sttInterimResults: true,
      noiseReduction: true,
      echoCancellation: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
      privacyMode: false,
      offlineMode: true,
      emotionalTone: true,
    };

    // Initial UI state
    this.uiState = {
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      wakeWordDetected: false,
      audioLevel: 0,
      emotion: { type: 'neutral', intensity: 0.5 },
      mode: { type: 'normal', intensity: 0.5 },
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize security first
      await voiceSecurity.initialize();

      // Check microphone permission
      const hasPermission = await voiceSecurity.checkMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission required for voice features');
      }

      // Initialize audio processor
      const audioContext = {
        sampleRate: this.config.sampleRate,
        channelCount: this.config.channelCount,
        latency: 0, // Will be set by audio context
      };
      await audioProcessor.initialize(audioContext);

      // Initialize STT engine
      await sttEngine.initialize(this.config);

      // Initialize TTS engine
      await ttsEngine.initialize(this.config);

      // Initialize wake word engine
      await wakeWordEngine.initialize(this.config);

      // Set up event handlers
      this.setupEventHandlers();

      // Start privacy monitoring
      voiceSecurity.startPrivacyMonitoring();

      this.isInitialized = true;
      this.emit('initialized');

    } catch (error) {
      this.emit('error', `Voice engine initialization failed: ${error}`);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // STT events
    sttEngine.onResult = (result) => {
      this.uiState.isListening = result.isListening;
      this.updateUIState();

      if (result.results.length > 0) {
        const latestResult = result.results[result.results.length - 1];

        // Add to conversation context
        conversationManager.addTranscript(latestResult);

        this.emit('speech-result', result);
      }

      if (result.error) {
        this.emit('error', result.error);
      }
    };

    sttEngine.onError = (error) => {
      this.uiState.isListening = false;
      this.updateUIState();
      this.emit('error', `STT Error: ${error}`);
    };

    // TTS events
    ttsEngine.onStart = () => {
      this.uiState.isSpeaking = true;
      this.updateUIState();
      this.emit('speech-start');
    };

    ttsEngine.onEnd = () => {
      this.uiState.isSpeaking = false;
      this.updateUIState();
      this.emit('speech-end');
    };

    ttsEngine.onError = (error) => {
      this.uiState.isSpeaking = false;
      this.updateUIState();
      this.emit('error', `TTS Error: ${error}`);
    };

    // Wake word events
    wakeWordEngine.onWakeWord = (event) => {
      this.uiState.wakeWordDetected = true;
      this.updateUIState();

      // Start conversation
      conversationManager.startConversation();

      this.emit('wake-word', event);

      // Auto-clear wake word detection after 2 seconds
      setTimeout(() => {
        this.uiState.wakeWordDetected = false;
        this.updateUIState();
      }, 2000);
    };

    wakeWordEngine.onError = (error) => {
      this.emit('error', `Wake word error: ${error}`);
    };
  }

  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Voice engine not initialized');
    }

    try {
      // Start wake word detection
      await wakeWordEngine.startListening();

      // Start STT listening
      await sttEngine.startListening();

      this.uiState.isListening = true;
      this.updateUIState();

    } catch (error) {
      this.uiState.isListening = false;
      this.updateUIState();
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    try {
      await wakeWordEngine.stopListening();
      await sttEngine.stopListening();

      this.uiState.isListening = false;
      this.updateUIState();

    } catch (error) {
      this.emit('error', `Failed to stop listening: ${error}`);
    }
  }

  async speak(options: { text: string; emotion?: VoiceEmotion; mode?: VoiceMode }): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Voice engine not initialized');
    }

    try {
      // Update emotional context
      if (options.emotion) {
        conversationManager.setEmotion(options.emotion);
        ttsEngine.modulateEmotion(options.emotion);
        this.uiState.emotion = options.emotion;
      }

      if (options.mode) {
        conversationManager.setMode(options.mode);
        ttsEngine.setMode(options.mode);
        this.uiState.mode = options.mode;
      }

      // Add response to conversation context
      conversationManager.addResponse(options.text);

      // Speak the text
      await ttsEngine.speak(options);

      this.updateUIState();

    } catch (error) {
      this.emit('error', `Speech failed: ${error}`);
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    await ttsEngine.stop();
    this.uiState.isSpeaking = false;
    this.updateUIState();
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-initialize components with new config
    if (this.isInitialized) {
      this.reinitializeWithConfig();
    }
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  getUIState(): VoiceUIState {
    return { ...this.uiState };
  }

  getConversationContext(): ConversationContext {
    return conversationManager.getCurrentContext();
  }

  async saveConversation(memory: VoiceMemory): Promise<void> {
    if (!voiceSecurity.getPrivacySettings().allowStorage) {
      throw new Error('Conversation storage not permitted by privacy settings');
    }

    // In a real implementation, this would save to a secure database
    console.log('Saving conversation memory:', memory);

    // Store in local storage for demo (in production, use encrypted database)
    try {
      const memories = JSON.parse(localStorage.getItem('shivi-voice-memories') || '[]');
      memories.push(memory);

      // Limit to last 100 memories
      if (memories.length > 100) {
        memories.splice(0, memories.length - 100);
      }

      localStorage.setItem('shivi-voice-memories', JSON.stringify(memories));
    } catch (error) {
      console.error('Failed to save conversation memory:', error);
    }
  }

  async getConversationHistory(limit: number = 10): Promise<VoiceMemory[]> {
    try {
      const memories = JSON.parse(localStorage.getItem('shivi-voice-memories') || '[]');
      return memories.slice(-limit);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  enablePrivacyMode(): void {
    voiceSecurity.updatePrivacySettings({
      allowRecording: false,
      allowStorage: false,
      allowCloudProcessing: false,
      retentionPeriod: 0,
    });
  }

  disablePrivacyMode(): void {
    // Allow basic functionality while maintaining some privacy
    voiceSecurity.updatePrivacySettings({
      allowRecording: true,
      allowStorage: true,
      allowCloudProcessing: false,
      retentionPeriod: 5, // 5 minutes
    });
  }

  async clearStoredData(): Promise<void> {
    await voiceSecurity.clearStoredData();
    localStorage.removeItem('shivi-voice-memories');
  }

  private async reinitializeWithConfig(): Promise<void> {
    try {
      await sttEngine.initialize(this.config);
      await ttsEngine.initialize(this.config);
      await wakeWordEngine.initialize(this.config);
    } catch (error) {
      this.emit('error', `Failed to reinitialize with new config: ${error}`);
    }
  }

  private updateUIState(): void {
    this.emit('ui-state-changed', this.uiState);
  }

  // Pipeline event handling
  private emitPipelineEvent(event: VoicePipelineEvent): void {
    this.emit('pipeline-event', event);
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.stopListening();
    await this.stopSpeaking();
    await voiceSecurity.clearStoredData();
    this.isInitialized = false;
  }
}

export const voiceEngine = new VoiceEngine();