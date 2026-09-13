"use client";

import { cn } from "@/lib/utils";

export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-white/[0.05] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="max-w-md">
        <p className="text-sm font-medium text-snow">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="sm:min-w-[220px] sm:max-w-xs sm:flex-1 sm:text-right">{children}</div>
    </div>
  );
}
