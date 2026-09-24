"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, ChevronDown, Minus, Plus, Trash2, PenLine, Bot, Link as LinkIcon,
  Webhook, Ban, UserMinus, KeyRound, Settings2, Smile, ScrollText, AlertTriangle,
  X, Eye,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { PillTabs } from "@/components/dashboard/pill-tabs";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useGuild } from "@/components/dashboard/guild-context";
import { ResourcesProvider, useResources, ChannelSelect } from "@/components/dashboard/resource-select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  WATCHED_ACTIONS, PUNISHMENTS, COUNTER_WINDOWS, MUTE_DURATIONS,
  MESSAGE_VARIABLES, DEFAULT_WARNING_TEMPLATE, renderMessage, punishmentLabel,
  normalizeConfig, defaultAntinukeConfig,
  type AntinukeConfig, type ActionConfig, type AntinukeActionKey, type Punishment,
} from "@/lib/antinuke";
import { intToHexColor, timeAgo, cn } from "@/lib/utils";

const ICONS: Record<string, React.ReactNode> = {
  Trash2: <Trash2 className="size-4" />, Plus: <Plus className="size-4" />, PenLine: <PenLine className="size-4" />,
  Bot: <Bot className="size-4" />, Link: <LinkIcon className="size-4" />, Webhook: <Webhook className="size-4" />,
  Ban: <Ban className="size-4" />, UserMinus: <UserMinus className="size-4" />, KeyRound: <KeyRound className="size-4" />,
  Settings2: <Settings2 className="size-4" />, Smile: <Smile className="size-4" />, Users: <Users className="size-4" />,
};

