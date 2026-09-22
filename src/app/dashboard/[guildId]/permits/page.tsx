"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, Search, Plus, Pencil, Copy, Power, Trash2, BookOpen,
  Sparkles, Clock,
} from "lucide-react";
import { useGuild, useCan } from "@/components/dashboard/guild-context";
import { ResourcesProvider } from "@/components/dashboard/resource-select";
import { NoAccess } from "@/components/dashboard/locked-feature";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  PermitTabs, PermitCard, PermitMenu, StatusPill, EffectiveDonut,
  PermitGlyph, ArrowLink, type MenuAction,
} from "@/components/dashboard/permits/permit-ui";
import { CreatePermitWizard } from "@/components/dashboard/permits/create-permit-wizard";
import { usePermits, describeActivity, safeJson } from "@/components/dashboard/permits/use-permits";
import { computeEffective, catalogByCategory, PERMISSION_PRESETS, type Permit } from "@/lib/permits";
import { timeAgo } from "@/lib/utils";

type Filter = "all" | "active" | "inactive";

function PermitsInner() {
  const guild = useGuild();
  const router = useRouter();
  const { toast } = useToast();
  const { permits, activity, error, reload, loading } = usePermits(true);

  const [enabled, setEnabled] = React.useState(true); // section master toggle
  const [tab, setTab] = React.useState("permits");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardPreset, setWizardPreset] = React.useState<string | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Permit | null>(null);
  const [confirmPreset, setConfirmPreset] = React.useState<(typeof PERMISSION_PRESETS)[number] | null>(null);
  const [busy, setBusy] = React.useState(false);

  const base = `/dashboard/${guild.id}/permits`;

  const filtered = (permits ?? []).filter((p) => {
    const matchQuery =
      query.trim() === "" ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "all" || (filter === "active" ? p.enabled : !p.enabled);
    return matchQuery && matchFilter;
  });

  const effective = React.useMemo(() => computeEffective(permits ?? []), [permits]);

  /* -------------------------------- actions ------------------------------- */

  const patchPermit = async (id: string, changes: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error ?? "Update failed");
      toast({ variant: "success", title: "Permit saved successfully" });
      reload();
    } catch (e) {
      toast({ variant: "error", title: "Failed to save permit", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (p: Permit) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${p.name} (copy)`,
          description: p.description,
          icon: p.icon,
          enabled: p.enabled,
          color: p.color,
          discordRoleIds: p.discordRoleIds,
          permissions: p.permissions,
        }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error ?? "Duplicate failed");
      toast({ variant: "success", title: "Permit duplicated" });
      reload();
    } catch (e) {
      toast({ variant: "error", title: "Failed to duplicate", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles?id=${confirmDelete.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await safeJson(r)).error ?? "Delete failed");
      toast({ variant: "success", title: "Permit deleted" });
      setConfirmDelete(null);
      reload();
    } catch (e) {
      toast({ variant: "error", title: "Failed to delete", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const applyPreset = () => {
    if (!confirmPreset) return;
    setWizardPreset(confirmPreset.key);
    setConfirmPreset(null);
    setWizardOpen(true);
  };

  const menuActions = (p: Permit): MenuAction[] => [
    { key: "edit", label: "Edit", icon: <Pencil className="size-4" />, onSelect: () => router.push(`${base}/${p.id}`) },
    { key: "duplicate", label: "Duplicate", icon: <Copy className="size-4" />, onSelect: () => duplicate(p) },
    { key: "disable", label: p.enabled ? "Disable" : "Enable", icon: <Power className="size-4" />, onSelect: () => patchPermit(p.id, { enabled: !p.enabled }) },
    { key: "delete", label: "Delete", icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => setConfirmDelete(p) },
  ];

  /* --------------------------------- view --------------------------------- */

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-primary/10 text-arctic">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-snow">Permits</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage role-based permissions and access for your server.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <StatusPill active={enabled} />
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <PermitTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "overview", label: "Overview" },
            { key: "permits", label: "Permits" },
            { key: "groups", label: "Permission Groups" },
            { key: "audit", label: "Audit Log", href: `${base}/audit` },
          ]}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 xl:col-span-2">
          {tab === "groups" ? (
            <PermissionGroups />
          ) : (
            <>
              <Card>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>All Permits</CardTitle>
                      <CardDescription>Create and manage permission sets for your server.</CardDescription>
                    </div>
                    <Button onClick={() => { setWizardPreset(null); setWizardOpen(true); }} className="shrink-0">
                      <Plus className="size-4" /> Create Permit
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Search permits…" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="sm:w-40">
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px] w-full rounded-2xl" />)
                  ) : error ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.05] p-6 text-center">
                      <p className="text-sm font-medium text-snow">Couldn&apos;t load permits</p>
                      <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                      <Button variant="secondary" size="sm" className="mt-3" onClick={reload}>Try again</Button>
                    </div>
                  ) : filtered.length === 0 && (permits?.length ?? 0) === 0 ? (
                    <EmptyState onCreate={() => { setWizardPreset(null); setWizardOpen(true); }} />
                  ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                      <p className="text-sm font-medium text-snow">No permits found</p>
                      <p className="mt-1 text-xs text-muted-foreground">Try a different search.</p>
                    </div>
                  ) : (
                    filtered.map((p) => (
                      <div key={p.id} className="relative">
                        <PermitCard
                          permit={p}
                          href={`${base}/${p.id}`}
                          onMenu={(e) => { e.preventDefault(); setMenuFor(menuFor === p.id ? null : p.id); }}
                        />
                        <PermitMenu
                          open={menuFor === p.id}
                          onClose={() => setMenuFor(null)}
                          actions={menuActions(p)}
                          anchorClassName="right-3 top-12"
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Permission presets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-arctic" /> Permission Presets</CardTitle>
                  <CardDescription>Quickly apply common permission sets.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PERMISSION_PRESETS.map((preset) => (
                    <div key={preset.key} className="glass glass-hover flex items-start gap-3 rounded-2xl p-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-primary/10 text-arctic">
                        <PermitGlyph name={preset.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-snow">{preset.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{preset.description}</p>
                        <button
                          onClick={() => setConfirmPreset(preset)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-arctic hover:text-ice"
                        >
                          Apply →
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Effective permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Effective Permissions</CardTitle>
              <CardDescription>Your role&apos;s combined permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="mx-auto h-40 w-40 rounded-full" />
              ) : (
                <EffectiveDonut allowed={effective.allowed} denied={effective.denied} notSet={effective.notSet} />
              )}
              <div className="mt-4 text-center">
                <ArrowLink href={`${base}/audit`}>View details</ArrowLink>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="size-4 text-arctic" /> Recent Activity</CardTitle>
              <CardDescription>Your latest changes to permits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
              ) : activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.slice(0, 5).map((a) => {
                  const { title, sub } = describeActivity(a);
                  return (
                    <div key={a.id} className="rounded-xl px-2 py-2.5 hover:bg-white/[0.03]">
                      <p className="text-sm text-snow">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub} · {timeAgo(a.createdAt)}</p>
                    </div>
                  );
                })
              )}
              {activity.length > 0 && (
                <div className="pt-2"><ArrowLink href={`${base}/audit`}>View all activity</ArrowLink></div>
              )}
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="border-arctic/20 bg-arctic/[0.03]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-snow">
                <BookOpen className="size-4 text-arctic" />
                <p className="font-medium">Need help?</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Learn more about permits and permissions in our documentation.</p>
              <Button asChild variant="secondary" size="sm" className="mt-3">
                <a href="/commands" target="_blank" rel="noreferrer">Open Docs ↗</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wizard + dialogs */}
      <CreatePermitWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={reload}
        presetKey={wizardPreset}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={busy}
        destructive
        title={`Delete ${confirmDelete?.name}?`}
        description="This permanently removes the permit and its permission grants."
        confirmLabel="Delete permit"
        consequences={["Assigned roles will lose the access this permit granted.", "This cannot be undone."]}
      />
      <ConfirmDialog
        open={!!confirmPreset}
        onClose={() => setConfirmPreset(null)}
        onConfirm={applyPreset}
        title={`Apply ${confirmPreset?.name} preset?`}
        description="This opens the create-permit wizard pre-filled with the preset's permissions. Nothing is overwritten until you create the permit."
        confirmLabel="Apply Preset"
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white/[0.05]">
        <ShieldCheck className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-snow">No permits yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Create a permit to start managing role-based access.</p>
      <Button className="mt-5" onClick={onCreate}><Plus className="size-4" /> Create Permit</Button>
    </div>
  );
}

/** Permission Groups tab — categories as cards. */
function PermissionGroups() {
  const groups = catalogByCategory();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Groups</CardTitle>
        <CardDescription>Every permission Soward can delegate, grouped by area.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.category} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <PermitGlyph name={g.icon} className="size-4 text-arctic" />
              <p className="font-medium text-snow">{g.category}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{g.permissions.length} permissions</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.permissions.slice(0, 4).map((p) => (
                <span key={p.id} className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] text-frost">
                  {p.name}
                </span>
              ))}
              {g.permissions.length > 4 && (
                <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{g.permissions.length - 4}
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const guild = useGuild();
  // Only owners (wildcard) manage permits — re-checked server-side too.
  if (!guild.permissions.includes("*")) {
    return <NoAccess module="Permits" />;
  }
  return (
    <ResourcesProvider>
      <PermitsInner />
    </ResourcesProvider>
  );
}
