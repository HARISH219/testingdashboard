"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, Wifi, MessageSquare, TerminalSquare, Hash, UserCheck, Volume2,
  ShieldAlert, ArrowRight, Zap, Crown, ShieldCheck, Clock, UserPlus, UserMinus,
  AlertTriangle, Ban, Gavel, Tag, Trophy, ScrollText, DoorOpen, Bot as BotIcon,
  Settings as SettingsIcon, Sliders, BotMessageSquare, Check, Sparkles, Gift,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { greeting, formatNumber, guildIconUrl } from "@/lib/utils";
import {
  buildMetrics, RECENT_ACTIVITY, TOP_CHANNELS, TOP_MEMBERS,
  type Metric, type ActivityEvent,
} from "@/lib/overview-data";

const METRIC_ICON: Record<string, React.ReactNode> = {
  Users: <Users />, Wifi: <Wifi />, MessageSquare: <MessageSquare />,
  TerminalSquare: <TerminalSquare />, Hash: <Hash />, UserCheck: <UserCheck />,
  Volume2: <Volume2 />, ShieldAlert: <ShieldAlert />,
};

const ACTIVITY_ICON: Record<ActivityEvent["type"], React.ReactNode> = {
  join: <UserPlus className="size-4 text-success" />,
  leave: <UserMinus className="size-4 text-muted-foreground" />,
  warn: <AlertTriangle className="size-4 text-amber-400" />,
  ban: <Ban className="size-4 text-destructive" />,
  kick: <Gavel className="size-4 text-frost" />,
  command: <TerminalSquare className="size-4 text-arctic" />,
  role: <Tag className="size-4 text-purple-400" />,
  channel: <Hash className="size-4 text-ice" />,
};

