"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Copy, ArrowRight, Snowflake,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface Check {
  key: string;
  label: string;
  state: "ok" | "warn" | "off";
  detail: string;
  fix?: string;
  required: boolean;
}

const icons = {
  ok: <CheckCircle2 className="size-5 text-success" />,
  warn: <AlertTriangle className="size-5 text-warning" />,
  off: <XCircle className="size-5 text-destructive" />,
};

export default function SetupPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<{ mode: string; ready: boolean; checks: Check[] } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ variant: "success", title: "Copied" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={30} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="size-4" /> Recheck
            </Button>
            <Button asChild size="sm">
              <Link href="/servers">Open dashboard <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container relative z-10 max-w-3xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Snowflake className="mx-auto mb-4 size-10 text-arctic animate-float" />
          <h1 className="font-display text-3xl font-bold text-snow">Setup status</h1>
          <p className="mt-2 text-frost">
            Everything Snowy needs, and exactly what&apos;s missing.
          </p>
          {data && (
            <div className="mt-4 flex justify-center gap-2">
              <Badge variant={data.mode === "live" ? "success" : "warning"}>
                {data.mode === "live" ? "Live mode" : "Demo mode"}
              </Badge>
              <Badge variant={data.ready ? "success" : "destructive"}>
                {data.ready ? "Ready to use" : "Needs attention"}
              </Badge>
            </div>
          )}
        </motion.div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && !data && (
          <Card className="p-8 text-center">
            <XCircle className="mx-auto mb-3 size-8 text-destructive" />
            <p className="text-snow">Couldn&apos;t load setup status.</p>
            <Button className="mt-4" onClick={load}>Retry</Button>
          </Card>
        )}

        {data && (
          <div className="space-y-3">
            {data.checks.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">{icons[c.state]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-snow">{c.label}</p>
                        {c.required && c.state === "off" && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                        {!c.required && c.state === "warn" && (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </div>
                      <p className="mt-1 break-words text-sm text-frost">{c.detail}</p>
                      {c.state !== "ok" && c.fix && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                          <p className="flex-1 text-xs text-muted-foreground">{c.fix}</p>
                          <button
                            onClick={() => copy(c.fix!)}
                            className="shrink-0 text-muted-foreground hover:text-snow"
                            aria-label="Copy fix"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Card className="mt-8 p-5">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">After changing .env</CardTitle>
            <CardDescription>Environment changes need a server restart.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <code className="flex-1 font-mono text-sm text-arctic">npm run dev</code>
              <button onClick={() => copy("npm run dev")} className="text-muted-foreground hover:text-snow" aria-label="Copy command">
                <Copy className="size-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
