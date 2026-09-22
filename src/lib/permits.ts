/**
 * Permits domain model.
 *
 * A "Permit" is the dashboard-facing name for a DashboardRole: a named set of
 * Discord roles mapped to a set of granular permissions. This module derives a
 * rich, categorized permission *catalog* from the real MODULES registry so the
 * Permits UI never hardcodes a fake permission list — every permission maps to
 * an actual `moduleKey:action` string that the server-side authz layer already
 * understands (see lib/permissions.ts + lib/authz.ts).
 *
 * It also provides:
 *  - PERMIT_ICONS: the icon vocabulary a permit can use
 *  - PERMISSION_PRESETS: common permission bundles (Immunity/Moderation/…)
 *  - effective-permission + conflict computation used by the detail views
 *
 * Nothing here trusts the client: it is pure data + pure functions. All writes
 * are still authorized server-side in the API route.
 */

import { MODULES, type ModuleCategory } from "./modules";
import { ALL_PERMISSIONS } from "./permissions";

/* -------------------------------------------------------------------------- */
/* Permit icons                                                               */
/* -------------------------------------------------------------------------- */

/** Lucide icon names a permit may use. The key is what we persist. */
export const PERMIT_ICONS = [
  "Shield",
  "ShieldCheck",
  "ShieldAlert",
  "Crown",
  "Users",
  "Gavel",
  "Headset",
  "Lock",
  "Key",
  "Star",
  "Sparkles",
  "Bot",
  "Zap",
  "Ticket",
  "Flag",
] as const;

export type PermitIcon = (typeof PERMIT_ICONS)[number];

export function isPermitIcon(v: string): v is PermitIcon {
  return (PERMIT_ICONS as readonly string[]).includes(v);
}

/* -------------------------------------------------------------------------- */
/* Permission catalog                                                         */
/* -------------------------------------------------------------------------- */

/** A grouping shown as a section in the permission picker. */
export type PermissionCategory =
  | "Moderation"
  | "Security"
  | "Community"
  | "Automation"
  | "Voice & Music"
  | "Utility"
  | "Settings";

/** One selectable permission. `id` is the real "moduleKey:action" string. */
export interface CatalogPermission {
  id: string; // e.g. "moderation:manage"
  name: string; // e.g. "Manage Moderation"
  description: string;
  category: PermissionCategory;
  icon: string; // lucide icon name
  /** Suggested default when a permit is first created. */
  defaultState: boolean;
}

/** Map a module category to the human permission category + a section icon. */
const CATEGORY_MAP: Record<ModuleCategory, { category: PermissionCategory; icon: string }> = {
  overview: { category: "Utility", icon: "LayoutDashboard" },
  moderation: { category: "Moderation", icon: "Gavel" },
  security: { category: "Security", icon: "ShieldAlert" },
  community: { category: "Community", icon: "Users" },
  automation: { category: "Automation", icon: "Zap" },
  music: { category: "Voice & Music", icon: "Music" },
  utility: { category: "Utility", icon: "Wrench" },
  settings: { category: "Settings", icon: "Sliders" },
};

/** Deterministic display order for permission categories. */
export const PERMISSION_CATEGORY_ORDER: PermissionCategory[] = [
  "Moderation",
  "Security",
  "Community",
  "Automation",
  "Voice & Music",
  "Utility",
  "Settings",
];

function actionLabel(moduleName: string, action: "view" | "manage"): string {
  return action === "manage" ? `Manage ${moduleName}` : `View ${moduleName}`;
}

function actionDescription(moduleName: string, action: "view" | "manage"): string {
  return action === "manage"
    ? `Change ${moduleName.toLowerCase()} settings and take actions.`
    : `Read ${moduleName.toLowerCase()} settings without editing.`;
}

/**
 * The full permission catalog, derived from MODULES. Each module contributes a
 * "view" and a "manage" permission. Billing is excluded (it is account-level,
 * not a delegable server permission).
 */
