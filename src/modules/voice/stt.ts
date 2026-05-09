/**
 * Speech-to-Text Engine
 * Hindi-first speech recognition with real-time processing
 */

import type {
  STTEngine,
  VoiceConfig,
  SpeechRecognitionEvent,
  SpeechRecognitionResult,
} from './types';

export class SpeechToTextEngine implements STTEngine {
  private recognition: any = null;
  private config: VoiceConfig | null = null;
  private isCurrentlyListening = false;
  private lastResult: SpeechRecognitionResult | null = null;

  public onResult: (result: SpeechRecognitionEvent) => void = () => {};
  public onError: (error: string) => void = () => {};

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;

    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    // Create recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = config.sttContinuous;
    this.recognition.interimResults = config.sttInterimResults;
    this.recognition.lang = config.language;
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isCurrentlyListening = true;
      this.onResult({
        results: [],
        isListening: true,
      });
    };

    this.recognition.onresult = (event: any) => {
      const results: SpeechRecognitionResult[] = [];

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        const speechResult: SpeechRecognitionResult = {
          transcript: this.postProcessTranscript(transcript),
          confidence,
          isFinal: result.isFinal,
          timestamp: Date.now(),
          language: this.config?.language || 'hi-IN',
        };

        results.push(speechResult);

        if (result.isFinal) {
          this.lastResult = speechResult;
        }
      }

      this.onResult({
        results,
        isListening: this.isCurrentlyListening,
      });
    };

    this.recognition.onerror = (event: any) => {
      this.isCurrentlyListening = false;
      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'कोई आवाज़ नहीं सुनी गई';
          break;
        case 'audio-capture':
          errorMessage = 'माइक्रोफोन तक पहुंच नहीं मिली';
          break;
        case 'not-allowed':
          errorMessage = 'माइक्रोफोन अनुमति नहीं दी गई';
          break;
        case 'network':
          errorMessage = 'नेटवर्क त्रुटि';
          break;
        case 'service-not-allowed':
          errorMessage = 'स्पीच सेवा उपलब्ध नहीं है';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.onError(errorMessage);
      this.onResult({
        results: [],
        isListening: false,
        error: errorMessage,
      });
    };

    this.recognition.onend = () => {
      this.isCurrentlyListening = false;
      this.onResult({
        results: [],
        isListening: false,
      });
    };
  }

  private postProcessTranscript(transcript: string): string {
    if (!transcript) return '';

    let processed = transcript.trim();

    // Hindi-specific processing
    if (this.config?.language.startsWith('hi')) {
      // Normalize common Hindi speech patterns
      processed = processed
        .replace(/\bशिवी\b/gi, 'शिवी') // Normalize Shivi name
        .replace(/\bहे शिवी\b/gi, 'हे शिवी')
        .replace(/\bसुनो शिवी\b/gi, 'सुनो शिवी')
        .replace(/\bएक्स\b/gi, 'एक्स') // Common misrecognition
        .replace(/\bहेलो\b/gi, 'हेलो');
    }

    return processed;
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('STT engine not initialized');
    }

    if (this.isCurrentlyListening) {
      return; // Already listening
    }

    try {
      this.recognition.start();
    } catch (error) {
      throw new Error(`Failed to start speech recognition: ${error}`);
    }
  }

  async stopListening(): Promise<void> {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch (error) {
      // Ignore errors when stopping
    }
  }

  isListening(): boolean {
    return this.isCurrentlyListening;
  }

  getSupportedLanguages(): string[] {
    // Web Speech API supported languages
    return [
      'hi-IN', // Hindi (India)
      'en-IN', // English (India)
      'hi',    // Hindi
      'en-US', // English (US)
      'en-GB', // English (UK)
    ];
  }

  getLastResult(): SpeechRecognitionResult | null {
    return this.lastResult;
  }

  // Hindi-specific optimizations
  private optimizeForHindi(): void {
    if (!this.recognition) return;

    // Set Hindi-specific parameters for better recognition
    this.recognition.lang = 'hi-IN';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
  }
}

export const sttEngine = new SpeechToTextEngine();