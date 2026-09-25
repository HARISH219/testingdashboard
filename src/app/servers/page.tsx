"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Search, Plus, LogOut, ServerCrash, Check, Info, RefreshCw } from "lucide-react";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { GuildIcon } from "@/components/guild-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, cn } from "@/lib/utils";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  botInstalled: boolean;
  memberCount: number;
  manageable?: boolean;
}

export default function ServersPage() {
  const router = useRouter();
  const { status } = useSession();
  const [guilds, setGuilds] = React.useState<Guild[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [demo, setDemo] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("#");

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/guilds")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
        return r.json();
      })
      .then((data) => {
        setGuilds(data.guilds);
        setDemo(data.demo);
      })
      .catch((e) => setError(e.message));
    fetch("/api/invite-url").then((r) => r.json()).then((d) => setInviteUrl(d.url)).catch(() => {});
  }, [status]);

  const filtered = guilds?.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );
  // Priority order (stable within each tier so we never randomly reorder):
  //   1. Manageable + Soward installed  → the "Manage" servers you actually use
  //   2. Manageable + not installed      → "Invite Soward"
  //   3. Everything else (no access)
  const rank = (g: Guild) => (g.manageable && g.botInstalled ? 0 : g.manageable ? 1 : 2);
  const sorted = filtered ? [...filtered].sort((a, b) => rank(a) - rank(b)) : undefined;
  // Manageable = tiers 0 + 1 (shown at top); everything else below the divider.
  const manageableGuilds = sorted?.filter((g) => g.manageable) ?? [];
  const otherGuilds = sorted?.filter((g) => !g.manageable) ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={40} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />

      <header className="relative z-20 border-b border-white/[0.06]">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-snow">Select a server</h1>
          <p className="mt-2 text-frost">Choose a server to manage with Soward.</p>
          {demo && (
            <Badge variant="warning" className="mt-3">
              Demo mode — showing sample servers
            </Badge>
          )}
        </motion.div>

        <div className="mx-auto mb-8 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search servers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={() => location.reload()} title="Refresh server list">
            <RefreshCw className="size-4" />
          </Button>
        </div>

        {/* Loading */}
        {!guilds && !error && (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-9 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="mx-auto max-w-md p-8 text-center">
            <ServerCrash className="mx-auto mb-4 size-10 text-destructive" />
            <h3 className="font-semibold text-snow">Couldn&apos;t load your servers</h3>
            <p className="mt-1 break-words text-sm text-muted-foreground">{error}</p>
            <div className="mt-5 flex justify-center">
              <Button onClick={() => location.reload()}>Try again</Button>
            </div>
          </Card>
        )}

        {/* Bot not in any of the user's servers — the most common first-run snag */}
        {filtered && filtered.length > 0 && filtered.every((g) => !g.botInstalled) && (
          <Card className="mx-auto mb-6 max-w-2xl border-arctic/20 bg-arctic/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-arctic" />
              <div>
                <p className="text-sm font-medium text-snow">Add Soward to a server to begin</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You manage {filtered.length} server{filtered.length > 1 ? "s" : ""}, but Soward
                  isn&apos;t in {filtered.length > 1 ? "any of them" : "it"} yet. Use{" "}
                  <span className="text-frost">Invite Soward</span> below, then refresh this page.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty */}
        {filtered && filtered.length === 0 && (
          <Card className="mx-auto max-w-md p-8 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white/[0.05]">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-snow">No servers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? "No servers match your search."
                : "You don't manage any servers yet, or none are available."}
            </p>
          </Card>
        )}

        {/* Grid — manageable servers first, then the rest below a divider. */}
        {filtered && filtered.length > 0 && (
          <div className="mx-auto max-w-4xl space-y-6">
            {manageableGuilds.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {manageableGuilds.map((g, i) => (
                  <ServerCard key={g.id} g={g} i={i} inviteUrl={inviteUrl} />
                ))}
              </div>
            )}

            {otherGuilds.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Other servers
                  </span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherGuilds.map((g, i) => (
                    <ServerCard key={g.id} g={g} i={i} inviteUrl={inviteUrl} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * A single server card. Same design across both groups. Manageable servers get
 * Manage / Invite Soward actions; non-manageable ones show a subtle read-only
 * state (the user can't manage or invite there).
 */
function ServerCard({ g, i, inviteUrl }: { g: Guild; i: number; inviteUrl: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (i % 6) * 0.05 }}
    >
      <Card hover className={cn("flex h-full flex-col p-5", !g.manageable && "opacity-75")}>
        <div className="flex items-center gap-3">
          <GuildIcon id={g.id} name={g.name} icon={g.icon} size={48} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-snow">{g.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatNumber(g.memberCount)} members
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {g.owner && <Badge variant="secondary">Owner</Badge>}
          {g.manageable && g.botInstalled ? (
            <Badge variant="success">
              <Check className="size-3" /> Soward installed
            </Badge>
          ) : g.manageable ? (
            <Badge variant="outline">Not installed</Badge>
          ) : (
            <Badge variant="outline">No access</Badge>
          )}
        </div>
        <div className="mt-auto pt-4">
          {!g.manageable ? (
            <Button variant="secondary" className="w-full" disabled title="You don't have permission to manage this server">
              Can&apos;t manage
            </Button>
          ) : g.botInstalled ? (
            <Button asChild className="w-full">
              <Link href={`/dashboard/${g.id}`}>Manage</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="w-full">
              <a href={inviteUrl} target="_blank" rel="noreferrer">
                <Plus className="size-4" /> Invite Soward
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
