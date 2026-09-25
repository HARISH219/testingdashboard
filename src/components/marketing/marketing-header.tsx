"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Commands", href: "/commands", match: (p: string) => p.startsWith("/commands") },
  { label: "Features", href: "/#features", match: (p: string) => p === "/" },
  { label: "Pricing", href: "/pricing", match: (p: string) => p === "/pricing" },
  { label: "Documentation", href: "/commands", match: (p: string) => false },
];

/**
 * Floating glass navbar used across all marketing pages. Pill-shaped, blurred,
 * blue-glow active state, with a full mobile drawer (hamburger) below `lg`.
 */
export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 sm:pt-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-pill mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl px-3 sm:h-16 sm:rounded-full sm:px-4"
      >
        <Link href="/" aria-label="Soward home" className="shrink-0">
          <Logo size="sm" className="sm:hidden" />
          <Logo className="hidden sm:flex" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm transition-colors",
                  active ? "text-snow" : "text-frost hover:text-snow"
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-arctic shadow-glow-sm"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm" className="glow-btn hidden rounded-full sm:inline-flex">
            <Link href="/servers">
              Open Dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-snow lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-strong mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl p-2 lg:hidden"
            aria-label="Mobile navigation"
          >
            {links.map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-xl px-4 text-sm transition-colors",
                    active ? "bg-primary/15 text-snow" : "text-frost hover:bg-white/[0.06] hover:text-snow"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button asChild className="glow-btn mt-2 w-full rounded-xl">
              <Link href="/servers">Open Dashboard <ArrowRight className="size-4" /></Link>
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
