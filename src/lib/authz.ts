import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { DEMO_MODE, HAS_DATABASE, isPlatformAdmin } from "./env";
import { getManageableGuilds, getUserGuilds, botIsInGuilds } from "./discord";
import { DEMO_GUILDS } from "./demo";
import { prisma } from "./db";
import { hasPermission, type PermissionAction } from "./permissions";
import { canManageGuild } from "./utils";
import { decodeList } from "./json-fields";

export interface SessionUser {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  isAdmin: boolean;
  accessToken?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    discordId: session.user.discordId,
    username: session.user.username,
    globalName: session.user.globalName,
    avatar: session.user.avatar,
    isAdmin: session.user.isAdmin,
    accessToken: session.accessToken,
  };
}

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  botInstalled: boolean;
  memberCount: number;
  /** Whether the user can actually manage this server (owner or MANAGE_GUILD). */
  manageable?: boolean;
}

/** Guilds the current user can manage. Always validated server-side. */
export async function getManageableGuildsForUser(
  user: SessionUser
): Promise<ManageableGuild[]> {
  if (DEMO_MODE || !user.accessToken) {
    return DEMO_GUILDS.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      owner: g.owner,
      permissions: g.permissions,
      botInstalled: g.botInstalled,
      memberCount: g.memberCount,
    }));
  }

  const guilds = await getManageableGuilds(user.accessToken);

  // Resolve "bot installed" definitively by checking each managed guild
  // directly. This is reliable regardless of how large the bot's global guild
  // list is, and avoids the pagination pitfalls of /users/@me/guilds.
  const botGuildIds = await botIsInGuilds(guilds.map((g) => g.id));

  // Optional DB enrichment (cached member counts). Never required.
  let stored: Record<string, { botInstalled: boolean; memberCount: number }> = {};
  if (HAS_DATABASE) {
    try {
      const rows = await prisma.guild.findMany({
        where: { id: { in: guilds.map((g) => g.id) } },
        select: { id: true, botInstalled: true, memberCount: true },
      });
      stored = Object.fromEntries(
        rows.map((r) => [r.id, { botInstalled: r.botInstalled, memberCount: r.memberCount }])
      );
    } catch {
      // DB unreachable — degrade gracefully instead of failing the page.
      stored = {};
    }
  }

  return guilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner,
    permissions: g.permissions,
    // Live Discord check first, then DB, so this is correct with no database.
    botInstalled: botGuildIds.has(g.id) || (stored[g.id]?.botInstalled ?? false),
    memberCount:
      g.approximate_member_count ?? stored[g.id]?.memberCount ?? 0,
  }));
}

/**
 * ALL of the user's guilds (not just manageable ones), each flagged with
 * `manageable` = the user is owner or has MANAGE_GUILD. Sorted so manageable
 * servers always come first, preserving Discord's original order within each
 * group. Used by the server-picker so the user's manageable servers surface
 * at the top while their other servers remain visible below.
 */
