import { Suspense } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { CommandsExplorer } from "@/components/commands/commands-explorer";
import { Snowfall } from "@/components/snowfall";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMANDS } from "@/lib/commands";

export const metadata = {
  title: "Commands — Snowy",
  description: `Explore all ${COMMANDS.length} commands supported by Snowy, organized by category.`,
};

export default function CommandsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={42} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-55" />
      <div className="pointer-events-none fixed inset-0 z-0 grid-pattern opacity-[0.07]" />
      <MarketingHeader />
      <Suspense fallback={<CommandsLoading />}>
        <CommandsExplorer />
      </Suspense>
    </div>
  );
}

function CommandsLoading() {
  return (
    <div className="container relative z-10 py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Skeleton className="hidden h-[520px] rounded-2xl lg:block" />
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-full max-w-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl xl:max-w-sm" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
