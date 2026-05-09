import path from 'path';
import dotenv from 'dotenv';
import { logInfo, logWarn } from '../logging/logger';

export const loadApplicationEnvironment = () => {
  const environment = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production';
  const envFile = path.resolve(process.cwd(), `.env${environment === 'production' ? '' : `.${environment}`}`);

  const result = dotenv.config({ path: envFile, override: false });

  if (result.error) {
    logWarn('Environment file not loaded', { envFile, error: result.error });
  } else {
    logInfo('Environment loaded', { envFile });
  }
};
