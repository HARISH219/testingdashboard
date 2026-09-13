"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGuild } from "./guild-context";
import type { PlanTier } from "@/lib/plans";

export function LockedFeature({
  module,
  requiredPlan,
}: {
  module: string;
  requiredPlan: PlanTier;
}) {
  const guild = useGuild();
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 border border-white/10">
        <Lock className="size-6 text-arctic" />
      </div>
      <Badge className="mb-3">
        <Sparkles className="size-3" /> {requiredPlan} feature
      </Badge>
      <h2 className="font-display text-xl font-bold text-snow">
        Unlock {module} with {requiredPlan}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        This feature isn&apos;t included in your current {guild.tier} plan. Upgrade to unlock it
        and preserve all your existing configuration.
      </p>
      <Button asChild className="mt-6">
        <Link href={`/dashboard/${guild.id}/billing`}>Upgrade plan</Link>
      </Button>
    </Card>
  );
}

export function NoAccess({ module }: { module: string }) {
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-white/[0.05]">
        <Lock className="size-6 text-muted-foreground" />
      </div>
      <h2 className="font-display text-xl font-bold text-snow">Access restricted</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        You don&apos;t have permission to view {module}. Ask a server owner to grant you access
        in the Permissions settings.
      </p>
    </Card>
  );
}
