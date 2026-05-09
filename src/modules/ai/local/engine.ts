/**
 * Local AI Engine - Core Local Intelligence
 * Handles local processing, memory integration, and personality
 */

import { buildShiviReply, decidePersonalityMode, PersonalityMode } from '../../personality/personalityEngine';
import { memoryEngine } from '../../memory';

export interface LocalAIRequest {
  message: string;
  context: string[];
  mode: PersonalityMode;
}

export class LocalAI {
  private static instance: LocalAI;

  static getInstance(): LocalAI {
    if (!LocalAI.instance) {
      LocalAI.instance = new LocalAI();
    }
    return LocalAI.instance;
  }

  async generateResponse(request: LocalAIRequest): Promise<string> {
    try {
      // Determine personality mode
      const mode = decidePersonalityMode(request.message, request.context, request.mode);

      // Get conversation history for context
      const conversationHistory = request.context.slice(-5); // Last 5 messages

      // Generate response using personality engine
      const response = await buildShiviReply(request.message, mode, conversationHistory);

      return response;
    } catch (error) {
      console.error('Local AI generation failed:', error);
      // Fallback response
      return 'Sorry, mujhe samajh nahi aaya. Kya aap dohra sakte hain?';
    }
  }

  async getMemoryContext(message: string): Promise<string[]> {
    try {
      const memories = await memoryEngine.searchMemories(message, 3);
      return memories.map(m => {
        if (m.type === 'reminder') {
          return (m as any).content || (m as any).title;
        } else if (m.type === 'conversation') {
          return (m as any).userMessage || (m as any).shiviResponse;
        } else {
          return (m as any).content || 'Memory content';
        }
      });
    } catch (error) {
      console.warn('Memory retrieval failed:', error);
      return [];
    }
  }

  async summarizeConversation(messages: string[]): Promise<string> {
    // Simple local summarization
    const keyPoints = messages.slice(-3).join(' ').split(' ').slice(0, 20).join(' ');
    return `Conversation summary: ${keyPoints}...`;
  }
}

export const localAI = LocalAI.getInstance();