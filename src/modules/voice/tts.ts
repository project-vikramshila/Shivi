/**
 * Text-to-Speech Engine
 * Emotional Hindi voice synthesis with multiple modes
 */

import type {
  TTSEngine,
  VoiceConfig,
  TTSOptions,
  VoiceEmotion,
  VoiceMode,
} from './types';

export class TextToSpeechEngine implements TTSEngine {
  private config: VoiceConfig | null = null;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private isCurrentlySpeaking = false;
  private speechQueue: SpeechSynthesisUtterance[] = [];
  private currentEmotion: VoiceEmotion = { type: 'neutral', intensity: 0.5 };
  private currentMode: VoiceMode = { type: 'normal', intensity: 0.5 };

  public onStart: () => void = () => {};
  public onEnd: () => void = () => {};
  public onError: (error: string) => void = () => {};

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;

    // Check for Web Speech API support
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-speech not supported in this browser');
    }

    // Wait for voices to load
    await this.waitForVoices();

    // Set default voice
    this.setVoice(config.ttsVoice);
  }

  private async waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }

      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      };

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    });
  }

  async speak(options: TTSOptions): Promise<void> {
    if (!this.config) {
      throw new Error('TTS engine not initialized');
    }

    const utterance = new SpeechSynthesisUtterance(options.text);

    // Apply configuration
    utterance.voice = this.currentVoice;
    utterance.rate = options.rate || this.config.ttsRate;
    utterance.pitch = options.pitch || this.config.ttsPitch;
    utterance.volume = options.volume || this.config.ttsVolume;
    utterance.lang = this.config.language;

    // Apply emotional modulation
    if (options.emotion) {
      this.applyEmotion(utterance, options.emotion);
    } else {
      this.applyEmotion(utterance, this.currentEmotion);
    }

    // Apply mode modulation
    if (options.mode) {
      this.applyMode(utterance, options.mode);
    } else {
      this.applyMode(utterance, this.currentMode);
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.isCurrentlySpeaking = true;
      this.onStart();
    };

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      this.processQueue();
      this.onEnd();
    };

    utterance.onerror = (event) => {
      this.isCurrentlySpeaking = false;
      this.onError(`TTS error: ${event.error}`);
      this.processQueue();
    };

    // Add to queue or speak immediately
    if (this.isCurrentlySpeaking) {
      this.speechQueue.push(utterance);
    } else {
      speechSynthesis.speak(utterance);
    }
  }

  private applyEmotion(utterance: SpeechSynthesisUtterance, emotion: VoiceEmotion): void {
    const intensity = emotion.intensity;

    switch (emotion.type) {
      case 'happy':
        utterance.rate *= (1 + intensity * 0.2); // Slightly faster
        utterance.pitch *= (1 + intensity * 0.3); // Higher pitch
        utterance.volume *= (1 + intensity * 0.1); // Slightly louder
        break;

      case 'sad':
        utterance.rate *= (1 - intensity * 0.3); // Slower
        utterance.pitch *= (1 - intensity * 0.2); // Lower pitch
        utterance.volume *= (1 - intensity * 0.2); // Quieter
        break;

      case 'excited':
        utterance.rate *= (1 + intensity * 0.4); // Much faster
        utterance.pitch *= (1 + intensity * 0.4); // Much higher
        utterance.volume *= (1 + intensity * 0.2); // Louder
        break;

      case 'calm':
        utterance.rate *= (1 - intensity * 0.2); // Slower
        utterance.pitch *= (1 - intensity * 0.1); // Slightly lower
        utterance.volume *= (0.8 - intensity * 0.2); // Quieter
        break;

      case 'concerned':
        utterance.rate *= (1 - intensity * 0.1); // Slightly slower
        utterance.pitch *= (1 - intensity * 0.1); // Slightly lower
        utterance.volume *= (0.9 - intensity * 0.1); // Slightly quieter
        break;

      case 'playful':
        utterance.rate *= (1 + intensity * 0.15); // Slightly faster
        utterance.pitch *= (1 + intensity * 0.2); // Higher pitch
        utterance.volume *= (1 + intensity * 0.05); // Slightly louder
        break;

      case 'warm':
        utterance.rate *= (1 - intensity * 0.1); // Slightly slower
        utterance.pitch *= (1 + intensity * 0.1); // Slightly higher
        utterance.volume *= (0.95 + intensity * 0.05); // Balanced volume
        break;

      case 'neutral':
      default:
        // No modification for neutral
        break;
    }
  }

  private applyMode(utterance: SpeechSynthesisUtterance, mode: VoiceMode): void {
    const intensity = mode.intensity;

    switch (mode.type) {
      case 'whisper':
        utterance.volume *= (0.3 - intensity * 0.2); // Very quiet
        utterance.rate *= (0.8 - intensity * 0.1); // Slower
        break;

      case 'focus':
        utterance.rate *= (0.9 - intensity * 0.1); // Slightly slower
        utterance.pitch *= (0.95 - intensity * 0.05); // Slightly lower
        utterance.volume *= (0.9 - intensity * 0.1); // Quieter
        break;

      case 'excited':
        utterance.rate *= (1 + intensity * 0.3); // Faster
        utterance.pitch *= (1 + intensity * 0.2); // Higher
        utterance.volume *= (1 + intensity * 0.1); // Louder
        break;

      case 'calm':
        utterance.rate *= (0.8 - intensity * 0.1); // Slower
        utterance.pitch *= (0.9 - intensity * 0.1); // Lower
        utterance.volume *= (0.8 - intensity * 0.1); // Quieter
        break;

      case 'normal':
      default:
        // No modification for normal
        break;
    }
  }

  async stop(): Promise<void> {
    speechSynthesis.cancel();
    this.speechQueue = [];
    this.isCurrentlySpeaking = false;
  }

  isSpeaking(): boolean {
    return this.isCurrentlySpeaking || speechSynthesis.speaking;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  setVoice(voiceName: string): void {
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v =>
      v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
      v.lang === voiceName
    );

    if (voice) {
      this.currentVoice = voice;
    } else {
      // Fallback to first Hindi voice or default
      const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
      this.currentVoice = hindiVoice || voices[0] || null;
    }
  }

  modulateEmotion(emotion: VoiceEmotion): void {
    this.currentEmotion = emotion;
  }

  setMode(mode: VoiceMode): void {
    this.currentMode = mode;
  }

  private processQueue(): void {
    if (this.speechQueue.length > 0 && !this.isCurrentlySpeaking) {
      const nextUtterance = this.speechQueue.shift();
      if (nextUtterance) {
        speechSynthesis.speak(nextUtterance);
      }
    }
  }

  // Hindi-specific voice optimizations
  private optimizeForHindi(): void {
    if (!this.currentVoice) return;

    // Prefer female Hindi voices for Shivi
    const hindiVoices = speechSynthesis.getVoices().filter(v =>
      v.lang.startsWith('hi') && v.name.toLowerCase().includes('female')
    );

    if (hindiVoices.length > 0) {
      this.currentVoice = hindiVoices[0];
    }
  }
}

export const ttsEngine = new TextToSpeechEngine();