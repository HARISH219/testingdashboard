/**
 * AutoMod protection model.
 *
 * The dashboard stores one JSON blob under ModuleConfig("automod").data. It
 * holds a top-level `logChannelId` plus a `protections` map keyed by protection
 * id. Each protection has a common shape (enabled + action + ignore lists) and
 * a small set of protection-specific fields. This keeps every protection
 * configurable without a schema migration and lets the bot enforce them
 * uniformly at runtime.
 */

export type AutomodAction = "delete" | "warn" | "timeout" | "kick" | "ban";

export const AUTOMOD_ACTIONS: { value: AutomodAction; label: string }[] = [
  { value: "delete", label: "Delete message" },
  { value: "warn", label: "Warn user" },
  { value: "timeout", label: "Timeout" },
  { value: "kick", label: "Kick" },
  { value: "ban", label: "Ban" },
];

export const TIMEOUT_DURATIONS: { value: number; label: string }[] = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 1800, label: "30 minutes" },
  { value: 3600, label: "1 hour" },
  { value: 86400, label: "1 day" },
];

/** Fields common to every protection. */
export interface BaseProtection {
  enabled: boolean;
  action: AutomodAction;
  timeoutSeconds: number;
  warnThreshold: number;
  ignoreAdmins: boolean;
  ignoreModerators: boolean;
  ignoredRoles: string[];
  ignoredChannels: string[];
  /** Extra per-protection numeric/string/array fields. */
  [key: string]: unknown;
}

export type ProtectionId =
  | "antiSpam"
  | "antiLink"
  | "antiMention"
  | "antiCaps"
  | "badWords"
  | "duplicate"
  | "raid"
  | "invite"
  | "massMention"
  | "emojiSpam"
  | "repeatedChars"
  | "attachmentSpam";

export interface ProtectionMeta {
  id: ProtectionId;
  name: string;
  description: string;
  icon: string; // lucide name
  /** Extra fields with their defaults, beyond the base protection. */
  extraDefaults: Record<string, unknown>;
}

export const PROTECTIONS: ProtectionMeta[] = [
  {
    id: "antiSpam",
    name: "Anti-Spam",
    description: "Detects users sending too many messages in a short period.",
    icon: "Gauge",
    extraDefaults: { messageThreshold: 5, windowSeconds: 5 },
  },
  {
    id: "antiLink",
    name: "Anti-Link",
    description: "Blocks links and invites based on your rules.",
    icon: "Link",
    extraDefaults: {
      blockAll: false,
      blockInvites: true,
      blockExternal: true,
      whitelistDomains: [] as string[],
    },
  },
  {
    id: "antiMention",
    name: "Anti-Mention Spam",
    description: "Punishes users who mention too many people at once.",
    icon: "AtSign",
    extraDefaults: { mentionThreshold: 5 },
  },
  {
    id: "antiCaps",
    name: "Anti-Caps",
    description: "Flags messages that are mostly uppercase.",
    icon: "CaseUpper",
    extraDefaults: { capsPercentage: 70, minLength: 10 },
  },
  {
    id: "badWords",
    name: "Bad Words",
    description: "Filters messages containing blacklisted words.",
    icon: "Filter",
    extraDefaults: { words: [] as string[], fuzzy: true },
  },
  {
    id: "duplicate",
    name: "Duplicate Messages",
    description: "Stops users repeating the same message.",
    icon: "Copy",
    extraDefaults: { repeatThreshold: 3, windowSeconds: 15 },
  },
  {
    id: "raid",
    name: "Raid Protection",
    description: "Auto-locks the server during a join spike.",
    icon: "ShieldAlert",
    extraDefaults: { joinThreshold: 10, windowSeconds: 10, lockdown: true },
  },
  {
    id: "invite",
    name: "Invite Protection",
    description: "Removes Discord invite links from messages.",
    icon: "Send",
    extraDefaults: { allowOwnServer: true },
  },
  {
    id: "massMention",
    name: "Mass Mention Protection",
    description: "Blocks @everyone / @here abuse and role mention floods.",
    icon: "Megaphone",
    extraDefaults: { blockEveryone: true, roleMentionThreshold: 3 },
  },
  {
    id: "emojiSpam",
    name: "Emoji Spam",
    description: "Detects messages stuffed with emojis.",
    icon: "Smile",
    extraDefaults: { emojiThreshold: 10 },
  },
  {
    id: "repeatedChars",
    name: "Repeated Characters",
    description: "Flags messages with long runs of the same character.",
    icon: "Repeat",
    extraDefaults: { charThreshold: 10 },
  },
  {
    id: "attachmentSpam",
    name: "Attachment Spam",
    description: "Limits how many attachments can be posted quickly.",
    icon: "Paperclip",
    extraDefaults: { attachmentThreshold: 5, windowSeconds: 10 },
  },
];

export const PROTECTION_MAP: Record<ProtectionId, ProtectionMeta> = Object.fromEntries(
  PROTECTIONS.map((p) => [p.id, p])
) as Record<ProtectionId, ProtectionMeta>;

export function baseProtectionDefaults(): BaseProtection {
  return {
    enabled: false,
    action: "delete",
    timeoutSeconds: 600,
    warnThreshold: 3,
    ignoreAdmins: true,
    ignoreModerators: true,
    ignoredRoles: [],
    ignoredChannels: [],
  };
}

export interface AutomodConfig extends Record<string, unknown> {
  logChannelId: string;
  protections: Record<string, BaseProtection>;
}

/** Build a complete default automod config (all protections present). */
export function defaultAutomodConfig(): AutomodConfig {
  const protections: Record<string, BaseProtection> = {};
  for (const p of PROTECTIONS) {
    protections[p.id] = { ...baseProtectionDefaults(), ...p.extraDefaults };
  }
  // Sensible defaults on for common protections.
  protections.antiSpam.enabled = true;
  protections.invite.enabled = true;
  protections.massMention.enabled = true;
  return { logChannelId: "", protections };
}

/** Merge a stored (possibly partial) config with complete defaults. */
export function normalizeAutomodConfig(input?: Partial<AutomodConfig>): AutomodConfig {
  const base = defaultAutomodConfig();
  if (!input) return base;
  const protections = { ...base.protections };
  const stored = input.protections ?? {};
  for (const p of PROTECTIONS) {
    protections[p.id] = {
      ...base.protections[p.id],
      ...(stored[p.id] ?? {}),
    };
  }
  return {
    logChannelId: typeof input.logChannelId === "string" ? input.logChannelId : base.logChannelId,
    protections,
  };
}
