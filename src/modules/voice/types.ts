/**
 * Voice Engine Types
 * Complete type system for Hindi-first voice assistant
 */

export interface VoiceConfig {
  enabled: boolean;
  language: 'hi-IN' | 'en-IN' | 'hi';
  wakeWords: string[];
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  sttContinuous: boolean;
  sttInterimResults: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  privacyMode: boolean;
  offlineMode: boolean;
  emotionalTone: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  language: string;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  isListening: boolean;
  error?: string;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  emotion?: VoiceEmotion;
  mode?: VoiceMode;
}

export interface TTSEvent {
  text: string;
  isSpeaking: boolean;
  progress: number;
  error?: string;
}

export interface WakeWordEvent {
  wakeWord: string;
  confidence: number;
  timestamp: number;
  audioLevel: number;
}

export interface AudioContext {
  sampleRate: number;
  channelCount: number;
  latency: number;
}

export interface AudioAnalysis {
  frequency: number[];
  amplitude: number[];
  dominantFrequency: number;
  averageAmplitude: number;
  isSilent: boolean;
  noiseLevel: number;
}

export interface VoiceEmotion {
  type: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'concerned' | 'playful' | 'warm';
  intensity: number; // 0-1
}

export interface VoiceMode {
  type: 'normal' | 'whisper' | 'focus' | 'excited' | 'calm';
  intensity: number; // 0-1
}

export interface ConversationContext {
  id: string;
  startTime: number;
  lastActivity: number;
  turnCount: number;
  currentEmotion: VoiceEmotion;
  currentMode: VoiceMode;
  isActive: boolean;
  transcripts: SpeechRecognitionResult[];
  responses: string[];
}

export interface VoiceMemory {
  conversationId: string;
  timestamp: number;
  transcript: string;
  response: string;
  emotion: VoiceEmotion;
  mode: VoiceMode;
  duration: number;
  quality: number;
}

export interface PrivacySettings {
  allowRecording: boolean;
  allowStorage: boolean;
  allowCloudProcessing: boolean;
  retentionPeriod: number; // hours
  anonymizeData: boolean;
}

export interface VoiceUIState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  wakeWordDetected: boolean;
  audioLevel: number;
  emotion: VoiceEmotion;
  mode: VoiceMode;
  error?: string;
}

export interface VoicePipelineEvent {
  type: 'listening' | 'processing' | 'speaking' | 'error' | 'wake_word' | 'silence';
  data: any;
  timestamp: number;
}

export interface VoiceEngine {
  // Core methods
  initialize(): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  speak(options: TTSOptions): Promise<void>;
  stopSpeaking(): Promise<void>;

  // Configuration
  updateConfig(config: Partial<VoiceConfig>): void;
  getConfig(): VoiceConfig;

  // State management
  getUIState(): VoiceUIState;
  getConversationContext(): ConversationContext;

  // Memory integration
  saveConversation(memory: VoiceMemory): Promise<void>;
  getConversationHistory(limit?: number): Promise<VoiceMemory[]>;

  // Privacy controls
  enablePrivacyMode(): void;
  disablePrivacyMode(): void;
  clearStoredData(): Promise<void>;

  // Event handling
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
}

export interface STTEngine {
  initialize(config: VoiceConfig): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  isListening(): boolean;
  getSupportedLanguages(): string[];
  onResult: (result: SpeechRecognitionEvent) => void;
  onError: (error: string) => void;
}

export interface TTSEngine {
  initialize(config: VoiceConfig): Promise<void>;
  speak(options: TTSOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
  getAvailableVoices(): SpeechSynthesisVoice[];
  setVoice(voice: string): void;
  modulateEmotion(emotion: VoiceEmotion): void;
  setMode(mode: VoiceMode): void;
  onStart: () => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

export interface WakeWordEngine {
  initialize(config: VoiceConfig): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  addWakeWord(word: string): void;
  removeWakeWord(word: string): void;
  isListening(): boolean;
  onWakeWord: (event: WakeWordEvent) => void;
  onError: (error: string) => void;
}

export interface AudioProcessor {
  initialize(context: AudioContext): Promise<void>;
  processAudio(buffer: AudioBuffer): Promise<AudioAnalysis>;
  reduceNoise(buffer: AudioBuffer): Promise<AudioBuffer>;
  detectSilence(buffer: AudioBuffer, threshold?: number): boolean;
  getAudioLevel(buffer: AudioBuffer): number;
  normalizeAudio(buffer: AudioBuffer): AudioBuffer;
}

export interface VoiceSecurity {
  initialize(): Promise<void>;
  checkMicrophonePermission(): Promise<boolean>;
  requestMicrophonePermission(): Promise<boolean>;
  encryptAudioData(data: ArrayBuffer): Promise<ArrayBuffer>;
  decryptAudioData(data: ArrayBuffer): Promise<ArrayBuffer>;
  clearTemporaryData(): Promise<void>;
  validatePrivacySettings(): boolean;
}