"use client";

import * as React from "react";
import {
  Ticket, Send, Palette, Settings2, ScrollText, Image as ImageIcon,
  Hash, Clock, CheckCircle2, Inbox, TimerReset, TrendingUp, Loader2,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { PillTabs } from "@/components/dashboard/pill-tabs";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useGuild } from "@/components/dashboard/guild-context";
import { ChannelSelect, MultiRoleSelect, useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface TicketConfig extends Record<string, unknown> {
  panelTitle: string;
  panelDescription: string;
  panelColor: string;
  panelThumbnail: string;
  panelImageUrl: string;
  panelFooter: string;
  panelFooterIcon: string;
  panelAuthor: string;
  panelAuthorIcon: string;
  buttonText: string;
  buttonEmoji: string;
  buttonStyle: string;
  panelChannelId: string;
  panelMessageId: string;
  categoryChannelId: string;
  supportRoles: string[];
  staffRoles: string[];
  maxOpen: number;
  claimSystem: boolean;
  autoClose: boolean;
  autoCloseHours: number;
  closeConfirmation: boolean;
  namingFormat: string;
  transcripts: boolean;
  transcriptChannelId: string;
}

const defaults: TicketConfig = {
  panelTitle: "Need Help?",
  panelDescription: "Click the button below to open a support ticket.",
  panelColor: "#3B82F6",
  panelThumbnail: "",
  panelImageUrl: "",
  panelFooter: "Powered by Soward",
  panelFooterIcon: "",
  panelAuthor: "",
  panelAuthorIcon: "",
  buttonText: "Open a Ticket",
  buttonEmoji: "🎫",
  buttonStyle: "primary",
  panelChannelId: "",
  panelMessageId: "",
  categoryChannelId: "",
  supportRoles: [],
  staffRoles: [],
  maxOpen: 1,
  claimSystem: true,
  autoClose: false,
  autoCloseHours: 48,
  closeConfirmation: true,
  namingFormat: "ticket-{number}",
  transcripts: true,
  transcriptChannelId: "",
};

const BUTTON_STYLES: Record<string, string> = {
  primary: "bg-[#5865F2] text-white",
  secondary: "bg-[#4E5058] text-white",
  success: "bg-[#248046] text-white",
  danger: "bg-[#DA373C] text-white",
};

/* ------------------------------ stat cards ------------------------------ */
function StatCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <Card className="p-4">
      <div className={`mb-2 grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] ${tint}`}>
        {icon}
      </div>
      <p className="text-lg font-semibold text-snow">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

/* --------------------------- Discord embed preview ---------------------- */
function DiscordEmbedPreview({ d }: { d: TicketConfig }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#313338] p-4 font-[system-ui]">
      {/* bot message header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5865F2] text-sm font-bold text-white">S</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Soward</span>
            <span className="rounded bg-[#5865F2] px-1 py-0.5 text-[9px] font-semibold uppercase text-white">Bot</span>
            <span className="text-[11px] text-[#949BA4]">Today</span>
          </div>

          {/* embed */}
          <div
            className="mt-1.5 max-w-md overflow-hidden rounded border-l-4 bg-[#2B2D31]"
            style={{ borderColor: d.panelColor || "#3B82F6" }}
          >
            <div className="flex gap-3 p-3">
              <div className="min-w-0 flex-1">
                {d.panelAuthor && (
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {d.panelAuthorIcon && <img src={d.panelAuthorIcon} alt="" className="size-5 rounded-full object-cover" />}
                    <span className="text-xs font-semibold text-white">{d.panelAuthor}</span>
                  </div>
                )}
                {d.panelTitle && <p className="font-semibold text-white">{d.panelTitle}</p>}
                {d.panelDescription && <p className="mt-1 whitespace-pre-wrap text-sm text-[#DBDEE1]">{d.panelDescription}</p>}
              </div>
              {d.panelThumbnail && (
                <img src={d.panelThumbnail} alt="" className="size-16 shrink-0 rounded object-cover" />
              )}
            </div>
            {d.panelImageUrl && (
              <img src={d.panelImageUrl} alt="" className="max-h-48 w-full object-cover" />
            )}
            {(d.panelFooter || d.panelFooterIcon) && (
              <div className="flex items-center gap-1.5 px-3 pb-3">
                {d.panelFooterIcon && <img src={d.panelFooterIcon} alt="" className="size-4 rounded-full object-cover" />}
                <span className="text-[11px] text-[#949BA4]">{d.panelFooter}</span>
              </div>
            )}
          </div>

          {/* button */}
          <div className="mt-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${BUTTON_STYLES[d.buttonStyle] ?? BUTTON_STYLES.primary}`}
            >
              {d.buttonEmoji && <span>{d.buttonEmoji}</span>}
              {d.buttonText || "Open a Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const cfg = useModuleConfig<TicketConfig>("tickets", defaults);
  const { loading } = useResources();
  const d = cfg.data;
  const [tab, setTab] = React.useState("builder");
  const [sending, setSending] = React.useState(false);
  const [confirmRedeploy, setConfirmRedeploy] = React.useState(false);

  const hasPanel = Boolean(d.panelMessageId);

  const sendPanel = async (redeploy = false) => {
    setConfirmRedeploy(false);
    setSending(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendPanel", redeploy }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Failed to send panel");
      toast({
        variant: json.ok ? "success" : "info",
        title: json.ok ? "Ticket panel sent" : "Saved",
        description: json.message ?? "",
      });
      cfg.reload();
    } catch (e) {
      toast({ variant: "error", title: "Couldn't send panel", description: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  const onSend = () => {
    if (hasPanel) setConfirmRedeploy(true);
    else sendPanel(false);
  };

  const tabs = [
    { key: "builder", label: "Panel Builder", icon: <Palette className="size-3.5" /> },
    { key: "config", label: "Configuration", icon: <Settings2 className="size-3.5" /> },
    { key: "transcripts", label: "Transcripts", icon: <ScrollText className="size-3.5" /> },
  ];

  if (cfg.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Tickets"
        description="Support ticket panels, claims, and transcripts."
        icon={<Ticket className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      {/* Overview stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Inbox className="size-4" />} label="Open" value="—" tint="text-arctic" />
        <StatCard icon={<CheckCircle2 className="size-4" />} label="Claimed" value="—" tint="text-ice" />
        <StatCard icon={<Ticket className="size-4" />} label="Closed" value="—" tint="text-muted-foreground" />
        <StatCard icon={<TimerReset className="size-4" />} label="Avg response" value="—" tint="text-success" />
        <StatCard icon={<TrendingUp className="size-4" />} label="Total" value="—" tint="text-arctic" />
        <StatCard icon={<Clock className="size-4" />} label="Today" value="—" tint="text-ice" />
      </div>

      <div className="mb-6">
        <PillTabs tabs={tabs} active={tab} onChange={setTab} layoutId="tickets-tabs" />
      </div>

      {tab === "builder" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="size-4 text-arctic" /> Panel content</CardTitle>
              <CardDescription>Design the embed members see before opening a ticket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label>Title</Label>
                <Input value={d.panelTitle} onChange={(e) => cfg.setField("panelTitle", e.target.value)} placeholder="Need Help?" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={d.panelDescription} onChange={(e) => cfg.setField("panelDescription", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Embed color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={d.panelColor} onChange={(e) => cfg.setField("panelColor", e.target.value)} className="size-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                    <Input value={d.panelColor} onChange={(e) => cfg.setField("panelColor", e.target.value)} className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label>Button style</Label>
                  <Select value={d.buttonStyle} onChange={(e) => cfg.setField("buttonStyle", e.target.value)}>
                    <option value="primary">Blurple</option>
                    <option value="secondary">Grey</option>
                    <option value="success">Green</option>
                    <option value="danger">Red</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Button text</Label>
                  <Input value={d.buttonText} onChange={(e) => cfg.setField("buttonText", e.target.value)} />
                </div>
                <div>
                  <Label>Button emoji</Label>
                  <Input value={d.buttonEmoji} onChange={(e) => cfg.setField("buttonEmoji", e.target.value)} placeholder="🎫" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input value={d.panelThumbnail} onChange={(e) => cfg.setField("panelThumbnail", e.target.value)} placeholder="https://…" />
                </div>
                <div>
                  <Label>Large image URL</Label>
                  <Input value={d.panelImageUrl} onChange={(e) => cfg.setField("panelImageUrl", e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Author</Label>
                  <Input value={d.panelAuthor} onChange={(e) => cfg.setField("panelAuthor", e.target.value)} />
                </div>
                <div>
                  <Label>Author icon URL</Label>
                  <Input value={d.panelAuthorIcon} onChange={(e) => cfg.setField("panelAuthorIcon", e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Footer</Label>
                  <Input value={d.panelFooter} onChange={(e) => cfg.setField("panelFooter", e.target.value)} />
                </div>
                <div>
                  <Label>Footer icon URL</Label>
                  <Input value={d.panelFooterIcon} onChange={(e) => cfg.setField("panelFooterIcon", e.target.value)} placeholder="https://…" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="size-4 text-arctic" /> Live preview</CardTitle>
                <CardDescription>Exactly how the panel will look in Discord.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <DiscordEmbedPreview d={d} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="size-4 text-arctic" /> Send panel</CardTitle>
                <CardDescription>Post the panel to a channel. Requires an enabled ticket system and a category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <Label>Destination channel</Label>
                  <ChannelSelect value={d.panelChannelId} onChange={(id) => cfg.setField("panelChannelId", id)} />
                </div>
                {hasPanel && (
                  <Badge variant="success" className="gap-1.5">
                    <CheckCircle2 className="size-3" /> Panel deployed
                  </Badge>
                )}
                <Button onClick={onSend} disabled={sending || loading} className="w-full">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {hasPanel ? "Redeploy panel" : "Send ticket panel"}
                </Button>
                {!cfg.enabled && (
                  <p className="text-xs text-warning">Enable the ticket system (toggle above) before sending.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Ticket routing</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Ticket category" description="New ticket channels are created here.">
                <ChannelSelect value={d.categoryChannelId} onChange={(id) => cfg.setField("categoryChannelId", id)} />
              </SettingsRow>
              <SettingsRow label="Support roles" description="Roles pinged and given access to new tickets.">
                <MultiRoleSelect value={d.supportRoles} onChange={(ids) => cfg.setField("supportRoles", ids as never)} />
              </SettingsRow>
              <SettingsRow label="Staff roles" description="Roles that can manage and close any ticket.">
                <MultiRoleSelect value={d.staffRoles} onChange={(ids) => cfg.setField("staffRoles", ids as never)} />
              </SettingsRow>
              <SettingsRow label="Naming format" description="Use {number} and {user}.">
                <Input value={d.namingFormat} onChange={(e) => cfg.setField("namingFormat", e.target.value)} placeholder="ticket-{number}" />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Behaviour</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Max open tickets per member" description="0 means unlimited.">
                <Input type="number" min={0} max={20} value={d.maxOpen} onChange={(e) => cfg.setField("maxOpen", Number(e.target.value))} />
              </SettingsRow>
              <SettingsRow label="Claim system" description="Let staff claim a ticket so it's clear who's handling it.">
                <Switch checked={d.claimSystem} onCheckedChange={(v) => cfg.setField("claimSystem", v)} />
              </SettingsRow>
              <SettingsRow label="Close confirmation" description="Ask for confirmation before closing a ticket.">
                <Switch checked={d.closeConfirmation} onCheckedChange={(v) => cfg.setField("closeConfirmation", v)} />
              </SettingsRow>
              <SettingsRow label="Auto-close inactive tickets">
                <Switch checked={d.autoClose} onCheckedChange={(v) => cfg.setField("autoClose", v)} />
              </SettingsRow>
              {d.autoClose && (
                <SettingsRow label="Auto-close after (hours)">
                  <Input type="number" min={1} max={720} value={d.autoCloseHours} onChange={(e) => cfg.setField("autoCloseHours", Number(e.target.value))} />
                </SettingsRow>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "transcripts" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScrollText className="size-4 text-arctic" /> Transcripts</CardTitle>
            <CardDescription>Save a full record of each ticket when it closes.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SettingsRow label="Generate transcripts" description="Includes full message history, timestamps, authors, and attachments where possible.">
              <Switch checked={d.transcripts} onCheckedChange={(v) => cfg.setField("transcripts", v)} />
            </SettingsRow>
            <SettingsRow label="Transcript log channel" description="Where closed-ticket transcripts are posted.">
              <ChannelSelect value={d.transcriptChannelId} onChange={(id) => cfg.setField("transcriptChannelId", id)} />
            </SettingsRow>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-muted-foreground">
              Each transcript records the ticket creator, claimer, creation and close times, and the complete message history.
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmRedeploy}
        onClose={() => setConfirmRedeploy(false)}
        onConfirm={() => sendPanel(true)}
        loading={sending}
        title="Redeploy ticket panel?"
        description="This posts a new ticket panel message to the selected channel. The previous panel message stays unless you remove it in Discord."
        confirmLabel="Redeploy panel"
      />
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="tickets">
      <Inner />
    </ModuleGate>
  );
}
