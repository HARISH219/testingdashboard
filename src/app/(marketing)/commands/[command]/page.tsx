import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommandDetail } from "@/components/commands/command-detail";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Snowfall } from "@/components/snowfall";
import { getCommand } from "@/lib/commands";

interface CommandPageProps {
  params: { command: string };
}

export function generateMetadata({ params }: CommandPageProps): Metadata {
  const command = getCommand(params.command);
  if (!command) return { title: "Command not found — Snowy" };
  return {
    title: `/${command.name} — Snowy Commands`,
    description: command.description,
  };
}

export default function CommandPage({ params }: CommandPageProps) {
  const command = getCommand(params.command);
  if (!command) notFound();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={32} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-45" />
      <div className="pointer-events-none fixed inset-0 z-0 grid-pattern opacity-[0.055]" />
      <MarketingHeader />
      <CommandDetail command={command} />
    </div>
  );
}
