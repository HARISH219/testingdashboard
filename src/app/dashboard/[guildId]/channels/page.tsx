"use client";

import * as React from "react";
import { Hash, Volume2, Megaphone, Folder, Search, Radio } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_META: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: "Text", icon: <Hash className="size-4" /> },
  2: { label: "Voice", icon: <Volume2 className="size-4" /> },
  4: { label: "Category", icon: <Folder className="size-4" /> },
  5: { label: "Announcement", icon: <Megaphone className="size-4" /> },
  13: { label: "Stage", icon: <Radio className="size-4" /> },
};

function Inner() {
  const { channels, loading, error } = useResources();
  const [q, setQ] = React.useState("");

  const filtered = channels.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const byType = (t: number) => filtered.filter((c) => c.type === t);
  const counts = {
    text: channels.filter((c) => c.type === 0 || c.type === 5).length,
    voice: channels.filter((c) => c.type === 2 || c.type === 13).length,
    category: channels.filter((c) => c.type === 4).length,
  };

  return (
    <div className="mx-auto max-w-5xl pb-24 sm:pb-0">
      <PageHeader title="Channels" description="Every channel in your server, grouped by type." icon={<Hash className="size-5" />} />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{counts.text}</p><p className="text-xs text-muted-foreground">Text</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{counts.voice}</p><p className="text-xs text-muted-foreground">Voice</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-snow">{counts.category}</p><p className="text-xs text-muted-foreground">Categories</p></Card>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search channels…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Couldn&apos;t load channels. Connect the bot to sync your server.</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No channels match your search.</Card>
      ) : (
        <div className="space-y-6">
          {[0, 5, 2, 13, 4].map((type) => {
            const items = byType(type);
            if (items.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {meta.icon} {meta.label} · {items.length}
                </p>
                <Card>
                  <CardContent className="divide-y divide-white/[0.05] p-0">
                    {items.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-muted-foreground">{meta.icon}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-frost">{c.name}</span>
                        <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">{c.id.slice(-6)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="channels"><Inner /></ModuleGate>;
}
