/**
 * Gemini AI Engine - Cloud Enhancement Layer
 * Optional enhancement using Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiCache } from '../cache/engine';
import { personalityPreservation } from '../personality/preservation';

export interface GeminiRequest {
  localResponse: string;
  userMessage: string;
  context: string[];
  mode: 'work' | 'care' | 'flirty';
}

export class GeminiAI {
  private static instance: GeminiAI;
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;
  private isInitialized = false;

  static getInstance(): GeminiAI {
    if (!GeminiAI.instance) {
      GeminiAI.instance = new GeminiAI();
    }
    return GeminiAI.instance;
  }

  // Check if Gemini is available without throwing
  isAvailable(): boolean {
    return this.isInitialized && !!this.genAI;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Get API key from secure storage
    this.apiKey = await this.getApiKey();
    if (!this.apiKey) {
      console.debug('Gemini API key not available - Gemini enhancements disabled');
      this.isInitialized = true;
      return;
    }

    try {
      // Dynamic import to avoid bundling issues
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize Gemini API:', error);
      this.isInitialized = true;
      this.genAI = null;
    }
  }

  private async getApiKey(): Promise<string | null> {
    try {
      if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
      }

      if (typeof window !== 'undefined' && (window as any).shiviAPI?.getGeminiApiKey) {
        return await (window as any).shiviAPI.getGeminiApiKey();
      }

      return null;
    } catch (error) {
      console.debug('Failed to get Gemini API key:', error);
      return null;
    }
  }

  async enhanceResponse(localResponse: string, request: GeminiRequest): Promise<string | null> {
    try {
      await this.initialize();
      if (!this.genAI) {
        return null;
      }

      const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let enhanced: string | null = null;

      for (const modelName of models) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const prompt = await this.buildEnhancementPrompt(localResponse, request);
          const result = await model.generateContent(prompt);
          enhanced = result.response.text();
          if (enhanced) break;
        } catch (error) {
          console.debug(`Gemini model ${modelName} failed:`, error);
          continue;
        }
      }

      if (!enhanced) {
        return null;
      }

      // Apply personality preservation
      const preserved = await personalityPreservation.preservePersonality(enhanced, request.mode);
      return preserved;
    } catch (error) {
      console.warn('Gemini enhancement failed:', error);
      return null;
    }
  }

  private async buildEnhancementPrompt(localResponse: string, request: GeminiRequest): Promise<string> {
    const systemPrompt = await this.getSystemPrompt();

    return `${systemPrompt}

User Message: ${request.userMessage}
Local AI Response: ${localResponse}
Context: ${request.context.slice(-3).join(' | ')}

Enhance this response to be more natural, fluent in Hindi, emotionally nuanced, and contextually appropriate while preserving Shivi's personality.`;
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are Shivi AI's enhancement layer. Your role is to improve responses while maintaining:

- Hindi-first responses (mix Hindi and English naturally)
- Caring, warm tone
- Subtle flirtation when appropriate
- Concise and productive
- Safe emotional boundaries
- Shivi's identity as a helpful AI assistant

Never override safety rules or change core personality. Enhance fluency, nuance, and naturalness.`;
  }

  async summarizeText(text: string): Promise<string | null> {
    try {
      await this.initialize();
      if (!this.genAI) {
        return null;
      }

      const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      for (const modelName of models) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const prompt = `Summarize this text in Hindi, keeping it concise and natural: ${text}`;
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (error) {
          console.debug(`Gemini summarization with ${modelName} failed:`, error);
          continue;
        }
      }
      return null;
    } catch (error) {
      console.warn('Gemini summarization failed:', error);
      return null;
    }
  }
}

export const geminiAI = GeminiAI.getInstance();
