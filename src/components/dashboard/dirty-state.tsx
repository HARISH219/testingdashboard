"use client";

import * as React from "react";

/**
 * Global unsaved-changes system.
 *
 * Settings surfaces register their dirty/saving state and save/reset handlers.
 * Registration is deliberately deduplicated and handler identities are kept
 * stable so provider updates cannot cause a render-registration loop.
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
  entries: DirtyEntry[];
}

const DirtyCtx = React.createContext<DirtyContextValue | null>(null);

export function DirtyStateProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<DirtyEntry[]>([]);

  const register = React.useCallback((entry: DirtyEntry) => {
    setEntries((previous) => {
      const index = previous.findIndex((item) => item.id === entry.id);

      if (index === -1) return [...previous, entry];

      const current = previous[index];
      if (
        current.dirty === entry.dirty &&
        current.saving === entry.saving &&
        current.save === entry.save &&
        current.reset === entry.reset
      ) {
        return previous;
      }

      const next = [...previous];
      next[index] = entry;
      return next;
    });
  }, []);

  const unregister = React.useCallback((id: string) => {
    setEntries((previous) => {
      if (!previous.some((entry) => entry.id === id)) return previous;
      return previous.filter((entry) => entry.id !== id);
    });
  }, []);

  const value = React.useMemo(
    () => ({ register, unregister, entries }),
    [register, unregister, entries]
  );

  return <DirtyCtx.Provider value={value}>{children}</DirtyCtx.Provider>;
}

/**
 * Register a settings surface with the global save bar.
 *
 * save/reset are stored in refs and exposed through stable wrapper callbacks.
 * That means a parent/provider render cannot retrigger registration merely
 * because the consuming hook created a fresh function object.
 */
export function useRegisterDirty(entry: {
  id: string;
  dirty: boolean;
  saving: boolean;
  save: () => void | Promise<void>;
  reset: () => void;
}) {
  const ctx = React.useContext(DirtyCtx);
  const register = ctx?.register;
  const unregister = ctx?.unregister;
  const { id, dirty, saving, save, reset } = entry;

  const saveRef = React.useRef(save);
  const resetRef = React.useRef(reset);

  React.useEffect(() => {
    saveRef.current = save;
    resetRef.current = reset;
  }, [save, reset]);

  const runSave = React.useCallback(() => saveRef.current(), []);
  const runReset = React.useCallback(() => resetRef.current(), []);

  React.useEffect(() => {
    if (!register) return;
    register({ id, dirty, saving, save: runSave, reset: runReset });
  }, [register, id, dirty, saving, runSave, runReset]);

  React.useEffect(() => {
    if (!unregister) return;
    return () => unregister(id);
  }, [unregister, id]);
}

/** Aggregate dirty/saving state and stable save/reset actions. */
export function useGlobalDirty() {
  const ctx = React.useContext(DirtyCtx);
  const entries = ctx?.entries ?? [];
  const dirtyEntries = entries.filter((entry) => entry.dirty);

  const saveAll = React.useCallback(() => {
    dirtyEntries.forEach((entry) => void entry.save());
  }, [dirtyEntries]);

  const resetAll = React.useCallback(() => {
    dirtyEntries.forEach((entry) => entry.reset());
  }, [dirtyEntries]);

  return {
    dirty: dirtyEntries.length > 0,
    saving: dirtyEntries.some((entry) => entry.saving),
    saveAll,
    resetAll,
  };
}
