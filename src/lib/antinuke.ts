/**
 * Antinuke domain model.
 *
 * Implements the ACTION → LIMIT → WARNING → PUNISHMENT design:
 *   - Each watched action has its own config (enabled, limit, counter window,
 *     warning, punishment, protected/ignored roles & users).
 *   - Violations are counted per-user per-action within a time window.
 *   - When count reaches the limit → WARNING. The next violation → PUNISHMENT.
 *   - Counters reset after the configured window (or never).
 *
 * This file is the single source of truth for the action catalog, defaults,
 * and the pure decision function. The dashboard persists config via the
 * existing ModuleConfig JSON store; the bot enforces at runtime using the same
 * config. All punishment decisions are computed server-side — never trusted
 * from the client.
 */

/* -------------------------------------------------------------------------- */
/* Watched actions                                                            */
/* -------------------------------------------------------------------------- */

export type AntinukeActionKey =
  | "roleDelete"
  | "roleCreate"
  | "roleUpdate"
  | "channelDelete"
  | "channelCreate"
  | "channelUpdate"
  | "botAdd"
  | "vanityUrl"
  | "webhookCreate"
  | "webhookDelete"
  | "memberBan"
  | "memberKick"
  | "permissionUpdate"
  | "serverUpdate"
  | "emojiDelete"
  | "memberPrune";

export interface WatchedAction {
  key: AntinukeActionKey;
  label: string;
  description: string;
  icon: string; // lucide icon name
}

/** The full catalog of destructive actions Antinuke can watch. */
export const WATCHED_ACTIONS: WatchedAction[] = [
  { key: "roleDelete", label: "Role Delete", description: "Someone deletes server roles.", icon: "Trash2" },
  { key: "roleCreate", label: "Role Create", description: "Someone creates new roles.", icon: "Plus" },
  { key: "roleUpdate", label: "Role Update", description: "Someone edits role permissions.", icon: "PenLine" },
  { key: "channelDelete", label: "Channel Delete", description: "Someone deletes channels.", icon: "Trash2" },
  { key: "channelCreate", label: "Channel Create", description: "Someone creates channels.", icon: "Plus" },
  { key: "channelUpdate", label: "Channel Update", description: "Someone edits channel settings.", icon: "PenLine" },
  { key: "botAdd", label: "Bot Adds", description: "Someone adds a bot to the server.", icon: "Bot" },
  { key: "vanityUrl", label: "Vanity URL", description: "Someone changes the server vanity URL.", icon: "Link" },
  { key: "webhookCreate", label: "Webhook Create", description: "Someone creates webhooks.", icon: "Webhook" },
  { key: "webhookDelete", label: "Webhook Delete", description: "Someone deletes webhooks.", icon: "Webhook" },
  { key: "memberBan", label: "Ban", description: "Someone bans members.", icon: "Ban" },
  { key: "memberKick", label: "Kick", description: "Someone kicks members.", icon: "UserMinus" },
  { key: "permissionUpdate", label: "Permission Changes", description: "Someone changes permissions.", icon: "KeyRound" },
  { key: "serverUpdate", label: "Server Update", description: "Someone edits server settings.", icon: "Settings2" },
  { key: "emojiDelete", label: "Emoji Delete", description: "Someone deletes emojis.", icon: "Smile" },
  { key: "memberPrune", label: "Member Prune", description: "Someone prunes members.", icon: "Users" },
];

export const WATCHED_ACTION_MAP: Record<AntinukeActionKey, WatchedAction> = Object.fromEntries(
  WATCHED_ACTIONS.map((a) => [a.key, a])
) as Record<AntinukeActionKey, WatchedAction>;

/* -------------------------------------------------------------------------- */
/* Punishments                                                                */
/* -------------------------------------------------------------------------- */

export type Punishment = "ban" | "kick" | "strip" | "mute" | "logOnly";

