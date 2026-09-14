import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

/**
 * Prisma client backed by libSQL (Turso).
 *
 * Turso URLs look like `libsql://<db>-<org>.turso.io` and require an auth
 * token. A local file URL (`file:./dev.db`) also works for offline dev, in
 * which case no token is needed.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (!url) {
    // No database configured — callers guard on HAS_DATABASE, but a client
    // still has to exist so imports don't explode.
    return new PrismaClient({ log });
  }

  const libsql = createClient({
    url,
    // Remote Turso needs the token; a local file: URL must not receive one.
    ...(authToken && !url.startsWith("file:") ? { authToken } : {}),
  });

  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter, log });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
