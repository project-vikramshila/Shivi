import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import './dbBridge';
import './reminderBridge';
import './osBridge';
import { OSCore } from '../os';
import { initializeReminderSystem } from '../modules/reminders';
import { memorySecurity } from '../modules/memory/security/encryption';
import { memoryStorage } from '../modules/memory/storage/database';
import { automationAPI } from '../modules/automation';
import { voiceEngine } from '../modules/voice';
import { loadApplicationEnvironment } from '../security/envManager';
import { applySecurityHardening } from '../security/hardening';
import { initCrashReporter, registerAppErrorHandlers } from '../monitoring/crashReporter';
import { initializeRecoveryManager } from '../recovery/recoveryManager';
import { initializeAutoUpdater } from '../updates/autoUpdater';
import { validatePackagingConfiguration } from '../build/packaging';
import { logInfo, logWarn } from '../logging/logger';

loadApplicationEnvironment();

// Validate Gemini API key at startup (do not expose the key to renderer)
const hasGeminiKey = !!process.env.GEMINI_API_KEY;
if (!hasGeminiKey) {
  console.warn('GEMINI_API_KEY not configured. Gemini enhancements will be disabled.');
}

function createWindow(): BrowserWindow {
  // Preload path - will be at ./dist/main/preload.js at runtime
  const preloadPath = path.join(__dirname, 'preload.js');
  
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 840,
    minWidth: 1100,
    minHeight: 760,
    title: 'Shivi AI',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  applySecurityHardening(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.shivi.ai');
  initCrashReporter();
  registerAppErrorHandlers();
  initializeRecoveryManager();
  validatePackagingConfiguration();

  const mainWindow = createWindow();
  initializeAutoUpdater(mainWindow);

  // Initialize reminder system
  initializeReminderSystem();

  // Start Shivi OS core runtime and local services
  try {
    await OSCore.getInstance().initialize();
  } catch (error) {
    console.error('Failed to initialize Shivi OS core:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('core:get-version', async () => {
  return app.getVersion();
});

ipcMain.handle('core:get-config', async () => {
  const { getConfig } = await import('../core/config/configManager');
  return getConfig();
});

ipcMain.handle('core:set-config', async (event, config: any) => {
  const { setConfig } = await import('../core/config/configManager');
  setConfig(config);
});

ipcMain.handle('ai:get-gemini-api-key', async () => {
  // Keep existing handler for trusted main-process usage only.
  return process.env.GEMINI_API_KEY || null;
});

// Renderer-safe check: only expose whether key exists, not the key itself
ipcMain.handle('ai:has-key', async () => {
  return !!process.env.GEMINI_API_KEY;
});

// Memory security IPC handlers
ipcMain.handle('get-encryption-key', async () => {
  try {
    // Get the encryption key from the main process memory security
    const key = (memorySecurity as any).getStoredKey();
    return key;
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    return null;
  }
});

ipcMain.handle('store-encryption-key', async (event, key: string) => {
  try {
    // Store the encryption key in the main process
    (memorySecurity as any).storeKey(key);
    return true;
  } catch (error) {
    console.error('Failed to store encryption key:', error);
    return false;
  }
});

// Memory storage IPC handlers
ipcMain.handle('get-memory-data', async (event, key: string) => {
  try {
    return (memoryStorage as any).getFromPersistentStorage(key);
  } catch (error) {
    console.error('Failed to get memory data:', error);
    return null;
  }
});

ipcMain.handle('save-memory-data', async (event, key: string, data: string) => {
  try {
    (memoryStorage as any).saveToPersistentStorage(key, data);
    return true;
  } catch (error) {
    console.error('Failed to save memory data:', error);
    return false;
  }
});

// ============================================
// Automation System IPC Handlers
// ============================================

ipcMain.handle('automation:enable', async () => {
  try {
    automationAPI.enableAutomation('assist'); // Default to assist level
    return { success: true };
  } catch (error) {
    console.error('Failed to enable automation:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:disable', async () => {
  try {
    automationAPI.disableAutomation();
    return { success: true };
  } catch (error) {
    console.error('Failed to disable automation:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:emergency-stop', async () => {
  try {
    automationAPI.emergencyStop();
    return { success: true };
  } catch (error) {
    console.error('Failed to trigger emergency stop:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:grant-permission', async (event, appName: string, permissionLevel: string) => {
  try {
    const level = permissionLevel as 'observe' | 'read' | 'assist' | 'full';
    automationAPI.grantPermission(appName, level);
    return { success: true };
  } catch (error) {
    console.error('Failed to grant permission:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:revoke-permission', async (event, appName: string) => {
  try {
    automationAPI.revokePermission(appName);
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke permission:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:get-logs', async () => {
  try {
    const logs = automationAPI.getLogs();
    return logs;
  } catch (error) {
    console.error('Failed to get automation logs:', error);
    return [];
  }
});

ipcMain.handle('automation:clear-logs', async () => {
  try {
    automationAPI.clearLogs();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear logs:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:get-status', async () => {
  try {
    const status = automationAPI.getStatus();
    return status;
  } catch (error) {
    console.error('Failed to get automation status:', error);
    return { enabled: false, executing: false, error: String(error) };
  }
});

ipcMain.handle('automation:get-config', async () => {
  try {
    const config = automationAPI.getConfig();
    return config;
  } catch (error) {
    console.error('Failed to get automation config:', error);
    return null;
  }
});

ipcMain.handle('automation:update-config', async (event, updates: any) => {
  try {
    automationAPI.updateConfig(updates);
    return { success: true };
  } catch (error) {
    console.error('Failed to update automation config:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:plan-task', async (event, userRequest: string) => {
  try {
    const plan = await automationAPI.planTask(userRequest);
    return { success: true, plan };
  } catch (error) {
    console.error('Failed to plan automation task:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:execute-task', async (event, task: any) => {
  try {
    const result = await automationAPI.executeTask(task);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to execute automation task:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('automation:get-task-history', async () => {
  try {
    const history = automationAPI.getTaskHistory();
    return { success: true, history };
  } catch (error) {
    console.error('Failed to get automation task history:', error);
    return { success: false, error: String(error) };
  }
});

// ============================================
// Voice Engine IPC Handlers
// ============================================

ipcMain.handle('voice:initialize', async () => {
  try {
    await voiceEngine.initialize();
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize voice engine:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:start-listening', async () => {
  try {
    await voiceEngine.startListening();
    return { success: true };
  } catch (error) {
    console.error('Failed to start voice listening:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:stop-listening', async () => {
  try {
    await voiceEngine.stopListening();
    return { success: true };
  } catch (error) {
    console.error('Failed to stop voice listening:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:speak', async (event, options: any) => {
  try {
    await voiceEngine.speak(options);
    return { success: true };
  } catch (error) {
    console.error('Failed to speak:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:stop-speaking', async () => {
  try {
    await voiceEngine.stopSpeaking();
    return { success: true };
  } catch (error) {
    console.error('Failed to stop speaking:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:update-config', async (event, config: any) => {
  try {
    voiceEngine.updateConfig(config);
    return { success: true };
  } catch (error) {
    console.error('Failed to update voice config:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:get-config', async () => {
  try {
    const config = voiceEngine.getConfig();
    return config;
  } catch (error) {
    console.error('Failed to get voice config:', error);
    return null;
  }
});

ipcMain.handle('voice:get-ui-state', async () => {
  try {
    const uiState = voiceEngine.getUIState();
    return uiState;
  } catch (error) {
    console.error('Failed to get voice UI state:', error);
    return null;
  }
});

ipcMain.handle('voice:get-conversation-context', async () => {
  try {
    const context = voiceEngine.getConversationContext();
    return context;
  } catch (error) {
    console.error('Failed to get conversation context:', error);
    return null;
  }
});

ipcMain.handle('voice:get-conversation-history', async (event, limit?: number) => {
  try {
    const history = await voiceEngine.getConversationHistory(limit);
    return history;
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
});

ipcMain.handle('voice:save-conversation', async (event, memory: any) => {
  try {
    await voiceEngine.saveConversation(memory);
    return { success: true };
  } catch (error) {
    console.error('Failed to save conversation:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:clear-stored-data', async () => {
  try {
    await voiceEngine.clearStoredData();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear stored data:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:enable-privacy-mode', async () => {
  try {
    voiceEngine.enablePrivacyMode();
    return { success: true };
  } catch (error) {
    console.error('Failed to enable privacy mode:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('voice:disable-privacy-mode', async () => {
  try {
    voiceEngine.disablePrivacyMode();
    return { success: true };
  } catch (error) {
    console.error('Failed to disable privacy mode:', error);
    return { success: false, error: String(error) };
  }
});

