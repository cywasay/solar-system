import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/*
 * The client is cached on globalThis so hot-reloads don't open a new pool on every edit.
 * That cache is keyed by VERSION: without it, editing this file recompiles the module but
 * `globalThis` still hands back the client built by the previous version, so a fix to the
 * construction logic silently has no effect until the dev server is fully restarted.
 * Bump this whenever makePrismaClient below changes.
 */
const CLIENT_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaVersion?: number;
};

function makePrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing from environment');

  /*
   * PrismaNeon takes a Neon PoolConfig — an object with a connectionString — NOT the
   * query function returned by `neon(url)`. Passing that function (behind an `as any`,
   * which suppressed the compile error that would have caught it) left the adapter with
   * no connectionString, so it built a pool from libpq defaults and tried to reach
   * postgres on localhost as the current OS user.
   */
  const adapter = new PrismaNeon({ connectionString: url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const cached =
  globalForPrisma.prismaVersion === CLIENT_VERSION ? globalForPrisma.prisma : undefined;

export const db = cached ?? makePrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaVersion = CLIENT_VERSION;
}
