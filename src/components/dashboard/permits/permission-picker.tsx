"use client";

import * as React from "react";
import { Search, ListChecks, ListX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermitGlyph, PermissionRow } from "./permit-ui";
import { catalogByCategory, PERMISSION_CATEGORY_ORDER, type PermissionCategory } from "@/lib/permits";
import { cn } from "@/lib/utils";

/**
 * Searchable, category-grouped permission picker with per-category
 * Select All / Clear All. Used by the create wizard and the detail page.
 */
export function PermissionPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<PermissionCategory | "All">("All");

  const q = query.trim().toLowerCase();
  const groups = catalogByCategory(
    (p) =>
      (category === "All" || p.category === category) &&
      (q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q))
  );

  const set = new Set(selected);
  const toggle = (id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  const selectAll = (ids: string[]) => onChange([...new Set([...selected, ...ids])]);
  const clearAll = (ids: string[]) => onChange(selected.filter((s) => !ids.includes(s)));

  const filters: (PermissionCategory | "All")[] = ["All", ...PERMISSION_CATEGORY_ORDER];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search permissions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Category filter chips */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            className={cn(
              "min-h-[36px] whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === f
                ? "border-arctic/30 bg-primary/15 text-snow"
                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-frost"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grouped rows */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <p className="text-sm font-medium text-snow">No permissions found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const ids = g.permissions.map((p) => p.id);
            const allOn = ids.every((id) => set.has(id));
            return (
              <div key={g.category}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PermitGlyph name={g.icon} className="size-4 text-arctic" />
                    <p className="text-sm font-semibold uppercase tracking-wide text-frost">
                      {g.category}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => (allOn ? clearAll(ids) : selectAll(ids))}
                    >
                      {allOn ? (
                        <><ListX className="size-3.5" /> Clear all</>
                      ) : (
                        <><ListChecks className="size-3.5" /> Select all</>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {g.permissions.map((p) => (
                    <PermissionRow
                      key={p.id}
                      icon={p.icon}
                      name={p.name}
                      description={p.description}
                      checked={set.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
