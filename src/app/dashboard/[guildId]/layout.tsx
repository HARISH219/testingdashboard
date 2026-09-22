import { redirect } from "next/navigation";
import { authorizeGuild, getGuildPermissions } from "@/lib/authz";
import { getGuildTier } from "@/lib/subscription";
import { botApi, type BotApiResult } from "@/lib/bot-api";
import { DEMO_MODE } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/shell";
import type { GuildContextValue } from "@/components/dashboard/guild-context";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { guildId: string };
}) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) redirect("/servers");

  const { user, guild } = authz;

  // Load the supporting data defensively. None of these should be able to take
  // down the dashboard: a database that is unreachable / not yet migrated, or a
  // bot API that is offline, must degrade to sensible defaults rather than
  // throwing an uncaught error that trips the global error boundary
  // ("Something went wrong"). Each source is isolated so one failure can't
  // cascade into the others.
  const [permissions, tier, status] = await Promise.all([
    getGuildPermissions(user, guild).catch(() => (user.isAdmin ? ["*"] : [])),
    getGuildTier(guild.id).catch(() => "FREE" as const),
    botApi
      .getStatus(guild.id)
      .catch(
        (): BotApiResult<{ online: boolean; latencyMs: number }> => ({ ok: false })
      ),
  ]);

  const botOnline = status.ok ? Boolean(status.data?.online) : DEMO_MODE;

  const value: GuildContextValue = {
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    owner: guild.owner,
    memberCount: guild.memberCount,
    botInstalled: guild.botInstalled || DEMO_MODE,
    tier,
    permissions,
    botOnline,
    demo: DEMO_MODE,
  };

  return <DashboardShell guild={value}>{children}</DashboardShell>;
}
