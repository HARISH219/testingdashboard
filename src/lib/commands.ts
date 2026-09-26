import { MODULES, type DashboardModule, type ModuleCategory } from "./modules";

export type CommandCategory =
  | "General"
  | "Moderation"
  | "Security"
  | "Community"
  | "Automation"
  | "Music"
  | "Utility"
  | "Server"
  | "Owner";

export type PermissionLevel =
  | "Everyone"
  | "Moderator"
  | "Administrator"
  | "Server Owner";

export interface CommandOption {
  name: string;
  required: boolean;
  description: string;
}

export interface SnowyCommand {
  name: string;
  slug: string;
  description: string;
  detailedDescription: string;
  category: CommandCategory;
  icon: string;
  syntax: string;
  aliases: string[];
  permission?: string;
  access: PermissionLevel;
  options: CommandOption[];
  examples: string[];
  exampleOutput?: string;
  keywords: string[];
  moduleKey: string;
}

export const COMMAND_CATEGORY_ICONS: Record<CommandCategory, string> = {
  General: "Sparkles",
  Moderation: "ShieldCheck",
  Security: "Lock",
  Community: "Users",
  Automation: "Bot",
  Music: "Music",
  Utility: "Wrench",
  Server: "Server",
  Owner: "Crown",
};

export const COMMAND_CATEGORY_ORDER: CommandCategory[] = [
  "General",
  "Moderation",
  "Security",
  "Community",
  "Automation",
  "Music",
  "Utility",
  "Server",
  "Owner",
];

type CommandOverride = Partial<
  Omit<SnowyCommand, "name" | "slug" | "moduleKey" | "category" | "keywords">
> & { keywords?: string[] };

