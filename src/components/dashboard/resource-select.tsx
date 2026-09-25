"use client";

import * as React from "react";
import { Hash, Volume2, X, Plus } from "lucide-react";
import { useGuild } from "./guild-context";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface GuildChannel { id: string; name: string; type: number }
export interface GuildRole { id: string; name: string; color: number; position?: number }

interface ResourcesState {
  channels: GuildChannel[];
  roles: GuildRole[];
  loading: boolean;
  error: boolean;
}

const ResourcesCtx = React.createContext<ResourcesState | null>(null);

export function ResourcesProvider({ children }: { children: React.ReactNode }) {
  const guild = useGuild();
  const [state, setState] = React.useState<ResourcesState>({ channels: [], roles: [], loading: true, error: false });

  React.useEffect(() => {
    let cancelled = false;
    setState({ channels: [], roles: [], loading: true, error: false });
    fetch(`/api/dashboard/${guild.id}/resources`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setState({ channels: d.channels ?? [], roles: d.roles ?? [], loading: false, error: false });
      })
      .catch(() => !cancelled && setState({ channels: [], roles: [], loading: false, error: true }));
    return () => { cancelled = true; };
  }, [guild.id]);

  return <ResourcesCtx.Provider value={state}>{children}</ResourcesCtx.Provider>;
}

export function useResources() {
  return React.useContext(ResourcesCtx) ?? { channels: [], roles: [], loading: false, error: false };
}

export function ChannelSelect({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (id: string) => void;
  type?: "text" | "voice";
}) {
  const { channels, loading, error } = useResources();
  // Text giveaways/panels post to text (0) or announcement/news (5) channels.
  const filtered = channels.filter((c) => (type === "voice" ? c.type === 2 : c.type === 0 || c.type === 5));

  const placeholder = loading
    ? "Loading channels…"
    : error
      ? "Unable to load channels. Try again."
      : filtered.length === 0
        ? "No available channels"
        : "Select a channel…";

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading || error || filtered.length === 0}>
      <option value="">{placeholder}</option>
      {filtered.map((c) => (
        <option key={c.id} value={c.id}>
          {type === "voice" ? "🔊 " : "# "}{c.name}
        </option>
      ))}
    </Select>
  );
}

export function RoleSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { roles } = useResources();
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a role…</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>@{r.name}</option>
      ))}
    </Select>
  );
}

export function MultiRoleSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { roles } = useResources();
  const [pending, setPending] = React.useState("");
  const selected = roles.filter((r) => value.includes(r.id));

  const add = () => {
    if (pending && !value.includes(pending)) onChange([...value, pending]);
    setPending("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={pending} onChange={(e) => setPending(e.target.value)}>
          <option value="">Add a role…</option>
          {roles.filter((r) => !value.includes(r.id)).map((r) => (
            <option key={r.id} value={r.id}>@{r.name}</option>
          ))}
        </Select>
        <button
          onClick={add}
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-arctic hover:bg-white/[0.08]"
          aria-label="Add role"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1.5">
              @{r.name}
              <button onClick={() => onChange(value.filter((v) => v !== r.id))} aria-label={`Remove ${r.name}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
