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

  // Use hybrid AI for enhanced responses
  const response = await hybridAI.processMessage(
    userMessage,
    recentConversation,
    selectedMode,
    {
      enableGemini: true, // TODO: Get from user settings
      localOnly: false,
      privacyLevel: 'moderate'
    }
  );

  return {
    mode: selectedMode,
    response,
  };
};