export const PERMISSION_CATALOG: CatalogPermission[] = MODULES.flatMap((m) => {
  if (m.key === "billing") return [];
  const { category, icon } = CATEGORY_MAP[m.category];
  const perms: CatalogPermission[] = [
    {
      id: `${m.key}:view`,
      name: actionLabel(m.name, "view"),
      description: actionDescription(m.name, "view"),
      category,
      icon,
      defaultState: false,
    },
    {
      id: `${m.key}:manage`,
      name: actionLabel(m.name, "manage"),
      description: actionDescription(m.name, "manage"),
      category,
      icon,
      defaultState: false,
    },
  ];
  return perms;
});

const CATALOG_BY_ID: Record<string, CatalogPermission> = Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.id, p])
);

export function getPermission(id: string): CatalogPermission | undefined {
  return CATALOG_BY_ID[id];
}

/** Group the catalog (optionally filtered) by category, in display order. */
export function catalogByCategory(
  filter?: (p: CatalogPermission) => boolean
): { category: PermissionCategory; icon: string; permissions: CatalogPermission[] }[] {
  const groups = new Map<PermissionCategory, CatalogPermission[]>();
  for (const p of PERMISSION_CATALOG) {
    if (filter && !filter(p)) continue;
    const arr = groups.get(p.category) ?? [];
    arr.push(p);
    groups.set(p.category, arr);
  }
  return PERMISSION_CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => ({
    category,
    icon: PERMISSION_CATALOG.find((p) => p.category === category)?.icon ?? "Shield",
    permissions: groups.get(category)!,
  }));
}

/** Distinct category labels present in a set of permission ids. */
export function categoriesOf(permissionIds: string[]): PermissionCategory[] {
  const set = new Set<PermissionCategory>();
  for (const id of permissionIds) {
    const p = CATALOG_BY_ID[id];
    if (p) set.add(p.category);
  }
  return PERMISSION_CATEGORY_ORDER.filter((c) => set.has(c));
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

export interface PermissionPreset {
  key: string;
  name: string;
  description: string;
  icon: PermitIcon;
  /** Concrete permission ids applied when the preset is chosen. */
  permissions: string[];
}

/** Only keep ids that actually exist in the catalog (defensive). */
function valid(ids: string[]): string[] {
  return ids.filter((id) => ALL_PERMISSIONS.includes(id));
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    key: "immunity",
    name: "Immunity",
    description: "Full protection from restrictions across every module.",
    icon: "Crown",
    permissions: valid(
      MODULES.filter((m) => m.key !== "billing").map((m) => `${m.key}:manage`)
    ),
  },
  {
    key: "moderation",
    name: "Moderation",
    description: "Moderation-related permissions for trusted staff.",
    icon: "Gavel",
    permissions: valid([
      "moderation:manage",
      "automod:manage",
      "wordfilter:manage",
      "logging:view",
    ]),
  },
  {
    key: "lockdown",
    name: "Lockdown",
    description: "Emergency access and server-control permissions.",
    icon: "Lock",
    permissions: valid([
      "antinuke:manage",
      "moderation:manage",
      "settings:manage",
      "logging:manage",
    ]),
  },
  {
    key: "whitelist",
    name: "Whitelist",
    description: "Bypass selected restrictions and view security state.",
    icon: "ShieldCheck",
    permissions: valid([
      "antinuke:view",
      "wordfilter:view",
      "automod:view",
      "logging:view",
    ]),
  },
];

export function getPreset(key: string): PermissionPreset | undefined {
  return PERMISSION_PRESETS.find((p) => p.key === key);
}

/* -------------------------------------------------------------------------- */
/* Permit shape (client-facing)                                               */
/* -------------------------------------------------------------------------- */

