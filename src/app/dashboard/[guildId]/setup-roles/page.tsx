"use client";

import * as React from "react";
import {
  UserCog, Shield, ShieldCheck, Gavel, Crown, Headset, Gift, Ticket,
  Plus, Trash2, Users,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { RoleSelect, useResources } from "@/components/dashboard/resource-select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { intToHexColor } from "@/lib/utils";

/**
 * Setup Roles — configure which Discord roles map to Soward management roles.
 * Stores role IDs per guild in ModuleConfig("setuproles"). Never hardcodes role
 * names/ids; every selector pulls the guild's real roles from /resources.
 */

interface RoleSlot {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
}

const ROLE_SLOTS: RoleSlot[] = [
  { key: "adminRole", label: "Admin", description: "Full dashboard management and every module.", icon: <Crown className="size-4" />, tint: "text-arctic" },
  { key: "staffRole", label: "Staff", description: "General staff permissions across the server.", icon: <ShieldCheck className="size-4" />, tint: "text-ice" },
  { key: "moderatorRole", label: "Moderator", description: "Warn, mute, kick, ban, and moderation tools.", icon: <Gavel className="size-4" />, tint: "text-ice" },
  { key: "vipRole", label: "VIP", description: "VIP-only features and perks.", icon: <Crown className="size-4" />, tint: "text-warning" },
  { key: "supportRole", label: "Support", description: "Ticket and support permissions.", icon: <Headset className="size-4" />, tint: "text-arctic" },
  { key: "giveawayManagerRole", label: "Giveaway Manager", description: "Start, end, and reroll giveaways.", icon: <Gift className="size-4" />, tint: "text-success" },
  { key: "ticketStaffRole", label: "Ticket Staff", description: "Claim, respond to, and close tickets.", icon: <Ticket className="size-4" />, tint: "text-arctic" },
];

interface CustomRole { id: string; label: string; roleId: string }

interface SetupRolesData extends Record<string, unknown> {
  adminRole: string;
  staffRole: string;
  moderatorRole: string;
  vipRole: string;
  supportRole: string;
  giveawayManagerRole: string;
  ticketStaffRole: string;
  customRoles: CustomRole[];
}

const defaults: SetupRolesData = {
  adminRole: "",
  staffRole: "",
  moderatorRole: "",
  vipRole: "",
  supportRole: "",
  giveawayManagerRole: "",
  ticketStaffRole: "",
  customRoles: [],
};

function RoleRow({
  slot,
  value,
  onChange,
}: {
  slot: RoleSlot;
  value: string;
  onChange: (id: string) => void;
}) {
  const { roles } = useResources();
  const selected = roles.find((r) => r.id === value);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] ${slot.tint}`}>
          {slot.icon}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-snow">
            {slot.label}
            {selected && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: selected.color ? intToHexColor(selected.color) : "#9EDCFF",
                  backgroundColor: `${selected.color ? intToHexColor(selected.color) : "#9EDCFF"}1a`,
                }}
              >
                @{selected.name}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{slot.description}</p>
        </div>
      </div>
      <div className="w-full sm:w-64">
        <RoleSelect value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function Inner() {
  const cfg = useModuleConfig<SetupRolesData>("setuproles", defaults);
  const { loading } = useResources();
  const data = cfg.data;

  const setRole = (key: string, id: string) => cfg.setField(key as keyof SetupRolesData, id as never);

  const custom = data.customRoles ?? [];
  const addCustom = () =>
    cfg.setField("customRoles", [
      ...custom,
      { id: crypto.randomUUID(), label: "", roleId: "" },
    ] as never);
  const updateCustom = (id: string, patch: Partial<CustomRole>) =>
    cfg.setField(
      "customRoles",
      custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) as never
    );
  const removeCustom = (id: string) =>
    cfg.setField("customRoles", custom.filter((c) => c.id !== id) as never);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Setup Roles"
        description="Map your server's Discord roles to Soward management roles. Everything is stored as role IDs — names never get hardcoded."
        icon={<UserCog className="size-5" />}
      />

      {cfg.loading || loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-frost">
                <Shield className="size-4 text-arctic" /> Management roles
              </div>
              {ROLE_SLOTS.map((slot) => (
                <RoleRow
                  key={slot.key}
                  slot={slot}
                  value={(data[slot.key] as string) ?? ""}
                  onChange={(id) => setRole(slot.key, id)}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-frost">
                  <Users className="size-4 text-arctic" /> Custom roles
                </div>
                <Button size="sm" variant="secondary" onClick={addCustom}>
                  <Plus className="size-4" /> Add role
                </Button>
              </div>

              {custom.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
                  <Users className="mx-auto mb-2 size-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No custom roles yet.</p>
                  <p className="text-xs text-muted-foreground/70">Add your own labelled role mappings for anything not covered above.</p>
                </div>
              ) : (
                custom.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:flex-row sm:items-center"
                  >
                    <Input
                      placeholder="Role label (e.g. Event Host)"
                      value={c.label}
                      onChange={(e) => updateCustom(c.id, { label: e.target.value })}
                      className="sm:max-w-xs"
                    />
                    <div className="flex-1">
                      <RoleSelect value={c.roleId} onChange={(id) => updateCustom(c.id, { roleId: id })} />
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeCustom(c.id)}
                      aria-label="Remove custom role"
                      className="self-end text-muted-foreground hover:text-destructive sm:self-auto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="setuproles">
      <Inner />
    </ModuleGate>
  );
}
