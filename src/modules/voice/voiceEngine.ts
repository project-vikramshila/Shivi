// Legacy voice engine - replaced by comprehensive voice system
// This file maintained for backward compatibility

export const startVoiceListener = async () => {
  const { voiceEngine } = await import('./index');
  await voiceEngine.initialize();
  await voiceEngine.startListening();
  return 'Voice listener initialized with full voice engine';
};

export const speakText = async (text: string) => {
  const { voiceEngine } = await import('./index');
  await voiceEngine.speak({ text });
  return `Speaking: ${text}`;
};
