"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Copy, Power, MoreVertical, Trash2, Plus, X, Check,
  AlertTriangle, Search, ShieldCheck,
} from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import { ResourcesProvider, useResources } from "@/components/dashboard/resource-select";
import { NoAccess } from "@/components/dashboard/locked-feature";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  PermitTabs, PermitMenu, StatusPill, PermitGlyph, type MenuAction,
} from "@/components/dashboard/permits/permit-ui";
import { PermissionPicker } from "@/components/dashboard/permits/permission-picker";
import { usePermits, safeJson } from "@/components/dashboard/permits/use-permits";
import {
  PERMIT_ICONS, allConflicts, catalogByCategory, type Permit, type PermState,
} from "@/lib/permits";
import { intToHexColor } from "@/lib/utils";

type Draft = {
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  color: string;
  discordRoleIds: string[];
  permissions: string[];
};

function draftFrom(p: Permit): Draft {
  return {
    name: p.name,
    description: p.description ?? "",
    icon: p.icon,
    enabled: p.enabled,
    color: p.color,
    discordRoleIds: [...p.discordRoleIds],
    permissions: [...p.permissions],
  };
}

function DetailInner() {
  const guild = useGuild();
  const router = useRouter();
  const params = useParams<{ permitId: string }>();
  const { toast } = useToast();
  const { permits, reload, loading } = usePermits();

  const base = `/dashboard/${guild.id}/permits`;
  const permit = permits?.find((p) => p.id === params.permitId) ?? null;

  const [tab, setTab] = React.useState("general");
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [leaveTo, setLeaveTo] = React.useState<string | null>(null);

  // Initialise the draft once the permit loads.
  React.useEffect(() => {
    if (permit && !draft) setDraft(draftFrom(permit));
  }, [permit, draft]);

  const dirty = React.useMemo(() => {
    if (!permit || !draft) return false;
    return JSON.stringify(draft) !== JSON.stringify(draftFrom(permit));
  }, [permit, draft]);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = async () => {
    if (!draft || !permit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: permit.id, ...draft, description: draft.description || null }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error ?? "Save failed");
      toast({ variant: "success", title: "Permit saved successfully" });
      reload();
    } catch (e) {
      toast({ variant: "error", title: "Failed to save permit", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!permit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles?id=${permit.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await safeJson(r)).error ?? "Delete failed");
      toast({ variant: "success", title: "Permit deleted" });
      router.push(base);
    } catch (e) {
      toast({ variant: "error", title: "Failed to delete", description: (e as Error).message });
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!permit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${permit.name} (copy)`, description: permit.description, icon: permit.icon,
          enabled: permit.enabled, color: permit.color,
          discordRoleIds: permit.discordRoleIds, permissions: permit.permissions,
        }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error ?? "Duplicate failed");
      toast({ variant: "success", title: "Permit duplicated" });
      router.push(`${base}/${d.permit.id}`);
    } catch (e) {
      toast({ variant: "error", title: "Failed to duplicate", description: (e as Error).message });
      setSaving(false);
    }
  };

  const guardedBack = () => {
    if (dirty) setLeaveTo(base);
    else router.push(base);
  };

  if (loading || !draft) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!permit) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white/[0.05]">
          <ShieldCheck className="size-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-snow">Permit not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted.</p>
        <Button asChild className="mt-5"><Link href={base}>Back to Permits</Link></Button>
      </Card>
    );
  }

  const menuActions: MenuAction[] = [
    { key: "duplicate", label: "Duplicate", icon: <Copy className="size-4" />, onSelect: duplicate },
    { key: "disable", label: draft.enabled ? "Disable" : "Enable", icon: <Power className="size-4" />, onSelect: () => patch({ enabled: !draft.enabled }) },
    { key: "delete", label: "Delete", icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => setConfirmDelete(true) },
  ];

  return (
    <div>
      {/* Back */}
      <button onClick={guardedBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-snow">
        <ArrowLeft className="size-4" /> Back to Permits
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 text-arctic" style={{ backgroundColor: `${draft.color}1a` }}>
            <PermitGlyph name={draft.icon} className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-snow">{draft.name}</h1>
              <StatusPill active={draft.enabled} />
            </div>
            {draft.description && <p className="text-sm text-muted-foreground">{draft.description}</p>}
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTab("general")}><Pencil className="size-4" /> Edit</Button>
          <Button variant="secondary" size="sm" onClick={duplicate}><Copy className="size-4" /> Duplicate</Button>
          <Button variant="secondary" size="sm" onClick={() => patch({ enabled: !draft.enabled })}><Power className="size-4" /> {draft.enabled ? "Disable" : "Enable"}</Button>
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="More actions" className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-snow">
            <MoreVertical className="size-4" />
          </button>
          <PermitMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={menuActions} anchorClassName="right-0 top-11" />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <PermitTabs
          active={tab}
          onChange={setTab}
          layoutId="permit-detail-tab"
          tabs={[
            { key: "general", label: "General" },
            { key: "roles", label: "Roles" },
            { key: "permissions", label: "Permissions" },
            { key: "actions", label: "Actions" },
          ]}
        />
      </div>

      {tab === "general" && <GeneralTab draft={draft} patch={patch} />}
      {tab === "roles" && <RolesTab draft={draft} patch={patch} />}
      {tab === "permissions" && <PermissionsTab draft={draft} patch={patch} permits={permits ?? []} currentId={permit.id} />}
      {tab === "actions" && (
        <EffectiveTab permits={permits ?? []} />
      )}

      {/* Sticky save bar when dirty */}
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-strong sticky bottom-4 z-40 mt-6 flex items-center justify-between gap-3 rounded-2xl p-3 sm:p-4"
        >
          <p className="flex items-center gap-2 text-sm text-frost">
            <AlertTriangle className="size-4 text-warning" /> You have unsaved changes.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(draftFrom(permit))} disabled={saving}>Discard</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </motion.div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        loading={saving}
        destructive
        title={`Delete ${permit.name}?`}
        description="This permanently removes the permit and its permission grants."
        confirmLabel="Delete permit"
        consequences={["Assigned roles will lose this access.", "This cannot be undone."]}
      />
      <ConfirmDialog
        open={!!leaveTo}
        onClose={() => setLeaveTo(null)}
        onConfirm={() => { const to = leaveTo!; setLeaveTo(null); router.push(to); }}
        title="Discard unsaved changes?"
        description="You have edits that haven't been saved."
        confirmLabel="Discard & leave"
        destructive
      />
    </div>
  );
}

/* --------------------------------- Tabs ---------------------------------- */

function GeneralTab({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>General</CardTitle><CardDescription>Basic details for this permit.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Permit name</Label>
          <Input className="mt-2" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-2" value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
        </div>
        <div>
          <Label>Icon</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PERMIT_ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => patch({ icon: ic })} aria-label={ic}
                className={`grid size-10 place-items-center rounded-xl border transition-colors ${draft.icon === ic ? "border-arctic/40 bg-primary/15 text-arctic" : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-frost"}`}>
                <PermitGlyph name={ic} className="size-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-snow">Status</p>
            <p className="text-xs text-muted-foreground">Active permits apply their permissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill active={draft.enabled} />
            <Switch checked={draft.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RolesTab({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const { roles, loading } = useResources();
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const set = new Set(draft.discordRoleIds);
  const assigned = roles.filter((r) => set.has(r.id));
  const available = roles.filter((r) => !set.has(r.id) && r.name.toLowerCase().includes(query.toLowerCase()));

  const remove = (id: string) => patch({ discordRoleIds: draft.discordRoleIds.filter((r) => r !== id) });
  const add = (id: string) => patch({ discordRoleIds: [...draft.discordRoleIds, id] });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div><CardTitle>Roles</CardTitle><CardDescription>Discord roles that receive this permit.</CardDescription></div>
        <Button variant="secondary" size="sm" onClick={() => setAdding((a) => !a)}><Plus className="size-4" /> Add Role</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : assigned.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">No roles assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assigned.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="size-3 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
                <span className="flex-1 truncate text-sm text-snow">{r.name}</span>
                <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${r.name}`}><X className="size-4" /></button>
              </div>
            ))}
          </div>
        )}

        {adding && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search roles…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {available.length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">No roles to add.</p>
              ) : (
                available.map((r) => (
                  <button key={r.id} onClick={() => add(r.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-frost transition-colors hover:bg-white/[0.04]">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
                    <span className="flex-1 truncate text-left">{r.name}</span>
                    <Plus className="size-4 text-arctic" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionsTab({
  draft, patch, permits, currentId,
}: {
  draft: Draft; patch: (p: Partial<Draft>) => void; permits: Permit[]; currentId: string;
}) {
  // Compute conflicts using this permit's *draft* permissions merged with the
  // other saved permits, so the conflict view reflects unsaved edits.
  const merged: Permit[] = permits.map((p) =>
    p.id === currentId ? { ...p, permissions: draft.permissions, enabled: draft.enabled } : p
  );
  const conflicts = allConflicts(merged);

  return (
    <div className="space-y-6">
      {conflicts.length > 0 && (
        <Card className="border-warning/20 bg-warning/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> Permission conflicts</CardTitle>
            <CardDescription>These permissions are affected by more than one permit. The highest-priority permit wins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.slice(0, 6).map((c) => (
              <div key={c.permissionId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-sm font-medium text-snow">{c.permissionName}</p>
                <div className="mt-2 space-y-1">
                  {c.contributions.map((ct) => (
                    <div key={ct.permitId} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-frost"><PermitGlyph name={ct.icon} className="size-3.5" /> {ct.permitName}</span>
                      <StateTag state={ct.state} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs">
                  <span className="text-muted-foreground">{c.reason}</span>
                  <span className="font-semibold">Effective: <StateTag state={c.effective} /></span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Permissions</CardTitle><CardDescription>Toggle exactly what this permit grants.</CardDescription></CardHeader>
        <CardContent>
          <PermissionPicker selected={draft.permissions} onChange={(ids) => patch({ permissions: ids })} />
        </CardContent>
      </Card>
    </div>
  );
}

function EffectiveTab({ permits }: { permits: Permit[] }) {
  const [query, setQuery] = React.useState("");
  const groups = catalogByCategory(
    (p) => query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase())
  );
  const priorityOrdered = [...permits].sort((a, b) => b.priority - a.priority);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effective permissions</CardTitle>
        <CardDescription>How the final permission is calculated across every permit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search permissions…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {groups.map((g) => (
          <div key={g.category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.category}</p>
            <div className="space-y-2">
              {g.permissions.map((perm) => {
                const contributors = priorityOrdered.filter((p) => p.enabled && p.permissions.includes(perm.id));
                const effective: PermState = contributors.length > 0 ? "allow" : "unset";
                return (
                  <div key={perm.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-snow">{perm.name}</span>
                      <StateTag state={effective} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {contributors.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Not granted by any permit.</span>
                      ) : (
                        contributors.map((p) => (
                          <Badge key={p.id} variant="secondary" className="gap-1 text-[11px]">
                            <PermitGlyph name={p.icon} className="size-3" /> {p.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StateTag({ state }: { state: PermState }) {
  if (state === "allow") return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="size-3" /> Allowed</span>;
  if (state === "deny") return <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><X className="size-3" /> Denied</span>;
  return <span className="text-xs font-medium text-muted-foreground">Not set</span>;
}

export default function Page() {
  const guild = useGuild();
  if (!guild.permissions.includes("*")) return <NoAccess module="Permits" />;
  return (
    <ResourcesProvider>
      <DetailInner />
    </ResourcesProvider>
  );
}
