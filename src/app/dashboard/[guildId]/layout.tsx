import { redirect } from "next/navigation";
import { authorizeGuild, getGuildPermissions } from "@/lib/authz";
import { getGuildTier } from "@/lib/subscription";
import { botApi } from "@/lib/bot-api";
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
  const [permissions, tier, status] = await Promise.all([
    getGuildPermissions(user, guild),
    getGuildTier(guild.id),
    botApi.getStatus(guild.id),
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
