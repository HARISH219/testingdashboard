import Link from "next/link";
import { Users, Server, CreditCard, DollarSign, Activity, Gauge, ScrollText, Flag } from "lucide-react";
import { prisma } from "@/lib/db";
import { HAS_DATABASE, HAS_STRIPE, HAS_BOT_API, DEMO_MODE } from "@/lib/env";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

async function getStats() {
  if (!HAS_DATABASE) {
    return { users: 1482, guilds: 327, subs: 96, revenue: 767, live: false };
  }
  const [users, guilds, subs] = await Promise.all([
    prisma.user.count(),
    prisma.guild.count(),
    prisma.subscription.count({ where: { status: "ACTIVE", tier: { not: "FREE" } } }),
  ]);
  return { users, guilds, subs, revenue: subs * 8, live: true };
}

export default async function AdminPage() {
  const stats = await getStats();

  const services = [
    { label: "Database", ok: HAS_DATABASE, detail: HAS_DATABASE ? "Connected" : "Not configured" },
    { label: "Stripe", ok: HAS_STRIPE, detail: HAS_STRIPE ? "Configured" : "Not configured" },
    { label: "Bot API", ok: HAS_BOT_API, detail: HAS_BOT_API ? "Connected" : "Pending integration" },
    { label: "Auth", ok: !DEMO_MODE, detail: DEMO_MODE ? "Demo mode" : "Discord OAuth2" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-snow">Admin dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform overview for Soward administrators.</p>
        {!stats.live && <Badge variant="warning" className="mt-3">Demo data — connect a database for live metrics</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={formatNumber(stats.users)} icon={<Users />} />
        <StatCard label="Total Servers" value={formatNumber(stats.guilds)} icon={<Server />} tint="text-ice" delay={0.05} />
        <StatCard label="Active Subs" value={formatNumber(stats.subs)} icon={<CreditCard />} tint="text-success" delay={0.1} />
        <StatCard label="Est. MRR" value={`$${formatNumber(stats.revenue)}`} icon={<DollarSign />} tint="text-arctic" delay={0.15} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4 text-arctic" /> Service health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {services.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="text-sm text-frost">{s.label}</span>
                <Badge variant={s.ok ? "success" : "secondary"}>{s.detail}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Flag className="size-4 text-arctic" /> Controls</CardTitle><CardDescription>Feature flags and maintenance.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: <Gauge className="size-4" />, label: "Lavalink monitoring", desc: "Node health across all guilds." },
              { icon: <ScrollText className="size-4" />, label: "Audit logs", desc: "Platform-wide activity trail." },
              { icon: <Flag className="size-4" />, label: "Maintenance mode", desc: "Temporarily pause the dashboard." },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="grid size-9 place-items-center rounded-lg bg-white/[0.05] text-arctic">{c.icon}</div>
                <div><p className="text-sm font-medium text-snow">{c.label}</p><p className="text-xs text-muted-foreground">{c.desc}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        User & subscription management tables activate once a database is connected. <Link href="/servers" className="text-arctic hover:underline">Back to dashboard</Link>
      </p>
    </div>
  );
}
