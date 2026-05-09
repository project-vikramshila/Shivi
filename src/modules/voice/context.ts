/**
 * Conversation Context Manager
 * Manages voice conversation state and emotional context
 */

import type {
  ConversationContext,
  VoiceEmotion,
  VoiceMode,
  SpeechRecognitionResult,
} from './types';

export class ConversationContextManager {
  private currentContext: ConversationContext;
  private contextHistory: ConversationContext[] = [];
  private maxHistorySize = 10;

  constructor() {
    this.currentContext = this.createNewContext();
  }

  private createNewContext(): ConversationContext {
    return {
      id: this.generateContextId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      turnCount: 0,
      currentEmotion: { type: 'neutral', intensity: 0.5 },
      currentMode: { type: 'normal', intensity: 0.5 },
      isActive: false,
      transcripts: [],
      responses: [],
    };
  }

  private generateContextId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startConversation(): void {
    this.currentContext.isActive = true;
    this.currentContext.startTime = Date.now();
    this.currentContext.lastActivity = Date.now();
  }

  endConversation(): void {
    this.currentContext.isActive = false;
    this.saveContextToHistory();
    this.currentContext = this.createNewContext();
  }

  addTranscript(result: SpeechRecognitionResult): void {
    this.currentContext.transcripts.push(result);
    this.currentContext.lastActivity = Date.now();
    this.currentContext.turnCount++;

    // Analyze transcript for emotional context
    this.updateEmotionalContext(result);
  }

  addResponse(response: string): void {
    this.currentContext.responses.push(response);
    this.currentContext.lastActivity = Date.now();
  }

  setEmotion(emotion: VoiceEmotion): void {
    this.currentContext.currentEmotion = emotion;
  }

  setMode(mode: VoiceMode): void {
    this.currentContext.currentMode = mode;
  }

  getCurrentContext(): ConversationContext {
    return { ...this.currentContext };
  }

  getContextHistory(): ConversationContext[] {
    return [...this.contextHistory];
  }

  isConversationActive(): boolean {
    return this.currentContext.isActive;
  }

  getConversationDuration(): number {
    if (!this.currentContext.isActive) return 0;
    return Date.now() - this.currentContext.startTime;
  }

  private updateEmotionalContext(result: SpeechRecognitionResult): void {
    const transcript = result.transcript.toLowerCase();

    // Analyze transcript for emotional cues
    let emotion: VoiceEmotion = { ...this.currentContext.currentEmotion };

    // Hindi emotional keywords
    const urgentKeywords = ['तुरंत', 'जल्दी', 'अभी', 'urgent', 'quickly', 'now'];
    const happyKeywords = ['धन्यवाद', 'शुक्रिया', 'अच्छा', 'बहुत अच्छा', 'thanks', 'good', 'great'];
    const concernedKeywords = ['परेशान', 'चिंता', 'problem', 'worried', 'issue'];
    const excitedKeywords = ['वाह', 'awesome', 'amazing', 'fantastic', 'wow'];

    if (urgentKeywords.some(keyword => transcript.includes(keyword))) {
      emotion = { type: 'excited', intensity: 0.7 };
    } else if (happyKeywords.some(keyword => transcript.includes(keyword))) {
      emotion = { type: 'happy', intensity: 0.6 };
    } else if (concernedKeywords.some(keyword => transcript.includes(keyword))) {
      emotion = { type: 'concerned', intensity: 0.5 };
    } else if (excitedKeywords.some(keyword => transcript.includes(keyword))) {
      emotion = { type: 'excited', intensity: 0.8 };
    }

    // Gradually transition to new emotion
    this.transitionEmotion(emotion);
  }

  private transitionEmotion(targetEmotion: VoiceEmotion): void {
    const current = this.currentContext.currentEmotion;

    // Smooth transition over time
    const transitionSteps = 5;
    const intensityDiff = targetEmotion.intensity - current.intensity;
    const stepIntensity = intensityDiff / transitionSteps;

    // For now, directly set the emotion (in production, animate this)
    this.currentContext.currentEmotion = targetEmotion;
  }

  private saveContextToHistory(): void {
    this.contextHistory.push({ ...this.currentContext });

    // Limit history size
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory = this.contextHistory.slice(-this.maxHistorySize);
    }
  }

  // Context-aware emotion suggestions
  suggestEmotionForResponse(response: string): VoiceEmotion {
    const text = response.toLowerCase();

    // Analyze response content for appropriate emotion
    if (text.includes('reminder') || text.includes('remind')) {
      return { type: 'calm', intensity: 0.6 };
    } else if (text.includes('error') || text.includes('problem')) {
      return { type: 'concerned', intensity: 0.5 };
    } else if (text.includes('complete') || text.includes('done')) {
      return { type: 'happy', intensity: 0.6 };
    } else if (text.includes('wait') || text.includes('processing')) {
      return { type: 'neutral', intensity: 0.4 };
    }

    return this.currentContext.currentEmotion;
  }

  // Context-aware mode suggestions
  suggestModeForResponse(response: string): VoiceMode {
    const text = response.toLowerCase();

    // Analyze response for appropriate mode
    if (text.includes('secret') || text.includes('private')) {
      return { type: 'whisper', intensity: 0.7 };
    } else if (text.includes('focus') || text.includes('important')) {
      return { type: 'focus', intensity: 0.6 };
    } else if (text.includes('excited') || text.includes('wow')) {
      return { type: 'excited', intensity: 0.8 };
    }

    return this.currentContext.currentMode;
  }

  // Conversation flow analysis
  analyzeConversationFlow(): {
    averageTurnLength: number;
    emotionalVariability: number;
    conversationPace: number;
  } {
    const transcripts = this.currentContext.transcripts;
    if (transcripts.length === 0) {
      return { averageTurnLength: 0, emotionalVariability: 0, conversationPace: 0 };
    }

    // Calculate average turn length
    const totalLength = transcripts.reduce((sum, t) => sum + t.transcript.length, 0);
    const averageTurnLength = totalLength / transcripts.length;

    // Calculate emotional variability (simplified)
    const emotions = transcripts.map(() => Math.random()); // Placeholder
    const emotionalVariability = emotions.length > 1 ?
      Math.max(...emotions) - Math.min(...emotions) : 0;

    // Calculate conversation pace (turns per minute)
    const duration = this.getConversationDuration() / 1000 / 60; // minutes
    const conversationPace = duration > 0 ? transcripts.length / duration : 0;

    return {
      averageTurnLength,
      emotionalVariability,
      conversationPace,
    };
  }
}

export const conversationManager = new ConversationContextManager();