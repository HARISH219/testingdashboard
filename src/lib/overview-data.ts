/**
 * Overview / analytics presentation data.
 *
 * The dashboard cannot compute live message counts, per-member activity, or
 * voice minutes without the bot service. Until that API is connected, we derive
 * stable, plausible figures from the real member count so the UI reads as a
 * finished product (and the values don't jump on every render). The UI clearly
 * labels this as demo data via the guild.demo flag. When the bot API is wired
 * up, replace these derivations with live values.
 */

export interface Metric {
  key: string;
  label: string;
  value: string;
  icon: string; // lucide name, resolved by the page
  tint: string; // tailwind text color class for the icon
  trend?: { dir: "up" | "down"; value: string };
  hint?: string;
}

export interface ActivityEvent {
  id: string;
  type: "join" | "leave" | "warn" | "ban" | "kick" | "command" | "role" | "channel";
  title: string;
  meta: string;
  user: string;
  ago: string;
}

export interface TopChannel { id: string; name: string; messages: number }
export interface TopMember { id: string; name: string; messages: number }

export function buildMetrics(memberCount: number): Metric[] {
  const online = Math.max(1, Math.round(memberCount * 0.27));
  const messagesToday = Math.round(memberCount * 20.8);
  const activeUsers = Math.max(1, Math.round(memberCount * 0.42));
  return [
    { key: "members", label: "Total Members", value: fmt(memberCount), icon: "Users", tint: "text-arctic", trend: { dir: "up", value: "+12%" }, hint: "+8 this month" },
    { key: "online", label: "Online", value: fmt(online), icon: "Wifi", tint: "text-success", trend: { dir: "down", value: "-27%" }, hint: `of ${fmt(memberCount)} members` },
    { key: "messages", label: "Messages Today", value: fmt(messagesToday), icon: "MessageSquare", tint: "text-arctic", trend: { dir: "up", value: "+18%" }, hint: "vs. yesterday" },
    { key: "commands", label: "Commands Today", value: "7", icon: "TerminalSquare", tint: "text-ice", trend: { dir: "up", value: "+40%" }, hint: "vs. yesterday" },
    { key: "channels", label: "Active Channels", value: "5", icon: "Hash", tint: "text-arctic", trend: { dir: "up", value: "+71%" }, hint: "of 7 channels" },
    { key: "active", label: "Active Users", value: fmt(activeUsers), icon: "UserCheck", tint: "text-ice", trend: { dir: "up", value: "+10%" }, hint: "sent messages today" },
    { key: "voice", label: "Members in Voice", value: "1", icon: "Volume2", tint: "text-purple-400", hint: "in voice channels" },
    { key: "modactions", label: "Moderation Actions", value: "248", icon: "ShieldAlert", tint: "text-amber-400", trend: { dir: "up", value: "+6%" }, hint: "last 30 days" },
  ];
}

export const RECENT_ACTIVITY: ActivityEvent[] = [
  { id: "1", type: "command", title: "used /help", meta: "#main-chat", user: "baunimon", ago: "10m ago" },
  { id: "2", type: "warn", title: "was warned", meta: "Reason: Spamming messages", user: "dransbeyan", ago: "28m ago" },
  { id: "3", type: "join", title: "joined the server", meta: "Account created 2 days ago", user: "nekci_44", ago: "1h ago" },
  { id: "4", type: "ban", title: "used /ban @user", meta: "#moderation", user: "spnibobayan", ago: "2h ago" },
  { id: "5", type: "leave", title: "left the server", meta: "Was a member for 3 months", user: "nexirpathad", ago: "3h ago" },
  { id: "6", type: "role", title: "was given VIP", meta: "by @Admin", user: "frostbyte", ago: "4h ago" },
  { id: "7", type: "kick", title: "was kicked", meta: "Reason: Rule 3", user: "trolluser", ago: "5h ago" },
];

export const TOP_CHANNELS: TopChannel[] = [
  { id: "1", name: "main-chat", messages: 77159 },
  { id: "2", name: "general-vc", messages: 8665 },
  { id: "3", name: "owo", messages: 3612 },
  { id: "4", name: "commands", messages: 2761 },
  { id: "5", name: "music-vc", messages: 2393 },
];

export const TOP_MEMBERS: TopMember[] = [
  { id: "1", name: "baunimon", messages: 18976 },
  { id: "2", name: "dransbeyan", messages: 8828 },
  { id: "3", name: "nekci_44", messages: 8053 },
  { id: "4", name: "spnibobayan", messages: 4626 },
  { id: "5", name: "nexirpathad", messages: 4541 },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return n.toLocaleString("en-US");
  return String(n);
}
