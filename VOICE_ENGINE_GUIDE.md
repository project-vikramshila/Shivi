# Shivi Voice Engine - Complete Integration Guide

## 🎙️ Overview

The Shivi Voice Engine is a comprehensive Hindi-first voice assistant system featuring:

- **Speech-to-Text (STT)**: Real-time Hindi speech recognition
- **Text-to-Speech (TTS)**: Emotionally expressive voice synthesis
- **Wake Word Detection**: Local "शिवी" / "Hey Shivi" recognition
- **Emotional Modulation**: 8 emotion types with intensity control
- **Privacy-First**: Local processing with optional cloud enhancement
- **Context Awareness**: Multi-turn conversation management

---

## 📦 Architecture

### Module Structure

```
src/modules/voice/
├── types.ts              # TypeScript interfaces (150+ types)
├── index.ts              # Main VoiceEngine orchestrator
├── stt.ts                # Speech-to-Text engine
├── tts.ts                # Text-to-Speech engine
├── wakeword.ts           # Wake word detection
├── audio.ts              # Audio processing & analysis
├── context.ts            # Conversation context manager
├── security.ts           # Privacy & security controls
└── voiceEngine.ts        # Legacy compatibility layer
```

### Component Relationships

```
VoiceEngine (Main Orchestrator)
├── STT Engine (Speech Recognition)
├── TTS Engine (Voice Synthesis)
├── Wake Word Engine (Detection)
├── Audio Processor (Analysis & Filtering)
├── Conversation Manager (Context)
├── Voice Security (Privacy Controls)
└── React UI Components
    ├── VoiceOrb (Animated Interface)
    └── VoiceControls (Settings Panel)
```

---

## 🚀 Quick Start

### 1. Initialize Voice Engine

```typescript
import { voiceEngine } from '@modules/voice';

// Initialize in React component
useEffect(() => {
  const initVoice = async () => {
    try {
      await (window as any).shiviApi.voice.initialize();
      console.log('Voice engine ready!');
    } catch (error) {
      console.error('Voice init failed:', error);
    }
  };
  
  initVoice();
}, []);
```

### 2. Start Listening

```typescript
// Start listening for speech
await (window as any).shiviApi.voice.startListening();

// Listen for speech results
(window as any).shiviApi.voice.on('speech-result', (result) => {
  console.log('Transcript:', result.results[0]?.transcript);
});

// Stop listening
await (window as any).shiviApi.voice.stopListening();
```

### 3. Speak Text with Emotion

```typescript
// Speak with emotion
await (window as any).shiviApi.voice.speak({
  text: 'नमस्ते! मैं शिवी हूं।',
  emotion: { 
    type: 'warm', 
    intensity: 0.7 
  },
  mode: { 
    type: 'normal', 
    intensity: 0.5 
  }
});
```

---

## 🗣️ Speech-to-Text (STT)

### Implemented Features

- Multi-language support (Hi, En variants)
- Real-time transcription
- Interim results
- Confidence scoring
- Hindi-specific optimizations

### Supported Languages

```typescript
const languages = sttEngine.getSupportedLanguages();
// Returns: ['hi-IN', 'en-IN', 'hi', 'en-US', 'en-GB']
```

### Configuration

```typescript
voiceEngine.updateConfig({
  language: 'hi-IN',
  sttContinuous: true,      // Keep listening after speech ends
  sttInterimResults: true,   // Show results as user speaks
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
  sampleRate: 16000,
  channelCount: 1,
});
```

### Event Handling

```typescript
voiceEngine.on('speech-result', (event) => {
  const results = event.results;
  const latestResult = results[results.length - 1];
  
  console.log('Transcript:', latestResult.transcript);
  console.log('Confidence:', latestResult.confidence);
  console.log('Is Final:', latestResult.isFinal);
});
```

---

## 🎙️ Text-to-Speech (TTS)

### Emotion System

```typescript
interface VoiceEmotion {
  type: 'neutral' | 'happy' | 'sad' | 'excited' | 
        'calm' | 'concerned' | 'playful' | 'warm';
  intensity: number; // 0-1
}
```

#### Emotion Effects

