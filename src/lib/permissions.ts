import { MODULES } from "./modules";

/**
 * Distributed roles permission system.
 * A "dashboard role" maps one or more Discord roles to a set of module/feature
 * permissions. Owners have implicit full access. All checks are enforced
 * server-side (see lib/authz.ts).
 */

export type PermissionAction = "view" | "manage";

export interface PermissionKey {
  module: string;
  action: PermissionAction;
}

/** Flattened list of all grantable permissions, e.g. "moderation:manage". */
export const ALL_PERMISSIONS: string[] = MODULES.flatMap((m) => [
  `${m.key}:view`,
  `${m.key}:manage`,
]);

export function permString(module: string, action: PermissionAction): string {
  return `${module}:${action}`;
}

/** manage implies view */
export function hasPermission(
  granted: string[],
  module: string,
  action: PermissionAction
): boolean {
  if (granted.includes("*")) return true; // owner / admin wildcard
  if (granted.includes(`${module}:manage`)) return true;
  return granted.includes(`${module}:${action}`);
}

/**
 * Preset dashboard roles offered when creating a new distributed role.
 * These are suggestions; owners can fully customize.
 */
export const ROLE_PRESETS: { key: string; name: string; description: string; permissions: string[] }[] = [
  {
    key: "admin",
    name: "Admin",
    description: "Moderation, automod, logging, and tickets.",
    permissions: [
      "moderation:manage", "automod:manage", "logging:manage", "tickets:manage",
      "wordfilter:manage", "settings:view",
    ],
  },
  {
    key: "organizer",
    name: "Organizer",
    description: "Giveaways, events, and community features.",
    permissions: [
      "giveaways:manage", "welcome:manage", "goodbye:manage", "birthday:manage",
      "booster:manage", "selfrole:manage",
    ],
  },
  {
    key: "voice_manager",
    name: "Voice Manager",
    description: "Voice Master and voice channel settings.",
    permissions: ["voicemaster:manage"],
  },
  {
    key: "moderator",
    name: "Moderator",
    description: "Moderation actions and member management.",
    permissions: ["moderation:manage", "wordfilter:view"],
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access to the overview.",
    permissions: ["overview:view"],
  },
];
