"use client";

import { ModuleGate } from "./module-gate";
import { PageHeader } from "./page-header";
import { SettingsRow } from "./settings-row";
import { SaveBar } from "./save-bar";
import { useModuleConfig } from "./use-module-config";
import { ModuleIcon } from "./module-icon";
import { ChannelSelect, RoleSelect, MultiRoleSelect } from "./resource-select";
import { MessagePreview, VARIABLES } from "./embed-preview";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MODULE_MAP } from "@/lib/modules";

export type FieldType =
  | "text" | "textarea" | "switch" | "channel" | "voicechannel"
  | "role" | "roles" | "number" | "select" | "color";

export interface FieldDef {
  key: string;
  label: string;
  description?: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ConfigSection {
  title: string;
  description?: string;
  fields: FieldDef[];
}

function Field({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case "switch":
      return <Switch checked={Boolean(value)} onCheckedChange={onChange} />;
    case "channel":
      return <ChannelSelect value={value ?? ""} onChange={onChange} />;
    case "voicechannel":
      return <ChannelSelect value={value ?? ""} onChange={onChange} type="voice" />;
    case "role":
      return <RoleSelect value={value ?? ""} onChange={onChange} />;
    case "roles":
      return <MultiRoleSelect value={value ?? []} onChange={onChange} />;
    case "number":
      return <Input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />;
    case "textarea":
      return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case "select":
      return (
        <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value ?? "#9EDCFF"} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
          <span className="text-sm text-muted-foreground">{value}</span>
        </div>
      );
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
}

/**
 * Declarative config page used by the simpler modules. Renders sections of
 * fields backed by the real module-config API, with save bar and optional
 * message preview + variables reference.
 */
export function ConfigPage({
  moduleKey,
  sections,
  defaults,
  preview,
}: {
  moduleKey: string;
  sections: ConfigSection[];
  defaults: Record<string, unknown>;
  preview?: { contentKey?: string; embedTitleKey?: string; embedDescKey?: string; colorKey?: string };
}) {
  const mod = MODULE_MAP[moduleKey];
  const cfg = useModuleConfig<Record<string, unknown>>(moduleKey, defaults);

  return (
    <ModuleGate moduleKey={moduleKey}>
      {cfg.loading ? (
        <div className="space-y-4"><Skeleton className="h-16 w-64 rounded-xl" /><Skeleton className="h-80 w-full rounded-2xl" /></div>
      ) : (
        <div>
          <PageHeader
            title={mod?.name ?? moduleKey}
            description={mod?.description}
            icon={<ModuleIcon name={mod?.icon ?? "Settings2"} className="size-5" />}
            actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
          />
          <div className={preview ? "grid grid-cols-1 gap-6 xl:grid-cols-3" : ""}>
            <div className={preview ? "space-y-6 xl:col-span-2" : "space-y-6"}>
              {sections.map((section) => (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                    {section.description && <CardDescription>{section.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {section.fields.map((field) =>
                      field.type === "textarea" ? (
                        <div key={field.key} className="py-3">
                          <Label>{field.label}</Label>
                          {field.description && <p className="mb-2 mt-0.5 text-xs text-muted-foreground">{field.description}</p>}
                          <Field field={field} value={cfg.data[field.key]} onChange={(v) => cfg.setField(field.key, v)} />
                        </div>
                      ) : (
                        <SettingsRow key={field.key} label={field.label} description={field.description}>
                          <Field field={field} value={cfg.data[field.key]} onChange={(v) => cfg.setField(field.key, v)} />
                        </SettingsRow>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {preview && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
                  <CardContent>
                    <MessagePreview
                      content={preview.contentKey ? String(cfg.data[preview.contentKey] ?? "") : undefined}
                      embed={preview.embedTitleKey ? {
                        title: String(cfg.data[preview.embedTitleKey] ?? ""),
                        description: preview.embedDescKey ? String(cfg.data[preview.embedDescKey] ?? "") : undefined,
                        color: preview.colorKey ? String(cfg.data[preview.colorKey] ?? "#9EDCFF") : undefined,
                      } : undefined}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Variables</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {VARIABLES.map((v) => (
                      <div key={v.token} className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-mono">{v.token}</Badge>
                        <span className="text-xs text-muted-foreground">{v.desc}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
        </div>
      )}
    </ModuleGate>
  );
}