| Emotion | Rate | Pitch | Volume | Use Case |
|---------|------|-------|--------|----------|
| Happy | ↑↑ | ↑↑ | ↑ | Positive responses |
| Sad | ↓↓ | ↓ | ↓ | Empathetic responses |
| Excited | ↑↑↑ | ↑↑↑ | ↑↑ | Enthusiastic responses |
| Calm | ↓ | ↓ | ↓ | Meditative/focus mode |
| Concerned | ↓ | ↓ | ↓ | Warning/issue alerts |
| Playful | ↑ | ↑ | → | Casual/friendly mode |
| Warm | → | ↑ | → | Default/natural tone |
| Neutral | → | → | → | Fact-based info |

### Voice Modes

```typescript
interface VoiceMode {
  type: 'normal' | 'whisper' | 'focus' | 'excited' | 'calm';
  intensity: number; // 0-1
}
```

#### Mode Characteristics

| Mode | Volume | Speed | Best For |
|------|--------|-------|----------|
| Normal | Standard | Standard | Everyday interaction |
| Whisper | Very low | Slow | Private/sensitive info |
| Focus | Low | Slow | Important notifications |
| Excited | High | Fast | Celebratory moments |
| Calm | Low | Slow | Meditation/help mode |

### Configuration

```typescript
voiceEngine.updateConfig({
  ttsVoice: 'hi-IN',
  ttsRate: 1.0,      // 0.5 - 2.0
  ttsPitch: 1.0,     // 0.5 - 2.0
  ttsVolume: 0.8,    // 0 - 1.0
  emotionalTone: true,
});
```

### Speaking with Full Control

```typescript
await voiceEngine.speak({
  text: 'Aap thode tired lag rahe ho...',
  emotion: { 
    type: 'concerned', 
    intensity: 0.6 
  },
  mode: { 
    type: 'focus', 
    intensity: 0.7 
  },
  rate: 0.95,
  pitch: 1.1,
  volume: 0.8,
});
```

---

## 👂 Wake Word System

### Supported Wake Words (Default)

```typescript
wakeWords: [
  'शिवी',        // Hindi: Shivi
  'hey shivi',   // English: Hey Shivi
  'सुनो शिवी'    // Hindi: Listen Shivi
]
```

### Add Custom Wake Words

```typescript
// In main process
wakeWordEngine.addWakeWord('हलो शिवी');  // Hello Shivi
wakeWordEngine.addWakeWord('shivi wake up');
```

### Wake Word Event

```typescript
voiceEngine.on('wake-word', (event) => {
  console.log('Wake word detected:', event.wakeWord);
  console.log('Confidence:', event.confidence);
  console.log('Audio level:', event.audioLevel);
  
  // Trigger listening or special action
  startConversation();
});
```

---

## 🎨 Voice UI Components

### VoiceOrb Component

Animated voice interface with emotional state visualization.

```typescript
import VoiceOrb from '@components/voice/VoiceOrb';

<VoiceOrb 
  state={uiState}
  size={120}
  onClick={handleOrbClick}
  className="my-orb"
/>
```

**Features:**
- Real-time waveform visualization
- Emotional state animation
- Wake word detection pulse
- Audio level indicator
- Speaking/listening animation

### VoiceControls Component

Full control panel for voice configuration.

```typescript
import VoiceControls from '@components/voice/VoiceControls';

<VoiceControls
  uiState={uiState}
  config={config}
  onConfigChange={handleConfigChange}
  onStartListening={handleStart}
  onStopListening={handleStop}
  onEmergencyStop={handleStop}
/>
```

**Controls:**
- Start/Stop listening
- Emergency stop button
- Config adjustment sliders
- Privacy mode toggle
- Audio level meter
- Activity logs

### VoicePage

Complete voice hub page.

```typescript
import VoicePage from '@pages/VoicePage';

// Already integrated in App.tsx sidebar
```

---

## 🧠 Conversation Context

### Automatic Context Management

```typescript
// Conversation starts automatically on wake word
voiceEngine.on('wake-word', () => {
  conversationManager.startConversation();
});

// Get current context
const context = voiceEngine.getConversationContext();

console.log(context);
// {
//   id: 'conv_1234_xyz',
//   startTime: 1234567890,
//   turnCount: 3,
//   currentEmotion: { type: 'warm', intensity: 0.7 },
//   currentMode: { type: 'normal', intensity: 0.5 },
//   isActive: true,
//   transcripts: [...],
//   responses: [...]
// }
```

