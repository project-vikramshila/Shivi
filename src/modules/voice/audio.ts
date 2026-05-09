/**
 * Audio Processor
 * Real-time audio processing for noise reduction and analysis
 */

import type {
  AudioProcessor,
  AudioContext,
  AudioAnalysis,
} from './types';

export class AudioProcessingEngine implements AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseGate: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private silenceThreshold = 0.01;

  async initialize(context: AudioContext): Promise<void> {
    this.audioContext = context as any; // Web Audio API context

    try {
      // Create analyser for frequency analysis
      this.analyser = (this.audioContext as any).createAnalyser();
      this.analyser!.fftSize = 2048;
      this.analyser!.smoothingTimeConstant = 0.8;

      // Create noise gate
      this.noiseGate = (this.audioContext as any).createGain();
      this.noiseGate!.gain.value = 1;

      // Create low-pass filter for noise reduction
      this.filter = (this.audioContext as any).createBiquadFilter();
      this.filter!.type = 'lowpass';
      this.filter!.frequency.value = 3400; // Cut off high-frequency noise
      this.filter!.Q.value = 1;

      // Connect nodes
      this.filter!.connect(this.noiseGate!);
      this.noiseGate!.connect(this.analyser!);

    } catch (error) {
      throw new Error(`Failed to initialize audio processor: ${error}`);
    }
  }

  async processAudio(buffer: AudioBuffer): Promise<AudioAnalysis> {
    if (!this.analyser) {
      throw new Error('Audio processor not initialized');
    }

    // Get frequency data
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Convert to normalized frequency array (0-1)
    const frequency = Array.from(dataArray).map(v => v / 255);
    const amplitude = [...frequency];

    // Calculate analysis metrics
    const dominantFrequency = this.findDominantFrequency(frequency);
    const averageAmplitude = frequency.reduce((sum, val) => sum + val, 0) / frequency.length;
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

  async reduceNoise(buffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext || !this.filter || !this.noiseGate) {
      throw new Error('Audio processor not initialized');
    }

    // Create a new buffer for processed audio
    const processedBuffer = (this.audioContext as any).createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);

      // Apply noise reduction
      for (let i = 0; i < inputData.length; i++) {
        // Simple noise gate
        const amplitude = Math.abs(inputData[i]);
        const gain = amplitude > 0.01 ? 1 : 0.1; // Reduce quiet sounds

        // Apply low-pass filter effect (simplified)
        const filtered = this.applyLowPass(inputData, i);

        outputData[i] = filtered * gain;
      }
    }

    return processedBuffer;
  }

  detectSilence(buffer: AudioBuffer, threshold: number = 0.01): boolean {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        if (Math.abs(data[i]) > threshold) {
          return false;
        }
      }
    }
    return true;
  }

  getAudioLevel(buffer: AudioBuffer): number {
    let maxAmplitude = 0;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const amplitude = Math.abs(data[i]);
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude;
        }
      }
    }

    return maxAmplitude;
  }

  normalizeAudio(buffer: AudioBuffer): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('Audio processor not initialized');
    }

    const level = this.getAudioLevel(buffer);
    if (level === 0) return buffer;

    const normalizedBuffer = (this.audioContext as any).createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const targetLevel = 0.8; // Normalize to 80% of maximum
    const gain = targetLevel / level;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * gain;
      }
    }

    return normalizedBuffer;
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
    // Estimate noise from low-frequency components
    const lowFreqEnd = Math.floor(frequency.length * 0.1);
    const lowFreq = frequency.slice(0, lowFreqEnd);

    return lowFreq.reduce((sum, val) => sum + val, 0) / lowFreq.length;
  }

  private applyLowPass(data: Float32Array, index: number): number {
    // Simple low-pass filter (simplified implementation)
    if (index === 0) return data[0];

    const alpha = 0.1; // Filter coefficient
    return alpha * data[index] + (1 - alpha) * data[index - 1];
  }

  // Voice-specific audio optimizations
  optimizeForVoice(): void {
    if (!this.filter) return;

    // Optimize filter for human voice frequencies (80-3400 Hz)
    this.filter.frequency.value = 3400;
    this.filter.Q.value = 1;

    // Adjust analyser for voice analysis
    if (this.analyser) {
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
    }
  }

  // Hindi speech optimizations
  optimizeForHindi(): void {
    // Adjust parameters for Hindi phonetics
    if (this.filter) {
      this.filter.frequency.value = 4000; // Slightly higher for Hindi consonants
    }
  }
}

export const audioProcessor = new AudioProcessingEngine();