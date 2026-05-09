import os from 'os';
import { app } from 'electron';
import { logInfo } from '../logging/logger';

export const collectDiagnostics = () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
    userDataPath: app.getPath('userData'),
    appVersion: app.getVersion(),
  };

  logInfo('Diagnostics snapshot created', diagnostics);
  return diagnostics;
};