export const PUNISHMENTS: { value: Punishment; label: string; emoji: string; description: string }[] = [
  { value: "ban", label: "Ban", emoji: "🔨", description: "Ban the offending member from the server." },
  { value: "kick", label: "Kick", emoji: "👢", description: "Kick the offending member." },
  { value: "strip", label: "Strip Roles", emoji: "🛡", description: "Remove the configured roles from the member." },
  { value: "mute", label: "Mute", emoji: "🔇", description: "Timeout the member for the configured duration." },
  { value: "logOnly", label: "Log Only", emoji: "📝", description: "Only record the event; take no action." },
];

export function punishmentLabel(p: Punishment): string {
  const meta = PUNISHMENTS.find((x) => x.value === p);
  return meta ? `${meta.emoji} ${meta.label}` : p;
}

/* -------------------------------------------------------------------------- */
/* Durations (mute) + counter windows                                         */
/* -------------------------------------------------------------------------- */

/** Duration options in seconds; 0 = custom handled elsewhere. */
export const MUTE_DURATIONS: { value: number; label: string }[] = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 3600, label: "1 hour" },
  { value: 21600, label: "6 hours" },
  { value: 86400, label: "1 day" },
  { value: 604800, label: "7 days" },
];

/** Counter window options in seconds; 0 = never reset. */
export const COUNTER_WINDOWS: { value: number; label: string }[] = [
  { value: 10, label: "10 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 3600, label: "1 hour" },
  { value: 86400, label: "24 hours" },
  { value: 0, label: "Never" },
];

/* -------------------------------------------------------------------------- */
/* Per-action config + full module config                                     */
/* -------------------------------------------------------------------------- */

export interface ActionConfig {
  enabled: boolean;
  /** Violations allowed before the WARNING stage fires (limit reached → warn). */
  limit: number;
  /** Seconds before a user's counter for this action resets. 0 = never. */
  counterWindow: number;
  warningEnabled: boolean;
  /** Empty string = use the default warning template. */
  warningMessage: string;
  punishment: Punishment;
  /** Mute duration in seconds (only used when punishment === "mute"). */
  punishmentDuration: number;
  /** Roles/users that are exempt from THIS action specifically. */
  protectedRoles: string[]; // roles that must never be targeted (context for bot)
  ignoredRoles: string[]; // actors with these roles bypass this action
  ignoredUsers: string[]; // actor user ids that bypass this action
}

export interface AntinukeConfig extends Record<string, unknown> {
  /** Channel where security events are reported. */
  logChannel: string;
  /** Users that bypass all antinuke punishment. */
  trustedUsers: string[];
  /** Roles that bypass all antinuke punishment. */
  trustedRoles: string[];
  /** Optional DM sent after a punishment; empty = default template. */
  punishmentMessage: string;
  /** Per-action configuration keyed by action key. */
  actions: Record<AntinukeActionKey, ActionConfig>;
}

/** Sensible per-action starting point. */
export function defaultActionConfig(overrides: Partial<ActionConfig> = {}): ActionConfig {
  return {
    enabled: false,
    limit: 1,
    counterWindow: 600,
    warningEnabled: true,
    warningMessage: "",
    punishment: "ban",
    punishmentDuration: 3600,
    protectedRoles: [],
    ignoredRoles: [],
    ignoredUsers: [],
    ...overrides,
  };
}

/** Full default module config with every watched action present. */
export function defaultAntinukeConfig(): AntinukeConfig {
  const actions = Object.fromEntries(
    WATCHED_ACTIONS.map((a) => [a.key, defaultActionConfig()])
  ) as Record<AntinukeActionKey, ActionConfig>;
  return {
    logChannel: "",
    trustedUsers: [],
    trustedRoles: [],
    punishmentMessage: "",
    actions,
  };
}

/**
 * Merge a persisted (possibly partial / older) config onto the defaults so the
 * UI always has every action present even if the stored blob predates a new
 * action being added.
 */
export function normalizeConfig(raw: Partial<AntinukeConfig> | undefined): AntinukeConfig {
  const base = defaultAntinukeConfig();
  if (!raw) return base;
  const actions = { ...base.actions };
  if (raw.actions) {
    for (const a of WATCHED_ACTIONS) {
      const stored = raw.actions[a.key];
      if (stored) actions[a.key] = { ...base.actions[a.key], ...stored };
    }
  }
  return {
    logChannel: raw.logChannel ?? base.logChannel,
    trustedUsers: raw.trustedUsers ?? base.trustedUsers,
    trustedRoles: raw.trustedRoles ?? base.trustedRoles,
    punishmentMessage: raw.punishmentMessage ?? base.punishmentMessage,
    actions,
  };
}

/* -------------------------------------------------------------------------- */
/* Warning / punishment message templates                                     */
/* -------------------------------------------------------------------------- */

export const DEFAULT_WARNING_TEMPLATE = [
  "⚠️ **Security Warning**",
  "",
  "You have reached the configured limit for: **{action}**",
  "",
  "Current violations: **{count}**",
  "Limit: **{limit}**",
  "",
  "Your next violation will result in: **{punishment}**",
  "",
  "Server: {server}",
].join("\n");

export const DEFAULT_PUNISHMENT_TEMPLATE = [
  "🚨 **SOWARD Security Action**",
  "",
  "You have been punished for exceeding the security limit.",
  "",
  "Action: **{action}**",
  "Violations: **{count}**",
  "Configured limit: **{limit}**",
  "Punishment: **{punishment}**",
  "",
  "Server: {server}",
].join("\n");

export interface MessageVars {
  user?: string;
  username?: string;
  server?: string;
  action?: string;
  count?: number | string;
  limit?: number | string;
  punishment?: string;
  timestamp?: string;
}

/** Substitute {tokens} in a template. Unknown tokens are left as-is. */
export function renderMessage(template: string, vars: MessageVars): string {
  const dict: Record<string, string> = {
    user: vars.user ?? "@user",
    username: vars.username ?? "user",
    server: vars.server ?? "this server",
    action: vars.action ?? "an action",
    count: String(vars.count ?? 0),
    limit: String(vars.limit ?? 0),
    punishment: vars.punishment ?? "a punishment",
    timestamp: vars.timestamp ?? new Date().toLocaleString(),
  };
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in dict ? dict[key] : m));
}

