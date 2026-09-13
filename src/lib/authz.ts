import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { DEMO_MODE, HAS_DATABASE, isPlatformAdmin } from "./env";
import { getManageableGuilds } from "./discord";
import { DEMO_GUILDS } from "./demo";
import { prisma } from "./db";
import { hasPermission, type PermissionAction } from "./permissions";
import { canManageGuild } from "./utils";

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

  // Merge with DB knowledge of bot installation / member counts.
  let installed: Record<string, { botInstalled: boolean; memberCount: number }> = {};
  if (HAS_DATABASE) {
    const rows = await prisma.guild.findMany({
      where: { id: { in: guilds.map((g) => g.id) } },
      select: { id: true, botInstalled: true, memberCount: true },
    });
    installed = Object.fromEntries(
      rows.map((r) => [r.id, { botInstalled: r.botInstalled, memberCount: r.memberCount }])
    );
  }

  return guilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner,
    permissions: g.permissions,
    botInstalled: installed[g.id]?.botInstalled ?? false,
    memberCount: installed[g.id]?.memberCount ?? g.approximate_member_count ?? 0,
  }));
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
  const guilds = await getManageableGuildsForUser(user);
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

  const dbUser = await prisma.user.findUnique({ where: { discordId: user.discordId } });
  if (!dbUser) return [];

  const roles = await prisma.dashboardRole.findMany({
    where: {
      guildId: guild.id,
      members: { some: { userId: dbUser.id } },
    },
    select: { permissions: true },
  });
  return Array.from(new Set(roles.flatMap((r) => r.permissions)));
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
