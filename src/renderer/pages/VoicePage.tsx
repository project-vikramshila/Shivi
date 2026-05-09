/**
 * Voice Page
 * Complete voice interface for Hindi-first AI assistant
 */

import React, { useState, useEffect } from 'react';
import VoiceOrb from '../components/voice/VoiceOrb';
import VoiceControls from '../components/voice/VoiceControls';
import type {
  VoiceUIState,
  VoiceConfig,
  ConversationContext,
  VoiceMemory
} from '../../modules/voice/types';

const VoicePage = () => {
  const [uiState, setUIState] = useState<VoiceUIState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    wakeWordDetected: false,
    audioLevel: 0,
    emotion: { type: 'neutral', intensity: 0.5 },
    mode: { type: 'normal', intensity: 0.5 },
  });

  const [config, setConfig] = useState<VoiceConfig>({
    enabled: true,
    language: 'hi-IN',
    wakeWords: ['शिवी', 'hey shivi', 'सुनो शिवी'],
    ttsVoice: 'hi-IN',
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVolume: 0.8,
    sttContinuous: true,
    sttInterimResults: true,
    noiseReduction: true,
    echoCancellation: true,
    autoGainControl: true,
    sampleRate: 16000,
    channelCount: 1,
    privacyMode: false,
    offlineMode: true,
    emotionalTone: true,
  });

  const [conversation, setConversation] = useState<ConversationContext | null>(null);
  const [history, setHistory] = useState<VoiceMemory[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeVoiceEngine();
    loadConversationHistory();

    return () => {
      // Cleanup
      if ((window as any).shiviApi?.voice?.stopListening) {
        (window as any).shiviApi.voice.stopListening();
      }
    };
  }, []);

  const initializeVoiceEngine = async () => {
    try {
      // Initialize voice engine through IPC
      await (window as any).shiviApi.voice.initialize();
      setIsInitialized(true);

      // Set up event listeners
      setupVoiceEventListeners();

    } catch (error) {
      console.error('Failed to initialize voice engine:', error);
      setError('Voice engine initialization failed. Please check microphone permissions.');
    }
  };

  const setupVoiceEventListeners = () => {
    const voiceApi = (window as any).shiviApi.voice;

    // UI state updates
    voiceApi.on('ui-state-changed', (newState: VoiceUIState) => {
      setUIState(newState);
    });

    // Speech results
    voiceApi.on('speech-result', (result: any) => {
      console.log('Speech result:', result);
      updateConversation();
    });

    // Wake word detection
    voiceApi.on('wake-word', (event: any) => {
      console.log('Wake word detected:', event);
      // Could trigger special UI feedback
    });

    // Errors
    voiceApi.on('error', (error: string) => {
      console.error('Voice error:', error);
      setError(error);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    });
  };

  const updateConversation = async () => {
    try {
      const context = await (window as any).shiviApi.voice.getConversationContext();
      setConversation(context);
    } catch (error) {
      console.error('Failed to get conversation context:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const historyData = await (window as any).shiviApi.voice.getConversationHistory(10);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const handleConfigChange = async (newConfig: Partial<VoiceConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    try {
      await (window as any).shiviApi.voice.updateConfig(newConfig);
    } catch (error) {
      console.error('Failed to update voice config:', error);
    }
  };

  const handleStartListening = async () => {
    try {
      await (window as any).shiviApi.voice.startListening();
    } catch (error) {
      console.error('Failed to start listening:', error);
      setError('Failed to start voice listening. Please check microphone permissions.');
    }
  };

  const handleStopListening = async () => {
    try {
      await (window as any).shiviApi.voice.stopListening();
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await (window as any).shiviApi.voice.emergencyStop();
    } catch (error) {
      console.error('Failed to emergency stop:', error);
    }
  };

  const handleTestSpeech = async () => {
    try {
      await (window as any).shiviApi.voice.speak({
        text: 'नमस्ते! मैं शिवी हूं, आपकी व्यक्तिगत AI सहायक। मैं हिंदी में बात कर सकती हूं और आपकी मदद कर सकती हूं।',
        emotion: { type: 'warm', intensity: 0.7 }
      });
    } catch (error) {
      console.error('Failed to test speech:', error);
    }
  };

  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex flex-col gap-3 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Voice</p>
          <h1 className="text-3xl font-semibold text-white">Voice Assistant</h1>
        </div>
        <p className="text-sm text-white/70 max-w-3xl">
          Experience natural Hindi voice conversations with Shivi. Wake words, emotional speech, and hands-free interaction.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 mb-8">
        <div className="space-y-6">
          <VoiceControls
            uiState={uiState}
            config={config}
            onConfigChange={handleConfigChange}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            onEmergencyStop={handleEmergencyStop}
          />

          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Quick Test</h2>
            <button
              onClick={handleTestSpeech}
              className="w-full rounded-3xl bg-shivi-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-400"
            >
              🔊 Test Hindi Speech
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {conversation && (
            <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
              <h2 className="text-base font-semibold text-white mb-4">Current Conversation</h2>
              <div className="space-y-3">
                <div className="text-sm text-white/80">
                  <span className="text-shivi-pink-300">Status:</span> {conversation.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-white/80">
                  <span className="text-shivi-pink-300">Duration:</span> {Math.round((Date.now() - conversation.startTime) / 1000)}s
                </div>
                <div className="text-sm text-white/80">
                  <span className="text-shivi-pink-300">Turns:</span> {conversation.turnCount}
                </div>
                <div className="text-sm text-white/80">
                  <span className="text-shivi-pink-300">Emotion:</span> {conversation.currentEmotion.type} ({Math.round(conversation.currentEmotion.intensity * 100)}%)
                </div>
              </div>

              {conversation.transcripts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Recent Transcripts</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {conversation.transcripts.slice(-3).map((transcript, index) => (
                      <div key={index} className="text-xs text-white/60 bg-shivi-dark-900 p-2 rounded">
                        "{transcript.transcript}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Voice History</h2>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-white/60">No voice interactions yet</p>
              ) : (
                history.slice(-5).map((item, index) => (
                  <div key={index} className="rounded-2xl bg-shivi-dark-900 p-3 border border-white/5">
                    <p className="text-sm text-white/90">"{item.transcript}"</p>
                    <p className="text-xs text-white/50">→ "{item.response}"</p>
                    <p className="text-xs text-shivi-pink-300">
                      {new Date(item.timestamp).toLocaleTimeString()} • {item.emotion.type}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Voice Features</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Hindi Speech Recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Wake Word Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Emotional TTS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Noise Reduction</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Privacy Controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Real-time Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Offline Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white/80">Context Awareness</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoicePage;
