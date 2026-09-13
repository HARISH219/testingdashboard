/**
 * Central place to read environment variables.
 * We intentionally do NOT throw at import time so the app can boot in a
 * "demo mode" without full credentials for local UI development.
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,

  DATABASE_URL: process.env.DATABASE_URL,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  BOT_API_URL: process.env.BOT_API_URL, // internal bot service
  BOT_API_SECRET: process.env.BOT_API_SECRET,

  LAVALINK_HOST: process.env.LAVALINK_HOST,
  LAVALINK_PORT: process.env.LAVALINK_PORT,
  LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD,
  LAVALINK_SECURE: process.env.LAVALINK_SECURE === "true",

  // Snowy platform administrators (access to /admin)
  ADMIN_DISCORD_IDS: idList(process.env.ADMIN_DISCORD_IDS),
  // Bot owner(s) — highest level of access across every guild
  BOT_OWNER_IDS: idList(process.env.BOT_OWNER_IDS),
  // Extra trusted owners — owner-level dashboard access without being the bot owner
  EXTRA_OWNER_IDS: idList(process.env.EXTRA_OWNER_IDS),
};

/** Parse a comma/space/newline separated list of Discord snowflake IDs. */
function idList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{15,25}$/.test(s));
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