/** Rich metadata for commands where syntax/options need domain-specific detail. */
const OVERRIDES: Record<string, CommandOverride> = {
  help: {
    description: "Shows help information about Snowy.",
    detailedDescription:
      "Displays Snowy's available commands and usage information. Choose a category to narrow the list to a specific feature area.",
    icon: "CircleHelp",
    syntax: "/help [category]",
    options: [
      { name: "category", required: false, description: "The command category to display." },
    ],
    examples: ["/help", "/help moderation"],
    exampleOutput:
      "Help Menu\nUse /help <category> to browse moderation, music, utility, community, and security commands.",
  },
  ping: {
    description: "Shows Snowy's latency and response time.",
    detailedDescription:
      "Checks the round-trip latency between Discord and Snowy, plus the current WebSocket heartbeat.",
    icon: "Wifi",
    syntax: "/ping",
    examples: ["/ping"],
    exampleOutput: "Pong!\nAPI latency: 24ms\nWebSocket heartbeat: 18ms",
    keywords: ["latency", "response", "status", "health"],
  },
  invite: {
    description: "Gets Snowy's secure bot invite link.",
    detailedDescription:
      "Creates an OAuth2 invitation link you can use to add Snowy to a Discord server you manage.",
    icon: "Link",
    syntax: "/invite",
    examples: ["/invite"],
    keywords: ["add bot", "oauth", "install"],
  },
  stats: {
    description: "Shows current bot statistics.",
    icon: "BarChart3",
    syntax: "/stats",
    examples: ["/stats"],
    keywords: ["servers", "users", "uptime", "performance"],
  },
  ban: {
    description: "Bans a member from the server.",
    detailedDescription:
      "Permanently removes a member and prevents them from rejoining. Snowy records the moderator, reason, and timestamp in the moderation history.",
    icon: "Ban",
    syntax: "/ban <user> [reason]",
    aliases: ["banuser", "ban-member"],
    permission: "BAN_MEMBERS",
    access: "Moderator",
    options: [
      { name: "user", required: true, description: "The member to ban." },
      { name: "reason", required: false, description: "The reason for the ban." },
    ],
    examples: ["/ban @John", "/ban @John spam", "/ban @John repeated rule violations"],
    exampleOutput: "User banned successfully\n@John has been banned from the server.",
    keywords: ["user management", "remove member", "discipline"],
  },
  kick: {
    description: "Kicks a member from the server.",
    icon: "UserMinus",
    syntax: "/kick <user> [reason]",
    permission: "KICK_MEMBERS",
    access: "Moderator",
    options: [
      { name: "user", required: true, description: "The member to kick." },
      { name: "reason", required: false, description: "The reason for the kick." },
    ],
    examples: ["/kick @John", "/kick @John repeated spam"],
    exampleOutput: "Member kicked\n@John was removed from the server.",
  },
  warn: {
    description: "Issues a formal warning to a member.",
    icon: "TriangleAlert",
    syntax: "/warn <user> <reason>",
    access: "Moderator",
    options: [
      { name: "user", required: true, description: "The member to warn." },
      { name: "reason", required: true, description: "The reason for the warning." },
    ],
    examples: ["/warn @John excessive caps", "/warn @John rule 3"],
    keywords: ["infraction", "discipline", "user management"],
  },
  mute: {
    description: "Temporarily prevents a member from chatting.",
    icon: "VolumeX",
    syntax: "/mute <user> [duration] [reason]",
    permission: "MODERATE_MEMBERS",
    access: "Moderator",
    options: [
      { name: "user", required: true, description: "The member to mute." },
      { name: "duration", required: false, description: "How long the mute should last." },
      { name: "reason", required: false, description: "The moderation reason." },
    ],
    examples: ["/mute @John", "/mute @John 10m spam"],
    keywords: ["timeout", "silence", "user management"],
  },
  purge: {
    description: "Bulk deletes messages from a channel.",
    icon: "Trash2",
    syntax: "/purge <amount> [filter]",
    permission: "MANAGE_MESSAGES",
    access: "Moderator",
    options: [
      { name: "amount", required: true, description: "Number of messages to inspect and delete." },
      { name: "filter", required: false, description: "Optional content or author filter." },
    ],
    examples: ["/purge 25", "/purge 100 bots"],
  },
  slowmode: {
    description: "Sets a channel's message rate limit.",
    icon: "Timer",
    syntax: "/slowmode <duration>",
    permission: "MANAGE_CHANNELS",
    access: "Moderator",
    options: [{ name: "duration", required: true, description: "Delay between member messages." }],
    examples: ["/slowmode 10s", "/slowmode 1m"],
  },
  play: {
    description: "Plays a track or adds it to the queue.",
    detailedDescription:
      "Searches the configured Lavalink sources for a song, URL, or playlist and starts playback in your voice channel.",
    icon: "Play",
    syntax: "/play <query>",
    aliases: ["p"],
    options: [{ name: "query", required: true, description: "A track name, URL, or playlist URL." }],
    examples: ["/play snowfall", "/play https://youtu.be/example"],
    exampleOutput: "Added to queue\nSnowfall — Glacier",
    keywords: ["song", "audio", "youtube", "spotify", "lavalink"],
  },
  pause: {
    description: "Pauses the current track.",
    icon: "Pause",
    syntax: "/pause",
    examples: ["/pause"],
  },
  resume: {
    description: "Resumes paused playback.",
    icon: "Play",
    syntax: "/resume",
    examples: ["/resume"],
  },
  skip: {
    description: "Skips the current track.",
    icon: "SkipForward",
    syntax: "/skip",
    aliases: ["next"],
    examples: ["/skip"],
  },
  queue: {
    description: "Displays the current music queue.",
    icon: "ListMusic",
    syntax: "/queue [page]",
    aliases: ["q"],
    options: [{ name: "page", required: false, description: "Queue page to display." }],
    examples: ["/queue", "/queue 2"],
  },
  volume: {
    description: "Changes the music player's volume.",
    icon: "Volume2",
    syntax: "/volume <0-100>",
    options: [{ name: "level", required: true, description: "Volume percentage from 0 to 100." }],
    examples: ["/volume 65"],
  },
  poll: {
    description: "Creates an interactive community poll.",
    icon: "ChartNoAxesColumn",
    syntax: "/poll <question> <choices>",
    options: [
      { name: "question", required: true, description: "The question members will vote on." },
      { name: "choices", required: true, description: "Two or more answer choices." },
    ],
    examples: ["/poll What should we play? Minecraft | Valorant | Fortnite"],
  },
  imagine: {
    description: "Generates an image from a text prompt.",
    icon: "WandSparkles",
    syntax: "/imagine <prompt>",
    options: [{ name: "prompt", required: true, description: "A description of the image to generate." }],
    examples: ["/imagine a snowy castle beneath the northern lights"],
    keywords: ["ai", "image generation", "art"],
  },
  serverinfo: {
    description: "Shows detailed information about the server.",
    icon: "Server",
    syntax: "/serverinfo",
    examples: ["/serverinfo"],
    keywords: ["server information", "members", "boosts", "owner"],
  },
  userinfo: {
    description: "Shows detailed information about a member.",
    icon: "UserRoundSearch",
    syntax: "/userinfo [user]",
    options: [{ name: "user", required: false, description: "Member to inspect; defaults to you." }],
    examples: ["/userinfo", "/userinfo @John"],
    keywords: ["member information", "account", "roles"],
  },
  roleinfo: {
    description: "Shows detailed information about a role.",
    icon: "BadgeInfo",
    syntax: "/roleinfo <role>",
    options: [{ name: "role", required: true, description: "Role to inspect." }],
    examples: ["/roleinfo @Moderator"],
  },
  channelinfo: {
    description: "Shows detailed information about a channel.",
    icon: "Hash",
    syntax: "/channelinfo [channel]",
    options: [{ name: "channel", required: false, description: "Channel to inspect." }],
    examples: ["/channelinfo", "/channelinfo #general"],
  },
  avatar: {
    description: "Displays a member's avatar.",
    icon: "Image",
    syntax: "/avatar [user]",
    examples: ["/avatar", "/avatar @John"],
  },
  banner: {
    description: "Displays a member or server banner.",
    icon: "PanelsTopLeft",
    syntax: "/banner [user]",
    examples: ["/banner", "/banner @John"],
  },
  giveaway: {
    description: "Manages server giveaways.",
    icon: "Gift",
    syntax: "/g <action>",
    examples: ["/g start", "/g list"],
  },
};

