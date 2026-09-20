/**
 * Apply the Prisma schema to a remote Turso (libSQL) database.
 *
 * `prisma db push` cannot be used against Turso: the Prisma CLI only accepts
 * `file:` URLs for the sqlite provider. So we:
 *   1. ask Prisma to diff the schema into plain SQL
 *   2. execute that SQL over the libSQL protocol with the auth token
 *
 * Safe to re-run: every statement is IF NOT EXISTS, and failures on individual
 * statements are reported rather than aborting the whole run.
 *
 * Usage: npm run db:push:turso
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { readFileSync, existsSync, unlinkSync } from "node:fs";

/** Minimal .env loader so this script needs no extra dependency. */
function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
if (!url.startsWith("file:") && !authToken) {
  console.error("TURSO_AUTH_TOKEN is required for a remote libsql:// database.");
  process.exit(1);
}

const SQL_FILE = "prisma/.turso-schema.sql";

console.log("Generating SQL from prisma/schema.prisma ...");
const sql = execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script",
  ],
  { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
);

// Make re-runs safe.
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"))
  .map((s) =>
    s
      .replace(/^CREATE TABLE\s+"/i, 'CREATE TABLE IF NOT EXISTS "')
      .replace(/^CREATE UNIQUE INDEX\s+"/i, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
      .replace(/^CREATE INDEX\s+"/i, 'CREATE INDEX IF NOT EXISTS "')
  );

console.log(`Applying ${statements.length} statements to ${url.split("?")[0]} ...`);

const client = createClient({
  url,
  ...(authToken && !url.startsWith("file:") ? { authToken } : {}),
});

let ok = 0;
const failures = [];
for (const stmt of statements) {
  try {
    await client.execute(stmt);
    ok++;
  } catch (e) {
    failures.push({ stmt: stmt.slice(0, 90), error: e.message });
  }
}

console.log(`\nApplied: ${ok}/${statements.length}`);
if (failures.length) {
  console.log("Failed statements:");
  for (const f of failures) console.log(`  - ${f.stmt}...\n      ${f.error}`);
}

// Report what now exists.
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
);
console.log(`\nTables in database (${tables.rows.length}):`);
console.log("  " + tables.rows.map((r) => r.name).join(", "));

if (existsSync(SQL_FILE)) unlinkSync(SQL_FILE);
process.exit(failures.length ? 1 : 0);
