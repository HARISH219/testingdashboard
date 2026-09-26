"use client";

import * as React from "react";
import { useRegisterDirty } from "./dirty-state";

let saveBarCounter = 0;

/**
 * Per-page save-bar adapter.
 *
 * This component renders NOTHING. Historically each settings page rendered its
 * own floating "unsaved changes" bar, which produced multiple overlapping bars
 * and (because they were fixed, full-width and not click-through) could block
 * interaction with the page. Now there is exactly one floating popup for the
 * whole dashboard (`GlobalSaveBar`, mounted once in the dashboard shell).
 *
 * To avoid touching every page, this shim simply forwards the page's
 * dirty/saving state and save/reset handlers into the single global save-state
 * store. The visible popup is owned solely by `GlobalSaveBar`, which is
 * click-through everywhere except its own buttons.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  // Stable unique id per mounted SaveBar instance so multiple surfaces on one
  // page (rare) don't collide in the global registry.
  const idRef = React.useRef<string>();
  if (!idRef.current) idRef.current = `savebar:${++saveBarCounter}`;

  useRegisterDirty({
    id: idRef.current,
    dirty,
    saving,
    save: onSave,
    reset: onReset,
  });

  return null;
}
