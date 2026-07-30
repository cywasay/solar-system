import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/*
 * The client is cached on globalThis so hot-reloads don't open a new pool on every edit.
 * That cache is keyed by VERSION: without it, editing this file recompiles the module but
 * `globalThis` still hands back the client built by the previous version, so a fix to the
 * construction logic silently has no effect until the dev server is fully restarted.
 * Bump this whenever makePrismaClient below changes.
 */
const CLIENT_VERSION = 3;

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

function getClient(): PrismaClient {
  if (globalForPrisma.prismaVersion === CLIENT_VERSION && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = makePrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaVersion = CLIENT_VERSION;
  }

  return client;
}

/*
 * Lazily constructed. `next build` imports every route module to collect page data, so
 * building the client at module scope made the BUILD require a live DATABASE_URL — and
 * fail with "Failed to collect page data" wherever the database URL is a runtime-only
 * secret. Behind this proxy nothing is constructed until the first real query, so
 * importing the module is free and the connection is only opened when it is actually
 * used. Callers still write `db.contactMessage.create(...)` unchanged.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
