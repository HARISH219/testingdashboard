"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Hash, ScrollText, Menu } from "lucide-react";
import { useGuild } from "./guild-context";
import { cn } from "@/lib/utils";

/**
 * Fixed mobile bottom navigation (below 768px). Glass background, subtle top
 * border, safe-area padding, active blue indicator. "More" opens the full
 * navigation drawer owned by the shell.
 */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const guild = useGuild();
  const pathname = usePathname();
  const base = `/dashboard/${guild.id}`;

  const items = [
    { key: "home", label: "Home", icon: Home, href: base, exact: true },
    { key: "members", label: "Members", icon: Users, href: `${base}/members` },
    { key: "channels", label: "Channels", icon: Hash, href: `${base}/channels` },
    { key: "logs", label: "Logs", icon: ScrollText, href: `${base}/logs` },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-navy/80 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((it) => {
          const active = isActive(it.href, it.exact);
          const Icon = it.icon;
          return (
            <Link
              key={it.key}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-arctic" : "text-muted-foreground hover:text-frost"
              )}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-arctic" aria-hidden />}
              <Icon className="size-5" />
              {it.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-frost"
          aria-label="More navigation"
        >
          <Menu className="size-5" />
          More
        </button>
      </div>
    </nav>
  );
}
