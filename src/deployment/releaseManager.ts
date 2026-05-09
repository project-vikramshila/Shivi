import { execSync } from 'child_process';
import path from 'path';
import { logInfo, logError } from '../logging/logger';

export const buildRelease = (channel = 'stable') => {
  try {
    logInfo('Starting release build', { channel });
    const root = path.resolve(process.cwd());
    execSync(`npm run build`, { cwd: root, stdio: 'inherit' });
    logInfo('Application source build completed');
  } catch (error) {
    logError('Build failed during release orchestration', { error: String(error) });
    throw error;
  }
};

export const packageRelease = () => {
  try {
    logInfo('Packaging release with electron-builder');
    execSync('npx electron-builder', { stdio: 'inherit' });
    logInfo('Packaging finished');
  } catch (error) {
    logError('Packaging failed during release orchestration', { error: String(error) });
    throw error;
  }
};