const CATEGORY_MAP: Record<ModuleCategory, CommandCategory> = {
  overview: "General",
  moderation: "Moderation",
  security: "Security",
  automation: "Automation",
  community: "Community",
  voice: "Music",
  utility: "Utility",
  settings: "Owner",
};

const DESCRIPTION_BY_ACTION: Record<string, string> = {
  enable: "Enables this feature for the server.",
  disable: "Disables this feature for the server.",
  toggle: "Toggles this feature on or off.",
  setup: "Starts the guided setup for this feature.",
  config: "Shows or updates this feature's configuration.",
  settings: "Displays this feature's current settings.",
  list: "Lists the configured entries.",
  view: "Displays the current configuration.",
  status: "Shows the current status.",
  reset: "Resets this feature to its default configuration.",
  create: "Creates a new configuration entry.",
  delete: "Deletes a configured entry.",
  remove: "Removes a configured entry.",
  add: "Adds a new configuration entry.",
  test: "Sends a safe test using the current configuration.",
  sync: "Synchronizes the current state with Discord.",
  cleanup: "Cleans up stale configuration and records.",
  info: "Shows detailed information.",
  stats: "Shows usage and activity statistics.",
  clear: "Clears the current data safely.",
};

const DESCRIPTION_BY_BASE: Record<string, string> = {
  automod: "Configures Snowy's automatic moderation system.",
  antinuke: "Configures protection against destructive server actions.",
  whitelist: "Adds trusted users or roles to the security whitelist.",
  unwhitelist: "Removes users or roles from the security whitelist.",
  whitelisted: "Lists every trusted user and role on the whitelist.",
  extraowner: "Manages trusted extra server owners.",
  welcomer: "Configures welcome messages for new members.",
  welcome: "Controls the server's welcome system.",
  autorole: "Configures roles assigned automatically when members join.",
  goodbye: "Configures messages sent when members leave.",
  joindm: "Configures direct messages sent to new members.",
  autonick: "Configures automatic nickname formatting.",
  booster: "Configures boost and unboost announcements.",
  birthday: "Manages member birthdays and announcements.",
  g: "Manages server giveaways.",
  ticket: "Manages the server support ticket system.",
  activity: "Configures role rewards for active members.",
  autoresponder: "Manages trigger-and-response automations.",
  selfrole: "Manages self-assignable role panels.",
  media: "Configures media-only channels and bypasses.",
  logging: "Configures Discord event logging.",
  chatbot: "Configures Snowy's AI chatbot.",
  vc: "Manages members and settings in voice channels.",
  vm: "Sets up Snowy's voice management system.",
  blacklistword: "Manages the server's prohibited-word filter.",
  setup: "Manages Snowy's guided server setup.",
  prefix: "Changes the bot's legacy text-command prefix.",
  afk: "Sets or clears an AFK status.",
  embed: "Creates or edits a rich Discord embed.",
  staff: "Manages the configured staff role.",
  vip: "Manages the configured VIP role.",
  guest: "Manages the configured guest role.",
  ignore: "Manages channels, users, or roles ignored by Snowy.",
  slap: "Sends a playful slap interaction.",
  hug: "Sends a friendly hug interaction.",
  kiss: "Sends a playful kiss interaction.",
  pat: "Gives another member a friendly head pat.",
  cry: "Shares a crying reaction.",
  dance: "Shares a dancing reaction.",
  laugh: "Shares a laughing reaction.",
  ship: "Calculates a playful compatibility score between two members.",
  iq: "Generates a playful IQ score.",
  cute: "Generates a playful cuteness score.",
  fakeban: "Sends a harmless fake ban message.",
  fakekick: "Sends a harmless fake kick message.",
  role: "Manages member roles.",
  roleicon: "Changes a role's icon.",
  recentbans: "Lists the server's recent bans.",
  newmembers: "Lists members who joined recently.",
  modhistory: "Displays a member's moderation history.",
  modsetup: "Configures moderation roles and logging.",
  lock: "Locks the current channel.",
  unlock: "Unlocks the current channel.",
  hide: "Hides the current channel from members.",
  unhide: "Makes the current channel visible to members.",
  cleanup: "Removes Snowy's recent command responses.",
};

