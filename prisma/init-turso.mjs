/**
 * Create the Snowy schema directly on Turso over libSQL.
 *
 * `prisma db push` cannot target Turso (the CLI only accepts `file:` URLs), and
 * shelling out to `prisma migrate diff` proved unreliable here, so the DDL is
 * declared explicitly. Column names match prisma/schema.prisma exactly, which
 * is what Prisma Client requires at runtime.
 *
 * Idempotent: every statement uses IF NOT EXISTS, so re-running is safe.
 *
 * Usage: npm run db:init:turso
 */
import { createClient } from "@libsql/client";
import { readFileSync, existsSync, writeFileSync } from "node:fs";

function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvFile();

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "globalName" TEXT,
    "avatar" TEXT,
    "email" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeCustomerId" TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_discordId_key" ON "User"("discordId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId")`,

  `CREATE TABLE IF NOT EXISTS "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "ownerId" TEXT,
    "botInstalled" BOOLEAN NOT NULL DEFAULT false,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "GuildConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GuildConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GuildConfig_guildId_key" ON "GuildConfig"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "ModuleConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT NOT NULL DEFAULT '{}',
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModuleConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ModuleConfig_guildId_module_key" ON "ModuleConfig"("guildId", "module")`,
  `CREATE INDEX IF NOT EXISTS "ModuleConfig_guildId_idx" ON "ModuleConfig"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "guildId" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_guildId_key" ON "Subscription"("guildId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId")`,
  `CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Subscription_tier_status_idx" ON "Subscription"("tier", "status")`,

  `CREATE TABLE IF NOT EXISTS "PlanConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" REAL NOT NULL,
    "priceYearly" REAL NOT NULL,
    "stripePriceMonthlyId" TEXT,
    "stripePriceYearlyId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PlanConfig_tier_key" ON "PlanConfig"("tier")`,

  `CREATE TABLE IF NOT EXISTS "DashboardRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#9EDCFF',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "discordRoleIds" TEXT NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DashboardRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "DashboardRole_guildId_idx" ON "DashboardRole"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "DashboardRoleMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "DashboardRoleMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "DashboardRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DashboardRoleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DashboardRoleMember_roleId_userId_key" ON "DashboardRoleMember"("roleId", "userId")`,

  `CREATE TABLE IF NOT EXISTS "Giveaway" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT,
    "messageId" TEXT,
    "prize" TEXT NOT NULL,
    "winners" INTEGER NOT NULL DEFAULT 1,
    "requiredRoleId" TEXT,
    "winnerRoleId" TEXT,
    "endsAt" DATETIME NOT NULL,
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "wonBy" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Giveaway_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Giveaway_guildId_idx" ON "Giveaway"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT,
    "openerId" TEXT NOT NULL,
    "claimedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Ticket_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Ticket_guildId_idx" ON "Ticket"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "ModAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetTag" TEXT,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModAction_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ModAction_guildId_idx" ON "ModAction"("guildId")`,

  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_guildId_idx" ON "AuditLog"("guildId")`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId")`,

  `CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key")`,

  `CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "announcement" TEXT,
    "updatedAt" DATETIME NOT NULL
  )`,
];

// Seed rows for the three plan tiers (pricing is admin-editable later).
const SEED = [
  { tier: "FREE", name: "Free", m: 0, y: 0 },
  { tier: "PREMIUM", name: "Premium", m: 7.99, y: 79.99 },
  { tier: "ENTERPRISE", name: "Enterprise", m: 29.99, y: 299.99 },
];

const out = [];
const client = createClient({
  url,
  ...(authToken && !url.startsWith("file:") ? { authToken } : {}),
});

let ok = 0;
const failures = [];
for (const stmt of STATEMENTS) {
  try {
    await client.execute(stmt);
    ok++;
  } catch (e) {
    failures.push({ stmt: stmt.slice(0, 70).replace(/\s+/g, " "), error: e.message });
  }
}
out.push(`DDL applied: ${ok}/${STATEMENTS.length}`);
for (const f of failures) out.push(`  FAILED ${f.stmt}... -> ${f.error}`);

// Seed plan configs.
try {
  for (const p of SEED) {
    await client.execute({
      sql: `INSERT INTO "PlanConfig" ("id","tier","name","priceMonthly","priceYearly","active","updatedAt")
            VALUES (?,?,?,?,?,true,CURRENT_TIMESTAMP)
            ON CONFLICT("tier") DO UPDATE SET "name"=excluded."name",
              "priceMonthly"=excluded."priceMonthly","priceYearly"=excluded."priceYearly"`,
      args: [`plan_${p.tier.toLowerCase()}`, p.tier, p.name, p.m, p.y],
    });
  }
  out.push("Seeded PlanConfig: FREE, PREMIUM, ENTERPRISE");
} catch (e) {
  out.push("Seed failed: " + e.message);
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
);
out.push(`\nTables now present (${tables.rows.length}):`);
out.push("  " + tables.rows.map((r) => r.name).join(", "));

const plans = await client.execute(`SELECT tier, name FROM "PlanConfig" ORDER BY tier`);
out.push(`PlanConfig rows: ${plans.rows.map((r) => r.tier).join(", ")}`);

const text = out.join("\n");
writeFileSync("turso-init-result.txt", text);
console.log(text);
process.exit(failures.length ? 1 : 0);
