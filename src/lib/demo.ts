/**
 * Demo fixtures — used ONLY when DEMO_MODE is active (no Discord credentials).
 * All demo data is clearly labeled in the UI. Once real credentials are set,
 * the app uses live Discord + database data instead.
 */
import type { DiscordGuild, DiscordUser } from "./discord";

export const DEMO_USER: DiscordUser = {
  id: "100000000000000001",
  username: "frostadmin",
  global_name: "Frost",
  avatar: null,
  email: "demo@snowy.app",
};

export const DEMO_GUILDS: (DiscordGuild & { botInstalled: boolean; memberCount: number })[] = [
  {
    id: "900000000000000001",
    name: "Winterfell Community",
    icon: null,
    owner: true,
    permissions: "8",
    botInstalled: true,
    memberCount: 1284,
    approximate_presence_count: 342,
  },
  {
    id: "900000000000000002",
    name: "Arctic Gamers",
    icon: null,
    owner: false,
    permissions: "32",
    botInstalled: true,
    memberCount: 8642,
    approximate_presence_count: 1203,
  },
  {
    id: "900000000000000003",
    name: "Frostbyte Devs",
    icon: null,
    owner: false,
    permissions: "8",
    botInstalled: false,
    memberCount: 452,
    approximate_presence_count: 98,
  },
];

export function demoChannels() {
  return [
    { id: "800000000000000001", name: "general", type: 0 },
    { id: "800000000000000002", name: "welcome", type: 0 },
    { id: "800000000000000003", name: "mod-logs", type: 0 },
    { id: "800000000000000004", name: "announcements", type: 0 },
    { id: "800000000000000005", name: "music", type: 2 },
    { id: "800000000000000006", name: "General VC", type: 2 },
  ];
}

export function demoRoles() {
  return [
    { id: "700000000000000001", name: "@everyone", color: 0, position: 0 },
    { id: "700000000000000002", name: "Member", color: 3447003, position: 1 },
    { id: "700000000000000003", name: "Moderator", color: 5763719, position: 5 },
    { id: "700000000000000004", name: "Admin", color: 15548997, position: 8 },
    { id: "700000000000000005", name: "Loverswilla", color: 15277667, position: 6 },
    { id: "700000000000000006", name: "VIP", color: 16776960, position: 4 },
  ];
}

export const DEMO_MOD_ACTIONS = [
  { id: "1", type: "ban", targetTag: "raider#0001", moderatorId: "Frost", reason: "Spam/raid", createdAt: new Date(Date.now() - 1000 * 60 * 12) },
  { id: "2", type: "mute", targetTag: "loudmouth#4521", moderatorId: "Aurora", reason: "Excessive caps", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "3", type: "warn", targetTag: "newbie#9987", moderatorId: "Frost", reason: "Off-topic", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: "4", type: "kick", targetTag: "troll#0000", moderatorId: "Blizzard", reason: "Rule 3", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26) },
];

export const DEMO_NOW_PLAYING = {
  title: "Frostbite (Extended Mix)",
  author: "Aurora Skies",
  duration: 254,
  position: 78,
  artwork: null as string | null,
  paused: false,
  volume: 65,
  loop: "off" as "off" | "track" | "queue",
  channel: "General VC",
};

export const DEMO_QUEUE = [
  { title: "Snowfall", author: "Glacier", duration: 198 },
  { title: "Northern Lights", author: "Polar", duration: 221 },
  { title: "Ice Palace", author: "Aurora Skies", duration: 187 },
];

export const DEMO_LAVALINK = {
  nodes: [
    {
      name: "snowy-node-1",
      connected: true,
      status: "Healthy" as const,
      players: 3,
      activePlayers: 1,
      uptimeMs: 1000 * 60 * 60 * 52,
      cpu: 12.4,
      memoryUsedMb: 342,
      memoryTotalMb: 1024,
      pingMs: 24,
      reconnects: 0,
    },
    {
      name: "snowy-node-2",
      connected: true,
      status: "Warning" as const,
      players: 1,
      activePlayers: 0,
      uptimeMs: 1000 * 60 * 60 * 9,
      cpu: 41.8,
      memoryUsedMb: 780,
      memoryTotalMb: 1024,
      pingMs: 96,
      reconnects: 2,
    },
  ],
  errors: [
    { at: new Date(Date.now() - 1000 * 60 * 30), level: "warn", message: "Track load slow on node-2 (query: 'lofi mix')" },
    { at: new Date(Date.now() - 1000 * 60 * 120), level: "error", message: "Voice connection reset on guild 900...001, auto-reconnected" },
  ],
};
