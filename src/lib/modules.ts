import type { PlanTier } from "./plans";

/**
 * Soward dashboard modules — single source of truth for pages, sidebar nav,
 * icons, categories, and plan gating. Each module maps to a dashboard page and
 * a set of underlying bot commands. `minPlan` gates the module behind a tier.
 *
 * The sidebar and mobile drawer render purely from MODULES + SIDEBAR_GROUPS,
 * so structure changes here propagate everywhere. Music, AI, Fun and Lavalink
 * were intentionally removed — do not re-add them without a real backend.
 */

export type ModuleCategory =
  | "overview"
  | "moderation"
  | "security"
  | "community"
  | "automation"
  | "voice"
  | "server"
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
  /** Hidden from the sidebar (e.g. sub-pages reached from a parent page). */
  hidden?: boolean;
  /** Key of the parent module, for breadcrumbs / grouping of sub-pages. */
  parent?: string;
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

  /* ----------------------------- Moderation ----------------------------- */
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
    name: "AutoMod",
    description: "Advanced automatic moderation and protection modules.",
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
    category: "moderation",
    minPlan: "FREE",
    commands: ["antinuke", "whitelist", "unwhitelist", "whitelisted", "extraowner"],
    href: "/antinuke",
  },
  {
    key: "blacklistword",
    name: "Word Filter",
    description: "Blacklist words, bypasses, punishments, and violations.",
    icon: "Filter",
    category: "moderation",
    minPlan: "FREE",
    commands: ["blacklistword", "blacklistword add", "blacklistword remove", "blacklistword punishment", "blacklistword config"],
    href: "/wordfilter",
  },

  /* ------------------------------ Tickets ------------------------------- */
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

  /* ---------------------------- Voice Master ---------------------------- */
  {
    key: "voicemaster",
    name: "Voice Master",
    description: "Join-to-Create temporary voice channels and owner controls.",
    icon: "Mic",
    category: "voice",
    minPlan: "FREE",
    commands: ["vm setup", "vc rename", "vc lock", "vc unlock", "vc hide", "vc unhide", "vc limit", "vc bitrate", "vc region", "vc claim", "vc transfer", "vc kick"],
    href: "/voicemaster",
  },

  /* ------------------------------ Community ----------------------------- */
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

  /* ----------------------------- Automation ----------------------------- */
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
    key: "logging",
    name: "Logging",
    description: "Event logging across your server.",
    icon: "ScrollText",
    category: "automation",
    minPlan: "FREE",
    commands: ["logging", "logging message", "logging member", "logging mod", "logging role", "logging channel", "logging server", "logging voice", "logging emoji", "logging webhook"],
    href: "/logging",
  },

  /* ------------------------------ Utilities ----------------------------- */
  {
    key: "utilities",
    name: "Utilities",
    description: "AFK, Snipe, info tools, embeds, polls, and reminders.",
    icon: "Wrench",
    category: "utility",
    minPlan: "FREE",
    commands: [
      "afk", "snipe", "editsnipe", "userinfo", "serverinfo", "avatar", "banner",
      "roleinfo", "channelinfo", "membercount", "servericon", "firstmessage",
      "remind", "poll", "embed", "timestamp", "say", "nick", "purge", "slowmode",
      "lock", "unlock",
    ],
    href: "/utilities",
  },
  {
    key: "afk",
    name: "AFK",
    description: "Let members set an AFK status with mention responses.",
    icon: "Moon",
    category: "utility",
    minPlan: "FREE",
    commands: ["afk"],
    href: "/utilities/afk",
    hidden: true,
    parent: "utilities",
  },
  {
    key: "snipe",
    name: "Snipe",
    description: "View recently deleted and edited messages.",
    icon: "Eye",
    category: "utility",
    minPlan: "FREE",
    commands: ["snipe", "editsnipe"],
    href: "/utilities/snipe",
    hidden: true,
    parent: "utilities",
  },

  /* -------------------------- Server management ------------------------- */
  {
    key: "members",
    name: "Members",
    description: "Browse members, roles, and join dates.",
    icon: "Users",
    category: "server",
    minPlan: "FREE",
    commands: ["members", "userinfo", "membercount"],
    href: "/members",
  },
  {
    key: "channels",
    name: "Channels",
    description: "View and manage the server's channels.",
    icon: "Hash",
    category: "server",
    minPlan: "FREE",
    commands: ["channelinfo", "slowmode", "lock", "unlock"],
    href: "/channels",
  },
  {
    key: "analytics",
    name: "Analytics",
    description: "Message, member, and activity trends.",
    icon: "BarChart3",
    category: "server",
    minPlan: "FREE",
    commands: [],
    href: "/analytics",
  },

  /* ------------------------------- Settings ----------------------------- */
  {
    key: "custombot",
    name: "Custom Bot",
    description: "Customize the bot avatar, banner, and profile.",
    icon: "BotMessageSquare",
    category: "settings",
    minPlan: "FREE",
    commands: [],
    href: "/custom-bot",
  },
  {
    key: "setuproles",
    name: "Setup Roles",
    description: "Configure management roles: admin, staff, mod, VIP, and more.",
    icon: "UserCog",
    category: "settings",
    minPlan: "FREE",
    commands: ["setup", "staff", "vip", "guest"],
    href: "/setup-roles",
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
    key: "dashlogs",
    name: "Dashboard Logs",
    description: "See who changed settings in the dashboard.",
    icon: "ScrollText",
    category: "settings",
    minPlan: "FREE",
    commands: [],
    href: "/logs",
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
  { label: "Management", categories: ["settings", "server"] },
  { label: "Moderation", categories: ["moderation"] },
  { label: "Community", categories: ["community"] },
  { label: "Voice", categories: ["voice"] },
  { label: "Automation", categories: ["automation"] },
  { label: "Utilities", categories: ["utility"] },
];

export function modulesByCategory(cat: ModuleCategory): DashboardModule[] {
  return MODULES.filter((m) => m.category === cat && !m.hidden);
}
