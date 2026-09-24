"use client";

import * as React from "react";
import { ScrollText, Settings2, ShieldCheck, CreditCard, KeyRound, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MODULE_MAP } from "@/lib/modules";
import { timeAgo } from "@/lib/utils";

interface LogEntry {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

/** Turn a raw audit action + detail into a readable line + icon. */
function describe(entry: LogEntry): { icon: React.ReactNode; title: string; sub: string; by: string } {
  const d = entry.detail;
  const by = (d.by as string) ?? "Someone";
  switch (entry.action) {
    case "config.update": {
      const moduleKey = d.module as string;
      const name = MODULE_MAP[moduleKey]?.name ?? moduleKey ?? "a module";
      return {
        icon: <Settings2 className="size-4 text-arctic" />,
        title: `Updated ${name}`,
        sub: d.enabled === undefined ? "Changed settings" : d.enabled ? "Enabled + saved settings" : "Disabled + saved settings",
        by,
      };
    }
    case "permit.create": return { icon: <KeyRound className="size-4 text-arctic" />, title: `Created permit ${d.permit ?? ""}`, sub: `${d.permissions ?? 0} permissions`, by };
    case "permit.update": return { icon: <KeyRound className="size-4 text-arctic" />, title: `Updated permit ${d.permit ?? ""}`, sub: "Changed permit", by };
    case "permit.delete": return { icon: <KeyRound className="size-4 text-destructive" />, title: `Deleted permit ${d.permit ?? ""}`, sub: "Removed", by };
    case "billing.razorpay.paid": return { icon: <CreditCard className="size-4 text-success" />, title: `Upgraded to ${d.tier ?? "premium"}`, sub: "Payment recorded", by };
    case "antinuke.log": return { icon: <ShieldCheck className="size-4 text-warning" />, title: `Antinuke ${d.result ?? "event"}`, sub: `${d.action ?? ""}`, by: (d.username as string) ?? by };
    default: return { icon: <ScrollText className="size-4 text-frost" />, title: entry.action, sub: "", by };
  }
}

export default function Page() {
  const guild = useGuild();
  const [logs, setLogs] = React.useState<LogEntry[] | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/dashboard/${guild.id}/logs`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => setLogs([]));
  }, [guild.id]);

  const filtered = (logs ?? []).filter((l) => {
    if (!query.trim()) return true;
    const { title, by } = describe(l);
    return `${title} ${by} ${l.action}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Dashboard Logs"
        icon={<ScrollText className="size-5" />}
        description="A record of who changed what in the dashboard."
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          {logs === null ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-border"><ScrollText className="size-5 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-snow">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(logs?.length ?? 0) === 0 ? "Changes made in the dashboard will appear here." : "No logs match your search."}
              </p>
            </div>
          ) : (
            filtered.map((l) => {
              const { icon, title, sub, by } = describe(l);
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.01] px-3 py-3 transition-colors hover:bg-white/[0.03]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-snow">
                      <span className="font-medium">{by}</span> · {title}
                    </p>
                    {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
