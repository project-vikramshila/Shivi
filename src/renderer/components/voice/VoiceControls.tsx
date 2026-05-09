/**
 * Voice Controls Component
 * Voice settings and controls interface
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VoiceOrb from './VoiceOrb';
import type { VoiceUIState, VoiceConfig } from '../../../modules/voice/types';

interface VoiceControlsProps {
  uiState: VoiceUIState;
  config: VoiceConfig;
  onConfigChange: (config: Partial<VoiceConfig>) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onEmergencyStop: () => void;
  className?: string;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  uiState,
  config,
  onConfigChange,
  onStartListening,
  onStopListening,
  onEmergencyStop,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleListening = () => {
    if (uiState.isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleConfigChange = (key: keyof VoiceConfig, value: any) => {
    onConfigChange({ [key]: value });
  };

  return (
    <Container className={className}>
      <MainControls>
        <VoiceOrb
          state={uiState}
          size={120}
          onClick={handleToggleListening}
        />

        <ControlButtons>
          <ControlButton
            onClick={handleToggleListening}
            active={uiState.isListening}
            variant="primary"
          >
            {uiState.isListening ? '🔇 Stop Listening' : '🎤 Start Listening'}
          </ControlButton>

          <ControlButton
            onClick={onEmergencyStop}
            variant="danger"
            disabled={!uiState.isListening && !uiState.isSpeaking}
          >
            🚨 Emergency Stop
          </ControlButton>

          <ControlButton
            onClick={() => setIsExpanded(!isExpanded)}
            variant="secondary"
          >
            ⚙️ Settings
          </ControlButton>
        </ControlButtons>
      </MainControls>

      {isExpanded && (
        <SettingsPanel>
          <SettingsTitle>Voice Settings</SettingsTitle>

          <SettingGroup>
            <SettingLabel>Language</SettingLabel>
            <Select
              value={config.language}
              onChange={(e) => handleConfigChange('language', e.target.value)}
            >
              <option value="hi-IN">हिंदी (India)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi">हिंदी</option>
            </Select>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Voice Speed</SettingLabel>
            <Slider
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={config.ttsRate}
              onChange={(e) => handleConfigChange('ttsRate', parseFloat(e.target.value))}
            />
            <SliderValue>{config.ttsRate}x</SliderValue>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Voice Pitch</SettingLabel>
            <Slider
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={config.ttsPitch}
              onChange={(e) => handleConfigChange('ttsPitch', parseFloat(e.target.value))}
            />
            <SliderValue>{config.ttsPitch}x</SliderValue>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Volume</SettingLabel>
            <Slider
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.ttsVolume}
              onChange={(e) => handleConfigChange('ttsVolume', parseFloat(e.target.value))}
            />
            <SliderValue>{Math.round(config.ttsVolume * 100)}%</SliderValue>
          </SettingGroup>

          <Checkboxes>
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                checked={config.noiseReduction}
                onChange={(e) => handleConfigChange('noiseReduction', e.target.checked)}
              />
              <CheckboxLabel>Noise Reduction</CheckboxLabel>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                checked={config.echoCancellation}
                onChange={(e) => handleConfigChange('echoCancellation', e.target.checked)}
              />
              <CheckboxLabel>Echo Cancellation</CheckboxLabel>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                checked={config.emotionalTone}
                onChange={(e) => handleConfigChange('emotionalTone', e.target.checked)}
              />
              <CheckboxLabel>Emotional Tone</CheckboxLabel>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                checked={config.privacyMode}
                onChange={(e) => handleConfigChange('privacyMode', e.target.checked)}
              />
              <CheckboxLabel>Privacy Mode</CheckboxLabel>
            </CheckboxGroup>
          </Checkboxes>

          <WakeWordsSection>
            <WakeWordsTitle>Wake Words</WakeWordsTitle>
            <WakeWordsList>
              {config.wakeWords.map((word, index) => (
                <WakeWordTag key={index}>{word}</WakeWordTag>
              ))}
            </WakeWordsList>
            <WakeWordsNote>
              Wake words are automatically detected when listening is active
            </WakeWordsNote>
          </WakeWordsSection>
        </SettingsPanel>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const MainControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ControlButton = styled.button<{ active?: boolean; variant: string; disabled?: boolean }>`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  background: ${props => {
    if (props.disabled) return '#64748b';
    switch (props.variant) {
      case 'primary': return props.active ? '#3b82f6' : '#1e40af';
      case 'danger': return '#dc2626';
      case 'secondary': return '#374151';
      default: return '#374151';
    }
  }};

  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SettingsPanel = styled.div`
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingsTitle = styled.h3`
  color: #f1f5f9;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const SettingGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SettingLabel = styled.label`
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
  min-width: 100px;
`;

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background: rgba(30, 41, 59, 0.5);
  color: #f1f5f9;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Slider = styled.input`
  flex: 1;
  max-width: 120px;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  &::-webkit-slider-track {
    height: 4px;
    background: rgba(148, 163, 184, 0.3);
    border-radius: 2px;
  }
`;

const SliderValue = styled.span`
  color: #94a3b8;
  font-size: 12px;
  min-width: 40px;
  text-align: right;
`;

const Checkboxes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
`;

const CheckboxLabel = styled.label`
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
`;

const WakeWordsSection = styled.div`
  margin-top: 8px;
`;

const WakeWordsTitle = styled.h4`
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const WakeWordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const WakeWordTag = styled.span`
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const WakeWordsNote = styled.p`
  color: #64748b;
  font-size: 12px;
  margin: 8px 0 0 0;
`;

export default VoiceControls;