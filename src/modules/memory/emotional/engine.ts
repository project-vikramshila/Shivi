/**
 * Shivi AI Memory System - Emotional Memory & Adaptation
 * Learning from emotional patterns to provide better care
 */

import { EmotionalMemory, EmotionalState, EmotionalPattern, EmotionalAdaptation, Memory } from '../core/types';
import { memoryStorage } from '../storage/database';
import { memorySecurity } from '../security/encryption';

export class EmotionalMemoryEngine {
  private static instance: EmotionalMemoryEngine;
  private emotionalPatterns: Map<string, EmotionalPattern>;
  private adaptationHistory: EmotionalAdaptation[];

  private constructor() {
    this.emotionalPatterns = new Map();
    this.adaptationHistory = [];
    this.loadEmotionalData();
  }

  static getInstance(): EmotionalMemoryEngine {
    if (!EmotionalMemoryEngine.instance) {
      EmotionalMemoryEngine.instance = new EmotionalMemoryEngine();
    }
    return EmotionalMemoryEngine.instance;
  }

  private async loadEmotionalData(): Promise<void> {
    try {
      const emotionalMemories = await memoryStorage.query({ type: 'emotional', limit: 100 });

      for (const memory of emotionalMemories) {
        if (memory.type === 'emotional') {
          this.emotionalPatterns.set(memory.id, memory.pattern);
        }
      }

      // Load adaptation history
      const stored = this.getStoredAdaptationHistory();
      if (stored) {
        this.adaptationHistory = JSON.parse(memorySecurity.decrypt(stored));
      }
    } catch (error) {
      console.warn('Failed to load emotional data:', error);
    }
  }

