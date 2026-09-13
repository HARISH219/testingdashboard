"use client";

import { Brain, Image as ImageIcon, Sparkles } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { useGuild } from "@/components/dashboard/guild-context";
import { ChannelSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS } from "@/lib/plans";

interface AIConfig extends Record<string, unknown> {
  channelId: string;
  provider: string;
  systemPrompt: string;
  imageGen: boolean;
}

const defaults: AIConfig = {
  channelId: "", provider: "openai",
  systemPrompt: "You are Snowy, a friendly and helpful assistant for this Discord server.",
  imageGen: false,
};

function Inner() {
  const cfg = useModuleConfig<AIConfig>("ai", defaults);
  const guild = useGuild();
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const limits = PLANS[guild.tier].limits;

  return (
    <div>
      <PageHeader
        title="AI" icon={<Brain className="size-5" />}
        description="Configure the AI chatbot and image generation."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chatbot</CardTitle><CardDescription>Where and how the AI responds.</CardDescription></CardHeader>
          <CardContent>
            <SettingsRow label="Chat channel" description="The AI listens and replies here.">
              <ChannelSelect value={cfg.data.channelId} onChange={(id) => cfg.setField("channelId", id)} />
            </SettingsRow>
            <SettingsRow label="Provider">
              <Select value={cfg.data.provider} onChange={(e) => cfg.setField("provider", e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
              </Select>
            </SettingsRow>
            <div className="py-4">
              <Label>System prompt</Label>
              <Textarea className="mt-2" value={cfg.data.systemPrompt} onChange={(e) => cfg.setField("systemPrompt", e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="size-4 text-arctic" /> Image generation</CardTitle></CardHeader>
            <CardContent>
              <SettingsRow label="Enable /imagine" description={limits.aiImageGen ? "Members can generate images." : "Available on Enterprise."}>
                <div className="flex items-center justify-end gap-2">
                  {!limits.aiImageGen && <Badge variant="secondary">Enterprise</Badge>}
                  <Switch checked={cfg.data.imageGen && limits.aiImageGen} onCheckedChange={(v) => cfg.setField("imageGen", v)} disabled={!limits.aiImageGen} />
                </div>
              </SettingsRow>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-arctic" /> Usage this month</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-snow">128 <span className="text-sm text-muted-foreground">/ 5,000</span></p>
                <Badge variant="success">On track</Badge>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-arctic" style={{ width: "2.5%" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="ai"><Inner /></ModuleGate>;
}
