/**
 * Voice Orb Component
 * Animated voice interface with emotional states
 */

import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import type { VoiceUIState, VoiceEmotion, VoiceMode } from '../../../modules/voice/types';

interface VoiceOrbProps {
  state: VoiceUIState;
  size?: number;
  onClick?: () => void;
  className?: string;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  size = 120,
  onClick,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    // Generate waveform data based on audio level
    const generateWaveform = () => {
      const data = [];
      const points = 32;

      for (let i = 0; i < points; i++) {
        // Base amplitude from audio level
        let amplitude = state.audioLevel * 0.8;

        // Add emotional modulation
        amplitude *= getEmotionMultiplier(state.emotion);

        // Add mode modulation
        amplitude *= getModeMultiplier(state.mode);

        // Add listening/speaking animation
        if (state.isListening || state.isSpeaking) {
          amplitude *= (0.5 + Math.sin(Date.now() * 0.01 + i * 0.5) * 0.5);
        }

        // Add wake word pulse
        if (state.wakeWordDetected) {
          amplitude *= (1 + Math.sin(Date.now() * 0.02) * 0.3);
        }

        data.push(Math.max(0.1, Math.min(1, amplitude)));
      }

      setWaveformData(data);
    };

    const animate = () => {
      generateWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw orb
    drawOrb(ctx, size);

    // Draw waveform
    drawWaveform(ctx, size);

    // Draw status indicators
    drawStatusIndicators(ctx, size);

  }, [size, waveformData, state]);

  const drawOrb = (ctx: CanvasRenderingContext2D, size: number) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    // Create gradient based on state
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );

    if (state.wakeWordDetected) {
      gradient.addColorStop(0, '#fbbf24'); // Yellow for wake word
      gradient.addColorStop(1, '#f59e0b');
    } else if (state.isSpeaking) {
      gradient.addColorStop(0, '#10b981'); // Green for speaking
      gradient.addColorStop(1, '#059669');
    } else if (state.isListening) {
      gradient.addColorStop(0, '#3b82f6'); // Blue for listening
      gradient.addColorStop(1, '#2563eb');
    } else if (state.isProcessing) {
      gradient.addColorStop(0, '#8b5cf6'); // Purple for processing
      gradient.addColorStop(1, '#7c3aed');
    } else {
      gradient.addColorStop(0, '#e2e8f0'); // Gray for idle
      gradient.addColorStop(1, '#cbd5e1');
    }

    // Draw main orb
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add glow effect
    if (state.isListening || state.isSpeaking || state.wakeWordDetected) {
      ctx.shadowColor = state.wakeWordDetected ? '#fbbf24' :
                       state.isSpeaking ? '#10b981' : '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Add inner highlight
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, size: number) => {
    if (waveformData.length === 0) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    ctx.strokeStyle = state.isListening ? '#3b82f6' :
                     state.isSpeaking ? '#10b981' : '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw waveform circles
    waveformData.forEach((amplitude, index) => {
      const angle = (index / waveformData.length) * Math.PI * 2;
      const waveRadius = radius + amplitude * size * 0.1;

      const x = centerX + Math.cos(angle) * waveRadius;
      const y = centerY + Math.sin(angle) * waveRadius;

      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });
  };

  const drawStatusIndicators = (ctx: CanvasRenderingContext2D, size: number) => {
    const centerX = size / 2;
    const centerY = size / 2;

    // Draw emotion indicator
    if (state.emotion.intensity > 0.3) {
      const emotionColor = getEmotionColor(state.emotion);
      ctx.fillStyle = emotionColor;
      ctx.beginPath();
      ctx.arc(centerX + size * 0.25, centerY - size * 0.25, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw mode indicator
    if (state.mode.type !== 'normal') {
      const modeColor = getModeColor(state.mode);
      ctx.fillStyle = modeColor;
      ctx.beginPath();
      ctx.arc(centerX - size * 0.25, centerY - size * 0.25, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const getEmotionColor = (emotion: VoiceEmotion): string => {
    switch (emotion.type) {
      case 'happy': return '#10b981';
      case 'sad': return '#3b82f6';
      case 'excited': return '#f59e0b';
      case 'calm': return '#8b5cf6';
      case 'concerned': return '#ef4444';
      case 'playful': return '#ec4899';
      case 'warm': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getModeColor = (mode: VoiceMode): string => {
    switch (mode.type) {
      case 'whisper': return '#64748b';
      case 'focus': return '#059669';
      case 'excited': return '#dc2626';
      case 'calm': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const getEmotionMultiplier = (emotion: VoiceEmotion): number => {
    // Different emotions have different visual intensity
    const baseMultipliers = {
      neutral: 1.0,
      happy: 1.2,
      sad: 0.8,
      excited: 1.5,
      calm: 0.9,
      concerned: 1.1,
      playful: 1.3,
      warm: 1.1,
    };

    return baseMultipliers[emotion.type] * emotion.intensity;
  };

  const getModeMultiplier = (mode: VoiceMode): number => {
    const baseMultipliers = {
      normal: 1.0,
      whisper: 0.6,
      focus: 1.1,
      excited: 1.4,
      calm: 0.8,
    };

    return baseMultipliers[mode.type] * mode.intensity;
  };

  return (
    <OrbContainer
      className={className}
      size={size}
      onClick={onClick}
      isActive={state.isListening || state.isSpeaking || state.wakeWordDetected}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
      <StatusText>
        {state.wakeWordDetected && '👂 Wake Word Detected'}
        {state.isListening && !state.wakeWordDetected && '🎤 Listening...'}
        {state.isSpeaking && '🔊 Speaking...'}
        {state.isProcessing && '⚡ Processing...'}
        {!state.isListening && !state.isSpeaking && !state.isProcessing && !state.wakeWordDetected && '💤 Idle'}
      </StatusText>
    </OrbContainer>
  );
};

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const OrbContainer = styled.div<{ size: number; isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: ${props => props.isActive ? pulse : 'none'} 2s ease-in-out infinite;
`;

const StatusText = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-align: center;
  min-height: 16px;
`;

export default VoiceOrb;