  private getStoredAdaptationHistory(): string | null {
    try {
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        const { ipcRenderer } = require('electron');
        return ipcRenderer.invoke('get-emotional-adaptation');
      } else {
        return localStorage.getItem('shivi-emotional-adaptation');
      }
    } catch {
      return null;
    }
  }

  private saveAdaptationHistory(): void {
    try {
      const encrypted = memorySecurity.encrypt(JSON.stringify(this.adaptationHistory));
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        const { ipcRenderer } = require('electron');
        ipcRenderer.invoke('save-emotional-adaptation', encrypted);
      } else {
        localStorage.setItem('shivi-emotional-adaptation', encrypted);
      }
    } catch (error) {
      console.error('Failed to save adaptation history:', error);
    }
  }

  // Analyze emotional state from text
  analyzeEmotionalState(text: string): EmotionalState {
    const lowerText = text.toLowerCase();

    // Define emotional keywords
    const emotionalKeywords = {
      happy: ['khush', 'acha lag raha', 'mast', 'fun', 'excited', 'great', 'awesome', 'love'],
      sad: ['sad', 'dukhi', 'ghamgin', 'depressed', 'lonely', 'tired', 'thak', 'bore'],
      angry: ['angry', 'gussa', 'frustrated', 'irritated', 'annoyed', 'upset'],
      anxious: ['tension', 'worried', 'anxious', 'nervous', 'scared', 'fear', 'stress'],
      excited: ['excited', 'thrilled', 'pumped', 'energetic', 'enthusiastic'],
      stressed: ['stress', 'pressure', 'overwhelmed', 'busy', 'hectic', 'deadline'],
      calm: ['calm', 'relaxed', 'peaceful', 'chill', 'soothe', 'comfortable'],
    };

    let maxScore = 0;
    let detectedEmotion: EmotionalState = 'neutral';

    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      const score = keywords.reduce((acc, keyword) =>
        acc + (lowerText.includes(keyword) ? 1 : 0), 0
      );

      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as EmotionalState;
      }
    }

    return maxScore > 0 ? detectedEmotion : 'neutral';
  }

  // Record emotional interaction
  async recordEmotionalInteraction(
    userMessage: string,
    shiviResponse: string,
    userEmotion: EmotionalState,
    personalityMode: 'work' | 'care' | 'flirty',
    wasHelpful: boolean
  ): Promise<void> {
    const pattern: EmotionalPattern = {
      primaryEmotion: userEmotion,
      intensity: this.calculateIntensity(userMessage),
      triggers: this.extractTriggers(userMessage),
      frequency: 1,
      lastObserved: new Date().toISOString(),
    };

    const emotionalMemory: EmotionalMemory = {
      id: memorySecurity.generateSecureId(),
      type: 'emotional',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['emotional', userEmotion, personalityMode],
      emotionalContext: userEmotion,
      confidence: 0.8,
      pattern,
      triggers: [userMessage],
      responses: [{
        trigger: userMessage,
        response: shiviResponse,
        effectiveness: wasHelpful ? 0.8 : 0.3,
        usedCount: 1,
      }],
      adaptation: {
        preferredTone: personalityMode,
        responseStyle: this.detectResponseStyle(shiviResponse),
        reminderStyle: 'gentle',
        lastAdapted: new Date().toISOString(),
      },
    };

    await memoryStorage.store(emotionalMemory);
    this.emotionalPatterns.set(emotionalMemory.id, pattern);

    // Update adaptation history
    this.adaptationHistory.push(emotionalMemory.adaptation);
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory = this.adaptationHistory.slice(-50); // Keep last 50
    }
    this.saveAdaptationHistory();
  }

  // Get emotional adaptation recommendations
  getEmotionalAdaptation(currentEmotion: EmotionalState): EmotionalAdaptation {
    if (this.adaptationHistory.length === 0) {
      return {
        preferredTone: 'care',
        responseStyle: 'detailed',
        reminderStyle: 'gentle',
        lastAdapted: new Date().toISOString(),
      };
    }

    // Find patterns for this emotion
    const relevantAdaptations = this.adaptationHistory.filter(adaptation => {
      // Look for adaptations that worked for similar emotional states
      return true; // Simplified - in production, match emotional context
    });

    if (relevantAdaptations.length === 0) {
      return this.adaptationHistory[this.adaptationHistory.length - 1];
    }

    // Return the most recent successful adaptation
    return relevantAdaptations[relevantAdaptations.length - 1];
  }

  // Predict emotional state based on patterns
  predictEmotionalState(recentMessages: string[]): EmotionalState {
    if (recentMessages.length === 0) return 'neutral';

    const emotions = recentMessages.map(msg => this.analyzeEmotionalState(msg));
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<EmotionalState, number>);

    // Find most frequent emotion
    let maxCount = 0;
    let predictedEmotion: EmotionalState = 'neutral';

    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        predictedEmotion = emotion as EmotionalState;
      }
    }

    return predictedEmotion;
  }

  // Get emotional context for response generation
  getEmotionalContext(): {
    currentMood: EmotionalState;
    adaptation: EmotionalAdaptation;
    recentPatterns: EmotionalPattern[];
  } {
    const recentPatterns = Array.from(this.emotionalPatterns.values())
      .sort((a, b) => new Date(b.lastObserved).getTime() - new Date(a.lastObserved).getTime())
      .slice(0, 5);

    const currentMood = recentPatterns.length > 0
      ? recentPatterns[0].primaryEmotion
      : 'neutral';

    const adaptation = this.getEmotionalAdaptation(currentMood);

    return {
      currentMood,
      adaptation,
      recentPatterns,
    };
  }

  private calculateIntensity(text: string): number {
    // Simple intensity calculation based on emotional keywords and punctuation
    const emotionalWords = ['bahut', 'bohot', 'extremely', 'so', 'very', 'really', 'totally'];
    const punctuation = ['!', '!!', '!!!', '?', '??'];

    let intensity = 0.5; // Base intensity

    emotionalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) intensity += 0.1;
    });

    punctuation.forEach(punct => {
      const count = (text.match(new RegExp(`\\${punct}`, 'g')) || []).length;
      intensity += count * 0.05;
    });

    return Math.min(1.0, intensity);
  }

  private extractTriggers(text: string): string[] {
    // Extract potential emotional triggers from text
    const words = text.toLowerCase().split(/\s+/);
    const triggers: string[] = [];

    // Look for emotional keywords
    const emotionalWords = [
      'thak', 'tired', 'stress', 'tension', 'khush', 'sad', 'gussa',
      'worried', 'excited', 'lonely', 'happy', 'angry', 'anxious'
    ];

    words.forEach(word => {
      if (emotionalWords.some(emotion => word.includes(emotion))) {
        triggers.push(word);
      }
    });

    return triggers.slice(0, 5); // Limit to 5 triggers
  }

  private detectResponseStyle(response: string): 'concise' | 'detailed' | 'playful' {
    const length = response.length;

    if (length < 50) return 'concise';
    if (length > 150) return 'detailed';

    // Check for playful indicators
    const playfulIndicators = ['😉', '😊', '💖', 'cute', 'fun', 'mazak'];
    const hasPlayful = playfulIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    return hasPlayful ? 'playful' : 'detailed';
  }
}

// Export singleton instance
export const emotionalMemory = EmotionalMemoryEngine.getInstance();