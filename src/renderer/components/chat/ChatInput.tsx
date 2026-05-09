import React, { useState } from 'react';
import { FiSend, FiMic, FiSmile } from 'react-icons/fi';
import { PersonalityMode } from '@/modules/personality/personalityEngine';

const modeHints: Record<PersonalityMode, string> = {
  work: 'Work mode: precise aur calm response.',
  care: 'Care mode: warm aur supportive tone.',
  flirty: 'Flirty mode: playful aur respectful.'
};

interface ChatInputProps {
  currentMode: PersonalityMode;
  onSubmit: (message: string) => void;
  onModeChange: (mode: PersonalityMode) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ currentMode, onSubmit, onModeChange }) => {
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('Hindi mein likhiye...');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('/')) {
      const command = trimmed.slice(1).toLowerCase();
      if (command === 'work' || command === 'care' || command === 'flirty') {
        onModeChange(command as PersonalityMode);
        setHint(modeHints[command as PersonalityMode]);
        setDraft('');
        return;
      }
    }

    onSubmit(trimmed);
    setDraft('');
    setHint(modeHints[currentMode]);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          className="min-h-[84px] flex-1 rounded-3xl border border-white/10 bg-shivi-dark-900 px-4 py-4 text-sm text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          placeholder="Kuch likhiye, ya /work, /care, /flirty se tone badal sakte hain..."
        />
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10">
            <FiMic />
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-3xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-400">
            <FiSend /> Send
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span className="inline-flex items-center gap-1"><FiSmile /> Emoji support ready</span>
        <span>{hint}</span>
      </div>
    </form>
  );
};

export default ChatInput;
