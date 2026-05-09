import fs from 'fs';
import path from 'path';

const auditDirectory = path.join(process.cwd(), 'logs');
if (!fs.existsSync(auditDirectory)) {
  fs.mkdirSync(auditDirectory, { recursive: true });
}

const auditFile = path.join(auditDirectory, 'audit.log');

export const logAudit = (message: string, metadata?: Record<string, unknown>) => {
  const record = {
    timestamp: new Date().toISOString(),
    message,
    metadata: metadata || {},
  };
  fs.appendFileSync(auditFile, JSON.stringify(record) + '\n', 'utf-8');
};
