import { NextResponse } from "next/server";
import { env, DEMO_MODE, HAS_DATABASE, HAS_STRIPE, HAS_BOT_API } from "@/lib/env";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type State = "ok" | "warn" | "off";

interface Check {
  key: string;
  label: string;
  state: State;
  detail: string;
  fix?: string;
  required: boolean;
}

/**
 * Configuration health check. Returns only booleans / non-sensitive facts —
 * never secret values. Powers the /setup page so misconfiguration is obvious
 * instead of surfacing as a cryptic runtime error.
 */
export async function GET() {
  const checks: Check[] = [];

  // --- Auth ---
  checks.push({
    key: "authSecret",
    label: "Auth secret",
    state: env.NEXTAUTH_SECRET ? "ok" : "off",
    detail: env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET is set." : "NEXTAUTH_SECRET is missing.",
    fix: "Set NEXTAUTH_SECRET in .env (openssl rand -base64 32).",
    required: true,
  });

  checks.push({
    key: "authUrl",
    label: "App URL",
    state: env.NEXTAUTH_URL ? "ok" : "warn",
    detail: `NEXTAUTH_URL = ${env.NEXTAUTH_URL}`,
    fix: "In production set NEXTAUTH_URL to your deployed https URL.",
    required: true,
  });

  // --- Discord OAuth ---
  const hasOAuth = Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET);
  checks.push({
    key: "discordOAuth",
    label: "Discord OAuth2",
    state: hasOAuth ? "ok" : "off",
    detail: hasOAuth
      ? `Client ID ${env.DISCORD_CLIENT_ID}`
      : "DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET missing.",
    fix: "Add both from the Discord Developer Portal.",
    required: true,
  });

  checks.push({
    key: "redirectUri",
    label: "OAuth redirect URI",
    state: "warn",
    detail: `Must be registered in Discord: ${env.NEXTAUTH_URL}/api/auth/callback/discord`,
    fix: "Discord Developer Portal -> your app -> OAuth2 -> Redirects. This cannot be verified automatically.",
    required: true,
  });

  // --- Bot token (live check) ---
  let botState: State = "off";
  let botDetail = "DISCORD_BOT_TOKEN is missing.";
  let botGuilds: number | null = null;
  if (env.DISCORD_BOT_TOKEN) {
    try {
      const me = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
        cache: "no-store",
      });
      if (me.ok) {
        const data = (await me.json()) as { username: string; discriminator: string };
        botState = "ok";
        botDetail = `Authenticated as ${data.username}#${data.discriminator}.`;
        const g = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
          cache: "no-store",
        });
        if (g.ok) botGuilds = ((await g.json()) as unknown[]).length;
      } else {
        botState = "off";
        botDetail = `Discord rejected the bot token (HTTP ${me.status}).`;
      }
    } catch (e) {
      botState = "off";
      botDetail = `Could not reach Discord: ${(e as Error).message}`;
    }
  }
  checks.push({
    key: "botToken",
    label: "Bot token",
    state: botState,
    detail: botDetail,
    fix: "Add DISCORD_BOT_TOKEN from the Bot tab. Reset it if it was ever exposed.",
    required: true,
  });

  checks.push({
    key: "botGuilds",
    label: "Bot server membership",
    state: botGuilds === null ? "off" : botGuilds > 0 ? "ok" : "warn",
    detail:
      botGuilds === null
        ? "Unknown — bot token not working."
        : botGuilds > 0
          ? `Bot is in ${botGuilds} server(s).`
          : "Bot is not in any server yet.",
    fix: "Use the Invite button on the server selector to add the bot.",
    required: false,
  });

  // --- Database ---
  let dbState: State = HAS_DATABASE ? "warn" : "off";
  let dbDetail = HAS_DATABASE
    ? "DATABASE_URL is set but connection untested."
    : "No DATABASE_URL. Settings are kept in memory and reset on restart.";
  if (HAS_DATABASE) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbState = "ok";
      dbDetail = "Connected. Settings persist.";
    } catch (e) {
      dbState = "off";
      dbDetail = `Connection failed: ${(e as Error).message.slice(0, 120)}`;
    }
  }
  checks.push({
    key: "database",
    label: "Database",
    state: dbState,
    detail: dbDetail,
    fix: "Set DATABASE_URL, then run: npm run db:push && npm run db:seed",
    required: false,
  });

  // --- Admin access ---
  const adminCount = env.ADMIN_DISCORD_IDS.length + env.BOT_OWNER_IDS.length + env.EXTRA_OWNER_IDS.length;
  checks.push({
    key: "admins",
    label: "Admin / owner IDs",
    state: adminCount > 0 ? "ok" : "warn",
    detail: adminCount > 0
      ? `${adminCount} ID(s) configured.`
      : "None set — the /admin panel is unreachable.",
    fix: "Set BOT_OWNER_IDS and ADMIN_DISCORD_IDS to your Discord user ID.",
    required: false,
  });

  // --- Optional services ---
  checks.push({
    key: "botApi",
    label: "Bot API",
    state: HAS_BOT_API ? "ok" : "warn",
    detail: HAS_BOT_API
      ? `Configured at ${env.BOT_API_URL}`
      : "Not configured. Bot actions are saved but marked pending.",
    fix: "Set BOT_API_URL and BOT_API_SECRET to your discord.js service.",
    required: false,
  });

  checks.push({
    key: "stripe",
    label: "Stripe billing",
    state: HAS_STRIPE ? "ok" : "warn",
    detail: HAS_STRIPE ? "Configured." : "Not configured. Checkout is disabled.",
    fix: "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.",
    required: false,
  });

  const blocking = checks.filter((c) => c.required && c.state === "off");

  return NextResponse.json({
    mode: DEMO_MODE ? "demo" : "live",
    ready: blocking.length === 0,
    blocking: blocking.map((c) => c.key),
    checks,
  });
}
