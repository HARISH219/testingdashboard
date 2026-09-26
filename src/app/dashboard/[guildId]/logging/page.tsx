"use client";

import { ScrollText } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useGuild } from "@/components/dashboard/guild-context";
import { ChannelSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface LoggingConfig extends Record<string, unknown> {
  defaultChannelId: string;
  message: boolean; member: boolean; mod: boolean; role: boolean;
  channel: boolean; server: boolean; voice: boolean; emoji: boolean; webhook: boolean;
}

const defaults: LoggingConfig = {
  defaultChannelId: "", message: true, member: true, mod: true, role: false,
  channel: false, server: false, voice: false, emoji: false, webhook: false,
};

const TYPES: { key: keyof LoggingConfig; label: string; desc: string; premium?: boolean }[] = [
  { key: "message", label: "Message logs", desc: "Edits, deletes, and bulk deletes." },
  { key: "member", label: "Member logs", desc: "Joins, leaves, and updates." },
  { key: "mod", label: "Moderation logs", desc: "Bans, kicks, mutes, warns." },
  { key: "role", label: "Role logs", desc: "Role create/update/delete.", premium: true },
  { key: "channel", label: "Channel logs", desc: "Channel changes.", premium: true },
  { key: "server", label: "Server logs", desc: "Server setting changes.", premium: true },
  { key: "voice", label: "Voice logs", desc: "Voice joins, moves, leaves.", premium: true },
  { key: "emoji", label: "Emoji logs", desc: "Emoji changes.", premium: true },
  { key: "webhook", label: "Webhook logs", desc: "Webhook changes.", premium: true },
];

function Inner() {
  const cfg = useModuleConfig<LoggingConfig>("logging", defaults);
  const guild = useGuild();
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const isFree = guild.tier === "FREE";

  return (
    <div>
      <PageHeader
        title="Logging" icon={<ScrollText className="size-5" />}
        description="Track events across your server with detailed logs."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />
      <Card className="mb-6">
        <CardHeader><CardTitle>Default log channel</CardTitle><CardDescription>Used for any log type without a dedicated channel.</CardDescription></CardHeader>
        <CardContent>
          <ChannelSelect value={cfg.data.defaultChannelId} onChange={(id) => cfg.setField("defaultChannelId", id)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Log types</CardTitle>{isFree && <CardDescription>Free plan includes 3 log types. Upgrade for the full suite.</CardDescription>}</CardHeader>
        <CardContent>
          {TYPES.map((t) => {
            const locked = isFree && t.premium;
            return (
              <SettingsRow key={t.key} label={<span className="flex items-center gap-2">{t.label}{t.premium && <Badge variant="secondary">Premium</Badge>}</span>} description={t.desc}>
                <Switch checked={Boolean(cfg.data[t.key])} onCheckedChange={(v) => cfg.setField(t.key, v as any)} disabled={locked} />
              </SettingsRow>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="logging"><Inner /></ModuleGate>;
}
