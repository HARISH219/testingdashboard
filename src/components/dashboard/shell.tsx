"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { BottomNav } from "./bottom-nav";
import { GuildProvider, type GuildContextValue } from "./guild-context";
import { DirtyStateProvider } from "./dirty-state";
import { GlobalSaveBar } from "./global-save-bar";

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
      <DirtyStateProvider>
        <div className="relative flex min-h-screen">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <Topbar onMobileMenu={() => setMobileOpen(true)} />
            <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 md:p-6 md:pb-6 lg:p-8">{children}</main>
          </div>
        </div>
        {/* Fixed mobile bottom navigation (<768px). */}
        <BottomNav onMore={() => setMobileOpen(true)} />
        {/* One floating save bar for the whole dashboard. */}
        <GlobalSaveBar />
      </DirtyStateProvider>
    </GuildProvider>
  );
}
