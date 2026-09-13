"use client";

import { useGuild, useCan } from "./guild-context";
import { LockedFeature, NoAccess } from "./locked-feature";
import { ResourcesProvider } from "./resource-select";
import { MODULE_MAP } from "@/lib/modules";
import { planMeets } from "@/lib/plans";

/**
 * Wraps a module page: checks plan gating and dashboard permission (client-side
 * for UX; the API enforces the same checks server-side). Provides guild
 * channels/roles for selectors.
 */
export function ModuleGate({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  const guild = useGuild();
  const can = useCan();
  const mod = MODULE_MAP[moduleKey];

  if (mod && !planMeets(guild.tier, mod.minPlan)) {
    return <LockedFeature module={mod.name} requiredPlan={mod.minPlan} />;
  }
  if (moduleKey !== "billing" && !can(moduleKey, "view")) {
    return <NoAccess module={mod?.name ?? moduleKey} />;
  }

  return <ResourcesProvider>{children}</ResourcesProvider>;
}