interface ApiState {
  enabled: boolean;
  config: AntinukeConfig;
  logs: any[];
  stats: { protectedActions: number; enabledActions: number; warningsToday: number; punishmentsToday: number };
}

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [state, setState] = React.useState<ApiState | null>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [config, setConfig] = React.useState<AntinukeConfig>(defaultAntinukeConfig());
  const [saved, setSaved] = React.useState<{ enabled: boolean; config: AntinukeConfig } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [tab, setTab] = React.useState("modules");
  const [expanded, setExpanded] = React.useState<AntinukeActionKey | null>(null);

  const load = React.useCallback(() => {
    fetch(`/api/dashboard/${guild.id}/antinuke`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        const cfg = normalizeConfig(d.config);
        setState(d);
        setEnabled(d.enabled);
        setConfig(cfg);
        setSaved({ enabled: d.enabled, config: cfg });
      })
      .catch((e) => toast({ variant: "error", title: "Failed to load Antinuke", description: e.message }));
  }, [guild.id, toast]);
  React.useEffect(() => { load(); }, [load]);

  const dirty = saved ? JSON.stringify({ enabled, config }) !== JSON.stringify(saved) : false;

  const patchAction = (key: AntinukeActionKey, changes: Partial<ActionConfig>) =>
    setConfig((c) => ({ ...c, actions: { ...c.actions, [key]: { ...c.actions[key], ...changes } } }));

  const save = async () => {
    // Guard: if Antinuke is enabled with any watched action on, at least one
    // trusted user or role must be configured — otherwise admins (including the
    // owner) could be punished by their own protection. You can't proceed
    // without selecting who is trusted.
    const anyActionOn = Object.values(config.actions).some((a) => a.enabled);
    const hasTrusted = config.trustedUsers.length > 0 || config.trustedRoles.length > 0;
    if (enabled && anyActionOn && !hasTrusted) {
      toast({
        variant: "warning",
        title: "Select trusted roles first",
        description: "Add at least one trusted user or role in the Trusted tab before enabling Antinuke, so your admins aren't punished.",
      });
      setTab("trusted");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/antinuke`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, config }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Save failed");
      setSaved({ enabled, config });
      toast({ variant: "success", title: "Changes saved" });
      load();
    } catch (e) {
      toast({ variant: "error", title: "Unable to save changes", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { if (saved) { setEnabled(saved.enabled); setConfig(saved.config); } };

  if (!state) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const enabledCount = Object.values(config.actions).filter((a) => a.enabled).length;
  const trustedCount = config.trustedUsers.length + config.trustedRoles.length;

  return (
    <div>
      <PageHeader
        title="Antinuke"
        icon={<Shield className="size-5" />}
        description="Watch for destructive admin actions and punish whoever crosses the threshold."
        enabled={enabled}
        onEnabledChange={setEnabled}
      />

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={state.stats.protectedActions} label="Protected Actions" />
        <StatCard value={enabledCount} label="Enabled" tint="text-arctic" />
        <StatCard value={state.stats.warningsToday} label="Warnings Today" tint="text-warning" />
        <StatCard value={state.stats.punishmentsToday} label="Punishments Today" tint="text-destructive" />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <PillTabs
          active={tab}
          onChange={setTab}
          layoutId="antinuke-tabs"
          tabs={[
            { key: "modules", label: "Modules", icon: <Shield className="size-3.5" />, count: enabledCount },
            { key: "trusted", label: "Trusted", icon: <Users className="size-3.5" />, count: trustedCount },
            { key: "logs", label: "Logs", icon: <ScrollText className="size-3.5" />, count: state.logs.length },
          ]}
        />
      </div>

      {tab === "modules" && (
        <div className="space-y-4">
          {/* Log channel row */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <p className="text-sm font-medium text-snow">Log channel</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Where Antinuke reports detected actions.</p>
              </div>
              <div className="w-full sm:w-72">
                <ChannelSelect value={config.logChannel} onChange={(id) => setConfig((c) => ({ ...c, logChannel: id }))} />
              </div>
            </CardContent>
          </Card>

          {/* Action rows */}
          <Card>
            <div className="hidden grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Action watched</span>
              <span className="w-12 text-center">On</span>
              <span className="w-28 text-center">Limit</span>
              <span className="w-32 text-center">Punishment</span>
            </div>
            <div>
              {WATCHED_ACTIONS.map((a) => (
                <ActionRow
                  key={a.key}
                  actionKey={a.key}
                  icon={ICONS[a.icon] ?? <Shield className="size-4" />}
                  label={a.label}
                  cfg={config.actions[a.key]}
                  expanded={expanded === a.key}
                  onToggleExpand={() => setExpanded(expanded === a.key ? null : a.key)}
                  onChange={(changes) => patchAction(a.key, changes)}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "trusted" && (
        <TrustedTab config={config} setConfig={setConfig} />
      )}

      {tab === "logs" && (
        <SecurityLogs logs={state.logs} />
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}

/* ------------------------------- Stat card ------------------------------- */

function StatCard({ value, label, tint = "text-snow" }: { value: number; label: string; tint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={cn("text-2xl font-bold", tint)}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Action row ------------------------------ */

function ActionRow({
  actionKey, icon, label, cfg, expanded, onToggleExpand, onChange,
}: {
  actionKey: AntinukeActionKey;
  icon: React.ReactNode;
  label: string;
  cfg: ActionConfig;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (changes: Partial<ActionConfig>) => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4">
        <button onClick={onToggleExpand} className="flex min-w-0 items-center gap-2.5 text-left">
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border border-border", cfg.enabled ? "text-arctic" : "text-muted-foreground")}>
            {icon}
          </span>
          <span className="truncate text-sm font-medium text-snow">{label}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </button>

        {/* On */}
        <div className="flex w-12 justify-center">
          <Switch checked={cfg.enabled} onCheckedChange={(v) => onChange({ enabled: v })} aria-label={`Enable ${label}`} />
        </div>

        {/* Limit stepper */}
        <div className="flex w-28 items-center justify-center">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-white/[0.02] px-1">
            <button
              onClick={() => onChange({ limit: Math.max(1, cfg.limit - 1) })}
              disabled={!cfg.enabled}
              className="grid size-7 place-items-center rounded text-muted-foreground hover:text-snow disabled:opacity-40"
              aria-label="Decrease limit"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-[52px] text-center text-xs text-snow">{cfg.limit} action{cfg.limit === 1 ? "" : "s"}</span>
            <button
              onClick={() => onChange({ limit: Math.min(50, cfg.limit + 1) })}
              disabled={!cfg.enabled}
              className="grid size-7 place-items-center rounded text-muted-foreground hover:text-snow disabled:opacity-40"
              aria-label="Increase limit"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Punishment */}
        <div className="w-32">
          <PunishmentSelect
            value={cfg.punishment}
            onChange={(p) => onChange({ punishment: p })}
            disabled={!cfg.enabled}
          />
        </div>
      </div>

      {/* Expandable per-action settings */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ActionSettings actionKey={actionKey} label={label} cfg={cfg} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionSettings({
  actionKey, label, cfg, onChange,
}: {
  actionKey: AntinukeActionKey;
  label: string;
  cfg: ActionConfig;
  onChange: (changes: Partial<ActionConfig>) => void;
}) {
  const { roles } = useResources();
  const [warnPreview, setWarnPreview] = React.useState(false);

  return (
    <div className="space-y-4 border-t border-border bg-white/[0.01] px-4 py-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RowMini label="Counter window" hint="How long before a user's counter resets.">
          <Select
            value={String(cfg.counterWindow)}
            onChange={(e) => onChange({ counterWindow: Number(e.target.value) })}
            disabled={!cfg.enabled}
          >
            {COUNTER_WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </Select>
        </RowMini>

        <RowMini label="Warning DM" hint="Warn the user when the limit is reached.">
          <Switch checked={cfg.warningEnabled} onCheckedChange={(v) => onChange({ warningEnabled: v })} disabled={!cfg.enabled} />
        </RowMini>

        {cfg.punishment === "mute" && (
          <RowMini label="Mute duration" hint="Timeout length applied on punishment.">
            <Select
              value={String(cfg.punishmentDuration)}
              onChange={(e) => onChange({ punishmentDuration: Number(e.target.value) })}
              disabled={!cfg.enabled}
            >
              {MUTE_DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </RowMini>
        )}
      </div>

      {/* Warning message */}
      {cfg.warningEnabled && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Warning message</Label>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setWarnPreview(true)}>
              <Eye className="size-3.5" /> Preview
            </Button>
          </div>
          <Textarea
            value={cfg.warningMessage}
            onChange={(e) => onChange({ warningMessage: e.target.value })}
            placeholder={DEFAULT_WARNING_TEMPLATE}
            disabled={!cfg.enabled}
            rows={4}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {MESSAGE_VARIABLES.map((v) => (
              <span key={v.token} title={v.desc} className="rounded border border-border bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {v.token}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ignored roles / users (immunity) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChipRoleField
          label="Ignored roles"
          hint="Actors with these roles bypass this action."
          value={cfg.ignoredRoles}
          onChange={(ids) => onChange({ ignoredRoles: ids })}
          roles={roles}
          disabled={!cfg.enabled}
        />
        <ChipRoleField
          label="Protected roles"
          hint="Roles that must never be targeted by this action."
          value={cfg.protectedRoles}
          onChange={(ids) => onChange({ protectedRoles: ids })}
          roles={roles}
          disabled={!cfg.enabled}
        />
      </div>

      <Dialog open={warnPreview} onClose={() => setWarnPreview(false)} title="Warning message preview">
        <div className="whitespace-pre-wrap rounded-xl border border-border bg-white/[0.02] p-4 text-sm text-frost">
          {renderMessage(cfg.warningMessage || DEFAULT_WARNING_TEMPLATE, {
            server: "Your Server",
            action: label,
            count: cfg.limit,
            limit: cfg.limit,
            punishment: punishmentLabel(cfg.punishment),
          })}
        </div>
      </Dialog>
    </div>
  );
}

function RowMini({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.01] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-snow">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* --------------------------- Punishment select --------------------------- */

function PunishmentSelect({
  value, onChange, disabled,
}: {
  value: Punishment;
  onChange: (p: Punishment) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as Punishment)} disabled={disabled} className="h-9 text-xs">
      {PUNISHMENTS.map((p) => (
        <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>
      ))}
    </Select>
  );
}

/* ------------------------------ Chip role field -------------------------- */

function ChipRoleField({
  label, hint, value, onChange, roles, disabled,
}: {
  label: string;
  hint: string;
  value: string[];
  onChange: (ids: string[]) => void;
  roles: { id: string; name: string; color: number }[];
  disabled?: boolean;
}) {
  const [pending, setPending] = React.useState("");
  const selected = roles.filter((r) => value.includes(r.id));
  return (
    <div className="rounded-xl border border-border bg-white/[0.01] p-3">
      <p className="text-sm text-snow">{label}</p>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      <div className="flex gap-2">
        <Select value={pending} onChange={(e) => { const v = e.target.value; if (v && !value.includes(v)) onChange([...value, v]); setPending(""); }} disabled={disabled} className="h-9 text-xs">
          <option value="">Add a role…</option>
          {roles.filter((r) => !value.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
              {r.name}
              <button onClick={() => onChange(value.filter((v) => v !== r.id))} aria-label={`Remove ${r.name}`}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Trusted tab ----------------------------- */

function TrustedTab({
  config, setConfig,
}: {
  config: AntinukeConfig;
  setConfig: React.Dispatch<React.SetStateAction<AntinukeConfig>>;
}) {
  const { roles } = useResources();
  const [userInput, setUserInput] = React.useState("");
  const [pendingRole, setPendingRole] = React.useState("");
  const trustedRoleObjs = roles.filter((r) => config.trustedRoles.includes(r.id));

  return (
    <div className="space-y-4">
      <Card className="border-warning/20 bg-warning/[0.04]">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-snow">Trusted users and roles bypass all Antinuke punishment</p>
            <p className="text-sm text-muted-foreground">Only add people you fully trust. This is re-checked server-side.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-snow">Trusted users</p>
          <p className="mb-3 text-xs text-muted-foreground">User IDs with full antinuke immunity.</p>
          <div className="flex gap-2">
            <Input placeholder="User ID" value={userInput} onChange={(e) => setUserInput(e.target.value)} />
            <Button variant="secondary" onClick={() => { if (userInput.trim()) { setConfig((c) => ({ ...c, trustedUsers: [...c.trustedUsers, userInput.trim()] })); setUserInput(""); } }}>
              <Plus className="size-4" /> Add User
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {config.trustedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trusted users.</p>
            ) : (
              config.trustedUsers.map((id) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-border bg-white/[0.01] px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg border border-border text-arctic"><Users className="size-4" /></span>
                    <div>
                      <p className="font-mono text-sm text-snow">{id}</p>
                      <p className="text-xs text-muted-foreground">Trusted user</p>
                    </div>
                  </div>
                  <button onClick={() => setConfig((c) => ({ ...c, trustedUsers: c.trustedUsers.filter((x) => x !== id) }))} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-snow">Trusted roles</p>
          <p className="mb-3 text-xs text-muted-foreground">Members with these roles bypass antinuke.</p>
          <Select value={pendingRole} onChange={(e) => { const v = e.target.value; if (v && !config.trustedRoles.includes(v)) setConfig((c) => ({ ...c, trustedRoles: [...c.trustedRoles, v] })); setPendingRole(""); }}>
            <option value="">Add a role…</option>
            {roles.filter((r) => !config.trustedRoles.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          {trustedRoleObjs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trustedRoleObjs.map((r) => (
                <Badge key={r.id} variant="secondary" className="gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
                  {r.name}
                  <button onClick={() => setConfig((c) => ({ ...c, trustedRoles: c.trustedRoles.filter((x) => x !== r.id) }))} aria-label={`Remove ${r.name}`}><X className="size-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Security logs ---------------------------- */

function SecurityLogs({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-border"><ScrollText className="size-5 text-muted-foreground" /></div>
          <p className="text-sm font-medium text-snow">No security events yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Warnings and punishments will appear here.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.01] px-3 py-2.5">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border border-border", l.result === "punish" ? "text-destructive" : "text-warning")}>
              {l.result === "punish" ? <Ban className="size-4" /> : <AlertTriangle className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-snow">
                <span className="font-mono">{l.username}</span> · {l.action}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {l.count} / {l.limit} → {l.result === "punish" ? (l.punishment ?? "Punished") : "Warning"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="antinuke">
      <ResourcesProvider>
        <Inner />
      </ResourcesProvider>
    </ModuleGate>
  );
}
