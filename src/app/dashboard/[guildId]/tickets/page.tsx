"use client";

import * as React from "react";
import { Ticket, Send, MessageSquare, CheckCircle2, UserCheck } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useGuild } from "@/components/dashboard/guild-context";
import { ChannelSelect, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface TicketConfig extends Record<string, unknown> {
  categoryChannelId: string;
  supportRoles: string[];
  panelTitle: string;
  panelDescription: string;
  panelChannelId: string;
  panelMessageId: string;
  panelImageUrl: string;
  transcripts: boolean;
  transcriptChannelId: string;
  allowMultiple: boolean;
}

const defaults: TicketConfig = {
  categoryChannelId: "", supportRoles: [],
  panelTitle: "Need help?", panelDescription: "Click the button below to open a support ticket.",
  panelChannelId: "", panelMessageId: "", panelImageUrl: "",
  transcripts: true, transcriptChannelId: "", allowMultiple: false,
};

function Inner() {
  const guild = useGuild();
  const cfg = useModuleConfig<TicketConfig>("tickets", defaults);
  const { toast } = useToast();
  const [sending, setSending] = React.useState(false);
  const [confirmRedeploy, setConfirmRedeploy] = React.useState(false);

  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const hasPanel = Boolean(cfg.data.panelMessageId);

  const sendPanel = async (redeploy = false) => {
    // Client-side guards mirror the server validation for a clear message.
    if (!cfg.enabled) { toast({ variant: "warning", title: "Enable Tickets first" }); return; }
    if (!cfg.data.categoryChannelId) { toast({ variant: "warning", title: "Select a ticket category first" }); return; }
    if (!cfg.data.panelTitle.trim() || !cfg.data.panelDescription.trim()) { toast({ variant: "warning", title: "Set a panel title and description" }); return; }
    if (!cfg.data.panelChannelId) { toast({ variant: "warning", title: "Select a panel channel first" }); return; }
    if (cfg.dirty) { toast({ variant: "warning", title: "Save your changes first", description: "Save before sending the panel so the bot uses the latest config." }); return; }

    setSending(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendPanel", channelId: cfg.data.panelChannelId, redeploy }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to send panel");
      if (d.pending) {
        toast({ variant: "info", title: "Panel pending", description: d.message });
      } else {
        toast({ variant: "success", title: redeploy ? "Panel redeployed" : "Ticket panel sent" });
      }
      cfg.reload?.();
    } catch (e) {
      toast({ variant: "error", title: "Couldn't send panel", description: (e as Error).message });
    } finally {
      setSending(false);
      setConfirmRedeploy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tickets" icon={<Ticket className="size-5" />}
        description="Support ticket panels, claims, and transcripts."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open" value="7" icon={<MessageSquare />} />
        <StatCard label="Claimed" value="3" icon={<UserCheck />} tint="text-warning" delay={0.05} />
        <StatCard label="Closed" value="142" icon={<CheckCircle2 />} tint="text-success" delay={0.1} />
        <StatCard label="Avg response" value="8m" icon={<Ticket />} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Panel builder</CardTitle><CardDescription>Customize the ticket panel members see.</CardDescription></CardHeader>
          <CardContent>
            <div className="py-2"><Label>Panel title</Label><Input className="mt-2" value={cfg.data.panelTitle} onChange={(e) => cfg.setField("panelTitle", e.target.value)} /></div>
            <div className="py-2"><Label>Panel description</Label><Textarea className="mt-2" value={cfg.data.panelDescription} onChange={(e) => cfg.setField("panelDescription", e.target.value)} /></div>
            <div className="py-2"><Label>Panel image URL (optional)</Label><Input className="mt-2" placeholder="https://…/banner.png" value={cfg.data.panelImageUrl} onChange={(e) => cfg.setField("panelImageUrl", e.target.value)} /></div>
            <SettingsRow label="Ticket category" description="Where new ticket channels are created.">
              <ChannelSelect value={cfg.data.categoryChannelId} onChange={(id) => cfg.setField("categoryChannelId", id)} />
            </SettingsRow>
            <SettingsRow label="Panel channel" description="Where the ticket panel message is posted.">
              <ChannelSelect value={cfg.data.panelChannelId} onChange={(id) => cfg.setField("panelChannelId", id)} />
            </SettingsRow>
            <SettingsRow label="Allow multiple tickets" description="Let a member open more than one ticket at a time.">
              <Switch checked={cfg.data.allowMultiple} onCheckedChange={(v) => cfg.setField("allowMultiple", v)} />
            </SettingsRow>

            {/* Send / redeploy panel — sits below config, above the save area. */}
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => hasPanel ? setConfirmRedeploy(true) : sendPanel(false)} disabled={sending} className="glow-btn">
                  <Send className="size-4" /> {hasPanel ? "Redeploy panel" : "Send Ticket Panel"}
                </Button>
                {hasPanel && (
                  <Badge variant="success">Panel deployed</Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {hasPanel
                  ? "A panel is already deployed. Redeploy to post an updated one."
                  : "Posts the panel with an “Open a ticket” button to the selected channel."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support & transcripts</CardTitle><CardDescription>Roles that manage tickets, and where transcripts go.</CardDescription></CardHeader>
          <CardContent>
            <div className="py-2">
              <Label>Support roles</Label>
              <p className="mb-2 mt-0.5 text-xs text-muted-foreground">Roles that can view and claim tickets.</p>
              <MultiRoleSelect value={cfg.data.supportRoles} onChange={(ids) => cfg.setField("supportRoles", ids)} />
            </div>
            <SettingsRow label="Generate transcripts" description="Save a transcript when a ticket closes.">
              <Switch checked={cfg.data.transcripts} onCheckedChange={(v) => cfg.setField("transcripts", v)} />
            </SettingsRow>
            <SettingsRow label="Transcript logs" description="Channel where closed-ticket transcripts are sent.">
              <ChannelSelect value={cfg.data.transcriptChannelId} onChange={(id) => cfg.setField("transcriptChannelId", id)} />
            </SettingsRow>

            {/* Live preview of the panel */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
              {cfg.data.panelImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.data.panelImageUrl} alt="" className="h-20 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="mb-1 text-sm font-medium text-snow">{cfg.data.panelTitle}</p>
                <p className="text-sm text-muted-foreground">{cfg.data.panelDescription}</p>
                <div className="mt-3"><Badge>🎫 Open a ticket</Badge></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />

      <ConfirmDialog
        open={confirmRedeploy}
        onClose={() => setConfirmRedeploy(false)}
        onConfirm={() => sendPanel(true)}
        loading={sending}
        title="Redeploy ticket panel?"
        description="This posts a new ticket panel message to the selected channel. The previous panel message will remain unless you remove it in Discord."
        confirmLabel="Redeploy panel"
      />
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="tickets"><Inner /></ModuleGate>;
}