function commandCategory(module: DashboardModule): CommandCategory {
  if (module.key === "utilities" || module.key === "settings") return "Server";
  if (module.key === "general" || module.key === "fun" || module.key === "ai") {
    return module.key === "general" ? "General" : CATEGORY_MAP[module.category];
  }
  return CATEGORY_MAP[module.category];
}

function commandAccess(category: CommandCategory, moduleKey: string): PermissionLevel {
  if (category === "Owner" || moduleKey === "antinuke") return "Server Owner";
  if (category === "Moderation" || category === "Security") return "Moderator";
  if (["logging", "welcome", "goodbye", "tickets", "activity"].includes(moduleKey)) {
    return "Administrator";
  }
  return "Everyone";
}

function commandPermission(category: CommandCategory, moduleKey: string): string | undefined {
  if (category === "Moderation") return "MODERATE_MEMBERS";
  if (category === "Security" || moduleKey === "logging") return "MANAGE_GUILD";
  if (category === "Owner") return "ADMINISTRATOR";
  return undefined;
}

function friendlyDescription(rawName: string, module: DashboardModule): string {
  const [base, ...parts] = rawName.toLowerCase().split(/\s+/);
  const action = parts.at(-1);
  if (action && DESCRIPTION_BY_ACTION[action]) {
    return `${DESCRIPTION_BY_ACTION[action].replace("this feature", module.name)}`;
  }
  return DESCRIPTION_BY_BASE[base] ?? module.description;
}

