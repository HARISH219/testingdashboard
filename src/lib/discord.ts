import { env } from "./env";
import { canManageGuild } from "./utils";

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

async function discordFetch<T>(
  path: string,
  init: RequestInit & { token?: string; bot?: boolean } = {}
): Promise<T> {
  const { token, bot, ...rest } = init;
  const auth = bot
    ? `Bot ${env.DISCORD_BOT_TOKEN}`
    : token
      ? `Bearer ${token}`
      : undefined;
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/** Guilds the OAuth user is a member of (with permissions and member counts). */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  return discordFetch<DiscordGuild[]>("/users/@me/guilds?with_counts=true", {
    token: accessToken,
  });
}

/**
 * IDs of every guild the bot is currently in — a single API call, cached
 * briefly so the server selector stays fast and we don't hit rate limits.
 * This is what makes the "bot installed" badge work without a database.
 */
let botGuildCache: { ids: Set<string>; at: number } | null = null;
const BOT_GUILD_TTL_MS = 30_000;

export async function getBotGuildIds(): Promise<Set<string>> {
  if (!env.DISCORD_BOT_TOKEN) return new Set();
  if (botGuildCache && Date.now() - botGuildCache.at < BOT_GUILD_TTL_MS) {
    return botGuildCache.ids;
  }
  try {
    // `/users/@me/guilds` paginates by ID: each page must be requested with
    // `after=<highest id seen so far>`, and the results are ordered by id
    // ascending. Sorting the batch before taking the cursor guarantees we
    // advance correctly even if Discord returns a page unordered.
    const ids = new Set<string>();
    let after = "0";
    for (let page = 0; page < 100; page++) {
      const batch = await discordFetch<{ id: string }[]>(
        `/users/@me/guilds?limit=200&after=${after}`,
        { bot: true }
      );
      if (batch.length === 0) break;
      for (const g of batch) ids.add(g.id);
      if (batch.length < 200) break;
      // Highest snowflake by numeric value becomes the next cursor.
      after = batch.reduce((max, g) => (BigInt(g.id) > BigInt(max) ? g.id : max), after);
    }
    botGuildCache = { ids, at: Date.now() };
    return ids;
  } catch {
    // Bot token missing/invalid — fall back to "unknown" rather than breaking.
    return botGuildCache?.ids ?? new Set();
  }
}

/**
 * Definitive per-guild membership check. Used to resolve "bot installed" for
 * the specific guilds a user manages, independent of the paginated global
 * list. Each guild is checked once and cached; a 404 means the bot is not in
 * that guild, anything else is treated as unknown (not installed).
 */
const guildMembershipCache = new Map<string, { present: boolean; at: number }>();

export async function botIsInGuilds(guildIds: string[]): Promise<Set<string>> {
  const present = new Set<string>();
  if (!env.DISCORD_BOT_TOKEN) return present;

  await Promise.all(
    guildIds.map(async (id) => {
      const cached = guildMembershipCache.get(id);
      if (cached && Date.now() - cached.at < BOT_GUILD_TTL_MS) {
        if (cached.present) present.add(id);
        return;
      }
      try {
        // Succeeds only if the bot is a member of the guild.
        await discordFetch(`/guilds/${id}`, { bot: true });
        guildMembershipCache.set(id, { present: true, at: Date.now() });
        present.add(id);
      } catch {
        guildMembershipCache.set(id, { present: false, at: Date.now() });
      }
    })
  );

  return present;
}

/** Guilds the user can manage (ADMIN or MANAGE_GUILD). Validated server-side. */
export async function getManageableGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const guilds = await getUserGuilds(accessToken);
  return guilds.filter((g) => g.owner || canManageGuild(g.permissions));
}

/** Whether the Snowy bot is a member of a guild (requires bot token). */
export async function isBotInGuild(guildId: string): Promise<boolean> {
  if (!env.DISCORD_BOT_TOKEN) return false;
  try {
    await discordFetch(`/guilds/${guildId}?with_counts=false`, { bot: true });
    return true;
  } catch {
    return false;
  }
}

/** Full guild info (requires bot to be present). */
export async function getGuildWithCounts(guildId: string) {
  return discordFetch<any>(`/guilds/${guildId}?with_counts=true`, { bot: true });
}

/** Channels of a guild (requires bot). */
export async function getGuildChannels(guildId: string) {
  return discordFetch<any[]>(`/guilds/${guildId}/channels`, { bot: true });
}

/** Roles of a guild (requires bot). */
export async function getGuildRoles(guildId: string) {
  return discordFetch<any[]>(`/guilds/${guildId}/roles`, { bot: true });
}
