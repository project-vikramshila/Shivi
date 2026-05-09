import { PrismaClient } from '@prisma/client';
import { dbConfig } from './config';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

if (!dbConfig.databaseUrl) {
  console.warn('DATABASE_URL is not defined. Neon sync and PostgreSQL access are disabled.');
}

export default prisma;
