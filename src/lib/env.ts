/**
 * Central place to read environment variables.
 * We intentionally do NOT throw at import time so the app can boot in a
 * "demo mode" without full credentials for local UI development.
 */

/**
 * Read the first defined value from a list of env var names.
 * The Snowy bot and this dashboard historically use different names for the
 * same thing (DISCORD_APP_TOKEN vs DISCORD_BOT_TOKEN, DATABASE_URI vs
 * DATABASE_URL, ...). Accepting both means a single shared .env works for
 * either project and a naming mismatch can't silently drop us into demo mode.
 */
function pick(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v.trim() !== "") return v.trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

/**
 * Public origin of this deployment.
 * Explicit NEXTAUTH_URL wins. Otherwise fall back to the host Vercel injects,
 * so a deployment never silently reports "http://localhost:3000" and build
 * OAuth callbacks against the wrong origin.
 */
function resolveAppUrl(): string {
  const explicit = pick("NEXTAUTH_URL", "NEXT_PUBLIC_BASE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");

  // Stable production domain, then the per-deployment URL.
  const vercelHost = pick("VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL");
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

const APP_URL = resolveAppUrl();

/**
 * NextAuth v4 reads process.env.NEXTAUTH_URL directly when constructing OAuth
 * callback URLs. Populate it from the resolved origin so hosts that only
 * provide VERCEL_URL still generate correct callbacks.
 */
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = APP_URL;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXTAUTH_URL: APP_URL,
  NEXTAUTH_SECRET: pick("NEXTAUTH_SECRET", "AUTH_SECRET"),

  DISCORD_CLIENT_ID: pick("DISCORD_CLIENT_ID", "DISCORD_APP_ID", "CLIENT_ID"),
  DISCORD_CLIENT_SECRET: pick(
    "DISCORD_CLIENT_SECRET",
    "DISCORD_APP_CLIENT_SECRET",
    "CLIENT_SECRET"
  ),
  DISCORD_BOT_TOKEN: pick("DISCORD_BOT_TOKEN", "DISCORD_APP_TOKEN", "BOT_TOKEN", "TOKEN"),

  DATABASE_URL: pick("DATABASE_URL", "DATABASE_URI"),

  STRIPE_SECRET_KEY: pick("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: pick("STRIPE_WEBHOOK_SECRET"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pick("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  BOT_API_URL: pick("BOT_API_URL"), // internal bot service
  BOT_API_SECRET: pick("BOT_API_SECRET"),

  LAVALINK_HOST: pick("LAVALINK_HOST") ?? firstNode()?.host,
  LAVALINK_PORT: pick("LAVALINK_PORT") ?? firstNode()?.port?.toString(),
  LAVALINK_PASSWORD: pick("LAVALINK_PASSWORD") ?? firstNode()?.authorization,
  LAVALINK_SECURE:
    pick("LAVALINK_SECURE") === "true" || Boolean(firstNode()?.secure),

  // Snowy platform administrators (access to /admin)
  ADMIN_DISCORD_IDS: idList(pick("ADMIN_DISCORD_IDS")),
  // Bot owner(s) — highest level of access across every guild.
  // Also accepts the bot's DEVELOPER_IDS, including JSON-array form.
  BOT_OWNER_IDS: idList(pick("BOT_OWNER_IDS", "DEVELOPER_IDS", "OWNER_IDS")),
  // Extra trusted owners — owner-level dashboard access without being the bot owner
  EXTRA_OWNER_IDS: idList(pick("EXTRA_OWNER_IDS")),
};

/**
 * Parse a list of Discord snowflake IDs. Tolerates comma/space separated
 * values and the bot's JSON-array style: ["123","456"].
 */
function idList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .replace(/[[\]"'`]/g, " ")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{15,25}$/.test(s));
}

/**
 * The bot describes Lavalink as a JSON array in NODES. Reuse the first entry
 * so music diagnostics work without duplicating the config.
 */
interface LavalinkNode {
  id?: string;
  host?: string;
  port?: number;
  authorization?: string;
  secure?: boolean;
}
function firstNode(): LavalinkNode | undefined {
  const raw = process.env.NODES;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * DEMO_MODE: when Discord/DB credentials are missing we still want the UI to
 * run locally so it can be reviewed. In this mode auth uses a mock session and
 * data comes from clearly-labeled demo fixtures. Real integrations activate
 * automatically once credentials are provided.
 */
export const DEMO_MODE =
  !env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.NEXTAUTH_SECRET;

export const HAS_DATABASE = Boolean(env.DATABASE_URL);
export const HAS_STRIPE = Boolean(env.STRIPE_SECRET_KEY);
export const HAS_BOT_API = Boolean(env.BOT_API_URL && env.BOT_API_SECRET);

/** Bot owner — implicit full access everywhere. */
export function isBotOwner(discordId: string | undefined | null): boolean {
  if (!discordId) return false;
  return env.BOT_OWNER_IDS.includes(discordId);
}

/** Extra trusted owner — owner-level dashboard access. */
export function isExtraOwner(discordId: string | undefined | null): boolean {
  if (!discordId) return false;
  return env.EXTRA_OWNER_IDS.includes(discordId);
}

/**
 * Snowy platform administrator: explicit admin IDs, bot owners, and extra
 * owners all qualify. Gates the /admin panel and grants wildcard permissions.
 */
export function isPlatformAdmin(discordId: string | undefined | null): boolean {
  if (!discordId) return false;
  return (
    env.ADMIN_DISCORD_IDS.includes(discordId) ||
    isBotOwner(discordId) ||
    isExtraOwner(discordId)
  );
}

export const INVITE_URL = (() => {
  const clientId = env.DISCORD_CLIENT_ID ?? "0000000000000000000";
  // Administrator + applications.commands scope
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
})();
