"use client";

import * as React from "react";
import { MessagesSquare, Plus, Trash2 } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Responder { trigger: string; response: string; matchType: string }
interface ARConfig extends Record<string, unknown> { responders: Responder[] }
const defaults: ARConfig = { responders: [] };

// How a message is matched against the trigger.
const MATCH_TYPES: { value: string; label: string }[] = [
  { value: "exact", label: "Exact — message is exactly the trigger" },
  { value: "contains", label: "Contains — message includes the trigger" },
  { value: "starts_with", label: "Starts with — message begins with the trigger" },
  { value: "variable", label: "Variable — trigger with {placeholders}" },
  { value: "same", label: "Same — case-insensitive exact" },
];

function matchLabel(v: string): string {
  return MATCH_TYPES.find((m) => m.value === v)?.value ?? v;
}

function Inner() {
  const cfg = useModuleConfig<ARConfig>("autoresponder", defaults);
  const [trigger, setTrigger] = React.useState("");
  const [response, setResponse] = React.useState("");
  const [matchType, setMatchType] = React.useState("contains");
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const add = () => {
    if (!trigger || !response) return;
    cfg.setField("responders", [...cfg.data.responders, { trigger, response, matchType }]);
    setTrigger(""); setResponse(""); setMatchType("contains");
  };

  return (
    <div>
      <PageHeader title="Autoresponder" icon={<MessagesSquare className="size-5" />}
        description="Automatically reply when a message matches a trigger."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New responder</CardTitle><CardDescription>When someone says the trigger, Soward replies.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Trigger</Label><Input className="mt-2" placeholder="hello" value={trigger} onChange={(e) => setTrigger(e.target.value)} /></div>
            <div><Label>Response</Label><Input className="mt-2" placeholder="Hi there! ❄️" value={response} onChange={(e) => setResponse(e.target.value)} /></div>
            <div>
              <Label>Match type</Label>
              <Select className="mt-2" value={matchType} onChange={(e) => setMatchType(e.target.value)}>
                {MATCH_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
            <Button onClick={add}><Plus className="size-4" /> Add responder</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Responders</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cfg.data.responders.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No responders yet.</p>}
            {cfg.data.responders.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-snow"><span className="text-arctic">{r.trigger}</span> → {r.response}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{matchLabel(r.matchType ?? "contains")}</Badge>
                </div>
                <button onClick={() => cfg.setField("responders", cfg.data.responders.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="autoresponder"><Inner /></ModuleGate>;
}
