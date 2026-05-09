import { logInfo, logWarn } from '../logging/logger';

export const validatePackagingConfiguration = () => {
  logInfo('Validating packaging configuration');
  const required = ['GEMINI_API_KEY', 'CRASH_REPORT_URL'];
  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    logWarn('Missing packaging environment values', { missing });
    return false;
  }

  logInfo('Packaging configuration validated');
  return true;
};
