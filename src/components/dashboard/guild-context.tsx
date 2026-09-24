"use client";

import * as React from "react";
import { TEMP_UNLOCK_ALL, type PlanTier } from "@/lib/plans";

export interface GuildContextValue {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  memberCount: number;
  botInstalled: boolean;
  tier: PlanTier;
  permissions: string[]; // effective dashboard permissions ("*" = full)
  botOnline: boolean;
  demo: boolean;
}

const GuildCtx = React.createContext<GuildContextValue | null>(null);

export function GuildProvider({
  value,
  children,
}: {
  value: GuildContextValue;
  children: React.ReactNode;
}) {
  return <GuildCtx.Provider value={value}>{children}</GuildCtx.Provider>;
}

export function useGuild() {
  const ctx = React.useContext(GuildCtx);
  if (!ctx) throw new Error("useGuild must be used within GuildProvider");
  return ctx;
}

export function useCan() {
  const { permissions } = useGuild();
  return React.useCallback(
    (module: string, action: "view" | "manage" = "view") => {
      // TEMPORARY: everything unlocked — see TEMP_UNLOCK_ALL in lib/plans.
      if (TEMP_UNLOCK_ALL) return true;
      if (permissions.includes("*")) return true;
      if (permissions.includes(`${module}:manage`)) return true;
      return permissions.includes(`${module}:${action}`);
    },
    [permissions]
  );
}
