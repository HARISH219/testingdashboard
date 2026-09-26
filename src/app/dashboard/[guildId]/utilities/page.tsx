"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wrench, Moon, Eye, Search, ArrowRight, User, Server, Image as ImageIcon,
  Shield, Hash, Users, Clock, BarChart3, FileText, Timer, MessageSquare,
  Scissors, Lock,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/** Utility commands that map to real bot functionality. */
const COMMANDS: { name: string; description: string; usage?: string; icon: React.ReactNode }[] = [
  { name: "userinfo", description: "Detailed info about a member.", usage: "/userinfo @user", icon: <User className="size-4" /> },
  { name: "serverinfo", description: "Detailed server information.", icon: <Server className="size-4" /> },
  { name: "avatar", description: "Show a user's avatar.", usage: "/avatar @user", icon: <ImageIcon className="size-4" /> },
  { name: "banner", description: "Show a user or server banner.", icon: <ImageIcon className="size-4" /> },
  { name: "roleinfo", description: "Info about a role.", usage: "/roleinfo @role", icon: <Shield className="size-4" /> },
  { name: "channelinfo", description: "Info about a channel.", icon: <Hash className="size-4" /> },
  { name: "membercount", description: "Show the server member count.", icon: <Users className="size-4" /> },
  { name: "servericon", description: "Show the server icon.", icon: <ImageIcon className="size-4" /> },
  { name: "firstmessage", description: "Jump to the first message in a channel.", icon: <Clock className="size-4" /> },
  { name: "remind", description: "Set a personal reminder.", usage: "/remind 10m take a break", icon: <Timer className="size-4" /> },
  { name: "poll", description: "Create a reaction or button poll.", usage: "/poll question", icon: <BarChart3 className="size-4" /> },
  { name: "embed", description: "Build and send a custom embed.", icon: <FileText className="size-4" /> },
  { name: "timestamp", description: "Generate a Discord timestamp.", icon: <Clock className="size-4" /> },
  { name: "say", description: "Send a message as the bot.", usage: "/say hello", icon: <MessageSquare className="size-4" /> },
  { name: "nick", description: "Change a member's nickname.", usage: "/nick @user name", icon: <User className="size-4" /> },
  { name: "purge", description: "Bulk-delete messages.", usage: "/purge 50", icon: <Scissors className="size-4" /> },
  { name: "slowmode", description: "Set channel slowmode.", usage: "/slowmode 10s", icon: <Timer className="size-4" /> },
  { name: "lock", description: "Lock a channel.", icon: <Lock className="size-4" /> },
  { name: "unlock", description: "Unlock a channel.", icon: <Lock className="size-4" /> },
];

function FeatureCard({
  href,
  icon,
  title,
  desc,
  tint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  tint: string;
}) {
  return (
    <Link href={href} className="group">
      <Card hover className="h-full p-5">
        <div className="flex items-start justify-between">
          <div className={`grid size-11 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] ${tint}`}>
            {icon}
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-frost" />
        </div>
        <h3 className="mt-4 font-semibold text-snow">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </Card>
    </Link>
  );
}

function Inner() {
  const guild = useGuild();
  const base = `/dashboard/${guild.id}`;
  const [q, setQ] = React.useState("");
  const filtered = COMMANDS.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Utilities"
        description="Handy Discord management tools — AFK, Snipe, info commands, embeds, polls, reminders, and more."
        icon={<Wrench className="size-5" />}
      />

      {/* Configurable utility systems */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FeatureCard
          href={`${base}/utilities/afk`}
          icon={<Moon className="size-5" />}
          title="AFK System"
          desc="Set an AFK status with automatic mention responses and clear-on-return."
          tint="text-arctic"
        />
        <FeatureCard
          href={`${base}/utilities/snipe`}
          icon={<Eye className="size-5" />}
          title="Snipe"
          desc="View recently deleted and edited messages with retention controls."
          tint="text-ice"
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Utility commands</h2>
      </div>
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search commands…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.name} hover className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-arctic">
                {c.icon}
              </div>
              <Badge variant="secondary" className="font-mono">/{c.name}</Badge>
            </div>
            <p className="mt-2.5 text-sm text-frost">{c.description}</p>
            {c.usage && <p className="mt-1 font-mono text-xs text-muted-foreground">{c.usage}</p>}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No commands match.</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="utilities">
      <Inner />
    </ModuleGate>
  );
}
