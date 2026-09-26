"use client";

import * as React from "react";
import { Eye, Timer, Database, Hash, ShieldCheck } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SnipeData extends Record<string, unknown> {
  retentionMinutes: number;
  maxStored: number;
  staffOnly: boolean;
  ignoredChannels: string[];
}

const defaults: SnipeData = {
  retentionMinutes: 60,
  maxStored: 10,
  staffOnly: false,
  ignoredChannels: [],
};

function MultiChannelSelect({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { channels, loading } = useResources();
  const [pending, setPending] = React.useState("");
  const text = channels.filter((c) => c.type === 0 || c.type === 5);
  const selected = text.filter((c) => value.includes(c.id));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={pending} onChange={(e) => setPending(e.target.value)} disabled={loading}>
          <option value="">Add a channel…</option>
          {text.filter((c) => !value.includes(c.id)).map((c) => (
            <option key={c.id} value={c.id}># {c.name}</option>
          ))}
        </Select>
        <button
          type="button"
          onClick={() => { if (pending && !value.includes(pending)) onChange([...value, pending]); setPending(""); }}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-arctic hover:bg-white/[0.08]"
          aria-label="Add channel"
        >
          +
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1.5">
              <Hash className="size-3" />{c.name}
              <button onClick={() => onChange(value.filter((v) => v !== c.id))} aria-label={`Remove ${c.name}`}>×</button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Inner() {
  const cfg = useModuleConfig<SnipeData>("snipe", defaults);
  const d = cfg.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Snipe"
        description="View recently deleted and edited messages with /snipe and /editsnipe."
        icon={<Eye className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      {cfg.loading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="size-4 text-arctic" /> Storage</CardTitle>
              <CardDescription>Control how long and how many messages are retained for sniping.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Retention time" description="How long a deleted/edited message stays snipeable.">
                <Select value={String(d.retentionMinutes)} onChange={(e) => cfg.setField("retentionMinutes", Number(e.target.value))}>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="360">6 hours</option>
                  <option value="1440">24 hours</option>
                </Select>
              </SettingsRow>
              <SettingsRow label="Maximum stored per channel" description="How many recent messages to keep for sniping.">
                <Input type="number" min={1} max={50} value={d.maxStored} onChange={(e) => cfg.setField("maxStored", Number(e.target.value))} />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-arctic" /> Access</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Staff-only mode" description="Only members with a management role can snipe.">
                <Switch checked={d.staffOnly} onCheckedChange={(v) => cfg.setField("staffOnly", v)} />
              </SettingsRow>
              <SettingsRow label="Ignored channels" description="Messages in these channels are never stored for sniping.">
                <MultiChannelSelect value={d.ignoredChannels} onChange={(ids) => cfg.setField("ignoredChannels", ids as never)} />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
              <Timer className="mt-0.5 size-4 shrink-0 text-arctic" />
              Snipe data is stored in memory by the bot and respects the retention limits above. Deleted messages are shown with the original author, content, channel, and timestamp.
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="snipe">
      <Inner />
    </ModuleGate>
  );
}
