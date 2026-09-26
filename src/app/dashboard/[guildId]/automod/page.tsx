"use client";

import * as React from "react";
import {
  Bot, Gauge, Link as LinkIcon, AtSign, CaseUpper, Filter, Copy,
  ShieldAlert, Send, Megaphone, Smile, Repeat, Paperclip, Settings2,
  Plus, X, ScrollText,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ChannelSelect, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PROTECTIONS, PROTECTION_MAP, AUTOMOD_ACTIONS, TIMEOUT_DURATIONS,
  normalizeAutomodConfig, type AutomodConfig, type BaseProtection, type ProtectionId,
} from "@/lib/automod";

const ICONS: Record<string, React.ReactNode> = {
  Gauge: <Gauge className="size-4" />, Link: <LinkIcon className="size-4" />,
  AtSign: <AtSign className="size-4" />, CaseUpper: <CaseUpper className="size-4" />,
  Filter: <Filter className="size-4" />, Copy: <Copy className="size-4" />,
  ShieldAlert: <ShieldAlert className="size-4" />, Send: <Send className="size-4" />,
  Megaphone: <Megaphone className="size-4" />, Smile: <Smile className="size-4" />,
  Repeat: <Repeat className="size-4" />, Paperclip: <Paperclip className="size-4" />,
};

