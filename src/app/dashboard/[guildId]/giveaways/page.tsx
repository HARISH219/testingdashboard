"use client";

import * as React from "react";
import { Gift, Plus, Trophy, Clock, RotateCcw, Users } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { ChannelSelect, RoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ prize: "", winners: 1, durationHours: 24, requiredRoleId: "", winnerRoleId: "", channelId: "" });

  const load = React.useCallback(() => {
    fetch(`/api/dashboard/${guild.id}/giveaways`).then((r) => r.json()).then((d) => setItems(d.giveaways ?? [])).catch(() => {});
  }, [guild.id]);
  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.prize) { toast({ variant: "warning", title: "Enter a prize" }); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/giveaways`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, winners: Number(form.winners), durationHours: Number(form.durationHours) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ variant: "success", title: "Giveaway created", description: `"${form.prize}" is live.` });
      setOpen(false); setForm({ prize: "", winners: 1, durationHours: 24, requiredRoleId: "", winnerRoleId: "", channelId: "" });
      load();
    } catch (e) {
      toast({ variant: "error", title: "Failed to create", description: (e as Error).message });
    } finally { setLoading(false); }
  };

  const active = items.filter((g) => !g.ended);
  const ended = items.filter((g) => g.ended);

  return (
    <div>
      <PageHeader
        title="Giveaways" icon={<Gift className="size-5" />}
        description="Create and manage giveaways with prizes, winners, and role requirements."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> New giveaway</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-4 text-arctic" /> Active <Badge variant="secondary">{active.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No active giveaways. Create one to get started.</p>}
            {active.map((g) => (
              <div key={g.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-snow">{g.prize}</p>
                    <p className="text-xs text-muted-foreground">Ends {formatDate(g.endsAt)}</p>
                  </div>
                  <Badge><Users className="size-3" /> {g.winners} winner{g.winners > 1 ? "s" : ""}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => toast({ variant: "info", title: "End requested", description: "Bot will finalize winners (pending integration)." })}><Trophy className="size-3.5" /> End now</Button>
                  <Button variant="ghost" size="sm" onClick={() => toast({ variant: "info", title: "Reroll requested" })}><RotateCcw className="size-3.5" /> Reroll</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-arctic" /> Ended</CardTitle><CardDescription>Past giveaways and winners.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {ended.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No completed giveaways yet.</p>}
            {ended.map((g) => (
              <div key={g.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="font-medium text-snow">{g.prize}</p>
                <p className="text-xs text-muted-foreground">Won by {g.wonBy?.length ? g.wonBy.join(", ") : "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Create giveaway" description="Set up prize, winners, duration, and requirements.">
        <div className="space-y-4">
          <div><Label>Prize</Label><Input className="mt-2" placeholder="Discord Nitro" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Winners</Label><Input type="number" min={1} className="mt-2" value={form.winners} onChange={(e) => setForm({ ...form, winners: Number(e.target.value) })} /></div>
            <div><Label>Duration (hours)</Label><Input type="number" min={1} className="mt-2" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Channel</Label><div className="mt-2"><ChannelSelect value={form.channelId} onChange={(id) => setForm({ ...form, channelId: id })} /></div></div>
          <div><Label>Required role (optional)</Label><div className="mt-2"><RoleSelect value={form.requiredRoleId} onChange={(id) => setForm({ ...form, requiredRoleId: id })} /></div></div>
          <div><Label>Winner role (optional)</Label><div className="mt-2"><RoleSelect value={form.winnerRoleId} onChange={(id) => setForm({ ...form, winnerRoleId: id })} /></div></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={loading}>{loading ? "Creating…" : "Create giveaway"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="giveaways"><Inner /></ModuleGate>;
}
