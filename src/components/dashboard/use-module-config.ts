"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { useGuild } from "./guild-context";

interface ModuleConfigState<T> {
  enabled: boolean;
  data: T;
}

/**
 * Loads and persists a module's configuration through the real config API.
 * Tracks dirty state so a save bar can be shown. Not a fake toggle — every
 * save hits /api/dashboard/[guildId]/config/[module] which writes to the DB
 * (or in-memory store in demo) and forwards to the bot API when configured.
 */
export function useModuleConfig<T extends Record<string, unknown>>(
  module: string,
  defaults: T
) {
  const guild = useGuild();
  const { toast } = useToast();
  const [state, setState] = React.useState<ModuleConfigState<T>>({
    enabled: false,
    data: defaults,
  });
  const [initial, setInitial] = React.useState<ModuleConfigState<T> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const url = `/api/dashboard/${guild.id}/config/${module}`;

  React.useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const next = { enabled: json.enabled, data: { ...defaults, ...json.data } };
        setState(next);
        setInitial(next);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const dirty = initial
    ? JSON.stringify(state) !== JSON.stringify(initial)
    : false;

  const setEnabled = (enabled: boolean) => setState((s) => ({ ...s, enabled }));
  const setField = <K extends keyof T>(key: K, value: T[K]) =>
    setState((s) => ({ ...s, data: { ...s.data, [key]: value } }));
  const setData = (patch: Partial<T>) =>
    setState((s) => ({ ...s, data: { ...s.data, ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: state.enabled, data: state.data }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      const json = await r.json();
      const next = { enabled: json.enabled, data: { ...defaults, ...json.data } };
      setState(next);
      setInitial(next);
      toast({ variant: "success", title: "Settings saved", description: json.pending ? "Saved. Bot sync pending integration." : "Your changes are live." });
    } catch (e) {
      toast({ variant: "error", title: "Save failed", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => initial && setState(initial);

  return {
    enabled: state.enabled,
    data: state.data,
    loading,
    saving,
    error,
    dirty,
    setEnabled,
    setField,
    setData,
    save,
    reset,
  };
}