export async function getAllUserGuildsForUser(
  user: SessionUser
): Promise<ManageableGuild[]> {
  if (DEMO_MODE || !user.accessToken) {
    return DEMO_GUILDS.map((g) => ({
      id: g.id, name: g.name, icon: g.icon, owner: g.owner,
      permissions: g.permissions, botInstalled: g.botInstalled,
      memberCount: g.memberCount,
      manageable: g.owner || canManageGuild(g.permissions),
    }));
  }

  let guilds;
  try {
    guilds = await getUserGuilds(user.accessToken);
  } catch {
    return [];
  }

  const withFlag = guilds.map((g) => ({
    ...g,
    // Missing/invalid permission strings are treated as NOT manageable (safe).
    manageable: Boolean(g.owner) || safeCanManage(g.permissions),
  }));

  // Only resolve "bot installed" for the guilds the user can manage — those are
  // the ones that get a Manage/Invite action; a per-guild check on every server
  // the user is in would be wasteful.
  const manageableIds = withFlag.filter((g) => g.manageable).map((g) => g.id);
  const botGuildIds = await botIsInGuilds(manageableIds);

  let stored: Record<string, { botInstalled: boolean; memberCount: number }> = {};
  if (HAS_DATABASE) {
    try {
      const rows = await prisma.guild.findMany({
        where: { id: { in: withFlag.map((g) => g.id) } },
        select: { id: true, botInstalled: true, memberCount: true },
      });
      stored = Object.fromEntries(
        rows.map((r) => [r.id, { botInstalled: r.botInstalled, memberCount: r.memberCount }])
      );
    } catch {
      stored = {};
    }
  }

  const mapped: ManageableGuild[] = withFlag.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: Boolean(g.owner),
    permissions: g.permissions,
    manageable: g.manageable,
    botInstalled: botGuildIds.has(g.id) || (stored[g.id]?.botInstalled ?? false),
    memberCount: g.approximate_member_count ?? stored[g.id]?.memberCount ?? 0,
  }));

  // Stable partition: manageable first, original order preserved within groups.
  const manageable = mapped.filter((g) => g.manageable);
  const rest = mapped.filter((g) => !g.manageable);
  return [...manageable, ...rest];
}

/** Never throw on a malformed permissions value — treat it as "cannot manage". */
function safeCanManage(permissions: string | number | bigint | undefined | null): boolean {
  if (permissions === undefined || permissions === null || permissions === "") return false;
  try {
    return canManageGuild(permissions);
  } catch {
    return false;
  }
}

/**
 * Authorize the current user for a specific guild. Confirms the user actually
 * has MANAGE_GUILD/ADMIN on Discord — never trusts the frontend.
 */
export async function authorizeGuild(
  guildId: string
): Promise<{ user: SessionUser; guild: ManageableGuild } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  let guilds: ManageableGuild[];
  try {
    guilds = await getManageableGuildsForUser(user);
  } catch {
    // A failure fetching guilds (expired OAuth token, Discord API hiccup) must
    // read as "not authorized" so callers redirect to /servers, rather than
    // throwing an uncaught error that crashes the dashboard render.
    return null;
  }
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return null;
  if (!guild.owner && !canManageGuild(guild.permissions) && !user.isAdmin) return null;
  return { user, guild };
}

/**
 * Resolve the effective dashboard permissions of a user in a guild.
 * Guild owners and platform admins get the wildcard "*".
 */
export async function getGuildPermissions(
  user: SessionUser,
  guild: ManageableGuild
): Promise<string[]> {
  // Owner / MANAGE_GUILD holders and platform admins get full access.
  if (guild.owner || user.isAdmin || canManageGuild(guild.permissions)) {
    return ["*"];
  }
  if (!HAS_DATABASE) return [];

  try {
    const dbUser = await prisma.user.findUnique({ where: { discordId: user.discordId } });
    if (!dbUser) return [];

    const roles = await prisma.dashboardRole.findMany({
      where: {
        guildId: guild.id,
        members: { some: { userId: dbUser.id } },
      },
      select: { permissions: true },
    });
    return Array.from(new Set(roles.flatMap((r) => decodeList(r.permissions))));
  } catch {
    // DB unreachable or not yet migrated — grant no distributed permissions
    // rather than crashing. Owners/admins already returned "*" above, so this
    // only affects delegated roles, which safely fall back to "no extra access".
    return [];
  }
}

/** Assert a permission or throw a typed error for API routes. */
export async function requirePermission(
  guildId: string,
  module: string,
  action: PermissionAction
): Promise<{ user: SessionUser; guild: ManageableGuild }> {
  const authz = await authorizeGuild(guildId);
  if (!authz) {
    const err = new Error("Unauthorized guild access");
    (err as any).status = 403;
    throw err;
  }
  const perms = await getGuildPermissions(authz.user, authz.guild);
  if (!hasPermission(perms, module, action)) {
    const err = new Error(`Missing permission ${module}:${action}`);
    (err as any).status = 403;
    throw err;
  }
  return authz;
}
