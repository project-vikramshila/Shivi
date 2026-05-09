/**
 * AI Module - Hybrid Intelligence Layer
 * Exports all AI components for Shivi AI
 */

export { aiRouter, AIRouter } from './router/engine';
export { localAI, LocalAI } from './local/engine';
export { geminiAI, GeminiAI } from './gemini/engine';
export { privacyFilter, PrivacyFilter } from './privacy/filter';
export { personalityPreservation, PersonalityPreservation } from './personality/preservation';
export { aiCache, AICache } from './cache/engine';
export { aiPrompts, AIPrompts } from './prompts/engine';

// Main AI Engine - Orchestrator
export class HybridAI {
  private static instance: HybridAI;

  static getInstance(): HybridAI {
    if (!HybridAI.instance) {
      HybridAI.instance = new HybridAI();
    }
    return HybridAI.instance;
  }

  async processMessage(
    message: string,
    context: string[] = [],
    mode: 'work' | 'care' | 'flirty' = 'work',
    userSettings: {
      enableGemini: boolean;
      localOnly: boolean;
      privacyLevel: 'strict' | 'moderate' | 'relaxed';
    } = { enableGemini: false, localOnly: false, privacyLevel: 'moderate' }
  ): Promise<string> {
    const router = await import('./router/engine');
    const isOffline = !navigator.onLine; // Basic offline check

    const request = {
      message,
      context,
      mode,
      isOffline,
      userSettings
    };

    return await router.aiRouter.processRequest(request);
  }

  async summarizeText(text: string): Promise<string> {
    try {
      const gemini = await import('./gemini/engine');
      const geminiSummary = await gemini.geminiAI.summarizeText(text);
      if (geminiSummary) return geminiSummary;
    } catch (error) {
      console.warn('Gemini summarization failed:', error);
    }

    // Local fallback
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }
}

export const hybridAI = HybridAI.getInstance();