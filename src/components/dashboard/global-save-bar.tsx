"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalDirty } from "./dirty-state";

/**
 * Single floating save popup for the whole dashboard. Visible only when a
 * registered settings surface is actually dirty.
 *
 * Click-through safety: the fixed wrapper is `pointer-events-none` and is NOT a
 * full-screen overlay — it only spans the bottom strip. Only the small popup
 * pill inside it is `pointer-events-auto`, so every empty pixel around the pill
 * passes clicks straight through to the page. This guarantees the save bar can
 * never block interaction with the rest of the dashboard.
 */
export function GlobalSaveBar() {
  const { dirty, saving, saveAll, resetAll } = useGlobalDirty();

  return (
    <AnimatePresence>
      {dirty && (
        // Wrapper: fixed, bottom-only, centered, click-through.
        <div
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            // Popup: the only element that receives pointer events.
            className="glass-strong pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl p-3 shadow-glow-sm sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:p-3.5"
            role="region"
            aria-label="Unsaved changes"
          >
            <p className="flex-1 text-sm text-frost sm:pr-2">Don&apos;t forget to save your changes!</p>
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
        </div>
      )}
    </AnimatePresence>
  );
}
