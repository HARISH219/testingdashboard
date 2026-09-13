"use client";

import * as React from "react";
import { Lock, ShieldAlert, Users, Crown } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface AntinukeConfig extends Record<string, unknown> {
  whitelistRoles: string[];
  extraOwners: string[];
  banProtect: boolean;
  channelProtect: boolean;
  roleProtect: boolean;
  webhookProtect: boolean;
}

const defaults: AntinukeConfig = {
  whitelistRoles: [], extraOwners: [], banProtect: true,
  channelProtect: true, roleProtect: true, webhookProtect: true,
};

function Inner() {
  const cfg = useModuleConfig<AntinukeConfig>("antinuke", defaults);
  const { toast } = useToast();
  const [disableOpen, setDisableOpen] = React.useState(false);
  const [ownerInput, setOwnerInput] = React.useState("");

  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const protections: { key: keyof AntinukeConfig; label: string; desc: string }[] = [
    { key: "banProtect", label: "Anti mass-ban", desc: "Block members who ban many users quickly." },
    { key: "channelProtect", label: "Channel protection", desc: "Prevent mass channel deletion/creation." },
    { key: "roleProtect", label: "Role protection", desc: "Prevent dangerous role changes." },
    { key: "webhookProtect", label: "Webhook protection", desc: "Block malicious webhook spam." },
  ];

  const confirmDisable = () => { cfg.setEnabled(false); setDisableOpen(false); toast({ variant: "warning", title: "Antinuke disabled", description: "Remember to save. Your server protection is now off." }); };

  return (
    <div>
      <PageHeader
        title="Antinuke" icon={<Lock className="size-5" />}
        description="Protect your server from nuke attempts and malicious admins."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={cfg.enabled ? "success" : "destructive"}>{cfg.enabled ? "Protected" : "Unprotected"}</Badge>
            {cfg.enabled ? (
              <Button variant="destructive" size="sm" onClick={() => setDisableOpen(true)}>Disable</Button>
            ) : (
              <Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} />
            )}
          </div>
        }
      />

      <Card className="mb-6 border-warning/20 bg-warning/[0.04]">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-snow">Security-critical module</p>
            <p className="text-sm text-muted-foreground">Only whitelist people you fully trust. Whitelisted roles and extra owners bypass antinuke protections.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Protections</CardTitle></CardHeader>
          <CardContent>
            {protections.map((p) => (
              <SettingsRow key={p.key} label={p.label} description={p.desc}>
                <Switch checked={Boolean(cfg.data[p.key])} onCheckedChange={(v) => cfg.setField(p.key, v as any)} disabled={!cfg.enabled} />
              </SettingsRow>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4 text-arctic" /> Whitelisted roles</CardTitle><CardDescription>These roles bypass antinuke checks.</CardDescription></CardHeader>
            <CardContent><MultiRoleSelect value={cfg.data.whitelistRoles} onChange={(ids) => cfg.setField("whitelistRoles", ids)} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="size-4 text-arctic" /> Extra owners</CardTitle><CardDescription>Trusted user IDs with owner-level bypass.</CardDescription></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="User ID" value={ownerInput} onChange={(e) => setOwnerInput(e.target.value)} />
                <Button variant="secondary" onClick={() => { if (ownerInput) { cfg.setField("extraOwners", [...cfg.data.extraOwners, ownerInput]); setOwnerInput(""); } }}>Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cfg.data.extraOwners.map((id) => (
                  <Badge key={id} variant="secondary" className="font-mono">{id}
                    <button className="ml-1" onClick={() => cfg.setField("extraOwners", cfg.data.extraOwners.filter((x) => x !== id))}>×</button>
                  </Badge>
                ))}
                {cfg.data.extraOwners.length === 0 && <p className="text-xs text-muted-foreground">No extra owners.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />

      <ConfirmDialog
        open={disableOpen} onClose={() => setDisableOpen(false)} onConfirm={confirmDisable}
        destructive title="Disable antinuke protection?"
        description="Your server will be vulnerable to nuke attacks while this is off."
        confirmLabel="Disable protection"
        consequences={["Mass ban/kick protection will stop.", "Channel and role protection will stop.", "This is logged in the audit log."]}
      />
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="antinuke"><Inner /></ModuleGate>;
}
