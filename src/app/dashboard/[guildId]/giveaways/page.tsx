"use client";

import * as React from "react";
import { Gift, Plus, Trophy, Clock, RotateCcw, Users, Check, X } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { ResourcesProvider, ChannelSelect, RoleSelect, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, cn } from "@/lib/utils";
import {
  GIVEAWAY_TEMPLATES, PRESET_IMAGES, getTemplate, renderGiveawayDescription,
} from "@/lib/giveaway-templates";

interface FormState {
  prize: string;
  winners: number;
  durationHours: number;
  requiredRoleId: string;
  winnerRoleId: string;
  channelId: string;
  description: string;
  embedTemplate: string;
  embedColor: string;
  imageUrl: string;
  mentionRoleIds: string[];
}

const emptyForm: FormState = {
  prize: "", winners: 1, durationHours: 24, requiredRoleId: "", winnerRoleId: "",
  channelId: "", description: "", embedTemplate: "classic", embedColor: "#3B82F6",
  imageUrl: "", mentionRoleIds: [],
};

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const load = React.useCallback(() => {
    fetch(`/api/dashboard/${guild.id}/giveaways`).then((r) => r.json()).then((d) => setItems(d.giveaways ?? [])).catch(() => {});
  }, [guild.id]);
  React.useEffect(() => { load(); }, [load]);

  // Applying a template sets the accent color + a starter description.
  const applyTemplate = (key: string) => {
    const tpl = getTemplate(key);
    patch({ embedTemplate: key, embedColor: tpl.color });
  };

  const create = async () => {
    if (!form.prize) { toast({ variant: "warning", title: "Enter a prize" }); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/giveaways`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, winners: Number(form.winners), durationHours: Number(form.durationHours) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ variant: "success", title: "Giveaway created", description: `"${form.prize}" is live.` });
      setOpen(false); setForm(emptyForm);
      load();
    } catch (e) {
      toast({ variant: "error", title: "Failed to create", description: (e as Error).message });
    } finally { setLoading(false); }
  };

  const active = items.filter((g) => !g.ended);
  const ended = items.filter((g) => g.ended);
  const tpl = getTemplate(form.embedTemplate);

  return (
    <div>
      <PageHeader
        title="Giveaways" icon={<Gift className="size-5" />}
        description="Create and manage giveaways with prizes, winners, and role requirements."
        actions={<Button onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="size-4" /> New giveaway</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-4 text-arctic" /> Active <Badge variant="secondary">{active.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No active giveaways. Create one to get started.</p>}
            {active.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {g.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.imageUrl} alt="" className="h-24 w-full object-cover" />
                )}
                <div className="p-4">
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

      <Dialog open={open} onClose={() => setOpen(false)} title="Create giveaway" description="Set up the prize, embed, image, and who to notify." className="max-w-2xl">
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {/* Basics */}
          <div><Label>Prize</Label><Input className="mt-2" placeholder="Discord Nitro" value={form.prize} onChange={(e) => patch({ prize: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Winners</Label><Input type="number" min={1} className="mt-2" value={form.winners} onChange={(e) => patch({ winners: Number(e.target.value) })} /></div>
            <div><Label>Duration (hours)</Label><Input type="number" min={1} className="mt-2" value={form.durationHours} onChange={(e) => patch({ durationHours: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Description (optional)</Label><Textarea className="mt-2" placeholder="Extra details about the giveaway…" value={form.description} onChange={(e) => patch({ description: e.target.value })} /></div>

          {/* Template picker */}
          <div>
            <Label>Embed template</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GIVEAWAY_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                    form.embedTemplate === t.key
                      ? "border-arctic/40 bg-primary/15 text-snow"
                      : "border-border bg-white/[0.02] text-muted-foreground hover:text-frost"
                  )}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  {form.embedTemplate === t.key && <Check className="size-3.5 text-arctic" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preset image picker */}
          <div>
            <Label>Image</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <button
                type="button"
                onClick={() => patch({ imageUrl: "" })}
                className={cn(
                  "grid aspect-video place-items-center rounded-lg border text-muted-foreground transition-colors",
                  !form.imageUrl ? "border-arctic/40 bg-primary/15 text-arctic" : "border-border bg-white/[0.02] hover:text-frost"
                )}
                title="No image"
              >
                <X className="size-4" />
              </button>
              {PRESET_IMAGES.map((img) => (
                <button
                  key={img.key}
                  type="button"
                  onClick={() => patch({ imageUrl: img.url })}
                  title={img.name}
                  className={cn(
                    "relative aspect-video overflow-hidden rounded-lg border transition-colors",
                    form.imageUrl === img.url ? "border-arctic ring-1 ring-arctic" : "border-border hover:border-white/20"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="size-full object-cover" />
                  {form.imageUrl === img.url && (
                    <span className="absolute inset-0 grid place-items-center bg-navy/50"><Check className="size-4 text-arctic" /></span>
                  )}
                </button>
              ))}
            </div>
            <Input
              className="mt-2"
              placeholder="…or paste a custom image URL"
              value={PRESET_IMAGES.some((i) => i.url === form.imageUrl) ? "" : form.imageUrl}
              onChange={(e) => patch({ imageUrl: e.target.value })}
            />
          </div>

          {/* Accent color */}
          <div className="flex items-center justify-between">
            <Label>Accent color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.embedColor} onChange={(e) => patch({ embedColor: e.target.value })} className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent" />
              <span className="font-mono text-xs text-muted-foreground">{form.embedColor}</span>
            </div>
          </div>

          {/* Channel + roles */}
          <div><Label>Channel</Label><div className="mt-2"><ChannelSelect value={form.channelId} onChange={(id) => patch({ channelId: id })} /></div></div>
          <div><Label>Required role (optional)</Label><div className="mt-2"><RoleSelect value={form.requiredRoleId} onChange={(id) => patch({ requiredRoleId: id })} /></div></div>
          <div><Label>Winner role (optional)</Label><div className="mt-2"><RoleSelect value={form.winnerRoleId} onChange={(id) => patch({ winnerRoleId: id })} /></div></div>

          {/* Mention roles on send */}
          <div>
            <Label>Mention roles when sending (optional)</Label>
            <p className="mb-2 mt-0.5 text-xs text-muted-foreground">These roles will be pinged when the giveaway is posted.</p>
            <MultiRoleSelect value={form.mentionRoleIds} onChange={(ids) => patch({ mentionRoleIds: ids })} />
          </div>

          {/* Live preview */}
          <div>
            <Label>Preview</Label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white/[0.02]">
              <div className="flex">
                <span className="w-1 shrink-0" style={{ backgroundColor: form.embedColor }} />
                <div className="min-w-0 flex-1 p-3">
                  <p className="text-sm font-semibold text-snow">
                    {tpl.title.replace(/\{prize\}/g, form.prize || "your prize")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-frost">
                    {form.description
                      ? form.description
                      : renderGiveawayDescription(tpl, {
                          prize: form.prize || "your prize",
                          winners: form.winners,
                          ends: `in ${form.durationHours}h`,
                        })}
                  </p>
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="mt-2 max-h-40 w-full rounded-lg object-cover" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={loading}>{loading ? "Creating…" : "Create giveaway"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="giveaways">
      <ResourcesProvider>
        <Inner />
      </ResourcesProvider>
    </ModuleGate>
  );
}
