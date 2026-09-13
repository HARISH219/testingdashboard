"use client";

import * as React from "react";
import { Ticket, Plus, MessageSquare, CheckCircle2, UserCheck } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ChannelSelect, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketConfig extends Record<string, unknown> {
  categoryChannelId: string;
  supportRoles: string[];
  panelTitle: string;
  panelDescription: string;
  transcripts: boolean;
}

const defaults: TicketConfig = {
  categoryChannelId: "", supportRoles: [],
  panelTitle: "Need help?", panelDescription: "Click the button below to open a support ticket.",
  transcripts: true,
};

function Inner() {
  const cfg = useModuleConfig<TicketConfig>("tickets", defaults);
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

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
            <SettingsRow label="Ticket category" description="Where new ticket channels are created.">
              <ChannelSelect value={cfg.data.categoryChannelId} onChange={(id) => cfg.setField("categoryChannelId", id)} />
            </SettingsRow>
            <SettingsRow label="Generate transcripts" description="Save a transcript when a ticket closes.">
              <Switch checked={cfg.data.transcripts} onCheckedChange={(v) => cfg.setField("transcripts", v)} />
            </SettingsRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Support roles</CardTitle><CardDescription>Roles that can view and claim tickets.</CardDescription></CardHeader>
          <CardContent>
            <MultiRoleSelect value={cfg.data.supportRoles} onChange={(ids) => cfg.setField("supportRoles", ids)} />
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-sm font-medium text-snow">{cfg.data.panelTitle}</p>
              <p className="text-sm text-muted-foreground">{cfg.data.panelDescription}</p>
              <div className="mt-3"><Badge>🎫 Open a ticket</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="tickets"><Inner /></ModuleGate>;
}
