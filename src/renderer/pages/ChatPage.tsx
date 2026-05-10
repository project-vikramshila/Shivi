import React, { useMemo, useState, useEffect } from 'react';
import useChatStore from '@store/chatStore';
import ChatBubble from '@components/chat/ChatBubble';
import ChatInput from '@components/chat/ChatInput';
import TypingIndicator from '@components/chat/TypingIndicator';
import { getPersonalityLabel } from '@/modules/personality/personalityEngine';
import { processUserMessage } from '@/modules/personality/responseMiddleware';
import { useShiviAPI } from '@hooks/useShiviAPI';

const ChatPage = () => {
  const messages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.isTyping);
  const personalityMode = useChatStore((state) => state.personalityMode);
  const tonePreference = useChatStore((state) => state.tonePreference);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const addShiviMessage = useChatStore((state) => state.addShiviMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const setPersonalityMode = useChatStore((state) => state.setPersonalityMode);
  const regenerateLastResponse = useChatStore((state) => state.regenerateLastResponse);
  const clearConversation = useChatStore((state) => state.clearConversation);

  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const { api: shiviAPI, isReady } = useShiviAPI();

  useEffect(() => {
    const loadGeminiSetting = async () => {
      if (!isReady || !shiviAPI?.config?.get) {
        return;
      }
      try {
        const config = await shiviAPI.config.get();
        setGeminiEnabled(config.aiSettings?.enableGemini ?? false);
      } catch (error) {
        console.warn('Failed to load Gemini setting:', error);
      }
    };
    loadGeminiSetting();
  }, [isReady, shiviAPI]);

  const handleGeminiToggle = async (enabled: boolean) => {
    setGeminiEnabled(enabled);
    if (!shiviAPI?.config?.set) {
      console.warn('Config API not available');
      return;
    }
    try {
      const currentConfig = await shiviAPI.config.get();
      await shiviAPI.config.set({
        ...currentConfig,
        aiSettings: {
          ...currentConfig.aiSettings,
          enableGemini: enabled
        }
      });
    } catch (error) {
      console.warn('Failed to save Gemini setting:', error);
    }
  };

  const pinnedMessages = useMemo(() => messages.filter((message) => message.pinned), [messages]);
  const conversationText = messages.map((message) => message.text);

  const handleUserSend = async (text: string) => {
    addUserMessage(text);
    setTyping(true);
    try {
      const style = await processUserMessage(text, conversationText, personalityMode);
      setPersonalityMode(style.mode);
      addShiviMessage(style.response);
    } catch (error) {
      console.warn('Failed to process message:', error);
      // Fallback response
      addShiviMessage('Sorry, kuch technical issue ho gaya. Please try again. 💖');
    } finally {
      setTyping(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
      <div className="glass-card rounded-[32px] p-8 shadow-glow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Chat</p>
            <h1 className="text-3xl font-semibold text-white">Shivi se baat karein</h1>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {getPersonalityLabel(personalityMode)} • {tonePreference === personalityMode ? 'Auto tone' : 'Preference saved'}
          </div>
        </div>

        <div className="mb-6 rounded-[32px] border border-white/10 bg-shivi-dark-950 p-5 shadow-inner overflow-hidden">
          <div className="grid gap-4">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/70">
                <p className="text-lg font-medium text-white">Namaste! Shivi yahan hai. Kuch bhi poochiye — main aapka saathi hoon.</p>
                <p className="mt-3 text-sm text-white/60">Aap /work, /care, ya /flirty ke sath tone bhi choose kar sakte hain.</p>
              </div>
            )}

            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {isTyping && <TypingIndicator />}
          </div>
        </div>

        <ChatInput currentMode={personalityMode} onSubmit={handleUserSend} onModeChange={setPersonalityMode} />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={regenerateLastResponse}
            className="rounded-3xl border border-pink-500/20 bg-pink-500/10 px-5 py-3 text-sm font-semibold text-pink-100 transition hover:bg-pink-500/15"
          >
            Regenerate last response
          </button>
          <button
            type="button"
            onClick={clearConversation}
            className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Clear conversation
          </button>
        </div>
      </div>

      <aside className="glass-card rounded-[32px] p-8 shadow-glow border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Personality</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Shivi ka andaaz</h2>
          <p className="mt-3 text-white/75">Shivi abhi {getPersonalityLabel(personalityMode)} mein baat kar rahi hai. Aap mode badal kar experience ko cahie hue tone de sakte hain.</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-shivi-dark-900 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200 mb-3">AI Enhancement</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Enable Gemini</p>
                <p className="text-white/60 text-sm">Better Hindi responses with AI</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={geminiEnabled}
                  onChange={(e) => handleGeminiToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-shivi-dark-900 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200 mb-3">Pinned messages</p>
            {pinnedMessages.length === 0 ? (
              <p className="text-sm text-white/60">Aap kisi message ko pin kar sakte hain for quick access.</p>
            ) : (
              <ul className="space-y-3">
                {pinnedMessages.map((message) => (
                  <li key={message.id} className="rounded-2xl bg-white/5 p-3 text-sm text-white/80">{message.text}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-shivi-dark-900 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200 mb-3">Quick actions</p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setPersonalityMode('work')}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
              >
                Work mode: seeda aur useful
              </button>
              <button
                type="button"
                onClick={() => setPersonalityMode('care')}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
              >
                Care mode: soft aur nurturing
              </button>
              <button
                type="button"
                onClick={() => setPersonalityMode('flirty')}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
              >
                Flirty mode: playful aur respectful
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
};

export default ChatPage;
