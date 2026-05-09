import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logInfo, logWarn, logError } from '../logging/logger';

const updateChannel = process.env.UPDATE_CHANNEL || 'stable';

export const initializeAutoUpdater = (mainWindow?: BrowserWindow) => {
  if (process.env.NODE_ENV === 'development') {
    logInfo('Auto updater disabled in development mode');
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = updateChannel !== 'stable';
  autoUpdater.channel = updateChannel;

  autoUpdater.on('checking-for-update', () => {
    logInfo('Checking for updates', { updateChannel });
    mainWindow?.webContents.send('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    logInfo('Update available', { version: info.version, releaseNotes: info.releaseNotes });
    mainWindow?.webContents.send('update:available', info);
    autoUpdater.downloadUpdate().catch((error) => logError('Update download failed', { error: String(error) }));
  });

  autoUpdater.on('update-not-available', () => {
    logInfo('No update available', { updateChannel });
    mainWindow?.webContents.send('update:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    logInfo('Update download progress', { progress });
    mainWindow?.webContents.send('update:download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    logInfo('Update downloaded', { version: info.version });
    mainWindow?.webContents.send('update:downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    logError('Auto updater error', { error: String(error) });
    mainWindow?.webContents.send('update:error', { error: String(error) });
  });

  autoUpdater.checkForUpdates().catch((error) => {
    logError('Auto updater start failed', { error: String(error) });
  });
};
