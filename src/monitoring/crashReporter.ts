import { app, crashReporter, BrowserWindow } from 'electron';
import { logError, logInfo, logWarn } from '../logging/logger';

export const initCrashReporter = () => {
  const submitURL = process.env.CRASH_REPORT_URL?.trim();

  crashReporter.start({
    companyName: 'Namaste Codes',
    productName: 'Shivi AI',
    submitURL: submitURL || undefined,
    uploadToServer: !!submitURL,
    compress: true,
    extra: {
      env: process.env.NODE_ENV || 'production',
      appVersion: app.getVersion(),
    },
  });

  logInfo('Crash reporter initialized', { uploadToServer: !!submitURL });
};

export const registerAppErrorHandlers = (mainWindow?: BrowserWindow) => {
  process.on('uncaughtException', (error) => {
    logError('Uncaught exception', { error: String(error) });
  });

  process.on('unhandledRejection', (reason) => {
    logError('Unhandled promise rejection', { reason: String(reason) });
  });

  app.on('renderer-process-crashed', (event, webContents, killed) => {
    const url = webContents?.getURL?.() || 'unknown';
    logError('Renderer process crashed', { killed, url });
    mainWindow?.webContents.send('app:renderer-crashed', { url, killed });
  });

  app.on('child-process-gone', (_event, details) => {
    logWarn('Child process gone', { details });
    mainWindow?.webContents.send('app:child-process-gone', details);
  });
};
