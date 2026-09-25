"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, Wifi, Crown, Gavel, Music, ShieldCheck, ArrowRight, Zap,
  Ban, VolumeX, AlertTriangle, UserPlus, Activity as ActivityIcon,
  Sliders, Bot,
} from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SaveBar } from "@/components/dashboard/save-bar";
import { PLANS } from "@/lib/plans";
import { formatNumber, greeting, timeAgo } from "@/lib/utils";
import { DEMO_MOD_ACTIONS } from "@/lib/demo";
import { useSession } from "next-auth/react";

const modIcon: Record<string, React.ReactNode> = {
  ban: <Ban className="size-4 text-destructive" />,
  mute: <VolumeX className="size-4 text-warning" />,
  warn: <AlertTriangle className="size-4 text-warning" />,
  kick: <UserPlus className="size-4 rotate-180 text-frost" />,
};

/**
 * Server prefix + custom bot (avatar / banner) settings, saved via the real
 * "settings" module config. Custom bot fields tell the bot which avatar/banner
 * to use for this server (applied by the bot service when connected).
 */
interface ServerBotConfig extends Record<string, unknown> {
  prefix: string;
  customBotEnabled: boolean;
  botAvatarUrl: string;
  botBannerUrl: string;
}

const serverBotDefaults: ServerBotConfig = {
  prefix: "!",
  customBotEnabled: false,
  botAvatarUrl: "",
  botBannerUrl: "",
};

function ServerBotCard() {
  const cfg = useModuleConfig<ServerBotConfig>("settings", serverBotDefaults);
  if (cfg.loading) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sliders className="size-4 text-arctic" /> Server settings</CardTitle>
          <CardDescription>Core configuration for this server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Command prefix</Label>
            <Input
              className="mt-2 max-w-[120px]"
              value={cfg.data.prefix}
              onChange={(e) => cfg.setField("prefix", e.target.value)}
              placeholder="!"
              maxLength={5}
            />
            <p className="mt-1 text-xs text-muted-foreground">Used for text commands, e.g. <span className="font-mono">{cfg.data.prefix || "!"}help</span>.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bot className="size-4 text-arctic" /> Custom bot</CardTitle>
            <CardDescription>Give Soward a custom avatar and banner for this server.</CardDescription>
          </div>
          <Switch checked={cfg.data.customBotEnabled} onCheckedChange={(v) => cfg.setField("customBotEnabled", v)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bot avatar URL</Label>
            <Input
              className="mt-2"
              value={cfg.data.botAvatarUrl}
              onChange={(e) => cfg.setField("botAvatarUrl", e.target.value)}
              placeholder="https://…/avatar.png"
              disabled={!cfg.data.customBotEnabled}
            />
          </div>
          <div>
            <Label>Bot banner URL</Label>
            <Input
              className="mt-2"
              value={cfg.data.botBannerUrl}
              onChange={(e) => cfg.setField("botBannerUrl", e.target.value)}
              placeholder="https://…/banner.png"
              disabled={!cfg.data.customBotEnabled}
            />
          </div>
          {cfg.data.customBotEnabled && (cfg.data.botAvatarUrl || cfg.data.botBannerUrl) && (
            <div className="overflow-hidden rounded-xl border border-border">
              {cfg.data.botBannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.data.botBannerUrl} alt="" className="h-20 w-full object-cover" />
              )}
              {cfg.data.botAvatarUrl && (
                <div className="flex items-center gap-2 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cfg.data.botAvatarUrl} alt="" className="size-10 rounded-lg" />
                  <span className="text-sm text-frost">Preview</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const guild = useGuild();
  const { data: session } = useSession();
  const name = session?.user.globalName ?? session?.user.username ?? "there";
  const plan = PLANS[guild.tier];
  const online = Math.round(guild.memberCount * 0.27);

  const chartData = [42, 58, 51, 73, 66, 88, 79, 64, 91, 70, 83, 97, 76, 85];

  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-bold text-snow sm:text-3xl">
          {greeting()}, {name} ❄️
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening in {guild.name}.</p>
        {guild.demo && (
          <Badge variant="warning" className="mt-3">Demo data — connect the bot for live stats</Badge>
        )}
      </motion.div>

      {/* Server & custom bot settings */}
      <ServerBotCard />


      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Members" value={formatNumber(guild.memberCount)} icon={<Users />} delay={0} />
        <StatCard label="Online" value={formatNumber(online)} icon={<Wifi />} tint="text-success" hint="~27% active" delay={0.05} />
        <StatCard label="Live Sync" value={guild.botOnline ? "Online" : "Off"} icon={<ShieldCheck />} tint={guild.botOnline ? "text-success" : "text-muted-foreground"} delay={0.1} />
        <StatCard label="Premium Plan" value={plan.name} icon={<Crown />} tint="text-arctic" delay={0.15} />
        <StatCard label="Mod Actions" value="248" icon={<Gavel />} tint="text-ice" hint="last 30 days" delay={0.2} />
        <StatCard label="Music" value="Playing" icon={<Music />} tint="text-arctic" delay={0.25} />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="size-4 text-arctic" /> Server activity
              </CardTitle>
              <CardDescription>Messages over the last 14 days</CardDescription>
            </div>
            <Badge variant="success">+12.4%</Badge>
          </CardHeader>
          <CardContent>
            <ActivityChart data={chartData} />
          </CardContent>
        </Card>

        {/* Security status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-arctic" /> Security status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Antinuke", status: "Active", ok: true },
              { label: "Automod", status: "Active", ok: true },
              { label: "Word filter", status: "Active", ok: true },
              { label: "Raid mode", status: "Standby", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="text-sm text-frost">{s.label}</span>
                <Badge variant={s.ok ? "success" : "warning"}>{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent mod actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gavel className="size-4 text-arctic" /> Recent moderation
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/${guild.id}/moderation`}>View all <ArrowRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {DEMO_MOD_ACTIONS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03]">
                <div className="grid size-9 place-items-center rounded-lg bg-white/[0.05]">
                  {modIcon[a.type] ?? <Gavel className="size-4 text-frost" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-snow">
                    <span className="capitalize">{a.type}</span> · {a.targetTag}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.reason} — by {a.moderatorId}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-arctic" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: "Moderation", href: "/moderation" },
              { label: "Welcome", href: "/welcome" },
              { label: "Music", href: "/music" },
              { label: "Automod", href: "/automod" },
              { label: "Tickets", href: "/tickets" },
              { label: "Billing", href: "/billing" },
            ].map((q) => (
              <Button key={q.href} asChild variant="secondary" size="sm" className="justify-start">
                <Link href={`/dashboard/${guild.id}${q.href}`}>{q.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Premium usage */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-4 text-arctic" /> Plan usage
            </CardTitle>
            <CardDescription>{plan.name} plan · {plan.tagline}</CardDescription>
          </div>
          {guild.tier === "FREE" && (
            <Button asChild size="sm">
              <Link href={`/dashboard/${guild.id}/billing`}>Upgrade</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Servers", used: 1, total: plan.limits.maxServers === -1 ? "∞" : plan.limits.maxServers },
            { label: "Logging types", used: 4, total: plan.limits.logging === "advanced" ? "All" : 3 },
            { label: "AI messages", used: plan.limits.aiChatbot ? 128 : 0, total: plan.limits.aiChatbot ? "5,000" : "—" },
          ].map((u) => (
            <div key={u.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <p className="text-xs text-muted-foreground">{u.label}</p>
              <p className="mt-1 text-lg font-semibold text-snow">
                {u.used} <span className="text-sm text-muted-foreground">/ {u.total}</span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
