"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Lock, ArrowLeftRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { ModuleIcon } from "./module-icon";
import { useGuild, useCan } from "./guild-context";
import { MODULES, SIDEBAR_GROUPS, type DashboardModule } from "@/lib/modules";
import { planMeets } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const guild = useGuild();
  const can = useCan();
  const pathname = usePathname();
  const base = `/dashboard/${guild.id}`;

  const isActive = (m: DashboardModule) => {
    const href = base + m.href;
    if (m.href === "") return pathname === base;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.06] bg-navy/40 backdrop-blur-xl transition-all duration-300 md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="Soward home" className="rounded-lg transition-opacity hover:opacity-80">
          {collapsed ? <Logo size="sm" showText={false} /> : <Logo />}
        </Link>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-snow"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Server switcher */}
      <Link
        href="/servers"
        className={cn(
          "mx-3 mb-2 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.06]",
          collapsed && "justify-center"
        )}
      >
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-arctic/15 text-xs font-bold text-arctic">
          {guild.name.slice(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-snow">{guild.name}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ArrowLeftRight className="size-3" /> Switch server
            </p>
          </div>
        )}
      </Link>

      <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {SIDEBAR_GROUPS.map((group) => {
          const items = MODULES.filter((m) => group.categories.includes(m.category));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((m) => {
                  const locked = !planMeets(guild.tier, m.minPlan);
                  const noAccess = !can(m.key, "view") && m.key !== "billing";
                  const disabled = locked || noAccess;
                  const active = isActive(m);

                  const iconAndLabel = (
                    <>
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute left-0 h-5 w-1 rounded-r-full bg-arctic"
                        />
                      )}
                      <ModuleIcon
                        name={m.icon}
                        className={cn("size-4 shrink-0", active ? "text-arctic" : "")}
                      />
                      {!collapsed && <span className="flex-1 truncate">{m.name}</span>}
                      {!collapsed && disabled && (
                        <Lock className="size-3 text-muted-foreground/50" />
                      )}
                    </>
                  );

                  // Disabled features are not clickable — render a static,
                  // dimmed row instead of a navigable link.
                  if (disabled) {
                    return (
                      <div
                        key={m.key}
                        title={locked ? `${m.name} — upgrade to unlock` : `${m.name} — no access`}
                        aria-disabled="true"
                        className={cn(
                          "group relative flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted-foreground/50",
                          collapsed && "justify-center"
                        )}
                      >
                        {iconAndLabel}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={m.key}
                      href={base + m.href}
                      title={m.name}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/15 text-snow"
                          : "text-frost hover:bg-white/[0.05] hover:text-snow",
                        collapsed && "justify-center"
                      )}
                    >
                      {iconAndLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/[0.06] p-3">
          <Badge variant={guild.tier === "FREE" ? "secondary" : "default"} className="w-full justify-center py-1">
            {guild.tier} plan
          </Badge>
        </div>
      )}
    </aside>
  );
}
