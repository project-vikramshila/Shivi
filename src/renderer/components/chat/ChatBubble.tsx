import React from 'react';
import { FiClipboard, FiRefreshCcw } from 'react-icons/fi';
import useChatStore, { ChatMessage } from '@/renderer/store/chatStore';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const togglePinMessage = useChatStore((state) => state.togglePinMessage);

  return (
    <div className={`group relative ${message.role === 'shivi' ? 'self-start' : 'self-end'} w-full max-w-3xl`}> 
      <div
        className={`rounded-3xl p-5 shadow-glow border border-white/10 transition ${
          message.role === 'shivi'
            ? 'bg-white/5 text-white'
            : 'bg-pink-600/10 text-pink-50 border-pink-500/10'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-xs uppercase tracking-[0.28em] text-shivi-pink-200">
            {message.role === 'shivi' ? 'Shivi' : 'Aap'}
          </span>
          <span className="text-[11px] text-white/50">{message.timestamp}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7">{message.text}</p>
      </div>
      <div className="mt-2 hidden group-hover:flex gap-2 text-white/60 text-xs">
        <button
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10"
          onClick={() => navigator.clipboard.writeText(message.text)}
          type="button"
        >
          <FiClipboard /> Copy
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10"
          onClick={() => togglePinMessage(message.id)}
          type="button"
        >
          <FiRefreshCcw className={message.pinned ? 'text-pink-300' : 'text-white/70'} />
          {message.pinned ? 'Unpin' : 'Pin'}
        </button>
      </div>
      {message.pinned && (
        <div className="absolute -top-2 right-0 rounded-full bg-pink-500 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white shadow-glow">
          Pinned
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
