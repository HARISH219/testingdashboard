"use client";

import * as React from "react";
import { Moon, MessageSquare, Bot, Hash } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AfkData extends Record<string, unknown> {
  defaultMessage: string;
  mentionResponse: string;
  autoRemove: boolean;
  ignoreBots: boolean;
  ignoredChannels: string[];
}

const defaults: AfkData = {
  defaultMessage: "AFK",
  mentionResponse: "{user} is currently AFK: {reason}",
  autoRemove: true,
  ignoreBots: true,
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
  const cfg = useModuleConfig<AfkData>("afk", defaults);
  const d = cfg.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="AFK System"
        description="Let members set an AFK status. Soward replies when they're mentioned and clears it when they return."
        icon={<Moon className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      {cfg.loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="size-4 text-arctic" /> Messages</CardTitle>
              <CardDescription>Use {"{user}"} for the member and {"{reason}"} for their AFK note.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Default AFK note" description="Used when a member runs /afk without a message.">
                <Input value={d.defaultMessage} onChange={(e) => cfg.setField("defaultMessage", e.target.value)} placeholder="AFK" />
              </SettingsRow>
              <SettingsRow label="Mention response" description="Sent when someone pings an AFK member.">
                <Textarea
                  rows={2}
                  value={d.mentionResponse}
                  onChange={(e) => cfg.setField("mentionResponse", e.target.value)}
                  placeholder="{user} is currently AFK: {reason}"
                />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="size-4 text-arctic" /> Behaviour</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Auto-remove on message" description="Clear AFK automatically once the member sends a message.">
                <Switch checked={d.autoRemove} onCheckedChange={(v) => cfg.setField("autoRemove", v)} />
              </SettingsRow>
              <SettingsRow label="Ignore bots" description="Don't respond to bot mentions of AFK members.">
                <Switch checked={d.ignoreBots} onCheckedChange={(v) => cfg.setField("ignoreBots", v)} />
              </SettingsRow>
              <SettingsRow label="Ignored channels" description="AFK responses won't be sent in these channels.">
                <MultiChannelSelect value={d.ignoredChannels} onChange={(ids) => cfg.setField("ignoredChannels", ids as never)} />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Example</p>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-frost">
                <p className="text-muted-foreground">/afk I&apos;m sleeping</p>
                <p className="mt-2">Soward: Harish is currently AFK: I&apos;m sleeping.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="afk">
      <Inner />
    </ModuleGate>
  );
}
