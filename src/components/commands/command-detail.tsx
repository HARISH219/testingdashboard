"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { CommandIcon } from "./command-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SnowyCommand } from "@/lib/commands";
import { cn } from "@/lib/utils";

export function CommandDetail({ command }: { command: SnowyCommand }) {
  return (
    <div className="container relative z-10 max-w-5xl pb-20 pt-6 sm:pt-10">
      <Link
        href="/commands"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-snow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arctic/70"
      >
        <ArrowLeft className="size-4" /> Back to Commands
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-5"
      >
        {/* Command header */}
        <Card className="overflow-hidden border-arctic/20 bg-gradient-to-br from-arctic/[0.065] to-purple-500/[0.025]">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-arctic/20 bg-arctic/10 text-arctic shadow-glow-sm sm:size-16">
                  <CommandIcon name={command.icon} className="size-7 sm:size-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 break-all font-mono text-2xl font-bold text-snow sm:text-3xl">
                      /{command.name}
                    </h1>
                    <Badge>{command.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-frost sm:text-base">
                    {command.description}
                  </p>
                </div>
              </div>
              <CopyButton
                value={command.syntax}
                label="Copy Command"
                copiedLabel="Copied!"
                className="w-full shrink-0 sm:w-auto"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-6">
            {/* Syntax */}
            <DetailSection title="Syntax" icon={<Terminal className="size-4 text-arctic" />}>
              <CodeRow value={command.syntax} />
            </DetailSection>

            {/* Description */}
            <DetailSection title="Description">
              <p className="text-sm leading-7 text-frost sm:text-base">
                {command.detailedDescription}
              </p>
            </DetailSection>

            {/* Options */}
            {command.options.length > 0 && (
              <DetailSection title="Options / Parameters">
                <div className="space-y-2">
                  {command.options.map((option) => (
                    <div
                      key={option.name}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-white/[0.065] bg-white/[0.025] p-4 sm:grid-cols-[minmax(100px,0.35fr)_90px_minmax(0,1fr)] sm:items-center"
                    >
                      <code className="font-mono text-sm font-medium text-arctic">
                        {option.name}
                      </code>
                      <Badge variant={option.required ? "warning" : "secondary"} className="w-fit">
                        {option.required ? "Required" : "Optional"}
                      </Badge>
                      <p className="text-sm leading-6 text-frost">{option.description}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Examples */}
            <DetailSection title="Examples">
              <div className="space-y-2">
                {command.examples.map((example) => (
                  <CodeRow key={example} value={example} compact />
                ))}
              </div>
            </DetailSection>

            {/* Discord-like output */}
            {command.exampleOutput && (
              <DetailSection title="Example Output">
                <div className="rounded-xl border border-white/[0.07] bg-[#313338] p-4 shadow-inner">
                  <div className="flex gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-arctic/15 text-arctic">
                      <CommandIcon name="Sparkles" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-arctic">Snowy</span>
                        <span className="rounded bg-[#5865F2] px-1 py-0.5 text-[9px] font-bold text-white">
                          APP
                        </span>
                        <span className="text-[11px] text-white/40">Today at 12:00</span>
                      </div>
                      <div className="mt-2 border-l-[3px] border-success bg-[#2b2d31] px-3 py-2.5">
                        {command.exampleOutput.split("\n").map((line, index) => (
                          <p
                            key={`${line}-${index}`}
                            className={cn(
                              "text-sm leading-6 text-white/75",
                              index === 0 && "flex items-center gap-1.5 font-semibold text-white"
                            )}
                          >
                            {index === 0 && <CheckCircle2 className="size-3.5 text-success" />}
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DetailSection>
            )}
          </div>

          {/* Metadata rail */}
          <aside className="space-y-4">
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="size-4 text-arctic" /> Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5 pt-0">
                <Metadata label="Available to" value={command.access} />
                {command.permission && (
                  <Metadata label="Required permission" value={command.permission} mono />
                )}
                {!command.permission && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    No special Discord permission is required.
                  </p>
                )}
              </CardContent>
            </Card>

            {command.aliases.length > 0 && (
              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <KeyRound className="size-4 text-arctic" /> Aliases
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 px-5 pb-5 pt-0">
                  {command.aliases.map((alias) => (
                    <code
                      key={alias}
                      className="rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 font-mono text-xs text-frost"
                    >
                      /{alias}
                    </code>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-arctic/15 bg-arctic/[0.025] p-5">
              <p className="text-sm font-medium text-snow">Manage it visually</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Configure this feature without memorizing commands in Snowy&apos;s dashboard.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                <Link href="/servers">Open Dashboard</Link>
              </Button>
            </Card>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">{children}</CardContent>
    </Card>
  );
}

function CodeRow({ value, compact = false }: { value: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-navy/70",
        compact ? "p-3" : "p-4"
      )}
    >
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-ice no-scrollbar">
        {value}
      </code>
      <CopyButton value={value} iconOnly />
    </div>
  );
}

function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied!",
  iconOnly = false,
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for non-secure localhost/browser contexts.
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  if (iconOnly) {
    return (
      <button
        onClick={copy}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-arctic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arctic/70",
          copied && "text-success"
        )}
        aria-label={copied ? "Copied" : `Copy ${value}`}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    );
  }

  return (
    <Button onClick={copy} className={className} variant={copied ? "success" : "default"}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

function Metadata({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 break-words text-sm font-medium text-frost", mono && "font-mono text-xs text-arctic")}>
        {value}
      </p>
    </div>
  );
}
