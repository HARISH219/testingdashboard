"use client";

import * as React from "react";
import { Gauge, Cpu, MemoryStick, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, cn } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  Healthy: "success", Warning: "warning", Critical: "destructive", Offline: "secondary",
};

function fmtUptime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
}

function Inner() {
  const guild = useGuild();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/dashboard/${guild.id}/lavalink`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [guild.id]);
  React.useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Lavalink diagnostics" icon={<Gauge className="size-5" />}
        description="Music node health, performance, and error logs."
        actions={<Button variant="secondary" onClick={load}><RefreshCw className="size-4" /> Refresh</Button>}
      />

      {!data?.live && <Badge variant="warning" className="mb-4">{data?.pending ? "Bot API pending — showing preview" : "Preview data"}</Badge>}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data?.nodes?.map((node: any) => {
              const memPct = Math.round((node.memoryUsedMb / node.memoryTotalMb) * 100);
              return (
                <Card key={node.name} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", node.connected ? "bg-success animate-pulse-glow" : "bg-destructive")} />
                      <h3 className="font-semibold text-snow">{node.name}</h3>
                    </div>
                    <Badge variant={statusVariant[node.status]}>{node.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Metric icon={<Activity className="size-4" />} label="Ping" value={`${node.pingMs}ms`} />
                    <Metric icon={<Gauge className="size-4" />} label="Uptime" value={fmtUptime(node.uptimeMs)} />
                    <Metric icon={<Cpu className="size-4" />} label="CPU" value={`${node.cpu}%`} />
                    <Metric icon={<MemoryStick className="size-4" />} label="Memory" value={`${memPct}%`} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Players</span>
                    <span className="text-snow">{node.activePlayers} active / {node.players} total</span>
                  </div>
                  {node.reconnects > 0 && (
                    <p className="mt-2 text-xs text-warning">{node.reconnects} reconnection attempt(s)</p>
                  )}
                </Card>
              );
            })}
          </div>

          {guild.permissions.includes("*") && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Error log</CardTitle>
                <CardDescription>Admin-only diagnostics: track loading, voice, and search issues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.errors?.length ? data.errors.map((e: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <Badge variant={e.level === "error" ? "destructive" : "warning"}>{e.level}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-frost">{e.message}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(e.at)}</p>
                    </div>
                  </div>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No recent errors.</p>}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground [&_svg]:size-3.5">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-1 text-lg font-semibold text-snow">{value}</p>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="lavalink"><Inner /></ModuleGate>;
}
