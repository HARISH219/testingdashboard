"use client";

import { Bot } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ChannelSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AutomodConfig extends Record<string, unknown> {
  logChannelId: string;
  raidMode: boolean;
  raidThreshold: number;
  punishment: string;
  antiSpam: boolean;
  antiInvite: boolean;
  antiMassMention: boolean;
  antiCaps: boolean;
}

const defaults: AutomodConfig = {
  logChannelId: "", raidMode: false, raidThreshold: 10, punishment: "mute",
  antiSpam: true, antiInvite: true, antiMassMention: true, antiCaps: false,
};

function Inner() {
  const cfg = useModuleConfig<AutomodConfig>("automod", defaults);
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const rules: { key: keyof AutomodConfig; label: string; desc: string }[] = [
    { key: "antiSpam", label: "Anti-spam", desc: "Detect and stop message spam." },
    { key: "antiInvite", label: "Anti-invite", desc: "Block unauthorized Discord invites." },
    { key: "antiMassMention", label: "Mass mention", desc: "Punish excessive mentions." },
    { key: "antiCaps", label: "Excessive caps", desc: "Flag messages that are mostly uppercase." },
  ];

  return (
    <div>
      <PageHeader
        title="Automod" icon={<Bot className="size-5" />}
        description="Automatic moderation, raid protection, and punishments."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rules</CardTitle><CardDescription>Toggle automatic detection rules.</CardDescription></CardHeader>
          <CardContent>
            {rules.map((r) => (
              <SettingsRow key={r.key} label={r.label} description={r.desc}>
                <Switch checked={Boolean(cfg.data[r.key])} onCheckedChange={(v) => cfg.setField(r.key, v as any)} />
              </SettingsRow>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent>
            <SettingsRow label="Log channel" description="Where automod events are logged.">
              <ChannelSelect value={cfg.data.logChannelId} onChange={(id) => cfg.setField("logChannelId", id)} />
            </SettingsRow>
            <SettingsRow label="Default punishment">
              <Select value={cfg.data.punishment} onChange={(e) => cfg.setField("punishment", e.target.value)}>
                <option value="warn">Warn</option>
                <option value="mute">Mute</option>
                <option value="kick">Kick</option>
                <option value="ban">Ban</option>
              </Select>
            </SettingsRow>
            <SettingsRow label="Raid mode" description="Auto-lockdown when a join spike is detected.">
              <div className="flex items-center justify-end gap-2">
                {cfg.data.raidMode && <Badge variant="warning">Armed</Badge>}
                <Switch checked={cfg.data.raidMode} onCheckedChange={(v) => cfg.setField("raidMode", v)} />
              </div>
            </SettingsRow>
            {cfg.data.raidMode && (
              <SettingsRow label="Raid threshold" description="Joins per 10s that trigger raid mode.">
                <input type="range" min={3} max={30} value={cfg.data.raidThreshold} onChange={(e) => cfg.setField("raidThreshold", Number(e.target.value))} className="w-full accent-arctic" />
                <span className="ml-2 text-sm text-snow">{cfg.data.raidThreshold}</span>
              </SettingsRow>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="automod"><Inner /></ModuleGate>;
}
