"use client";

/**
 * DEPRECATED — the per-page starfield has been replaced by a single global
 * <CosmicBackground /> mounted once in providers. This is now a no-op so the
 * many existing `<Snowfall … />` call sites keep compiling and simply let the
 * global cosmic background show through (no duplicate/stacked canvases).
 *
 * Prefer not to add new usages; use the global background instead.
 */
export function Snowfall(_props: { density?: number; className?: string }) {
  return null;
}