function inferredSyntax(name: string): string {
  const lower = name.toLowerCase();
  if (/^(warn|ban|kick|mute|unmute|tempban|hardban)$/.test(lower)) {
    return `/${lower} <user> [reason]`;
  }
  if (/^(userinfo|avatar|banner|nick)$/.test(lower)) return `/${lower} [user]`;
  if (/^(play)$/.test(lower)) return `/${lower} <query>`;
  if (/^(volume|seek|slowmode)$/.test(lower)) return `/${lower} <value>`;
  if (/^(role|roleicon)$/.test(lower)) return `/${lower} <user-or-role>`;
  return `/${lower}`;
}

function commandSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCommand(name: string, module: DashboardModule): SnowyCommand {
  const normalized = name.toLowerCase().trim();
  const base = normalized.split(/\s+/)[0];
  const override = OVERRIDES[normalized] ?? OVERRIDES[base] ?? {};
  const category = commandCategory(module);
  const description = override.description ?? friendlyDescription(normalized, module);
  const syntax = override.syntax ?? inferredSyntax(normalized);
  const access = override.access ?? commandAccess(category, module.key);

  return {
    name: normalized,
    slug: commandSlug(normalized),
    description,
    detailedDescription:
      override.detailedDescription ??
      `${description} Use this command in a server where Snowy is installed. Access is checked against both Discord permissions and the server's Snowy configuration.`,
    category,
    icon: override.icon ?? module.icon,
    syntax,
    aliases: override.aliases ?? [],
    permission: override.permission ?? commandPermission(category, module.key),
    access,
    options: override.options ?? [],
    examples: override.examples ?? [syntax.replace(/<[^>]+>/g, "example").replace(/\s*\[[^\]]+\]/g, "")],
    exampleOutput: override.exampleOutput,
    keywords: Array.from(
      new Set([
        normalized,
        base,
        module.key,
        module.name.toLowerCase(),
        module.description.toLowerCase(),
        category.toLowerCase(),
        ...(override.aliases ?? []),
        ...(override.keywords ?? []),
      ])
    ),
    moduleKey: module.key,
  };
}

/**
 * Generated exclusively from MODULES, which is Snowy's supported command list.
 * No command can appear here unless it exists in that registry.
 */
export const COMMANDS: SnowyCommand[] = (() => {
  const seen = new Set<string>();
  return MODULES.flatMap((module) =>
    module.commands.map((name) => buildCommand(name, module))
  )
    .filter((command) => {
      if (!command.slug || seen.has(command.slug)) return false;
      seen.add(command.slug);
      return true;
    })
    .sort((a, b) =>
      COMMAND_CATEGORY_ORDER.indexOf(a.category) -
        COMMAND_CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name)
    );
})();

export const COMMAND_CATEGORIES = COMMAND_CATEGORY_ORDER.map((name) => ({
  name,
  icon: COMMAND_CATEGORY_ICONS[name],
  count: COMMANDS.filter((command) => command.category === name).length,
})).filter((category) => category.count > 0);

export function getCommand(slug: string): SnowyCommand | undefined {
  return COMMANDS.find((command) => command.slug === slug.toLowerCase());
}

export function searchCommands(query: string, category?: string): SnowyCommand[] {
  const q = query.trim().toLowerCase();
  return COMMANDS.filter((command) => {
    const categoryMatches =
      !category || category === "all" || command.category.toLowerCase() === category.toLowerCase();
    if (!categoryMatches) return false;
    if (!q) return true;
    return [
      command.name,
      command.description,
      command.detailedDescription,
      command.category,
      ...command.aliases,
      ...command.keywords,
    ].some((value) => value.toLowerCase().includes(q));
  });
}
