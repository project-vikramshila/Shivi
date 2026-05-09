import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { logInfo, logWarn, logError } from '../logging/logger';

const getStateFile = () => path.join(app.getPath('userData'), 'session-state.json');

export type SessionState = {
  lastSession?: Record<string, unknown>;
  lastCrash?: string;
  savedAt?: string;
};

export const loadRecoveryState = (): SessionState | null => {
  try {
    const filePath = getStateFile();
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as SessionState;
  } catch (error) {
    logError('Failed to load recovery state', { error: String(error) });
    return null;
  }
};

export const saveRecoveryState = (state: SessionState) => {
  try {
    const filePath = getStateFile();
    const payload = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    logInfo('Recovery state saved', { filePath });
  } catch (error) {
    logError('Failed to save recovery state', { error: String(error) });
  }
};

export const clearRecoveryState = () => {
  try {
    const filePath = getStateFile();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logInfo('Recovery state cleared', { filePath });
    }
  } catch (error) {
    logWarn('Failed to clear recovery state', { error: String(error) });
  }
};

export const initializeRecoveryManager = () => {
  const state = loadRecoveryState();
  if (state?.lastCrash) {
    logWarn('Previous crash detected, restoring session state', { state });
  }
};
