import { PrismaClient } from "@prisma/client";

/**
 * Prisma client backed by libSQL (Turso), created LAZILY.
 *
 * Why lazy: the client used to be constructed at module load. Any page whose
 * import graph touched this file would then crash during server rendering if
 * DATABASE_URL was absent — which is exactly what happens on a deployment
 * where the environment variables haven't been set yet. A 500 during SSR still
 * streams HTML, so the page *looks* fine but never hydrates and nothing is
 * clickable. Deferring construction means a missing database degrades to
 * "features that need the DB are unavailable" instead of taking down the UI.
 *
 * Callers already guard on HAS_DATABASE before querying.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (!url) {
    throw new Error(
      "No database configured. Set DATABASE_URL (and TURSO_AUTH_TOKEN for a remote Turso database)."
    );
  }

  // Required at runtime only, so a missing optional dependency can never break
  // page rendering.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaLibSQL } = require("@prisma/adapter-libsql");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@libsql/client");

  const libsql = createClient({
    url,
    // Remote Turso needs the token; a local file: URL must not receive one.
    ...(authToken && !url.startsWith("file:") ? { authToken } : {}),
  });

  return new PrismaClient({ adapter: new PrismaLibSQL(libsql), log });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = buildClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Proxy so `prisma.user.findMany()` works unchanged, but the underlying client
 * is only created on first property access rather than at import time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
