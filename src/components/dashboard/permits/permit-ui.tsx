"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, Crown, Users, Gavel, Headset, Lock,
  Key, Star, Sparkles, Bot, Zap, Ticket, Flag, MoreVertical, Check,
  LayoutDashboard, Music, Wrench, Sliders, ArrowRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Permit } from "@/lib/permits";

/* -------------------------------------------------------------------------- */
/* Icon glyph — covers the full permit + category icon vocabulary             */
/* -------------------------------------------------------------------------- */

const GLYPHS: Record<string, LucideIcon> = {
  Shield, ShieldCheck, ShieldAlert, Crown, Users, Gavel, Headset, Lock,
  Key, Star, Sparkles, Bot, Zap, Ticket, Flag,
  LayoutDashboard, Music, Wrench, Sliders,
};

export function PermitGlyph({ name, className }: { name: string; className?: string }) {
  const Icon = GLYPHS[name] ?? Shield;
  return <Icon className={className} />;
}

/* -------------------------------------------------------------------------- */
/* Tabs — smooth animated active indicator                                    */
/* -------------------------------------------------------------------------- */

export interface PermitTab {
  key: string;
  label: string;
  href?: string; // if provided, renders as a Link
}

export function PermitTabs({
  tabs,
  active,
  onChange,
  layoutId = "permit-tab",
}: {
  tabs: PermitTab[];
  active: string;
  onChange?: (key: string) => void;
  layoutId?: string;
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map((t) => {
        const isActive = t.key === active;
        const inner = (
          <span className="relative z-10 whitespace-nowrap">{t.label}</span>
        );
        const className = cn(
          "relative min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          isActive ? "text-snow" : "text-muted-foreground hover:text-frost"
        );
        const bg = isActive && (
          <motion.span
            layoutId={layoutId}
            className="pointer-events-none absolute inset-0 rounded-lg bg-primary/15 shadow-glow-sm ring-1 ring-arctic/20"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        );
        return t.href ? (
          <Link key={t.key} href={t.href} className={className}>
            {bg}
            {inner}
          </Link>
        ) : (
          <button key={t.key} type="button" onClick={() => onChange?.(t.key)} className={className}>
            {bg}
            {inner}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status pill + toggle                                                       */
/* -------------------------------------------------------------------------- */

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-success/15 text-success"
          : "bg-white/[0.06] text-muted-foreground"
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Permit card — horizontal on desktop, vertical on mobile                    */
/* -------------------------------------------------------------------------- */

export function PermitCard({
  permit,
  href,
  onMenu,
}: {
  permit: Permit;
  href: string;
  onMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass glass-hover group relative rounded-2xl"
    >
      <Link href={href} className="block p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Icon */}
          <div
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 text-arctic"
            style={{ backgroundColor: `${permit.color}1a` }}
          >
            <PermitGlyph name={permit.icon} className="size-5" />
          </div>

          {/* Name + description */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-snow">{permit.name}</h3>
            {permit.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {permit.description}
              </p>
            )}
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="size-3" /> {permit.discordRoleIds.length} Role
              {permit.discordRoleIds.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Key className="size-3" /> {permit.permissions.length} Permission
              {permit.permissions.length === 1 ? "" : "s"}
            </Badge>
            <StatusPill active={permit.enabled} />
          </div>
        </div>
      </Link>

      {/* Three-dot menu (outside the link so clicks don't navigate) */}
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Actions for ${permit.name}`}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-snow group-hover:opacity-100 sm:static sm:opacity-100"
        >
          <MoreVertical className="size-4" />
        </button>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown menu (Edit / Duplicate / Disable / Delete)                        */
/* -------------------------------------------------------------------------- */

export interface MenuAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onSelect: () => void;
}

export function PermitMenu({
  open,
  onClose,
  actions,
  anchorClassName,
}: {
  open: boolean;
  onClose: () => void;
  actions: MenuAction[];
  anchorClassName?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "glass-strong absolute z-50 w-44 rounded-xl p-1.5",
        anchorClassName
      )}
    >
      {actions.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={() => {
            a.onSelect();
            onClose();
          }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            a.destructive
              ? "text-destructive hover:bg-destructive/10"
              : "text-frost hover:bg-white/[0.06] hover:text-snow"
          )}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Effective-permissions donut ring                                           */
/* -------------------------------------------------------------------------- */

export function EffectiveDonut({
  allowed,
  denied,
  notSet,
}: {
  allowed: number;
  denied: number;
  notSet: number;
}) {
  const total = Math.max(allowed + denied + notSet, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const seg = (n: number) => (n / total) * circ;

  // Stack the arcs by offsetting stroke-dashoffset.
  const allowLen = seg(allowed);
  const denyLen = seg(denied);
  const notSetLen = seg(notSet);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-40">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="14" opacity={0.25} />
          {/* Not set (base ring) */}
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke="hsl(var(--muted-foreground))" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${notSetLen} ${circ}`}
            strokeDashoffset={-(allowLen + denyLen)}
            opacity={0.4}
          />
          {/* Denied */}
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke="hsl(var(--destructive))" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${denyLen} ${circ}`}
            strokeDashoffset={-allowLen}
          />
          {/* Allowed */}
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke="hsl(var(--arctic))" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${allowLen} ${circ}`}
            strokeDashoffset={0}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-snow">
              {allowed}
              <span className="text-base text-muted-foreground"> / {total}</span>
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Allowed</p>
          </div>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-2 text-center">
        <LegendDot color="bg-arctic" label="Allowed" value={allowed} />
        <LegendDot color="bg-destructive" label="Denied" value={denied} />
        <LegendDot color="bg-muted-foreground" label="Not set" value={notSet} />
      </div>
    </div>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2">
      <div className="flex items-center justify-center gap-1.5">
        <span className={cn("size-2 rounded-full", color)} />
        <span className="text-sm font-semibold text-snow">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Permission toggle row                                                      */
/* -------------------------------------------------------------------------- */

export function PermissionRow({
  icon,
  name,
  description,
  checked,
  onChange,
}: {
  icon: string;
  name: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-arctic">
        <PermitGlyph name={icon} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-snow">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Wizard step indicator                                                      */
/* -------------------------------------------------------------------------- */

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-glow-sm"
                    : done
                      ? "bg-arctic/20 text-arctic"
                      : "bg-white/[0.06] text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  active ? "font-medium text-snow" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-arctic/40" : "bg-white/10"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small helper: "View details" style link row                               */
/* -------------------------------------------------------------------------- */

export function ArrowLink({ children, href, onClick }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const cls =
    "inline-flex items-center gap-1.5 text-sm font-medium text-arctic transition-colors hover:text-ice";
  return href ? (
    <Link href={href} className={cls}>
      {children} <ArrowRight className="size-3.5" />
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children} <ArrowRight className="size-3.5" />
    </button>
  );
}
