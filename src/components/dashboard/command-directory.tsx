"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { ModuleGate } from "./module-gate";
import { PageHeader } from "./page-header";
import { ModuleIcon } from "./module-icon";
import { useGuild } from "./guild-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MODULE_MAP } from "@/lib/modules";

export interface CommandDoc { name: string; usage?: string; description: string }

/** Directory listing of commands for reference-style modules (fun, utilities). */
export function CommandDirectory({
  moduleKey,
  commands,
}: {
  moduleKey: string;
  commands: CommandDoc[];
}) {
  const guild = useGuild();
  const mod = MODULE_MAP[moduleKey];
  const [q, setQ] = React.useState("");
  const filtered = commands.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ModuleGate moduleKey={moduleKey}>
      <PageHeader
        title={mod?.name ?? moduleKey}
        description={mod?.description}
        icon={<ModuleIcon name={mod?.icon ?? "Wrench"} className="size-5" />}
      />
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search commands…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.name} hover className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {guild.tier === "FREE" ? "!" : ""}{c.name}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-frost">{c.description}</p>
            {c.usage && <p className="mt-1 font-mono text-xs text-muted-foreground">{c.usage}</p>}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No commands match.</p>}
      </div>
    </ModuleGate>
  );
}