### Conversation History

```typescript
// Load history
const history = await voiceEngine.getConversationHistory(10);

history.forEach(memory => {
  console.log(memory.transcript);   // User input
  console.log(memory.response);     // AI response
  console.log(memory.emotion);      // Voice emotion used
  console.log(memory.duration);     // Turn duration
  console.log(memory.quality);      // Quality score
});

// Save conversation
await voiceEngine.saveConversation({
  conversationId: context.id,
  transcript: 'User said...',
  response: 'Shivi said...',
  emotion: { type: 'warm', intensity: 0.7 },
  mode: { type: 'normal', intensity: 0.5 },
  duration: 2500,
  quality: 0.95,
  timestamp: Date.now(),
});
```

---

## 🔐 Privacy & Security

### Privacy-First Design

By default, the voice engine:
- ✅ Processes audio locally
- ✅ Does NOT record without permission
- ✅ Does NOT store audio permanently
- ✅ Does NOT send to cloud services
- ❌ Does NOT access storage

### Privacy Mode

```typescript
// Enable strict privacy mode
voiceEngine.enablePrivacyMode();
// - No recording
// - No storage
// - No cloud processing
// - Immediate data cleanup

// Disable when user allows
voiceEngine.disablePrivacyMode();
// - Allow basic recording (5-minute retention)
// - Allow temporary storage
// - Keep offline-first preference
```

### Permission Management

```typescript
// Check microphone permission
const hasPermission = 
  await (window as any).shiviApi.voice.checkMicrophonePermission();

// Request if needed
if (!hasPermission) {
  const granted = 
    await (window as any).shiviApi.voice.requestMicrophonePermission();
  
  if (!granted) {
    console.error('Microphone access denied');
    return;
  }
}
```

### Data Cleanup

```typescript
// Clear all stored voice data
await voiceEngine.clearStoredData();

// Privacy settings
const settings = voiceEngine.getPrivacySettings();
console.log(settings);
// {
//   allowRecording: true,
//   allowStorage: true,
//   allowCloudProcessing: false,   // Always false by default
//   retentionPeriod: 5,            // minutes
//   anonymizeData: true
// }
```

---

## 🔌 Integration with Other Systems

### Voice → Automation

```typescript
// Route voice commands to automation
voiceEngine.on('speech-result', async (result) => {
  if (result.results[result.results.length - 1].isFinal) {
    const transcript = result.results[result.results.length - 1].transcript;
    
    // Send to automation system
    const plan = await (window as any).shiviApi.automation.planTask(transcript);
    
    // Confirm with user
    await voiceEngine.speak({
      text: `मैं यह काम कर रही हूं: ${plan.explanation}`,
      emotion: { type: 'excited', intensity: 0.6 }
    });
    
    // Execute
    const result = await (window as any).shiviApi.automation.executeTask(plan);
  }
});
```

### Voice → Memory

```typescript
// Save conversation to memory system
voiceEngine.on('speech-result', async (result) => {
  const context = voiceEngine.getConversationContext();
  
  // Store transcript in memory
  await (window as any).shiviApi.memory.store({
    type: 'voice_transcript',
    content: result.results[0].transcript,
    conversationId: context.id,
    timestamp: Date.now(),
  });
});
```

### Voice → Reminders

```typescript
// Set reminders via voice
voiceEngine.on('speech-result', (result) => {
  const transcript = result.results[0].transcript;
  
  // Check if it's a reminder command
  if (transcript.includes('reminder') || transcript.includes('याद')) {
    // Extract reminder details
    const reminderText = transcript.replace(/.*reminder.*/, '').trim();
    
    // Create reminder
    (window as any).shiviApi.reminder.createReminder({
      title: reminderText,
      description: 'Created via voice',
      time: new Date(),
    });
    
    // Confirm
    voiceEngine.speak({
      text: `ठीक है, मैंने "${reminderText}" के लिए एक reminder बना दिया।`,
      emotion: { type: 'happy', intensity: 0.7 }
    });
  }
});
```

---

## ⚙️ Configuration Reference

