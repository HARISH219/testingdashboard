"use client";
import { CommandDirectory } from "@/components/dashboard/command-directory";

const commands = [
  { name: "serverinfo", description: "Detailed server information." },
  { name: "userinfo", description: "Info about a member.", usage: "userinfo @user" },
  { name: "roleinfo", description: "Info about a role." },
  { name: "channelinfo", description: "Info about a channel." },
  { name: "vcinfo", description: "Info about a voice channel." },
  { name: "ping", description: "Check the bot's latency." },
  { name: "invite", description: "Get the bot invite link." },
  { name: "stats", description: "Bot statistics." },
  { name: "badges", description: "Show a user's badges." },
  { name: "banner", description: "Show a user or server banner." },
  { name: "unbanall", description: "Unban everyone (owner only, confirmed)." },
  { name: "ignore", description: "Ignore channels/users/roles from commands." },
];

export default function Page() {
  return <CommandDirectory moduleKey="utilities" commands={commands} />;
}
