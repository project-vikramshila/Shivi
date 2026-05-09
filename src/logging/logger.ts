import fs from 'fs';
import path from 'path';

const logDirectory = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFile = path.join(logDirectory, 'shivi.log');
const auditFile = path.join(logDirectory, 'audit.log');

const writeLog = (type: string, message: string, metadata: Record<string, unknown> = {}) => {
  const record = {
    timestamp: new Date().toISOString(),
    level: type,
    message,
    metadata,
  };
  fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf-8');
};

export const logInfo = (message: string, metadata: Record<string, unknown> = {}) => writeLog('info', message, metadata);
export const logWarn = (message: string, metadata: Record<string, unknown> = {}) => writeLog('warn', message, metadata);
export const logError = (message: string, metadata: Record<string, unknown> = {}) => writeLog('error', message, metadata);
export const logEvent = (eventName: string, metadata: Record<string, unknown> = {}) => writeLog('event', eventName, metadata);

export const logAudit = (message: string, metadata: Record<string, unknown> = {}) => {
  const record = {
    timestamp: new Date().toISOString(),
    message,
    metadata,
  };
  fs.appendFileSync(auditFile, JSON.stringify(record) + '\n', 'utf-8');
};

export const getRecentLogs = () => {
  if (!fs.existsSync(logFile)) {
    return [];
  }
  return fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean).slice(-200);
};