export const MESSAGE_VARIABLES: { token: string; desc: string }[] = [
  { token: "{user}", desc: "Mention of the offending user" },
  { token: "{username}", desc: "Their username" },
  { token: "{server}", desc: "Server name" },
  { token: "{action}", desc: "The watched action" },
  { token: "{count}", desc: "Current violation count" },
  { token: "{limit}", desc: "Configured limit" },
  { token: "{punishment}", desc: "Configured punishment" },
  { token: "{timestamp}", desc: "When it happened" },
];

/* -------------------------------------------------------------------------- */
/* Decision logic (pure, server-side)                                         */
/* -------------------------------------------------------------------------- */

export type Decision = "allow" | "warn" | "punish";

/**
 * Given the current per-user per-action counter state and this action's config,
 * decide the outcome of the NEXT violation.
 *
 * Design (from the spec):
 *   count < limit           → allow  (keep monitoring)
 *   count === limit         → warn
 *   count > limit           → punish
 * where `count` is the number of violations INCLUDING the current one.
 *
 * Callers must first apply the counter-window reset (see `isExpired`) and check
 * trusted/ignored bypass before calling this.
 */
export function decide(countIncludingCurrent: number, cfg: ActionConfig): Decision {
  if (!cfg.enabled) return "allow";
  if (countIncludingCurrent < cfg.limit) return "allow";
  if (countIncludingCurrent === cfg.limit) return cfg.warningEnabled ? "warn" : "punish";
  return "punish";
}

/** Whether a stored counter has expired given its window (seconds). */
export function isExpired(lastViolationMs: number, windowSeconds: number, nowMs = Date.now()): boolean {
  if (windowSeconds <= 0) return false; // never resets
  return nowMs - lastViolationMs > windowSeconds * 1000;
}
