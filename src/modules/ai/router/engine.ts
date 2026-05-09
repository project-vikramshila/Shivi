/**
 * AI Router Engine - Decision Engine for Hybrid AI
 * Determines when to use local AI vs Gemini enhancement
 */

import { privacyFilter } from '../privacy/filter';
import { localAI } from '../local/engine';
import { geminiAI } from '../gemini/engine';
import { aiCache } from '../cache/engine';

export type AIProvider = 'local' | 'gemini' | 'hybrid';

export interface RoutingDecision {
  provider: AIProvider;
  reason: string;
  confidence: number;
}

export interface AIRequest {
  message: string;
  context: string[];
  mode: 'work' | 'care' | 'flirty';
  isOffline: boolean;
  userSettings: {
    enableGemini: boolean;
    localOnly: boolean;
    privacyLevel: 'strict' | 'moderate' | 'relaxed';
  };
}

export class AIRouter {
  private static instance: AIRouter;

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  async routeRequest(request: AIRequest): Promise<RoutingDecision> {
    // Check cache first
    const cached = await aiCache.getCachedResponse(request.message);
    if (cached) {
      return {
        provider: 'local',
        reason: 'cached_response',
        confidence: 1.0
      };
    }

    // Offline mode - always local
    if (request.isOffline) {
      return {
        provider: 'local',
        reason: 'offline_mode',
        confidence: 1.0
      };
    }

    // User disabled Gemini
    if (!request.userSettings.enableGemini || request.userSettings.localOnly) {
      return {
        provider: 'local',
        reason: 'user_disabled_gemini',
        confidence: 1.0
      };
    }

    // Privacy check
    const privacyCheck = await privacyFilter.checkRequest({
      message: request.message,
      context: request.context,
      privacyLevel: request.userSettings.privacyLevel
    });
    if (!privacyCheck.allowed) {
      return {
        provider: 'local',
        reason: `privacy_filter: ${privacyCheck.reason}`,
        confidence: 1.0
      };
    }

    // Decision logic based on content
    const decision = this.analyzeContent(request);

    return decision;
  }

  private analyzeContent(request: AIRequest): RoutingDecision {
    const message = request.message.toLowerCase();

    // Sensitive tasks - always local
    const sensitiveKeywords = ['password', 'token', 'secret', 'private', 'financial', 'bank', 'credit'];
    if (sensitiveKeywords.some(k => message.includes(k))) {
      return {
        provider: 'local',
        reason: 'sensitive_content',
        confidence: 0.9
      };
    }

    // Automation tasks - local
    const automationKeywords = ['reminder', 'schedule', 'calendar', 'task', 'ocr', 'screenshot', 'automation'];
    if (automationKeywords.some(k => message.includes(k))) {
      return {
        provider: 'local',
        reason: 'automation_task',
        confidence: 0.8
      };
    }

    // Complex conversation - hybrid
    const complexKeywords = ['explain', 'why', 'how', 'analyze', 'summarize', 'story', 'creative'];
    if (complexKeywords.some(k => message.includes(k))) {
      return {
        provider: 'hybrid',
        reason: 'complex_conversation',
        confidence: 0.7
      };
    }

    // Emotional nuance - hybrid
    const emotionalKeywords = ['feel', 'mood', 'sad', 'happy', 'stress', 'love', 'care'];
    if (emotionalKeywords.some(k => message.includes(k))) {
      return {
        provider: 'hybrid',
        reason: 'emotional_nuance',
        confidence: 0.6
      };
    }

    // Default - local with potential enhancement
    return {
      provider: 'hybrid',
      reason: 'general_conversation',
      confidence: 0.5
    };
  }

  async processRequest(request: AIRequest): Promise<string> {
    const decision = await this.routeRequest(request);

    let response: string;

    if (decision.provider === 'local') {
      response = await localAI.generateResponse(request);
    } else if (decision.provider === 'hybrid') {
      // Get local response first
      const localResponse = await localAI.generateResponse(request);

      // Enhance with Gemini if available
      try {
        const enhanced = await geminiAI.enhanceResponse(localResponse, {
          localResponse,
          userMessage: request.message,
          context: request.context,
          mode: request.mode
        });
        response = enhanced || localResponse; // Fallback to local
      } catch (error) {
        console.warn('Gemini enhancement failed, using local:', error);
        response = localResponse;
      }
    } else {
      // Fallback
      response = await localAI.generateResponse(request);
    }

    // Cache the response
    await aiCache.cacheResponse(request.message, response, decision.provider);

    return response;
  }
}

export const aiRouter = AIRouter.getInstance();