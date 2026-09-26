"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { useGuild } from "./guild-context";
import { useRegisterDirty } from "./dirty-state";

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
  const defaultsRef = React.useRef(defaults);
  defaultsRef.current = defaults;

  const url = `/api/dashboard/${guild.id}/config/${module}`;

  const load = React.useCallback(() => {
    setLoading(true);
    return fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then((json) => {
        const next = {
          enabled: json.enabled,
          data: { ...defaultsRef.current, ...json.data },
        };
        setState(next);
        setInitial(next);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  React.useEffect(() => {
    load();
  }, [load]);

  const dirty = initial
    ? JSON.stringify(state) !== JSON.stringify(initial)
    : false;

  const setEnabled = React.useCallback(
    (enabled: boolean) => setState((current) => ({ ...current, enabled })),
    []
  );
  const setField = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      setState((current) => ({
        ...current,
        data: { ...current.data, [key]: value },
      })),
    []
  );
  const setData = React.useCallback(
    (patch: Partial<T>) =>
      setState((current) => ({
        ...current,
        data: { ...current.data, ...patch },
      })),
    []
  );

  const save = React.useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: state.enabled, data: state.data }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      const json = await r.json();
      const next = {
        enabled: json.enabled,
        data: { ...defaultsRef.current, ...json.data },
      };
      setState(next);
      setInitial(next);
      toast({
        variant: "success",
        title: "Settings saved",
        description: json.pending
          ? "Saved. Bot sync pending integration."
          : "Your changes are live.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Save failed",
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }, [state, toast, url]);

  const reset = React.useCallback(() => {
    if (initial) setState(initial);
  }, [initial]);

  // Register with the global save bar so any module page automatically shows
  // the floating "unsaved changes" popup without duplicating a save bar.
  useRegisterDirty({ id: `module:${module}`, dirty, saving, save, reset });

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
    reload: load,
  };
}
