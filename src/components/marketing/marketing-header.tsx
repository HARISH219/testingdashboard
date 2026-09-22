"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/logo";
import { DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Features", href: "/#features", match: (path: string) => path === "/" },
  { label: "Pricing", href: "/pricing", match: (path: string) => path === "/pricing" },
  { label: "Dashboard", href: "/servers", match: (path: string) => path.startsWith("/dashboard") || path === "/servers" },
  { label: "Commands", href: "/commands", match: (path: string) => path.startsWith("/commands") },
];

export function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className="relative z-40 border-b border-white/[0.05] bg-navy/35 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-3 sm:h-20">
        <Link href="/" aria-label="Snowy home" className="shrink-0">
          <Logo size="sm" className="sm:hidden" />
          <Logo className="hidden sm:flex" />
        </Link>

        <nav className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm transition-all",
                  active
                    ? "border border-arctic/25 bg-arctic/10 text-snow shadow-glow-sm"
                    : "border border-transparent text-frost hover:bg-white/[0.05] hover:text-snow"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Keep Commands reachable on phone where the centre nav collapses. */}
          <Button
            asChild
            variant={pathname.startsWith("/commands") ? "secondary" : "ghost"}
            size="icon-sm"
            className="lg:hidden"
          >
            <Link href="/commands" aria-label="Commands" aria-current={pathname.startsWith("/commands") ? "page" : undefined}>
              <BookOpenText className="size-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
            <Link href="/servers">
              <LayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="px-2.5 sm:px-3">
            <Link href="/login">
              <DiscordIcon className="size-4" />
              <span className="hidden xs:inline">Login</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
