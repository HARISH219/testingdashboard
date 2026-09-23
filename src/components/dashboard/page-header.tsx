"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useGuild } from "./guild-context";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Compact module header used across the dashboard (see design system):
 *   Breadcrumb (Dashboard > Module)
 *   [icon] Title                          [ Enabled ● ]
 *   Short description
 *
 * `PageHeader` keeps its original API (title/description/icon/actions) so every
 * existing module keeps working, and adds optional `breadcrumb` and a built-in
 * global enable switch via `enabled`/`onEnabledChange`.
 */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumb = true,
  enabled,
  onEnabledChange,
  enableLabel = "Enabled",
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  /** Show the "Dashboard > Title" breadcrumb (default true). */
  breadcrumb?: boolean;
  /** When provided, renders the global enable switch on the right. */
  enabled?: boolean;
  onEnabledChange?: (v: boolean) => void;
  enableLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      {breadcrumb && <Breadcrumb title={title} />}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.02] text-arctic">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-snow sm:text-2xl">{title}</h1>
            {description && <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {enabled !== undefined && onEnabledChange && (
            <EnablePill enabled={enabled} onChange={onEnabledChange} label={enableLabel} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Dashboard > Module breadcrumb. */
export function Breadcrumb({ title, items }: { title?: string; items?: { label: string; href?: string }[] }) {
  const guild = useGuild();
  const trail = items ?? [
    { label: "Dashboard", href: `/dashboard/${guild.id}` },
    ...(title ? [{ label: title }] : []),
  ];
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {trail.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-frost">{item.label}</Link>
          ) : (
            <span className="text-frost">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** The "Enabled ●" pill toggle from the reference. */
export function EnablePill({
  enabled,
  onChange,
  label = "Enabled",
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
        enabled ? "border-primary/40 bg-primary/10" : "border-border bg-white/[0.02]"
      )}
    >
      <span className={cn("text-xs font-medium", enabled ? "text-arctic" : "text-muted-foreground")}>
        {enabled ? label : "Disabled"}
      </span>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}