/* --------------------------------- Metric --------------------------------- */
function MetricCard({ m, delay }: { m: Metric; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Card hover className="group h-full p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] [&_svg]:size-4 ${m.tint}`}>
            {METRIC_ICON[m.icon]}
          </div>
          {m.trend && (
            <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${m.trend.dir === "up" ? "text-success" : "text-destructive"}`}>
              {m.trend.dir === "up" ? "▲" : "▼"} {m.trend.value}
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold text-snow">{m.value}</p>
        <p className="text-xs font-medium text-frost">{m.label}</p>
        {m.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{m.hint}</p>}
      </Card>
    </motion.div>
  );
}

export default function OverviewPage() {
  const guild = useGuild();
  const { data: session } = useSession();
  const name = session?.user.globalName ?? session?.user.username ?? "there";
  const base = `/dashboard/${guild.id}`;
  const icon = guildIconUrl(guild.id, guild.icon, 128);
  const metrics = buildMetrics(guild.memberCount);
  const online = Math.max(1, Math.round(guild.memberCount * 0.27));

  const quickActions = [
    { label: "Manage Roles", href: "/setup-roles", icon: <Users className="size-4" /> },
    { label: "View Logs", href: "/logs", icon: <ScrollText className="size-4" /> },
    { label: "Configure Welcome", href: "/welcome", icon: <DoorOpen className="size-4" /> },
    { label: "Auto Moderation", href: "/automod", icon: <BotIcon className="size-4" /> },
    { label: "Bot Settings", href: "/custom-bot", icon: <BotMessageSquare className="size-4" /> },
    { label: "Manage Channels", href: "/channels", icon: <Hash className="size-4" /> },
    { label: "Server Settings", href: "/settings", icon: <SettingsIcon className="size-4" /> },
  ];

  const security = [
    { label: "Server Verification", enabled: true },
    { label: "Auto Moderation", enabled: true },
    { label: "Anti-Raid Protection", enabled: true },
    { label: "Logging", enabled: true },
    { label: "Bot Permissions", enabled: true },
  ];

  const snapshot = [
    { label: "Channels", value: "7", icon: <Hash className="size-4 text-arctic" /> },
    { label: "Roles", value: "12", icon: <Tag className="size-4 text-amber-400" /> },
    { label: "Bots", value: "3", icon: <BotIcon className="size-4 text-ice" /> },
    { label: "Boosts", value: "0", icon: <Sparkles className="size-4 text-purple-400" /> },
    { label: "Members", value: formatNumber(guild.memberCount), icon: <Users className="size-4 text-arctic" /> },
    { label: "Emojis", value: "18", icon: <Gift className="size-4 text-success" /> },
  ];

  const maxChannel = Math.max(...TOP_CHANNELS.map((c) => c.messages));

  return (
    <div className="pb-24 md:pb-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-snow sm:text-3xl">
            {greeting()}, {name} <span className="text-arctic">❄️</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening in {guild.name}.</p>
          {guild.demo && <Badge variant="warning" className="mt-3">Demo data — connect the bot for live stats</Badge>}
        </div>
        {/* Plan / Free / Upgrade */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 pl-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
            <p className="text-sm font-semibold text-snow">{guild.tier === "FREE" ? "Free" : guild.tier}</p>
          </div>
          <Button asChild size="sm" className="glow-btn">
            <Link href={`${base}/billing`}>Upgrade</Link>
          </Button>
        </div>
      </div>

      {/* Server Overview + Custom Bot summary */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sliders className="size-4 text-arctic" /> Server Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" className="size-14 rounded-2xl object-cover" />
              ) : (
                <div className="grid size-14 place-items-center rounded-2xl bg-arctic/15 text-lg font-bold text-arctic">
                  {guild.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-snow">{guild.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="success" className="gap-1"><span className="size-1.5 rounded-full bg-success" /> {formatNumber(online)} Online</Badge>
                  <Badge variant="secondary">{formatNumber(guild.memberCount)} Members</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="text-xs text-muted-foreground">Server ID</p>
                <p className="truncate font-mono text-frost">{guild.id}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-frost">{guild.owner ? "You" : "Another member"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BotMessageSquare className="size-4 text-arctic" /> Custom Bot</CardTitle>
              <CardDescription>Customize your bot&apos;s avatar, banner, and profile.</CardDescription>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={`${base}/custom-bot`}>Open <ArrowRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <div className="h-16 w-full bg-gradient-to-br from-arctic/40 to-navy" />
              <div className="flex items-center gap-3 px-3 pb-3">
                <div className="-mt-5 grid size-12 place-items-center rounded-full border-4 border-card bg-arctic/15 text-arctic">
                  {guild.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="pt-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-snow">
                    {guild.name} <span className="rounded bg-[#5865F2] px-1 text-[9px] font-semibold uppercase text-white">Bot</span>
                  </p>
                  <p className="flex items-center gap-1 text-xs text-success"><span className="size-1.5 rounded-full bg-success" /> Online</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8 metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.key} m={m} delay={i * 0.04} />)}
      </div>

      {/* Recent Activity / Top Channels / Top Members */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Clock className="size-4 text-arctic" /> Recent Activity</CardTitle>
              <CardDescription>Latest events from your server.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href={`${base}/logs`}>View All <ArrowRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {RECENT_ACTIVITY.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05]">{ACTIVITY_ICON[a.type]}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-snow"><span className="font-medium">{a.user}</span> {a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.meta}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.ago}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Channels */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Hash className="size-4 text-arctic" /> Top Channels</CardTitle>
              <CardDescription>Channels with the most messages.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href={`${base}/channels`}>View All <ArrowRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOP_CHANNELS.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate text-sm text-frost"><Hash className="size-3 text-muted-foreground" />{c.name}</span>
                    <span className="shrink-0 text-xs font-medium text-snow">{formatNumber(c.messages)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-arctic" style={{ width: `${(c.messages / maxChannel) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Members */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-arctic" /> Top Members</CardTitle>
              <CardDescription>Most active members by messages.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href={`${base}/members`}>View All <ArrowRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {TOP_MEMBERS.map((mem, i) => (
              <div key={mem.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-arctic/15 text-xs font-bold text-arctic">
                  {mem.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-frost">
                  {mem.name}
                  {i === 0 && <Crown className="size-3.5 shrink-0 text-amber-400" aria-label="Top member" />}
                </span>
                <span className="shrink-0 text-xs font-medium text-snow">{formatNumber(mem.messages)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Security Status / Server Snapshot */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="size-4 text-arctic" /> Quick Actions</CardTitle>
            <CardDescription>Common server management actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickActions.map((q) => (
              <Button key={q.href} asChild variant="secondary" size="sm" className="justify-start">
                <Link href={`${base}${q.href}`}>{q.icon}<span className="truncate">{q.label}</span></Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-arctic" /> Security Status</CardTitle>
            <CardDescription>Security and moderation status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {security.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm text-frost">
                  <span className="grid size-5 place-items-center rounded-full bg-success/15">
                    <Check className="size-3 text-success" />
                  </span>
                  {s.label}
                </span>
                <Badge variant="success">Enabled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScrollText className="size-4 text-arctic" /> Server Snapshot</CardTitle>
            <CardDescription>Quick overview of your server.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            {snapshot.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
                <div className="mx-auto mb-1 grid size-8 place-items-center rounded-lg bg-white/[0.04]">{s.icon}</div>
                <p className="text-lg font-bold text-snow">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
