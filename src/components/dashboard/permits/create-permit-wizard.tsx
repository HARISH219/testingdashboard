"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useGuild } from "@/components/dashboard/guild-context";
import { useResources } from "@/components/dashboard/resource-select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  PermitGlyph, StepIndicator, StatusPill,
} from "./permit-ui";
import { PermissionPicker } from "./permission-picker";
import {
  PERMIT_ICONS, categoriesOf, getPreset, type PermissionPreset,
} from "@/lib/permits";
import { intToHexColor } from "@/lib/utils";

const STEPS = ["Details", "Roles", "Permissions", "Review"];

interface FormState {
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  color: string;
  discordRoleIds: string[];
  permissions: string[];
}

const EMPTY: FormState = {
  name: "",
  description: "",
  icon: "Shield",
  enabled: true,
  color: "#9EDCFF",
  discordRoleIds: [],
  permissions: [],
};

export function CreatePermitWizard({
  open,
  onClose,
  onCreated,
  presetKey,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  presetKey?: string | null;
}) {
  const guild = useGuild();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  // Reset and optionally pre-apply a preset each time the wizard opens.
  React.useEffect(() => {
    if (!open) return;
    setStep(0);
    const preset = presetKey ? getPreset(presetKey) : undefined;
    setForm(
      preset
        ? { ...EMPTY, name: preset.name, description: preset.description, icon: preset.icon, permissions: [...preset.permissions] }
        : EMPTY
    );
  }, [open, presetKey]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  };

  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          icon: form.icon,
          enabled: form.enabled,
          color: form.color,
          discordRoleIds: form.discordRoleIds,
          permissions: form.permissions,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to create permit");
      toast({ variant: "success", title: "Permit created", description: `${form.name} is ready.` });
      onCreated();
      onClose();
    } catch (e) {
      toast({ variant: "error", title: "Failed to save permit", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-stretch justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-strong relative z-10 flex h-full w-full flex-col rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-snow">Create permit</h2>
                <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-snow">
                <X className="size-5" />
              </button>
            </div>

            {/* Progress */}
            <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
              <StepIndicator steps={STEPS} current={step} />
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {step === 0 && <DetailsStep form={form} patch={patch} />}
              {step === 1 && <RolesStep form={form} patch={patch} />}
              {step === 2 && <PermissionPicker selected={form.permissions} onChange={(ids) => patch({ permissions: ids })} />}
              {step === 3 && <ReviewStep form={form} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] p-4 sm:p-5">
              <Button
                variant="ghost"
                onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                disabled={saving}
              >
                {step === 0 ? "Cancel" : <><ArrowLeft className="size-4" /> Back</>}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Next <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={saving}>
                  {saving ? "Creating…" : <><Check className="size-4" /> Create permit</>}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Steps --------------------------------- */

function DetailsStep({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Permit name *</Label>
        <Input className="mt-2" placeholder="e.g. Moderators" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea className="mt-2" placeholder="Access for server moderators" value={form.description} onChange={(e) => patch({ description: e.target.value })} />
      </div>
      <div>
        <Label>Icon</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PERMIT_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => patch({ icon: ic })}
              aria-label={ic}
              className={`grid size-10 place-items-center rounded-xl border transition-colors ${
                form.icon === ic
                  ? "border-arctic/40 bg-primary/15 text-arctic"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-frost"
              }`}
            >
              <PermitGlyph name={ic} className="size-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
        <div>
          <p className="text-sm font-medium text-snow">Status</p>
          <p className="text-xs text-muted-foreground">Active permits apply their permissions immediately.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill active={form.enabled} />
          <Switch checked={form.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
        </div>
      </div>
    </div>
  );
}

function RolesStep({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  const { roles, loading } = useResources();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const filtered = roles.filter((r) => r.name.toLowerCase().includes(q));
  const set = new Set(form.discordRoleIds);
  const toggle = (id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    patch({ discordRoleIds: [...next] });
  };
  const selected = roles.filter((r) => set.has(r.id));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-snow">Assign roles</h3>
        <p className="text-sm text-muted-foreground">Select which Discord roles will receive this permit.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search roles…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
              {r.name}
              <button onClick={() => toggle(r.id)} aria-label={`Remove ${r.name}`}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        {loading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Loading roles…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No roles found.</p>
        ) : (
          filtered.map((r) => {
            const on = set.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  on ? "bg-primary/15 text-snow" : "text-frost hover:bg-white/[0.04]"
                }`}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: intToHexColor(r.color) }} />
                <span className="flex-1 truncate text-left">{r.name}</span>
                {on && <Check className="size-4 text-arctic" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: FormState }) {
  const cats = categoriesOf(form.permissions);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-xl border border-white/10 text-arctic" style={{ backgroundColor: `${form.color}1a` }}>
          <PermitGlyph name={form.icon} className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-snow">{form.name || "Untitled permit"}</h3>
          {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <ReviewCell label="Roles" value={`${form.discordRoleIds.length} selected`} />
        <ReviewCell label="Permissions" value={`${form.permissions.length} enabled`} />
        <ReviewCell label="Categories" value={cats.length ? cats.join(", ") : "None"} />
        <ReviewCell label="Status" value={form.enabled ? "Active" : "Inactive"} />
      </dl>
    </div>
  );
}

function ReviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-snow">{value}</dd>
    </div>
  );
}
