import { PrismaClient } from '@prisma/client';

// Validate DATABASE_URL at startup for visibility in Vercel runtime logs
function validateDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim().length === 0) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.error('[Prisma Startup] FATAL: DATABASE_URL environment variable is missing or empty.');
    }
    return;
  }

  try {
    const parsed = new URL(dbUrl);
    if (!parsed.protocol.startsWith('postgres')) {
      console.warn(`[Prisma Startup] WARNING: DATABASE_URL protocol is "${parsed.protocol}", expected postgresql:.`);
    }
    if (process.env.NODE_ENV === 'production' && !parsed.hostname.includes('-pooler')) {
      console.warn(
        `[Prisma Startup] WARNING: DATABASE_URL host "${parsed.hostname}" does not contain "-pooler". Serverless runtimes should use the Neon pooled connection string to prevent connection pool exhaustion and query hangs.`
      );
    }
  } catch (err) {
    console.error('[Prisma Startup] ERROR: DATABASE_URL is not a valid URL:', err);
  }
}

validateDatabaseConfig();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Executes a database promise with a strict timeout to prevent queries
 * from hanging serverless lambdas and frontend initializations indefinitely.
 */
export async function withQueryTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  context = 'Database query'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[Prisma Timeout] ${context} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

