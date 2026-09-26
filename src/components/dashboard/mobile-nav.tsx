"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { ModuleIcon } from "./module-icon";
import { useGuild, useCan } from "./guild-context";
import { MODULES, SIDEBAR_GROUPS } from "@/lib/modules";
import { planMeets } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const guild = useGuild();
  const can = useCan();
  const pathname = usePathname();
  const base = `/dashboard/${guild.id}`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-white/10 bg-navy"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/" aria-label="Soward home" onClick={onClose} className="rounded-lg transition-opacity hover:opacity-80">
                <Logo />
              </Link>
              <button onClick={onClose} className="rounded-lg p-2 text-frost hover:bg-white/[0.06]" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-2">
              {SIDEBAR_GROUPS.map((group) => {
                const items = MODULES.filter((m) => group.categories.includes(m.category) && !m.hidden);
                if (items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </p>
                    {items.map((m) => {
                      const active = m.href === "" ? pathname === base : pathname.startsWith(base + m.href);
                      const locked = !planMeets(guild.tier, m.minPlan);
                      return (
                        <Link
                          key={m.key}
                          href={base + m.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm",
                            active ? "bg-primary/15 text-snow" : "text-frost hover:bg-white/[0.05]"
                          )}
                        >
                          <ModuleIcon name={m.icon} className={cn("size-4", active && "text-arctic")} />
                          <span className="flex-1">{m.name}</span>
                          {locked && <Lock className="size-3 text-muted-foreground/60" />}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
