import type { PlanTier } from "./plans";

/**
 * Snowy dashboard modules — derived from the bot command list.
 * Each module maps to a dashboard page and a set of underlying bot commands.
 * `minPlan` gates the module behind a subscription tier.
 * `permissionKey` is used by the distributed-roles permission system.
 */

export type ModuleCategory =
  | "overview"
  | "moderation"
  | "security"
  | "automation"
  | "community"
  | "music"
  | "utility"
  | "settings";

export interface DashboardModule {
  key: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: ModuleCategory;
  minPlan: PlanTier;
  commands: string[];
  href: string; // relative to /dashboard/[guildId]
}

export const MODULES: DashboardModule[] = [
  {
    key: "overview",
    name: "Overview",
    description: "Server overview, stats, and quick actions.",
    icon: "LayoutDashboard",
    category: "overview",
    minPlan: "FREE",
    commands: ["stats"],
    href: "",
  },
  {
    key: "moderation",
    name: "Moderation",
    description: "Warn, ban, kick, mute, purge, lock, and more.",
    icon: "ShieldCheck",
    category: "moderation",
    minPlan: "FREE",
    commands: [
      "warn", "ban", "unban", "kick", "mute", "unmute", "lock", "unlock",
      "lockall", "unlockall", "hide", "unhide", "purge", "cleanup", "slowmode",
      "nuke", "clone", "nick", "tempban", "hardban", "massban", "modhistory",
      "modsetup", "role", "roleicon", "recentbans", "newmembers",
    ],
    href: "/moderation",
  },
  {
    key: "automod",
    name: "Automod",
    description: "Automatic moderation, raid mode, and punishments.",
    icon: "Bot",
    category: "moderation",
    minPlan: "FREE",
    commands: ["automod", "automod enable", "automod disable", "automod logging", "automod raidmod", "automod view", "automod punishment"],
    href: "/automod",
  },
  {
    key: "antinuke",
    name: "Antinuke",
    description: "Server protection, whitelists, and extra owners.",
    icon: "Lock",
    category: "security",
    minPlan: "FREE",
    commands: ["antinuke", "whitelist", "unwhitelist", "whitelisted", "extraowner"],
    href: "/antinuke",
  },
  {
    key: "blacklistword",
    name: "Word Filter",
    description: "Blacklist words, bypasses, punishments, and violations.",
    icon: "Filter",
    category: "security",
    minPlan: "FREE",
    commands: ["blacklistword", "blacklistword add", "blacklistword remove", "blacklistword punishment", "blacklistword config"],
    href: "/wordfilter",
  },
  {
    key: "welcome",
    name: "Welcome",
    description: "Welcome messages, embeds, and auto roles.",
    icon: "DoorOpen",
    category: "community",
    minPlan: "FREE",
    commands: ["welcomer", "welcome toggle", "autorole", "autorole humans", "autorole bots", "autorole logchannel"],
    href: "/welcome",
  },
  {
    key: "goodbye",
    name: "Goodbye",
    description: "Goodbye messages and channel configuration.",
    icon: "DoorClosed",
    category: "community",
    minPlan: "FREE",
    commands: ["goodbye", "goodbye setup", "goodbye channel", "goodbye toggle", "goodbye reset"],
    href: "/goodbye",
  },
  {
    key: "joindm",
    name: "Join DM",
    description: "Direct messages sent to new members.",
    icon: "MailPlus",
    category: "community",
    minPlan: "FREE",
    commands: ["joindm", "joindm Setup", "joindm enable", "joindm disable", "joindm test"],
    href: "/joindm",
  },
  {
    key: "autonick",
    name: "AutoNick",
    description: "Automatic nickname templates for new members.",
    icon: "PenLine",
    category: "community",
    minPlan: "FREE",
    commands: ["autonick", "autonick enable", "autonick disable", "autonick excludeuser", "autonick excluderole"],
    href: "/autonick",
  },
  {
    key: "booster",
    name: "Booster",
    description: "Boost & unboost messages, embeds, and perks.",
    icon: "Sparkles",
    category: "community",
    minPlan: "PREMIUM",
    commands: ["booster", "booster setup", "booster boostmsg", "booster unboostmsg", "booster channel"],
    href: "/booster",
  },
  {
    key: "birthday",
    name: "Birthday",
    description: "Birthday tracking, messages, and stats.",
    icon: "Cake",
    category: "community",
    minPlan: "FREE",
    commands: ["birthday set", "birthday view", "birthday list", "birthday upcoming", "birthday config", "birthday stats"],
    href: "/birthday",
  },
  {
    key: "giveaways",
    name: "Giveaways",
    description: "Create, manage, and reroll giveaways.",
    icon: "Gift",
    category: "community",
    minPlan: "PREMIUM",
    commands: ["g start", "g end", "g reroll", "g list", "g editprize", "g editwinners", "g reqrole", "g winrole", "g info"],
    href: "/giveaways",
  },
  {
    key: "tickets",
    name: "Tickets",
    description: "Support ticket panels, claims, and transcripts.",
    icon: "Ticket",
    category: "community",
    minPlan: "FREE",
    commands: ["ticket setup", "ticket panel", "ticket stats", "ticket add-user", "ticket remove-user", "ticket transcript", "ticket close", "ticket claim"],
    href: "/tickets",
  },
  {
    key: "autoresponder",
    name: "Autoresponder",
    description: "Trigger and response automation.",
    icon: "MessagesSquare",
    category: "automation",
    minPlan: "FREE",
    commands: ["autoresponder", "autoresponder create", "autoresponder delete", "autoresponder edit", "autoresponder config"],
    href: "/autoresponder",
  },
  {
    key: "selfrole",
    name: "Self Roles",
    description: "Reaction and button self-assignable roles.",
    icon: "UserPlus",
    category: "automation",
    minPlan: "FREE",
    commands: ["selfrole", "selfrole create", "selfrole delete", "selfrole info", "selfrole list", "selfrole gender", "selfrole games"],
    href: "/selfrole",
  },
  {
    key: "media",
    name: "Media",
    description: "Media-only channels and bypass management.",
    icon: "Image",
    category: "automation",
    minPlan: "FREE",
    commands: ["media", "media setup", "media remove", "media config", "media bypass"],
    href: "/media",
  },
  {
    key: "music",
    name: "Music",
    description: "Lavalink music player, queue, and controls.",
    icon: "Music",
    category: "music",
    minPlan: "FREE",
    commands: ["play", "pause", "resume", "skip", "stop", "queue", "shuffle", "loop", "volume", "seek", "nowplaying", "247", "join", "disconnect"],
    href: "/music",
  },
  {
    key: "lavalink",
    name: "Lavalink",
    description: "Node health and music diagnostics.",
    icon: "Gauge",
    category: "music",
    minPlan: "FREE",
    commands: [],
    href: "/lavalink",
  },
  {
    key: "voice",
    name: "Voice",
    description: "Voice channel management and voice roles.",
    icon: "Mic",
    category: "music",
    minPlan: "FREE",
    commands: ["vc mute", "vc move", "vc disconnect", "vc limit", "vc bitrate", "vc region", "vc rename", "vc role", "vm setup"],
    href: "/voice",
  },
  {
    key: "logging",
    name: "Logging",
    description: "Event logging across your server.",
    icon: "ScrollText",
    category: "utility",
    minPlan: "FREE",
    commands: ["logging", "logging message", "logging member", "logging mod", "logging role", "logging channel", "logging server", "logging voice", "logging emoji", "logging webhook"],
    href: "/logging",
  },
  {
    key: "ai",
    name: "AI",
    description: "AI chatbot and image generation.",
    icon: "Brain",
    category: "utility",
    minPlan: "PREMIUM",
    commands: ["chatbot setup", "chatbot provider", "chatbot clear", "chatbot reset", "imagine"],
    href: "/ai",
  },
  {
    key: "general",
    name: "General & Setup",
    description: "AFK, polls, embeds, staff/VIP setup, and utilities.",
    icon: "Settings2",
    category: "utility",
    minPlan: "FREE",
    commands: ["afk", "poll", "embed", "setup", "staff", "vip", "guest", "membercount", "snipe"],
    href: "/general",
  },
  {
    key: "fun",
    name: "Fun",
    description: "Fun and social commands directory.",
    icon: "Smile",
    category: "utility",
    minPlan: "FREE",
    commands: ["slap", "hug", "kiss", "pat", "cry", "dance", "laugh", "ship", "iq", "cute", "fakeban", "fakekick"],
    href: "/fun",
  },
  {
    key: "utilities",
    name: "Server Utilities",
    description: "Info commands, ignore system, and banners.",
    icon: "Wrench",
    category: "utility",
    minPlan: "FREE",
    commands: ["serverinfo", "userinfo", "roleinfo", "channelinfo", "ping", "invite", "ignore", "unbanall", "banner"],
    href: "/utilities",
  },
  {
    key: "roles",
    name: "Permits",
    description: "Role-based permits and granular access control.",
    icon: "KeyRound",
    category: "settings",
    minPlan: "FREE",
    commands: [],
    href: "/permits",
  },
  {
    key: "settings",
    name: "Server Settings",
    description: "Prefix, general config, and retention.",
    icon: "Sliders",
    category: "settings",
    minPlan: "FREE",
    commands: ["prefix", "setup config", "setup reset"],
    href: "/settings",
  },
  {
    key: "billing",
    name: "Billing",
    description: "Subscription, plan, and invoices.",
    icon: "CreditCard",
    category: "settings",
    minPlan: "FREE",
    commands: [],
    href: "/billing",
  },
];

export const MODULE_MAP: Record<string, DashboardModule> = Object.fromEntries(
  MODULES.map((m) => [m.key, m])
);

export const SIDEBAR_GROUPS: { label: string; categories: ModuleCategory[] }[] = [
  { label: "General", categories: ["overview"] },
  { label: "Safety", categories: ["moderation", "security"] },
  { label: "Community", categories: ["community"] },
  { label: "Automation", categories: ["automation"] },
  { label: "Voice & Music", categories: ["music"] },
  { label: "Tools", categories: ["utility"] },
  { label: "Settings", categories: ["settings"] },
];

export function modulesByCategory(cat: ModuleCategory): DashboardModule[] {
  return MODULES.filter((m) => m.category === cat);
}
