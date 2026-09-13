"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsRow } from "@/components/dashboard/settings-row";
import { SaveBar } from "@/components/dashboard/save-bar";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { MultiRoleSelect } from "@/components/dashboard/resource-select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface WordFilterConfig extends Record<string, unknown> {
  words: string[];
  punishment: string;
  bypassRoles: string[];
}
const defaults: WordFilterConfig = { words: [], punishment: "delete", bypassRoles: [] };

function Inner() {
  const cfg = useModuleConfig<WordFilterConfig>("wordfilter", defaults);
  const [word, setWord] = React.useState("");
  if (cfg.loading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div>
      <PageHeader title="Word Filter" icon={<Filter className="size-5" />}
        description="Blacklist words, set punishments, and manage bypasses."
        actions={<div className="flex items-center gap-2"><span className="text-sm text-frost">Enabled</span><Switch checked={cfg.enabled} onCheckedChange={cfg.setEnabled} /></div>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Blacklisted words</CardTitle><CardDescription>Messages containing these are actioned.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Add a word…" value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && word) { cfg.setField("words", [...cfg.data.words, word.toLowerCase()]); setWord(""); } }} />
              <Button variant="secondary" onClick={() => { if (word) { cfg.setField("words", [...cfg.data.words, word.toLowerCase()]); setWord(""); } }}>Add</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cfg.data.words.map((w) => (
                <Badge key={w} variant="secondary">{w}<button className="ml-1" onClick={() => cfg.setField("words", cfg.data.words.filter((x) => x !== w))}>×</button></Badge>
              ))}
              {cfg.data.words.length === 0 && <p className="text-xs text-muted-foreground">No words blacklisted.</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
          <CardContent>
            <SettingsRow label="Punishment">
              <Select value={cfg.data.punishment} onChange={(e) => cfg.setField("punishment", e.target.value)}>
                <option value="delete">Delete message</option>
                <option value="warn">Delete + warn</option>
                <option value="mute">Delete + mute</option>
                <option value="kick">Delete + kick</option>
              </Select>
            </SettingsRow>
            <div className="py-3">
              <p className="text-sm font-medium text-snow">Bypass roles</p>
              <p className="mb-2 text-xs text-muted-foreground">These roles are exempt from the filter.</p>
              <MultiRoleSelect value={cfg.data.bypassRoles} onChange={(ids) => cfg.setField("bypassRoles", ids)} />
            </div>
          </CardContent>
        </Card>
      </div>
      <SaveBar dirty={cfg.dirty} saving={cfg.saving} onSave={cfg.save} onReset={cfg.reset} />
    </div>
  );
}

export default function Page() {
  return <ModuleGate moduleKey="wordfilter"><Inner /></ModuleGate>;
}
