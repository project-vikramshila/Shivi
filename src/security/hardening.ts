import { BrowserWindow, session } from 'electron';
import { logInfo } from '../logging/logger';

const defaultCsp = [
  "default-src 'self'", 
  "script-src 'self' 'unsafe-inline'", 
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
].join('; ');

export const applySecurityHardening = (mainWindow: BrowserWindow) => {
  const { webContents } = mainWindow;

  webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [defaultCsp],
      'X-Content-Type-Options': ['nosniff'],
      'X-Frame-Options': ['DENY'],
      'Referrer-Policy': ['strict-origin-when-cross-origin'],
    };

    callback({ responseHeaders });
  });

  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  webContents.on('will-navigate', (event, url) => {
    if (webContents.getURL() !== url) {
      event.preventDefault();
    }
  });

  session.defaultSession.setPermissionRequestHandler((webContentsRequest, permission, callback) => {
    logInfo('Permission requested', { permission, url: webContentsRequest.getURL() });
    callback(false);
  });
};