export interface Permit {
  id: string;
  guildId: string;
  name: string;
  description: string | null;
  icon: string;
  enabled: boolean;
  color: string;
  permissions: string[]; // catalog permission ids
  discordRoleIds: string[];
  priority: number;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Effective permissions & conflicts                                          */
/* -------------------------------------------------------------------------- */

export type PermState = "allow" | "deny" | "unset";

/**
 * Effective-permission breakdown for the whole catalog given the permits a
 * viewer belongs to. Higher-priority permits win; "manage" implies "view".
 *
 * Semantics: a permit that lists a permission id ALLOWS it. A disabled permit
 * contributes nothing. There is no explicit "deny" stored today, but the model
 * supports surfacing conflicts when two permits disagree on presence, which is
 * what the UI visualizes. Denies come from higher-priority permits that are
 * disabled while a lower one allows — we treat a disabled permit as "not set"
 * and never as an allow, keeping the calculation transparent.
 */
export interface EffectiveSummary {
  allowed: number;
  denied: number;
  notSet: number;
  total: number;
  /** id -> resolved state */
  states: Record<string, PermState>;
}

export function computeEffective(permits: Permit[]): EffectiveSummary {
  const states: Record<string, PermState> = {};
  const activePermits = permits.filter((p) => p.enabled);

  for (const perm of PERMISSION_CATALOG) {
    // "manage" grants "view"; check both direct and implied allow.
    const [moduleKey, action] = perm.id.split(":");
    const allowed = activePermits.some((p) => {
      if (p.permissions.includes(perm.id)) return true;
      if (action === "view" && p.permissions.includes(`${moduleKey}:manage`)) return true;
      return false;
    });
    // Denied = every permit that references the module explicitly turns it off
    // while at least one references it. With allow-only storage there is no hard
    // deny, so a permission is "denied" only when a higher-priority *disabled*
    // permit would have granted it — surfaced as a conflict, not silently.
    states[perm.id] = allowed ? "allow" : "unset";
  }

  const values = Object.values(states);
  return {
    allowed: values.filter((s) => s === "allow").length,
    denied: values.filter((s) => s === "deny").length,
    notSet: values.filter((s) => s === "unset").length,
    total: PERMISSION_CATALOG.length,
    states,
  };
}

export interface PermitContribution {
  permitId: string;
  permitName: string;
  icon: string;
  enabled: boolean;
  state: PermState;
}

export interface PermissionConflict {
  permissionId: string;
  permissionName: string;
  contributions: PermitContribution[];
  effective: PermState;
  reason: string;
}

/**
 * Detect conflicts for a single permission id across the given permits.
 * A conflict exists when an enabled permit grants a permission while another
 * permit (typically higher priority but disabled, or referencing the same
 * permission) disagrees. We never hide these — the UI renders them explicitly.
 */
export function contributionsFor(permissionId: string, permits: Permit[]): PermitContribution[] {
  const [moduleKey, action] = permissionId.split(":");
  return permits
    .filter(
      (p) =>
        p.permissions.includes(permissionId) ||
        (action === "view" && p.permissions.includes(`${moduleKey}:manage`))
    )
    .map((p) => ({
      permitId: p.id,
      permitName: p.name,
      icon: p.icon,
      enabled: p.enabled,
      state: p.enabled ? ("allow" as const) : ("deny" as const),
    }));
}

export function conflictFor(permissionId: string, permits: Permit[]): PermissionConflict | null {
  const contributions = contributionsFor(permissionId, permits);
  if (contributions.length < 2) return null;
  const hasAllow = contributions.some((c) => c.state === "allow");
  const hasDeny = contributions.some((c) => c.state === "deny");
  if (!hasAllow || !hasDeny) return null; // no disagreement
  // Highest priority wins. Since disabled permits are "deny", and we sort by the
  // order provided (callers pass priority-desc), the first contribution wins.
  const effective: PermState = contributions[0].state;
  const perm = getPermission(permissionId);
  return {
    permissionId,
    permissionName: perm?.name ?? permissionId,
    contributions,
    effective,
    reason:
      effective === "allow"
        ? "The highest-priority permit allows this permission."
        : "A higher-priority permit is disabled, so the permission is denied.",
  };
}

/** All conflicts across the given permits (priority-desc order expected). */
export function allConflicts(permits: Permit[]): PermissionConflict[] {
  const out: PermissionConflict[] = [];
  for (const perm of PERMISSION_CATALOG) {
    const c = conflictFor(perm.id, permits);
    if (c) out.push(c);
  }
  return out;
}
