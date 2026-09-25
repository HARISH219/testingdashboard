"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PillTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  href?: string;
}

/**
 * Compact pill-style segmented tabs used across the dashboard (see design
 * system). Horizontally scrollable on mobile, animated active indicator,
 * optional per-tab count badge (e.g. "Modules 41").
 */
export function PillTabs({
  tabs,
  active,
  onChange,
  layoutId = "pill-tabs",
  className,
}: {
  tabs: PillTab[];
  active: string;
  onChange?: (key: string) => void;
  layoutId?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card/60 p-1",
        className
      )}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        const content = (
          <>
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="pointer-events-none absolute inset-0 rounded-full bg-white/[0.06] ring-1 ring-border"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    isActive ? "bg-primary/20 text-arctic" : "bg-white/[0.06] text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              )}
            </span>
          </>
        );
        const cls = cn(
          "relative flex min-h-[36px] items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
          isActive ? "text-snow" : "text-muted-foreground hover:text-frost"
        );
        return t.href ? (
          <Link key={t.key} href={t.href} className={cls}>{content}</Link>
        ) : (
          <button key={t.key} type="button" onClick={() => onChange?.(t.key)} className={cls}>{content}</button>
        );
      })}
    </div>
  );
}
