"use client";

import { DoorOpen, Info } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ChannelSelect, MultiRoleSelect } from "@/components/dashboard/resource-select";
import { MessagePreview, VARIABLES } from "@/components/dashboard/embed-preview";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WelcomeConfig extends Record<string, unknown> {
  channelId: string;
  message: string;
  useEmbed: boolean;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  autoRoleHumans: string[];
  autoRoleBots: string[];
  logChannelId: string;
}

const defaults: WelcomeConfig = {
  channelId: "",
  message: "Welcome {user} to **{server}**! You're member #{membercount} ❄️",
  useEmbed: true,
  embedTitle: "Welcome to {server}!",
  embedDescription: "Hey {username}, glad to have you here. Make yourself at home!",
  embedColor: "#9EDCFF",
  autoRoleHumans: [],
  autoRoleBots: [],
  logChannelId: "",
};

function WelcomeInner() {
  const cfg = useModuleConfig<WelcomeConfig>("welcome", defaults);

  if (cfg.loading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Welcome"
        description="Greet new members with messages, embeds, and auto roles."
        icon={<DoorOpen className="size-5" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-frost">Enabled</span>
            <Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} aria-label="Enable welcome" />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Message</CardTitle></CardHeader>
            <CardContent>
              <SettingsRow label="Welcome channel" description="Where welcome messages are posted.">
                <ChannelSelect value={cfg.data.channelId} onChange={(id) => cfg.setField("channelId", id)} />
              </SettingsRow>
              <div className="py-4">
                <Label>Message content</Label>
                <Textarea
                  className="mt-2"
                  value={cfg.data.message}
                  onChange={(e) => cfg.setField("message", e.target.value)}
                  placeholder="Welcome {user}!"
                />
              </div>
              <SettingsRow label="Use embed" description="Send a rich embed alongside the message.">
                <Switch checked={cfg.data.useEmbed} onCheckedChange={(v) => cfg.setField("useEmbed", v)} />
              </SettingsRow>
              {cfg.data.useEmbed && (
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Embed title</Label>
                    <Input className="mt-2" value={cfg.data.embedTitle} onChange={(e) => cfg.setField("embedTitle", e.target.value)} />
                  </div>
                  <div>
                    <Label>Embed description</Label>
                    <Textarea className="mt-2" value={cfg.data.embedDescription} onChange={(e) => cfg.setField("embedDescription", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Accent color</Label>
                    <input
                      type="color"
                      value={cfg.data.embedColor}
                      onChange={(e) => cfg.setField("embedColor", e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                    />
                    <span className="text-sm text-muted-foreground">{cfg.data.embedColor}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto roles</CardTitle>
              <CardDescription>Automatically assign roles when members or bots join.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-2">
                <Label>Roles for humans</Label>
                <div className="mt-2"><MultiRoleSelect value={cfg.data.autoRoleHumans} onChange={(ids) => cfg.setField("autoRoleHumans", ids)} /></div>
              </div>
              <div className="py-2">
                <Label>Roles for bots</Label>
                <div className="mt-2"><MultiRoleSelect value={cfg.data.autoRoleBots} onChange={(ids) => cfg.setField("autoRoleBots", ids)} /></div>
              </div>
              <SettingsRow label="Log channel" description="Log auto role assignments.">
                <ChannelSelect value={cfg.data.logChannelId} onChange={(id) => cfg.setField("logChannelId", id)} />
              </SettingsRow>
            </CardContent>
          </Card>
        </div>

        {/* Preview + variables */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <MessagePreview
                content={cfg.data.message}
                embed={cfg.data.useEmbed ? {
                  title: cfg.data.embedTitle,
                  description: cfg.data.embedDescription,
                  color: cfg.data.embedColor,
                } : undefined}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="size-4 text-arctic" /> Variables</CardTitle>
            </CardHeader>
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
      </div>

      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
    </div>
  );
}

export default function WelcomePage() {
  return <ModuleGate moduleKey="welcome"><WelcomeInner /></ModuleGate>;
}
