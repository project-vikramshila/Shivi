import { buildShiviReply, decidePersonalityMode, PersonalityMode } from './personalityEngine';
import { hybridAI } from '../ai';

export type StyleResult = {
  mode: PersonalityMode;
  response: string;
};

export const processUserMessage = async (
  userMessage: string,
  recentConversation: string[],
  preferredMode: PersonalityMode,
): Promise<StyleResult> => {
  const selectedMode = decidePersonalityMode(userMessage, recentConversation, preferredMode);

  // Get AI settings from config
  let aiSettings = { enableGemini: false, localOnly: false, privacyLevel: 'moderate' as const };
  if (typeof window !== 'undefined') {
    try {
      const shiviAPI = (window as any).shiviAPI;
      if (shiviAPI?.config?.get) {
        const config = await shiviAPI.config.get();
        aiSettings = config.aiSettings || aiSettings;
      }
    } catch (error) {
      console.warn('Failed to get AI settings from config:', error);
    }
  }

  // Use hybrid AI for enhanced responses
  const response = await hybridAI.processMessage(
    userMessage,
    recentConversation,
    selectedMode,
    aiSettings
  );

  return {
    mode: selectedMode,
    response,
  };
};