### Complete Configuration Object

```typescript
interface VoiceConfig {
  // Core
  enabled: boolean;                          // Master on/off
  language: 'hi-IN' | 'en-IN' | 'hi' | ...;  // Language
  
  // Wake Words
  wakeWords: string[];                       // List of wake words
  
  // TTS (Synthesis)
  ttsVoice: string;                          // Voice name/lang
  ttsRate: number;                           // 0.5-2.0
  ttsPitch: number;                          // 0.5-2.0
  ttsVolume: number;                         // 0-1
  
  // STT (Recognition)
  sttContinuous: boolean;                    // Keep listening
  sttInterimResults: boolean;                // Show partial results
  
  // Audio Processing
  noiseReduction: boolean;                   // Noise gate
  echoCancellation: boolean;                 // Echo cancellation
  autoGainControl: boolean;                  // Auto volume
  sampleRate: number;                        // 16000 Hz
  channelCount: number;                      // Mono/Stereo
  
  // Features
  privacyMode: boolean;                      // Privacy-first
  offlineMode: boolean;                      // Prefer local
  emotionalTone: boolean;                    // Enable emotions
}
```

### Update Configuration

```typescript
voiceEngine.updateConfig({
  language: 'hi-IN',
  ttsRate: 1.1,
  ttsPitch: 1.05,
  emotionalTone: true,
});
```

---

## 📊 Monitoring & Diagnostics

### UI State

```typescript
const state = voiceEngine.getUIState();

console.log(state);
// {
//   isListening: true,
//   isSpeaking: false,
//   isProcessing: false,
//   wakeWordDetected: true,
//   audioLevel: 0.65,
//   emotion: { type: 'warm', intensity: 0.7 },
//   mode: { type: 'normal', intensity: 0.5 },
//   error: null
// }
```

### Conversation Analytics

```typescript
const context = voiceEngine.getConversationContext();
const analytics = conversationManager.analyzeConversationFlow();

console.log(analytics);
// {
//   averageTurnLength: 45,
//   emotionalVariability: 0.3,
//   conversationPace: 8.5               // turns per minute
// }
```

---

## 🧪 Testing

```bash
# Test voice engine
npm run test:voice

# Run test suite
node test-voice-engine.js

# Expected output:
# ✅ Configuration tests pass
# ✅ Emotion modulation verified
# ✅ Voice modes tested
# ✅ Conversation context working
# 🎉 Voice Status: READY FOR PRODUCTION
```

---

## 🐛 Troubleshooting

### Microphone Not Working

```typescript
// Check permission
const hasPerm = await voiceEngine.checkMicrophonePermission();
if (!hasPerm) {
  // Request permission
  await voiceEngine.requestMicrophonePermission();
}
```

### Speech Not Recognized

- Check language setting matches speech language
- Reduce background noise (enable noiseSuppression)
- Increase microphone volume
- Check STT language support

### Wake Word Not Detected

- Ensure wake word volume is adequate
- Check background noise levels
- Verify wake word configuration
- Test with wake word detection demo

### Audio Quality Issues

```typescript
voiceEngine.updateConfig({
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
});
```

---

## 🚀 Performance Tips

1. **Lazy Initialize**: Initialize voice only when needed
2. **Cleanup**: Call `voiceEngine.destroy()` when done
3. **Event Throttling**: Debounce rapid UI updates
4. **Memory**: Monitor conversation history size
5. **Audio**: Use mono (1 channel) for lower bandwidth

---

## 📚 Additional Resources

- **Voice Types**: `src/modules/voice/types.ts`
- **STT Docs**: `src/modules/voice/stt.ts`
- **TTS Docs**: `src/modules/voice/tts.ts`
- **Security**: `src/modules/voice/security.ts`
- **Tests**: `test-voice-engine.js`

---

## 🎯 Next Steps

1. **User Testing**: Gather feedback on voice quality
2. **Model Improvements**: Fine-tune emotion recognition
3. **Multi-language**: Add more language variants
4. **Accessibility**: Enhanced visual feedback for hearing impaired
5. **Performance**: Optimize audio processing pipeline

---

**🎙️ Voice Engine Status: PRODUCTION-READY**

Built for natural, emotionally expressive Hindi conversations.
