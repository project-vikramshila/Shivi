import { create } from 'zustand';
import { memoryEngine } from '../../modules/memory';
import { processConversationForReminders, queryReminders, createReminder } from '../../modules/reminders/renderer';

export type ChatMessage = {
  id: string;
  role: 'user' | 'shivi';
  text: string;
  timestamp: string;
  pinned?: boolean;
};

export type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
  personalityMode: 'work' | 'care' | 'flirty';
  tonePreference: 'work' | 'care' | 'flirty';
  emotionContext: string;
  sessionId: string;
  addUserMessage: (text: string) => void;
  addShiviMessage: (text: string) => void;
  setPersonalityMode: (mode: ChatState['personalityMode']) => void;
  setTonePreference: (mode: ChatState['tonePreference']) => void;
  setTyping: (value: boolean) => void;
  togglePinMessage: (id: string) => void;
  regenerateLastResponse: () => void;
  clearConversation: () => void;
  searchMemories: (query: string) => Promise<any[]>;
  getActiveReminders: () => Promise<any[]>;
  storeReminder: (title: string, description?: string) => Promise<string>;
};

const STORAGE_KEY = 'shivi-chat-session';

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const loadInitialMessages = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { messages: ChatMessage[]; personalityMode: ChatState['personalityMode']; tonePreference: ChatState['tonePreference']; emotionContext: string; sessionId: string };
    return data.messages || [];
  } catch {
    return [];
  }
};

const loadInitialMode = (): ChatState['personalityMode'] => {
  if (typeof window === 'undefined') return 'work';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'work';
    const data = JSON.parse(raw) as { personalityMode: ChatState['personalityMode']; tonePreference: ChatState['tonePreference']; emotionContext: string; sessionId: string };
    return data.personalityMode || 'work';
  } catch {
    return 'work';
  }
};

const loadInitialTonePreference = (): ChatState['tonePreference'] => {
  if (typeof window === 'undefined') return 'work';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'work';
    const data = JSON.parse(raw) as { personalityMode: ChatState['personalityMode']; tonePreference: ChatState['tonePreference']; emotionContext: string; sessionId: string };
    return data.tonePreference || 'work';
  } catch {
    return 'work';
  }
};

const saveSession = (state: ChatState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      messages: state.messages,
      personalityMode: state.personalityMode,
      tonePreference: state.tonePreference,
      emotionContext: state.emotionContext,
    }),
  );
};

const formatTimestamp = (): string => new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });

const useChatStore = create<ChatState>((set, get) => ({
  messages: loadInitialMessages(),
  isTyping: false,
  personalityMode: loadInitialMode(),
  tonePreference: loadInitialTonePreference(),
  emotionContext: 'neutral',
  sessionId: generateSessionId(),
  addUserMessage: (text) => {
    const message = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      text,
      timestamp: formatTimestamp(),
    };
    set((state) => {
      const updated = { ...state, messages: [...state.messages, message], emotionContext: 'active' };
      saveSession(updated);

      // Check for reminder intents
      processConversationForReminders('user-1', state.sessionId, text).then(result => {
        if (result && result.detected) {
          // Add a confirmation message from Shivi
          setTimeout(() => {
            get().addShiviMessage(result.message || 'Thik hai, reminder set kar diya gaya hai.');
          }, 500);
        }
      }).catch(error => {
        console.warn('Reminder processing failed:', error);
      });

      return updated;
    });
  },
  addShiviMessage: (text) => {
    const message = {
      id: `shivi-${Date.now()}`,
      role: 'shivi' as const,
      text,
      timestamp: formatTimestamp(),
    };
    set((state) => {
      const updated = { ...state, messages: [...state.messages, message] };
      saveSession(updated);

      // Store conversation in memory
      const stateAfterUpdate = { ...state, messages: [...state.messages, message] };
      memoryEngine.storeConversation(
        stateAfterUpdate.sessionId,
        stateAfterUpdate.messages[stateAfterUpdate.messages.length - 2]?.text || '',
        text,
        stateAfterUpdate.personalityMode,
        [], // topics will be extracted by memory system
        []  // entities will be extracted by memory system
      ).catch(error => console.warn('Failed to store conversation:', error));

      return updated;
    });
  },
  setPersonalityMode: (mode) => {
    set((state) => {
      const updated = { ...state, personalityMode: mode };
      saveSession(updated);
      return updated;
    });
  },
  setTonePreference: (mode) => {
    set((state) => {
      const updated = { ...state, tonePreference: mode };
      saveSession(updated);
      return updated;
    });
  },
  setTyping: (value) => set({ isTyping: value }),
  togglePinMessage: (id) => {
    set((state) => {
      const updated = {
        ...state,
        messages: state.messages.map((message) =>
          message.id === id ? { ...message, pinned: !message.pinned } : message,
        ),
      };
      saveSession(updated);
      return updated;
    });
  },
  regenerateLastResponse: () => {
    const state = get();
    const lastUserMessage = [...state.messages].reverse().find((message) => message.role === 'user');
    if (!lastUserMessage) return;
    set({ isTyping: true });
    setTimeout(() => {
      const responseText = `Thoda saaurri response, main ${lastUserMessage.text} ko fir se dekh rahi hoon. 💖`;
      set((currentState) => {
        const allShivi = currentState.messages.filter((message) => message.role === 'shivi');
        const lastShivi = allShivi.length ? allShivi[allShivi.length - 1] : null;
        const newMessages = lastShivi
          ? currentState.messages.filter((message) => message.id !== lastShivi.id)
          : currentState.messages;
        const newResponse: ChatMessage = {
          id: `shivi-${Date.now()}`,
          role: 'shivi',
          text: responseText,
          timestamp: formatTimestamp(),
        };
        const updated = {
          ...currentState,
          messages: [...newMessages, newResponse],
          isTyping: false,
        };
        saveSession(updated);
        return updated;
      });
    }, 1200);
  },
  searchMemories: async (query: string) => {
    try {
      return await memoryEngine.searchMemories(query, 10);
    } catch (error) {
      console.warn('Memory search failed:', error);
      return [];
    }
  },
  getActiveReminders: async () => {
    try {
      const reminders = await queryReminders({
        userId: 'user-1',
        status: 'active',
        limit: 10,
      });
      return reminders;
    } catch (error) {
      console.warn('Failed to get reminders:', error);
      return [];
    }
  },
  storeReminder: async (title: string, description?: string) => {
    try {
      const reminder = await createReminder({
        userId: 'user-1',
        title,
        description,
        priority: 'medium',
      });
      if (!reminder) {
        throw new Error('Reminder creation failed');
      }
      return reminder.id;
    } catch (error) {
      console.warn('Failed to store reminder:', error);
      throw error;
    }
  },
  clearConversation: () => {
    set({ messages: [], emotionContext: 'neutral' });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

// Persist session whenever store updates
if (typeof window !== 'undefined') {
  useChatStore.subscribe((state) => {
    saveSession(state);
  });
}

export default useChatStore;
