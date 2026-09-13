"use client";

import * as React from "react";
import { ShieldCheck, Ban, VolumeX, UserMinus, AlertTriangle, Lock, Timer, Gavel } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";
import { DEMO_MOD_ACTIONS } from "@/lib/demo";

type ActionType = "warn" | "mute" | "kick" | "ban" | "tempban";

const ACTIONS: { type: ActionType; label: string; icon: React.ReactNode; variant: "secondary" | "destructive"; danger: boolean; desc: string }[] = [
  { type: "warn", label: "Warn", icon: <AlertTriangle className="size-4" />, variant: "secondary", danger: false, desc: "Issue a warning to a member." },
  { type: "mute", label: "Mute", icon: <VolumeX className="size-4" />, variant: "secondary", danger: false, desc: "Timeout a member temporarily." },
  { type: "kick", label: "Kick", icon: <UserMinus className="size-4" />, variant: "destructive", danger: true, desc: "Remove a member from the server." },
  { type: "ban", label: "Ban", icon: <Ban className="size-4" />, variant: "destructive", danger: true, desc: "Permanently ban a member." },
  { type: "tempban", label: "Tempban", icon: <Timer className="size-4" />, variant: "destructive", danger: true, desc: "Ban a member for a set duration." },
];

function ModerationInner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [selected, setSelected] = React.useState<ActionType>("warn");
  const [targetId, setTargetId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [actions, setActions] = React.useState(DEMO_MOD_ACTIONS as any[]);

  React.useEffect(() => {
    fetch(`/api/dashboard/${guild.id}/moderation`)
      .then((r) => r.json())
      .then((d) => { if (d.actions?.length) setActions(d.actions); })
      .catch(() => {});
  }, [guild.id]);

  const current = ACTIONS.find((a) => a.type === selected)!;

  const execute = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selected, targetId, reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      toast({ variant: d.pending ? "info" : "success", title: `${current.label} ${d.pending ? "recorded" : "executed"}`, description: d.message });
      setActions((prev) => [{ id: Math.random().toString(), type: selected, targetTag: targetId, moderatorId: "You", reason, createdAt: new Date() }, ...prev]);
      setTargetId(""); setReason("");
    } catch (e) {
      toast({ variant: "error", title: "Action failed", description: (e as Error).message });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const submit = () => {
    if (!targetId) { toast({ variant: "warning", title: "Enter a user ID" }); return; }
    if (current.danger) setConfirmOpen(true);
    else execute();
  };

  return (
    <div>
      <PageHeader
        title="Moderation"
        description="Take moderation actions and review history. All actions are logged."
        icon={<ShieldCheck className="size-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Take action</CardTitle>
            <CardDescription>Select an action and target. Dangerous actions require confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <Button
                  key={a.type}
                  variant={selected === a.type ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelected(a.type)}
                >
                  {a.icon} {a.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{current.desc}</p>
            <div>
              <Label>Target user ID</Label>
              <Input className="mt-2" placeholder="e.g. 123456789012345678" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea className="mt-2" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <Button variant={current.danger ? "destructive" : "default"} onClick={submit} disabled={loading} className="w-full">
              {current.icon} {current.label} member
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Gavel className="size-4 text-arctic" /> Recent actions</CardTitle>
            <Badge variant="secondary">{actions.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            {actions.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03]">
                <div className="grid size-9 place-items-center rounded-lg bg-white/[0.05]">
                  <Gavel className="size-4 text-frost" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-snow"><span className="capitalize">{a.type}</span> · {a.targetTag}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.reason || "No reason"} — {a.moderatorId}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { icon: <Lock className="size-5" />, label: "Channel locking", desc: "Lock and unlock channels instantly." },
          { icon: <VolumeX className="size-5" />, label: "Slowmode", desc: "Throttle chat during busy periods." },
          { icon: <Timer className="size-5" />, label: "Purge tools", desc: "Bulk delete by user, links, images, and more." },
        ].map((q) => (
          <Card key={q.label} hover className="p-5">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 border border-white/10 text-arctic">{q.icon}</div>
            <p className="font-medium text-snow">{q.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{q.desc}</p>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={execute}
        loading={loading}
        destructive
        title={`${current.label} this member?`}
        description={`You are about to ${current.label.toLowerCase()} user ${targetId}. This action will be logged.`}
        confirmLabel={current.label}
        consequences={[
          selected === "ban" ? "The member will be permanently removed and unable to rejoin." : "",
          selected === "kick" ? "The member will be removed but can rejoin with an invite." : "",
          "This action is recorded in the moderation audit log.",
        ].filter(Boolean)}
      />
    </div>
  );
}

export default function ModerationPage() {
  return <ModuleGate moduleKey="moderation"><ModerationInner /></ModuleGate>;
}
