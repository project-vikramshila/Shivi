/**
 * Wake Word Detection Engine
 * Local wake word detection for "Shivi", "Hey Shivi", "Suno Shivi"
 */

import type {
  WakeWordEngine,
  VoiceConfig,
  WakeWordEvent,
  AudioAnalysis,
} from './types';

export class WakeWordDetectionEngine implements WakeWordEngine {
  private config: VoiceConfig | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private _isListening = false;
  private wakeWords: string[] = [];
  private detectionThreshold = 0.7;
  private silenceThreshold = 0.01;
  private minWordLength = 0.5; // seconds
  private maxWordLength = 2.0; // seconds

  public onWakeWord: (event: WakeWordEvent) => void = () => {};
  public onError: (error: string) => void = () => {};

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;
    this.wakeWords = config.wakeWords;

    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = (this.audioContext as any).createAnalyser();

      // Configure analyser for wake word detection
      this.analyser!.fftSize = 2048;
      this.analyser!.smoothingTimeConstant = 0.8;
      this.analyser!.minDecibels = -90;
      this.analyser!.maxDecibels = -10;

    } catch (error) {
      throw new Error(`Failed to initialize wake word engine: ${error}`);
    }
  }

  async startListening(): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Wake word engine not initialized');
    }

    if (this._isListening) return;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config?.echoCancellation ?? true,
          noiseSuppression: this.config?.noiseReduction ?? true,
          autoGainControl: this.config?.autoGainControl ?? true,
          sampleRate: this.config?.sampleRate ?? 16000,
        },
      });

      // Create microphone source
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this._isListening = true;

      // Start detection loop
      this.detectionLoop();

    } catch (error) {
      this.onError(`Failed to start wake word listening: ${error}`);
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    this._isListening = false;
  }

  addWakeWord(word: string): void {
    if (!this.wakeWords.includes(word)) {
      this.wakeWords.push(word);
    }
  }

  removeWakeWord(word: string): void {
    this.wakeWords = this.wakeWords.filter(w => w !== word);
  }

  isListening(): boolean {
    return this._isListening;
  }

  private async detectionLoop(): Promise<void> {
    if (!this._isListening || !this.analyser) return;

    try {
      const analysis = this.analyzeAudio();

      // Check for wake word patterns
      const wakeWord = this.detectWakeWord(analysis);

      if (wakeWord) {
        const event: WakeWordEvent = {
          wakeWord,
          confidence: this.calculateConfidence(analysis, wakeWord),
          timestamp: Date.now(),
          audioLevel: analysis.averageAmplitude,
        };

        this.onWakeWord(event);
      }

      // Continue detection loop
      if (this._isListening) {
        requestAnimationFrame(() => this.detectionLoop());
      }

    } catch (error) {
      this.onError(`Wake word detection error: ${error}`);
    }
  }

  private analyzeAudio(): AudioAnalysis {
    if (!this.analyser) {
      return {
        frequency: [],
        amplitude: [],
        dominantFrequency: 0,
        averageAmplitude: 0,
        isSilent: true,
        noiseLevel: 0,
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(dataArray);

    // Convert to float array (0-1)
    const frequency = Array.from(dataArray).map(v => v / 255);
    const amplitude = [...frequency];

    // Calculate metrics
    const averageAmplitude = frequency.reduce((sum, val) => sum + val, 0) / frequency.length;
    const dominantFrequency = this.findDominantFrequency(frequency);
    const isSilent = averageAmplitude < this.silenceThreshold;
    const noiseLevel = this.calculateNoiseLevel(frequency);

    return {
      frequency,
      amplitude,
      dominantFrequency,
      averageAmplitude,
      isSilent,
      noiseLevel,
    };
  }

  private detectWakeWord(analysis: AudioAnalysis): string | null {
    if (analysis.isSilent || analysis.averageAmplitude < 0.1) {
      return null;
    }

    // Simple pattern matching for wake words
    // In a production system, this would use ML models

    for (const wakeWord of this.wakeWords) {
      if (this.matchesWakeWordPattern(analysis, wakeWord)) {
        return wakeWord;
      }
    }

    return null;
  }

  private matchesWakeWordPattern(analysis: AudioAnalysis, wakeWord: string): boolean {
    // Simplified pattern matching - in production, use proper wake word detection

    const { averageAmplitude, dominantFrequency, frequency } = analysis;

    // Basic heuristics for different wake words
    switch (wakeWord.toLowerCase()) {
      case 'शिवी':
      case 'shivi':
        // Look for specific frequency patterns
        return averageAmplitude > 0.15 &&
               dominantFrequency > 80 && dominantFrequency < 300;

      case 'hey shivi':
      case 'हे शिवी':
        // Longer pattern with rising amplitude
        return averageAmplitude > 0.12 &&
               this.hasRisingPattern(frequency);

      case 'सुनो शिवी':
      case 'suno shivi':
        // Sustained pattern
        return averageAmplitude > 0.1 &&
               this.hasSustainedPattern(frequency);

      default:
        return false;
    }
  }

  private hasRisingPattern(frequency: number[]): boolean {
    // Check if amplitude rises over time (simplified)
    const mid = Math.floor(frequency.length / 2);
    const firstHalf = frequency.slice(0, mid);
    const secondHalf = frequency.slice(mid);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return secondAvg > firstAvg * 1.2; // 20% increase
  }

  private hasSustainedPattern(frequency: number[]): boolean {
    // Check for sustained amplitude
    const avg = frequency.reduce((sum, val) => sum + val, 0) / frequency.length;
    const variance = frequency.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / frequency.length;

    return Math.sqrt(variance) < 0.1; // Low variance = sustained
  }

  private findDominantFrequency(frequency: number[]): number {
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < frequency.length; i++) {
      if (frequency[i] > maxValue) {
        maxValue = frequency[i];
        maxIndex = i;
      }
    }

    // Convert index to frequency (approximate)
    if (this.audioContext) {
      return (maxIndex * this.audioContext.sampleRate) / (2 * frequency.length);
    }

    return 0;
  }

  private calculateNoiseLevel(frequency: number[]): number {
    // Simple noise estimation
    const lowFreq = frequency.slice(0, Math.floor(frequency.length * 0.1));
    return lowFreq.reduce((sum, val) => sum + val, 0) / lowFreq.length;
  }

  private calculateConfidence(analysis: AudioAnalysis, wakeWord: string): number {
    // Calculate confidence based on various factors
    let confidence = 0;

    // Amplitude confidence
    if (analysis.averageAmplitude > 0.2) confidence += 0.3;
    else if (analysis.averageAmplitude > 0.1) confidence += 0.2;

    // Pattern confidence (simplified)
    confidence += 0.4;

    // Noise confidence
    if (analysis.noiseLevel < 0.05) confidence += 0.3;

    return Math.min(confidence, 1.0);
  }

  // Hindi-specific wake word optimizations
  private optimizeForHindi(): void {
    // Adjust detection parameters for Hindi phonetics
    this.detectionThreshold = 0.6; // Slightly lower for Hindi speakers
    this.minWordLength = 0.6; // Hindi words might be slightly longer
  }
}

export const wakeWordEngine = new WakeWordDetectionEngine();