"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ScrollText, Search, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import { NoAccess } from "@/components/dashboard/locked-feature";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermits, describeActivity, type PermitActivity } from "@/components/dashboard/permits/use-permits";
import { TEMP_UNLOCK_ALL } from "@/lib/plans";
import { timeAgo } from "@/lib/utils";

type ActionFilter = "all" | "permit.create" | "permit.update" | "permit.delete";

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; tint: string }> = {
  "permit.create": { label: "Created", icon: <Plus className="size-4" />, tint: "text-success" },
  "permit.update": { label: "Updated", icon: <Pencil className="size-4" />, tint: "text-arctic" },
  "permit.delete": { label: "Deleted", icon: <Trash2 className="size-4" />, tint: "text-destructive" },
};

function AuditInner() {
  const guild = useGuild();
  const { activity, loading } = usePermits(true);
  const base = `/dashboard/${guild.id}/permits`;

  const [query, setQuery] = React.useState("");
  const [action, setAction] = React.useState<ActionFilter>("all");
  const [permitName, setPermitName] = React.useState("all");

  const permitNames = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of activity) {
      const p = a.detail.permit as string | undefined;
      if (p) set.add(p);
    }
    return [...set].sort();
  }, [activity]);

  const filtered = activity.filter((a) => {
    if (action !== "all" && a.action !== action) return false;
    if (permitName !== "all" && a.detail.permit !== permitName) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = `${a.detail.by ?? ""} ${a.detail.permit ?? ""} ${a.action}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <Link href={base} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-snow">
        <ArrowLeft className="size-4" /> Back to Permits
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-primary/10 text-arctic">
          <ScrollText className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-snow">Audit Log</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Every change made to permits in this server.</p>
        </div>
      </motion.div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-arctic" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search user or permit…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={action} onChange={(e) => setAction(e.target.value as ActionFilter)}>
              <option value="all">All actions</option>
              <option value="permit.create">Created</option>
              <option value="permit.update">Updated</option>
              <option value="permit.delete">Deleted</option>
            </Select>
            <Select value={permitName} onChange={(e) => setPermitName(e.target.value)}>
              <option value="all">All permits</option>
              {permitNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
              <p className="text-sm font-medium text-snow">No activity found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.length === 0 ? "Changes to permits will appear here." : "Try different filters."}
              </p>
            </div>
          ) : (
            filtered.map((a) => <AuditRow key={a.id} entry={a} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditRow({ entry }: { entry: PermitActivity }) {
  const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: <ScrollText className="size-4" />, tint: "text-frost" };
  const { title, sub } = describeActivity(entry);
  const by = (entry.detail.by as string) ?? "Someone";
  const permit = (entry.detail.permit as string) ?? "—";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition-colors hover:bg-white/[0.04]">
      <div className={`grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] ${meta.tint}`}>{meta.icon}</div>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-snow">{by}</p>
          <p className="truncate text-xs text-muted-foreground sm:hidden">{title}</p>
        </div>
        <p className="hidden truncate text-sm text-frost sm:block">{meta.label} <span className="text-snow">{permit}</span></p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{sub}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
    </div>
  );
}

export default function Page() {
  const guild = useGuild();
  if (!TEMP_UNLOCK_ALL && !guild.permissions.includes("*")) return <NoAccess module="Permits" />;
  return <AuditInner />;
}
