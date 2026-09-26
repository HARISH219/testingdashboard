"use client";

import * as React from "react";
import {
  Mic, Volume2, FolderTree, Hash, Users2, Radio, Trash2, ShieldCheck,
  Lock, EyeOff, UserMinus, Crown, Pencil, Sparkles,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ChannelSelect, useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Voice Master — Join-to-Create temporary voice channels.
 * Config persists to ModuleConfig("voicemaster") and syncs to the bot, which
 * owns the actual channel create/delete/rename logic at runtime.
 */

interface VoiceMasterData extends Record<string, unknown> {
  joinChannelId: string;
  categoryId: string;
  nameFormat: string;
  userLimit: number;
  bitrate: number;
  region: string;
  autoDelete: boolean;
  lockByDefault: boolean;
  allowRename: boolean;
  allowLimit: boolean;
  allowKick: boolean;
}

const defaults: VoiceMasterData = {
  joinChannelId: "",
  categoryId: "",
  nameFormat: "{user}'s Room",
  userLimit: 0,
  bitrate: 64,
  region: "auto",
  autoDelete: true,
  lockByDefault: false,
  allowRename: true,
  allowLimit: true,
  allowKick: true,
};

const REGIONS = [
  { value: "auto", label: "Automatic" },
  { value: "us-central", label: "US Central" },
  { value: "us-east", label: "US East" },
  { value: "us-west", label: "US West" },
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "rotterdam", label: "Rotterdam" },
  { value: "brazil", label: "Brazil" },
  { value: "japan", label: "Japan" },
  { value: "sydney", label: "Sydney" },
];

/** Category (type 4) picker built from guild resources. */
function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { channels, loading } = useResources();
  const categories = channels.filter((c) => c.type === 4);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading}>
      <option value="">{loading ? "Loading…" : "Same as Join channel"}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>📁 {c.name}</option>
      ))}
    </Select>
  );
}

const OWNER_CONTROLS = [
  { icon: <Pencil className="size-4" />, label: "Rename", desc: "Change the channel name." },
  { icon: <Lock className="size-4" />, label: "Lock / Unlock", desc: "Control who can join." },
  { icon: <EyeOff className="size-4" />, label: "Hide / Unhide", desc: "Hide the channel from others." },
  { icon: <Users2 className="size-4" />, label: "User limit", desc: "Set a maximum member count." },
  { icon: <UserMinus className="size-4" />, label: "Kick / Ban", desc: "Remove disruptive members." },
  { icon: <Crown className="size-4" />, label: "Transfer owner", desc: "Hand the room to someone else." },
];

function StatCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <Card className="p-4">
      <div className={`mb-2 grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] ${tint}`}>
        {icon}
      </div>
      <p className="text-lg font-semibold text-snow">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function Inner() {
  const cfg = useModuleConfig<VoiceMasterData>("voicemaster", defaults);
  const { loading } = useResources();
  const d = cfg.data;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Voice Master"
        description="Let members automatically create their own temporary voice channels with the Join-to-Create system."
        icon={<Mic className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      {/* Live-ish statistics */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Radio className="size-4" />} label="Active rooms" value="—" tint="text-arctic" />
        <StatCard icon={<Volume2 className="size-4" />} label="Join channel" value={d.joinChannelId ? "Set" : "Not set"} tint="text-ice" />
        <StatCard icon={<Users2 className="size-4" />} label="Default limit" value={d.userLimit === 0 ? "∞" : String(d.userLimit)} tint="text-success" />
        <StatCard icon={<ShieldCheck className="size-4" />} label="Status" value={cfg.enabled ? "Enabled" : "Disabled"} tint={cfg.enabled ? "text-success" : "text-muted-foreground"} />
      </div>

      {cfg.loading || loading ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderTree className="size-4 text-arctic" /> Join to Create</CardTitle>
              <CardDescription>When a member joins the trigger channel, Soward makes them their own room.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Join-to-Create channel" description="Members who join this voice channel get a fresh temporary room.">
                <ChannelSelect type="voice" value={d.joinChannelId} onChange={(id) => cfg.setField("joinChannelId", id)} />
              </SettingsRow>
              <SettingsRow label="Category" description="Where new temporary channels are created.">
                <CategorySelect value={d.categoryId} onChange={(id) => cfg.setField("categoryId", id)} />
              </SettingsRow>
              <SettingsRow label="Channel name format" description="Use {user} for the owner's name, {count} for a number.">
                <Input value={d.nameFormat} onChange={(e) => cfg.setField("nameFormat", e.target.value)} placeholder="{user}'s Room" />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="size-4 text-arctic" /> Channel defaults</CardTitle>
              <CardDescription>Applied to every new temporary channel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Default user limit" description="0 means unlimited.">
                <Input type="number" min={0} max={99} value={d.userLimit} onChange={(e) => cfg.setField("userLimit", Number(e.target.value))} />
              </SettingsRow>
              <SettingsRow label="Bitrate (kbps)" description="Higher is clearer but uses more bandwidth.">
                <Select value={String(d.bitrate)} onChange={(e) => cfg.setField("bitrate", Number(e.target.value))}>
                  {[8, 16, 32, 64, 96, 128, 256, 384].map((b) => <option key={b} value={b}>{b} kbps</option>)}
                </Select>
              </SettingsRow>
              <SettingsRow label="Voice region" description="Force a region or leave automatic.">
                <Select value={d.region} onChange={(e) => cfg.setField("region", e.target.value)}>
                  {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </SettingsRow>
              <SettingsRow label="Locked by default" description="New rooms start locked to the owner only.">
                <Switch checked={d.lockByDefault} onCheckedChange={(v) => cfg.setField("lockByDefault", v)} />
              </SettingsRow>
              <SettingsRow label="Auto-delete empty channels" description="Remove a room once everyone leaves.">
                <Switch checked={d.autoDelete} onCheckedChange={(v) => cfg.setField("autoDelete", v)} />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-arctic" /> Owner permissions</CardTitle>
              <CardDescription>What temporary-channel owners are allowed to do.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsRow label="Allow rename" description="Owners can rename their room.">
                <Switch checked={d.allowRename} onCheckedChange={(v) => cfg.setField("allowRename", v)} />
              </SettingsRow>
              <SettingsRow label="Allow user limit changes" description="Owners can set their own limit.">
                <Switch checked={d.allowLimit} onCheckedChange={(v) => cfg.setField("allowLimit", v)} />
              </SettingsRow>
              <SettingsRow label="Allow kick / ban" description="Owners can remove members from their room.">
                <Switch checked={d.allowKick} onCheckedChange={(v) => cfg.setField("allowKick", v)} />
              </SettingsRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown className="size-4 text-arctic" /> What owners can control</CardTitle>
              <CardDescription>These controls are available to room owners via the bot's control panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 pt-0 sm:grid-cols-2 lg:grid-cols-3">
              {OWNER_CONTROLS.map((c) => (
                <div key={c.label} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-arctic">{c.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-snow">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="voicemaster">
      <Inner />
    </ModuleGate>
  );
}
