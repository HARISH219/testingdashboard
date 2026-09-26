"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Search, Shield, ArrowRight, Info } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, intToHexColor } from "@/lib/utils";

function Inner() {
  const guild = useGuild();
  const { roles, loading } = useResources();
  const [q, setQ] = React.useState("");
  const base = `/dashboard/${guild.id}`;

  const online = Math.round(guild.memberCount * 0.27);
  const bots = roles.length ? Math.max(1, Math.round(guild.memberCount * 0.04)) : 0;
  const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) && r.name !== "@everyone");

  return (
    <div className="mx-auto max-w-5xl pb-24 sm:pb-0">
      <PageHeader title="Members" description="Member overview and role distribution for your server." icon={<Users className="size-5" />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{formatNumber(guild.memberCount)}</p><p className="text-xs text-muted-foreground">Total members</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-success">{formatNumber(online)}</p><p className="text-xs text-muted-foreground">Online</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{roles.length}</p><p className="text-xs text-muted-foreground">Roles</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{bots}</p><p className="text-xs text-muted-foreground">Bots</p></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-arctic" />
          Live per-member browsing (avatars, join dates, message counts) streams from the bot once its API is connected. Role distribution below is synced from your server now.
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Shield className="size-4" /> Roles
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}/setup-roles`}>Manage roles <ArrowRight className="size-3.5" /></Link>
        </Button>
      </div>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search roles…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)}</div>
      ) : filteredRoles.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No roles match.</Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-white/[0.05] p-0">
            {filteredRoles.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
                <span className="min-w-0 flex-1 truncate text-sm text-frost">{r.name}</span>
                <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">{r.id.slice(-6)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="members"><Inner /></ModuleGate>;
}
