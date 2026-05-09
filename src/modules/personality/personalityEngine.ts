import { memoryEngine, emotionalMemory } from '../memory';

export type PersonalityMode = 'work' | 'care' | 'flirty';

const workKeywords = ['kab', 'kaise', 'kya', 'message', 'reminder', 'meeting', 'schedule', 'task', 'yaad', 'kaam', 'calendar'];
const careKeywords = ['thak', 'tired', 'mood', 'kaise ho', 'feel', 'achha', 'khush', 'sad', 'lonely', 'buri', 'tension'];
const flirtyKeywords = ['tum', 'suno', 'cute', 'fun', 'pyaar', 'mazak', 'acha lagta', 'dost', 'awesome', 'sweet'];

const recallKeywords = ['yaad', 'last time', 'previously', 'before', 'kal', 'parson', 'remember'];
const reminderKeywords = ['remind', 'reminder', 'yaad dilana', 'reminder lagao'];

export const decidePersonalityMode = (
  userMessage: string,
  recentConversation: string[],
  preferredMode: PersonalityMode,
): PersonalityMode => {
  const normalized = userMessage.toLowerCase();
  const careSignal = careKeywords.some((keyword) => normalized.includes(keyword));
  const workSignal = workKeywords.some((keyword) => normalized.includes(keyword));
  const flirtySignal = flirtyKeywords.some((keyword) => normalized.includes(keyword));

  if (careSignal) {
    return 'care';
  }

  if (flirtySignal && !workSignal) {
    return 'flirty';
  }

  if (workSignal) {
    return 'work';
  }

  return preferredMode || 'work';
};

const responseBase = {
  work: 'Ji, main aapko seedha aur saaf jawab deti hoon. ',
  care: 'Aap chinta mat kariye, main dhyaan se help karti hoon. ',
  flirty: 'Thoda pyar se dekh leti hoon, phir batati hoon. ',
};

export const formatShiviResponse = (message: string, mode: PersonalityMode) => {
  const prefix = responseBase[mode];
  const suffix = mode === 'flirty' ? ' 😉' : mode === 'care' ? ' 💖' : '';
  return `${prefix}${message.trim()}${suffix}`;
};

export const buildShiviReply = async (
  userMessage: string,
  mode: PersonalityMode,
  conversationHistory: string[] = []
): Promise<string> => {
  const normalized = userMessage.toLowerCase();

  // Check for memory-related queries
  const isRecallQuery = recallKeywords.some(keyword => normalized.includes(keyword));
  const isReminderQuery = reminderKeywords.some(keyword => normalized.includes(keyword));

  try {
    // Get emotional context for better responses
    const emotionalContext = emotionalMemory.getEmotionalContext();

    // Handle recall queries
    if (isRecallQuery) {
      const memories = await memoryEngine.searchMemories(userMessage, 3);
      if (memories.length > 0) {
        const memory = memories[0];
        let recallResponse = '';

        if (memory.type === 'conversation') {
          recallResponse = `Yaad hai, last time hum ${memory.topics.slice(0, 2).join(' aur ')} ke baare mein baat kar rahe the.`;
        } else if (memory.type === 'reminder') {
          recallResponse = `Haan, maine aapko "${memory.title}" ka reminder lagaya tha.`;
        } else {
          recallResponse = 'Main aapki baat ko yaad karke dekh rahi hoon.';
        }

        return formatShiviResponse(recallResponse, mode);
      }
    }

    // Handle reminder queries
    if (isReminderQuery) {
      const reminders = await memoryEngine.getActiveReminders();
      if (reminders.length > 0) {
        const reminder = reminders[0];
        const reminderResponse = `Aapka reminder: "${reminder.title}"${reminder.description ? ` - ${reminder.description}` : ''}`;
        return formatShiviResponse(reminderResponse, mode);
      } else {
        return formatShiviResponse('Aapke paas koi active reminder nahi hai.', mode);
      }
    }

    // Use emotional adaptation for response style
    const adaptation = emotionalContext.adaptation;
    let responseStyle = mode;

    // Adapt based on emotional learning
    if (adaptation.preferredTone !== mode && emotionalContext.currentMood !== 'neutral') {
      responseStyle = adaptation.preferredTone;
    }

    // Generate context-aware response
    let response = '';

    if (mode === 'care' && emotionalContext.currentMood === 'sad') {
      response = 'Main samajhti hoon aap thode upset lag rahe hain. Kuch share karna chahenge? Main yahan hoon aapke liye. 💖';
    } else if (mode === 'care' && emotionalContext.currentMood === 'stressed') {
      response = 'Lagta hai aapko bohot stress hai. Thoda rest lijiye, main help karne ko taiyaar hoon.';
    } else {
      // Default responses with memory context
      response = mode === 'work'
        ? 'Aapki request samajh li hai. Main aage ka response taiyaar kar rahi hoon.'
        : mode === 'care'
        ? 'Main yeh dekh rahi hoon aur aapka dhyan rakhti hoon.'
        : 'Ek second... main hasi ke saath dekh leti hoon.';
    }

    return formatShiviResponse(response, responseStyle);

  } catch (error) {
    console.warn('Memory retrieval failed, using default response:', error);
    // Fallback to default response
    const defaultReply = mode === 'work'
      ? 'Aapki request samajh li hai. Main aage ka response taiyaar kar rahi hoon.'
      : mode === 'care'
      ? 'Main yeh dekh rahi hoon aur aapka dhyan rakhti hoon.'
      : 'Ek second... main hasi ke saath dekh leti hoon.';

    return formatShiviResponse(defaultReply, mode);
  }
};

export const getPersonalityLabel = (mode: PersonalityMode) => {
  switch (mode) {
    case 'work':
      return 'Work Mode';
    case 'care':
      return 'Care Mode';
    case 'flirty':
      return 'Flirty Mode';
    default:
      return 'Work Mode';
  }
};
