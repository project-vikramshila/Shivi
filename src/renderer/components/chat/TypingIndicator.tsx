import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-3xl border border-white/10 bg-white/5 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="text-sm text-white/75">Shivi type kar rahi hai...</span>
    </div>
  );
};

export default TypingIndicator;
