"use client";

import * as React from "react";

/**
 * Global unsaved-changes system.
 *
 * Any settings surface (a module config page, tickets, etc.) registers itself
 * with a stable `id`, its current `dirty`/`saving` state, and `save`/`reset`
 * handlers. The single floating <GlobalSaveBar /> (mounted once in the
 * dashboard shell) shows whenever ANY registered surface is dirty and drives
 * its save/reset — so we never duplicate a save bar per page.
 */

interface DirtyEntry {
  id: string;
  dirty: boolean;
  saving: boolean;
  save: () => void | Promise<void>;
  reset: () => void;
}

interface DirtyContextValue {
  register: (entry: DirtyEntry) => void;
  unregister: (id: string) => void;
  /** Snapshot of all currently-registered entries (for the save bar). */
  entries: DirtyEntry[];
}

const DirtyCtx = React.createContext<DirtyContextValue | null>(null);

export function DirtyStateProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<DirtyEntry[]>([]);

  const register = React.useCallback((entry: DirtyEntry) => {
    setEntries((prev) => {
      const rest = prev.filter((e) => e.id !== entry.id);
      return [...rest, entry];
    });
  }, []);

  const unregister = React.useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <DirtyCtx.Provider value={{ register, unregister, entries }}>
      {children}
    </DirtyCtx.Provider>
  );
}

/**
 * Register a settings surface with the global save bar. Call this from a page
 * hook whenever its dirty/saving state or handlers change. No-ops gracefully
 * if there's no provider (e.g. a page rendered outside the dashboard shell).
 */
export function useRegisterDirty(entry: {
  id: string;
  dirty: boolean;
  saving: boolean;
  save: () => void | Promise<void>;
  reset: () => void;
}) {
  const ctx = React.useContext(DirtyCtx);
  const { id, dirty, saving, save, reset } = entry;

  React.useEffect(() => {
    if (!ctx) return;
    ctx.register({ id, dirty, saving, save, reset });
    return () => ctx.unregister(id);
    // Re-register when any of these change so the bar always has fresh handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dirty, saving, save, reset]);
}

/** Aggregate dirty/saving across all registered surfaces (for the save bar). */
export function useGlobalDirty() {
  const ctx = React.useContext(DirtyCtx);
  const entries = ctx?.entries ?? [];
  const dirtyEntries = entries.filter((e) => e.dirty);
  return {
    dirty: dirtyEntries.length > 0,
    saving: dirtyEntries.some((e) => e.saving),
    saveAll: () => dirtyEntries.forEach((e) => void e.save()),
    resetAll: () => dirtyEntries.forEach((e) => e.reset()),
  };
}
