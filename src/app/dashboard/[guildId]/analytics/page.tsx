"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Users, Wifi, MessageSquare, TerminalSquare, Hash, UserCheck,
  Volume2, ShieldAlert, TrendingUp, Trophy,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildMetrics, TOP_CHANNELS, TOP_MEMBERS, type Metric } from "@/lib/overview-data";
import { formatNumber } from "@/lib/utils";

const ICON: Record<string, React.ReactNode> = {
  Users: <Users />, Wifi: <Wifi />, MessageSquare: <MessageSquare />,
  TerminalSquare: <TerminalSquare />, Hash: <Hash />, UserCheck: <UserCheck />,
  Volume2: <Volume2 />, ShieldAlert: <ShieldAlert />,
};

function MetricCard({ m, delay }: { m: Metric; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Card hover className="h-full p-4">
        <div className="flex items-start justify-between">
          <div className={`grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] [&_svg]:size-4 ${m.tint}`}>{ICON[m.icon]}</div>
          {m.trend && <span className={`text-[11px] font-semibold ${m.trend.dir === "up" ? "text-success" : "text-destructive"}`}>{m.trend.dir === "up" ? "▲" : "▼"} {m.trend.value}</span>}
        </div>
        <p className="mt-3 text-2xl font-bold text-snow">{m.value}</p>
        <p className="text-xs text-frost">{m.label}</p>
      </Card>
    </motion.div>
  );
}

function Inner() {
  const guild = useGuild();
  const metrics = buildMetrics(guild.memberCount).slice(0, 4);
  const messages = [42, 58, 51, 73, 66, 88, 79, 64, 91, 70, 83, 97, 76, 85];
  const joins = [4, 6, 3, 8, 5, 9, 7, 6, 10, 5, 8, 11, 7, 9];
  const maxChannel = Math.max(...TOP_CHANNELS.map((c) => c.messages));

  return (
    <div className="mx-auto max-w-6xl pb-24 sm:pb-0">
      <PageHeader
        title="Analytics"
        description="Message, member, and activity trends for your server."
        icon={<BarChart3 className="size-5" />}
      />
      {guild.demo && <Badge variant="warning" className="mb-4">Demo data — connect the bot for live analytics</Badge>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.key} m={m} delay={i * 0.04} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-arctic" /> Messages</CardTitle>
              <CardDescription>Last 14 days</CardDescription>
            </div>
            <Badge variant="success">+12.4%</Badge>
          </CardHeader>
          <CardContent><ActivityChart data={messages} /></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="size-4 text-arctic" /> New members</CardTitle>
              <CardDescription>Last 14 days</CardDescription>
            </div>
            <Badge variant="success">+8.1%</Badge>
          </CardHeader>
          <CardContent><ActivityChart data={joins} /></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Hash className="size-4 text-arctic" /> Top Channels</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {TOP_CHANNELS.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm"><span className="truncate text-frost">#{c.name}</span><span className="text-snow">{formatNumber(c.messages)}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-arctic" style={{ width: `${(c.messages / maxChannel) * 100}%` }} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-arctic" /> Top Members</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {TOP_MEMBERS.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="grid size-8 place-items-center rounded-full bg-arctic/15 text-xs font-bold text-arctic">{m.name.slice(0, 1).toUpperCase()}</div>
                <span className="min-w-0 flex-1 truncate text-sm text-frost">{m.name}</span>
                <span className="text-xs text-snow">{formatNumber(m.messages)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="analytics"><Inner /></ModuleGate>;
}
