"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Music, Play, Pause, SkipForward, Square, Shuffle, Repeat, Volume2, Disc3, ListMusic, Radio,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Inner() {
  const guild = useGuild();
  const { toast } = useToast();
  const [state, setState] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    fetch(`/api/dashboard/${guild.id}/music`).then((r) => r.json()).then((d) => { setState(d); setLoading(false); }).catch(() => setLoading(false));
  }, [guild.id]);

  React.useEffect(() => { load(); }, [load]);

  const control = async (action: string, value?: unknown) => {
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/music`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, value }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ variant: d.pending ? "info" : "success", title: `Music: ${action}`, description: d.message });
    } catch (e) {
      toast({ variant: "error", title: "Control failed", description: (e as Error).message });
    }
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const np = state?.nowPlaying;
  const queue = state?.queue ?? [];
  const progress = np ? (np.position / np.duration) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Music" icon={<Music className="size-5" />}
        description="Control playback, manage the queue, and check node status."
        actions={<Badge variant={state?.connected ? "success" : "secondary"}><Radio className="size-3" /> {state?.connected ? np?.channel ?? "Connected" : "Not connected"}</Badge>}
      />

      {!state?.live && (
        <Badge variant="warning" className="mb-4">{state?.pending ? "Bot API pending — showing preview" : "Preview data"}</Badge>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Player */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <motion.div
                animate={{ rotate: np && !np.paused ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="grid size-40 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-arctic/25 to-primary/10 border border-white/10 shadow-glow"
              >
                {np?.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={np.artwork} alt="" className="size-full rounded-2xl object-cover" />
                ) : (
                  <Disc3 className="size-16 text-arctic/70" />
                )}
              </motion.div>

              <div className="w-full flex-1 text-center sm:text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Now playing</p>
                <h2 className="mt-1 text-xl font-bold text-snow">{np?.title ?? "Nothing playing"}</h2>
                <p className="text-sm text-frost">{np?.author ?? "—"}</p>

                {/* Progress */}
                <div className="mt-5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-arctic to-ice" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{fmt(np?.position ?? 0)}</span>
                    <span>{fmt(np?.duration ?? 0)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-5 flex items-center justify-center gap-2 sm:justify-start">
                  <Button variant="ghost" size="icon" onClick={() => control("shuffle")} aria-label="Shuffle"><Shuffle className="size-4" /></Button>
                  <Button variant="secondary" size="icon" onClick={() => control(np?.paused ? "resume" : "pause")} aria-label="Play/pause" className="size-12">
                    {np?.paused ? <Play className="size-5" /> : <Pause className="size-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => control("skip")} aria-label="Skip"><SkipForward className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => control("stop")} aria-label="Stop"><Square className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => control("loop")} aria-label="Loop"><Repeat className={cn("size-4", np?.loop !== "off" && "text-arctic")} /></Button>
                </div>

                {/* Volume + 247 */}
                <div className="mt-4 flex items-center gap-3">
                  <Volume2 className="size-4 text-muted-foreground" />
                  <input type="range" min={0} max={100} defaultValue={np?.volume ?? 65} onMouseUp={(e) => control("volume", Number((e.target as HTMLInputElement).value))} className="flex-1 accent-arctic" />
                  <Button variant="secondary" size="sm" onClick={() => control("247")}>24/7</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ListMusic className="size-4 text-arctic" /> Queue <Badge variant="secondary">{queue.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {queue.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Queue is empty.</p>}
            {queue.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                <div className="grid size-9 place-items-center rounded-lg bg-white/[0.05]"><Music className="size-4 text-frost" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-snow">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.author}</p>
                </div>
                <span className="text-xs text-muted-foreground">{fmt(t.duration)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="music"><Inner /></ModuleGate>;
}