/** Simple string-list editor for words/domains. */
function ListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [pending, setPending] = React.useState("");
  const add = () => {
    const v = pending.trim().toLowerCase();
    if (v && !value.includes(v)) onChange([...value, v]);
    setPending("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={pending}
          placeholder={placeholder}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="icon" variant="secondary" onClick={add} aria-label="Add">
          <Plus className="size-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1.5 font-mono">
              {v}
              <button onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Per-protection settings modal. */
function ProtectionDialog({
  id,
  open,
  onClose,
  p,
  update,
}: {
  id: ProtectionId;
  open: boolean;
  onClose: () => void;
  p: BaseProtection;
  update: (patch: Partial<BaseProtection>) => void;
}) {
  const meta = PROTECTION_MAP[id];
  return (
    <Dialog open={open} onClose={onClose} title={meta.name} description={meta.description} className="max-w-xl">
      <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
        {/* Protection-specific fields */}
        {id === "antiSpam" && (
          <>
            <SettingsRow label="Message threshold" description="Messages allowed before the action triggers.">
              <Input type="number" min={2} max={30} value={Number(p.messageThreshold)} onChange={(e) => update({ messageThreshold: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Time window (seconds)" description="Detects users sending too many messages in a short period.">
              <Input type="number" min={1} max={60} value={Number(p.windowSeconds)} onChange={(e) => update({ windowSeconds: Number(e.target.value) })} />
            </SettingsRow>
          </>
        )}
        {id === "antiLink" && (
          <>
            <SettingsRow label="Block all links" description="Remove every URL, not just invites.">
              <Switch checked={Boolean(p.blockAll)} onCheckedChange={(v) => update({ blockAll: v })} />
            </SettingsRow>
            <SettingsRow label="Block Discord invites">
              <Switch checked={Boolean(p.blockInvites)} onCheckedChange={(v) => update({ blockInvites: v })} />
            </SettingsRow>
            <SettingsRow label="Block external links">
              <Switch checked={Boolean(p.blockExternal)} onCheckedChange={(v) => update({ blockExternal: v })} />
            </SettingsRow>
            <SettingsRow label="Whitelisted domains" description="Links to these domains are always allowed.">
              <ListEditor value={(p.whitelistDomains as string[]) ?? []} onChange={(v) => update({ whitelistDomains: v })} placeholder="example.com" />
            </SettingsRow>
          </>
        )}
        {id === "antiMention" && (
          <SettingsRow label="Mention threshold" description="Max user mentions allowed in one message.">
            <Input type="number" min={2} max={50} value={Number(p.mentionThreshold)} onChange={(e) => update({ mentionThreshold: Number(e.target.value) })} />
          </SettingsRow>
        )}
        {id === "antiCaps" && (
          <>
            <SettingsRow label="Caps percentage" description="Flag when this % of the message is uppercase.">
              <Input type="number" min={50} max={100} value={Number(p.capsPercentage)} onChange={(e) => update({ capsPercentage: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Minimum length" description="Ignore short messages below this length.">
              <Input type="number" min={5} max={100} value={Number(p.minLength)} onChange={(e) => update({ minLength: Number(e.target.value) })} />
            </SettingsRow>
          </>
        )}
        {id === "badWords" && (
          <>
            <SettingsRow label="Fuzzy matching" description="Catch obfuscated spellings (l33t, spacing).">
              <Switch checked={Boolean(p.fuzzy)} onCheckedChange={(v) => update({ fuzzy: v })} />
            </SettingsRow>
            <SettingsRow label="Blacklisted words" description="Messages containing these are actioned.">
              <ListEditor value={(p.words as string[]) ?? []} onChange={(v) => update({ words: v })} placeholder="word" />
            </SettingsRow>
          </>
        )}
        {id === "duplicate" && (
          <>
            <SettingsRow label="Repeat threshold" description="Identical messages before actioning.">
              <Input type="number" min={2} max={10} value={Number(p.repeatThreshold)} onChange={(e) => update({ repeatThreshold: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Time window (seconds)">
              <Input type="number" min={5} max={120} value={Number(p.windowSeconds)} onChange={(e) => update({ windowSeconds: Number(e.target.value) })} />
            </SettingsRow>
          </>
        )}
        {id === "raid" && (
          <>
            <SettingsRow label="Join threshold" description="Joins within the window that trigger raid mode.">
              <Input type="number" min={3} max={100} value={Number(p.joinThreshold)} onChange={(e) => update({ joinThreshold: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Time window (seconds)">
              <Input type="number" min={5} max={120} value={Number(p.windowSeconds)} onChange={(e) => update({ windowSeconds: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Auto lockdown" description="Lock the server automatically during a raid.">
              <Switch checked={Boolean(p.lockdown)} onCheckedChange={(v) => update({ lockdown: v })} />
            </SettingsRow>
          </>
        )}
        {id === "invite" && (
          <SettingsRow label="Allow own-server invites" description="Don't remove invites to this server.">
            <Switch checked={Boolean(p.allowOwnServer)} onCheckedChange={(v) => update({ allowOwnServer: v })} />
          </SettingsRow>
        )}
        {id === "massMention" && (
          <>
            <SettingsRow label="Block @everyone / @here" description="Prevent non-staff from using mass pings.">
              <Switch checked={Boolean(p.blockEveryone)} onCheckedChange={(v) => update({ blockEveryone: v })} />
            </SettingsRow>
            <SettingsRow label="Role mention threshold" description="Max role mentions allowed in one message.">
              <Input type="number" min={1} max={20} value={Number(p.roleMentionThreshold)} onChange={(e) => update({ roleMentionThreshold: Number(e.target.value) })} />
            </SettingsRow>
          </>
        )}
        {id === "emojiSpam" && (
          <SettingsRow label="Emoji threshold" description="Max emojis allowed in one message.">
            <Input type="number" min={3} max={50} value={Number(p.emojiThreshold)} onChange={(e) => update({ emojiThreshold: Number(e.target.value) })} />
          </SettingsRow>
        )}
        {id === "repeatedChars" && (
          <SettingsRow label="Character run threshold" description="Max repeated characters in a row.">
            <Input type="number" min={4} max={50} value={Number(p.charThreshold)} onChange={(e) => update({ charThreshold: Number(e.target.value) })} />
          </SettingsRow>
        )}
        {id === "attachmentSpam" && (
          <>
            <SettingsRow label="Attachment threshold" description="Max attachments in the window.">
              <Input type="number" min={2} max={20} value={Number(p.attachmentThreshold)} onChange={(e) => update({ attachmentThreshold: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Time window (seconds)">
              <Input type="number" min={5} max={60} value={Number(p.windowSeconds)} onChange={(e) => update({ windowSeconds: Number(e.target.value) })} />
            </SettingsRow>
          </>
        )}

        {/* Shared action + ignore settings */}
        <div className="my-3 border-t border-white/[0.06]" />
        <SettingsRow label="Action" description="What happens when this protection triggers.">
          <Select value={p.action} onChange={(e) => update({ action: e.target.value as BaseProtection["action"] })}>
            {AUTOMOD_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
        </SettingsRow>
        {p.action === "timeout" && (
          <SettingsRow label="Timeout duration">
            <Select value={String(p.timeoutSeconds)} onChange={(e) => update({ timeoutSeconds: Number(e.target.value) })}>
              {TIMEOUT_DURATIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </SettingsRow>
        )}
        <SettingsRow label="Warning threshold" description="Warnings before escalating the punishment.">
          <Input type="number" min={1} max={10} value={p.warnThreshold} onChange={(e) => update({ warnThreshold: Number(e.target.value) })} />
        </SettingsRow>
        <SettingsRow label="Ignore administrators">
          <Switch checked={p.ignoreAdmins} onCheckedChange={(v) => update({ ignoreAdmins: v })} />
        </SettingsRow>
        <SettingsRow label="Ignore moderators">
          <Switch checked={p.ignoreModerators} onCheckedChange={(v) => update({ ignoreModerators: v })} />
        </SettingsRow>
        <SettingsRow label="Ignored roles" description="Members with these roles are never actioned.">
          <MultiRoleSelect value={p.ignoredRoles} onChange={(ids) => update({ ignoredRoles: ids })} />
        </SettingsRow>
        <SettingsRow label="Ignored channels" description="This protection won't run in these channels.">
          <ChannelSelect value={p.ignoredChannels[0] ?? ""} onChange={(id) => update({ ignoredChannels: id ? [id] : [] })} />
        </SettingsRow>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Dialog>
  );
}

function Inner() {
  const cfg = useModuleConfig<AutomodConfig>("automod", normalizeAutomodConfig());
  const [openId, setOpenId] = React.useState<ProtectionId | null>(null);

  // Normalize so partial stored data always has every protection present.
  const config = React.useMemo(() => normalizeAutomodConfig(cfg.data), [cfg.data]);

  const setProtection = (id: ProtectionId, patch: Partial<BaseProtection>) => {
    cfg.setField("protections", {
      ...config.protections,
      [id]: { ...config.protections[id], ...patch },
    } as never);
  };

  const enabledCount = PROTECTIONS.filter((p) => config.protections[p.id]?.enabled).length;

  if (cfg.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="AutoMod"
        description="Advanced automatic moderation. Enable protections individually and fine-tune each one."
        icon={<Bot className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-arctic">
              <ScrollText className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-snow">AutoMod log channel</p>
              <p className="text-xs text-muted-foreground">{enabledCount} of {PROTECTIONS.length} protections enabled</p>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <ChannelSelect value={config.logChannelId} onChange={(id) => cfg.setField("logChannelId", id)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROTECTIONS.map((meta) => {
          const p = config.protections[meta.id];
          return (
            <Card key={meta.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div className={`grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] ${p.enabled ? "text-arctic" : "text-muted-foreground"}`}>
                  {ICONS[meta.icon]}
                </div>
                <Switch checked={p.enabled} onCheckedChange={(v) => setProtection(meta.id, { enabled: v })} />
              </div>
              <h3 className="mt-3 font-semibold text-snow">{meta.name}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{meta.description}</p>
              <div className="mt-3 flex items-center justify-between">
                {p.enabled ? (
                  <Badge variant="success">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => setOpenId(meta.id)}>
                  <Settings2 className="size-4" /> Settings
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {openId && (
        <ProtectionDialog
          id={openId}
          open={openId !== null}
          onClose={() => setOpenId(null)}
          p={config.protections[openId]}
          update={(patch) => setProtection(openId, patch)}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="automod">
      <Inner />
    </ModuleGate>
  );
}
