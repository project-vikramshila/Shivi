import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  cloudSyncEnabled: process.env.CLOUD_SYNC_ENABLED === 'true',
  localOnlyMode: process.env.LOCAL_ONLY_MODE === 'true',
  neonSyncMode: (process.env.NEON_SYNC_MODE as 'immediate' | 'async' | 'manual') || 'async',
  syncRetryLimit: Number(process.env.SYNC_RETRY_LIMIT || 5),
  cacheTtlSeconds: Number(process.env.MEMORY_CACHE_TTL || 300),
  auditEnabled: process.env.AUDIT_ENABLED === 'true',
};
