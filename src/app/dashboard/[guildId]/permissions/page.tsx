"use client";

import * as React from "react";
import { KeyRound, Plus, Trash2, ShieldAlert, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild, useCan } from "@/components/dashboard/guild-context";
import { ResourcesProvider, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { NoAccess } from "@/components/dashboard/locked-feature";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { MODULES } from "@/lib/modules";
import { ROLE_PRESETS } from "@/lib/permissions";

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<{ name: string; color: string; permissions: string[]; discordRoleIds: string[] }>({
    name: "", color: "#9EDCFF", permissions: [], discordRoleIds: [],
  });

  const load = React.useCallback(() => {
    fetch(`/api/dashboard/${guild.id}/roles`)
      .then((r) => r.json())
      .then((d) => { setRoles(d.roles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guild.id]);
  React.useEffect(() => { load(); }, [load]);

  const togglePerm = (perm: string) =>
    setForm((f) => ({ ...f, permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm] }));

  const applyPreset = (preset: typeof ROLE_PRESETS[number]) =>
    setForm((f) => ({ ...f, name: f.name || preset.name, permissions: preset.permissions }));

  const create = async () => {
    if (!form.name) { toast({ variant: "warning", title: "Enter a role name" }); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ variant: "success", title: "Dashboard role created", description: `${form.name} can now access assigned modules.` });
      setOpen(false); setForm({ name: "", color: "#9EDCFF", permissions: [], discordRoleIds: [] });
      load();
    } catch (e) {
      toast({ variant: "error", title: "Failed", description: (e as Error).message });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/dashboard/${guild.id}/roles?id=${id}`, { method: "DELETE" });
    toast({ variant: "success", title: "Role deleted" });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Permissions" icon={<KeyRound className="size-5" />}
        description="Distributed roles — grant Discord roles access to specific dashboard modules."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> New role</Button>}
      />

      <Card className="mb-6 border-arctic/20 bg-arctic/[0.03]">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-arctic" />
          <div>
            <p className="text-sm font-medium text-snow">Owner-only management</p>
            <p className="text-sm text-muted-foreground">Only server owners can manage permissions. Granted access is always re-checked server-side against Discord permissions — the frontend can never escalate privileges.</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : roles.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white/[0.05]"><KeyRound className="size-5 text-muted-foreground" /></div>
          <h3 className="font-semibold text-snow">No dashboard roles yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create a role to delegate access to your team.</p>
          <Button className="mt-5" onClick={() => setOpen(true)}><Plus className="size-4" /> Create your first role</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ backgroundColor: role.color }} />
                  <h3 className="font-semibold text-snow">{role.name}</h3>
                </div>
                <button onClick={() => remove(role.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete role"><Trash2 className="size-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 6).map((p: string) => (
                  <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                ))}
                {role.permissions.length > 6 && <Badge variant="secondary" className="text-[10px]">+{role.permissions.length - 6}</Badge>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{role.discordRoleIds?.length ?? 0} Discord role(s) assigned</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New dashboard role" description="Assign Discord roles and choose which modules they can access." className="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div><Label>Role name</Label><Input className="mt-2" placeholder="e.g. Loverswilla" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Color</Label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-2 h-10 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent" /></div>
          </div>

          <div>
            <Label>Quick presets</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_PRESETS.map((p) => (
                <Button key={p.key} variant="secondary" size="sm" onClick={() => applyPreset(p)}>{p.name}</Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Assigned Discord roles</Label>
            <p className="mb-2 text-xs text-muted-foreground">Members with these Discord roles gain this access.</p>
            <MultiRoleSelect value={form.discordRoleIds} onChange={(ids) => setForm({ ...form, discordRoleIds: ids })} />
          </div>

          <div>
            <Label>Module permissions</Label>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
              {MODULES.filter((m) => m.key !== "billing").map((m) => {
                const manage = `${m.key}:manage`;
                const active = form.permissions.includes(manage);
                return (
                  <button
                    key={m.key}
                    onClick={() => togglePerm(manage)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${active ? "bg-primary/15 text-snow" : "text-frost hover:bg-white/[0.04]"}`}
                  >
                    <span>{m.name}</span>
                    {active && <Check className="size-4 text-arctic" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? "Creating…" : "Create role"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function Page() {
  const guild = useGuild();
  const can = useCan();
  // Only owners (wildcard) manage permissions.
  if (!guild.permissions.includes("*")) {
    return <NoAccess module="Permissions" />;
  }
  return <ResourcesProvider><Inner /></ResourcesProvider>;
}
