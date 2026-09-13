"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { GuildProvider, type GuildContextValue } from "./guild-context";
import { Snowfall } from "@/components/snowfall";

export function DashboardShell({
  guild,
  children,
}: {
  guild: GuildContextValue;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <GuildProvider value={guild}>
      <div className="relative flex min-h-screen">
        <Snowfall density={22} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-40" />
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <Topbar onMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </GuildProvider>
  );
}
