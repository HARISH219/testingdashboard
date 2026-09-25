"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalDirty } from "./dirty-state";

/**
 * Single floating save popup for the whole dashboard. Appears whenever any
 * registered settings surface has unsaved changes (see DirtyStateProvider).
 * Cosmic glass styling, compact, responsive, and lifted above the mobile
 * safe-area so it never overlaps browser/nav UI.
 */
export function GlobalSaveBar() {
  const { dirty, saving, saveAll, resetAll } = useGlobalDirty();

  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="glass-strong fixed inset-x-3 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl p-3 shadow-glow-sm sm:inset-x-auto sm:right-6 sm:flex-row sm:items-center sm:gap-4 sm:p-3.5"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          role="region"
          aria-label="Unsaved changes"
        >
          <p className="flex-1 text-sm text-frost">Don&apos;t forget to save your changes!</p>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={resetAll} disabled={saving} className="flex-1 sm:flex-none">
              Reset
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving} className="glow-btn flex-1 sm:flex-none">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
