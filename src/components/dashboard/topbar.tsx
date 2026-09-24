"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, ChevronRight, Menu, LogOut, User, CreditCard } from "lucide-react";
import { useGuild } from "./guild-context";
import { MODULES } from "@/lib/modules";
import { userAvatarUrl, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

function useBreadcrumb() {
  const guild = useGuild();
  const pathname = usePathname();
  const base = `/dashboard/${guild.id}`;
  const rest = pathname.replace(base, "");
  const mod = MODULES.find((m) => m.href !== "" && rest.startsWith(m.href));
  return mod?.name ?? "Overview";
}

export function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const guild = useGuild();
  const { data: session } = useSession();
  const crumb = useBreadcrumb();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const user = session?.user;
  const avatar = user
    ? userAvatarUrl(user.discordId, user.avatar, "0", 64)
    : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/[0.06] bg-navy/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenu}
          className="rounded-lg p-2 text-frost hover:bg-white/[0.06] md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href="/servers" className="shrink-0 text-muted-foreground hover:text-snow">
            Servers
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
          <span className="hidden max-w-[160px] truncate text-frost sm:inline">{guild.name}</span>
          <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:inline" />
          <span className="truncate font-medium text-snow">{crumb}</span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Live-sync status. "Online" when the bot API is reachable; otherwise
            a calm neutral "Live sync: off" rather than an alarming red
            "offline" (the bot itself may be running fine in Discord — this only
            reflects the optional dashboard↔bot API link). */}
        <Badge variant={guild.botOnline ? "success" : "secondary"} className="hidden sm:flex">
          <span className={cn("size-1.5 rounded-full", guild.botOnline ? "bg-success animate-pulse-glow" : "bg-muted-foreground")} />
          {guild.botOnline ? "Bot online" : "Live sync: off"}
        </Badge>
        <span
          className="grid size-9 place-items-center sm:hidden"
          title={guild.botOnline ? "Bot online" : "Live sync: off"}
          aria-label={guild.botOnline ? "Bot online" : "Live sync off"}
        >
          <span className={cn("size-2.5 rounded-full", guild.botOnline ? "bg-success animate-pulse-glow" : "bg-muted-foreground")} />
        </span>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative rounded-lg p-2 text-frost hover:bg-white/[0.06]"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-arctic" />
        </button>

        {/* User menu */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-1 pl-1 pr-2.5 hover:bg-white/[0.06]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className="size-7 rounded-lg" />
          <span className="hidden max-w-[120px] truncate text-sm text-snow sm:inline">
            {user?.globalName ?? user?.username}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-2 top-14 z-50 w-52 max-w-[calc(100vw-1rem)] rounded-xl border border-white/10 bg-popover p-1.5 shadow-glass backdrop-blur-xl sm:right-4">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-frost hover:bg-white/[0.06]"
              >
                <User className="size-4" /> Profile
              </Link>
              <Link
                href={`/dashboard/${guild.id}/billing`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-frost hover:bg-white/[0.06]"
              >
                <CreditCard className="size-4" /> Billing
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        <div className="space-y-2">
          {[
            { t: "Welcome to Soward", d: "Your dashboard is ready. Explore the modules on the left." },
            { t: "Live sync", d: guild.botOnline ? "Soward is connected to the dashboard." : "Live bot sync is off. Your bot can still run normally in Discord." },
          ].map((n, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-snow">{n.t}</p>
              <p className="text-xs text-muted-foreground">{n.d}</p>
            </div>
          ))}
        </div>
      </Dialog>
    </header>
  );
}
