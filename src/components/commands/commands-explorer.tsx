"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpenText, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CommandIcon } from "./command-icon";
import {
  COMMANDS,
  COMMAND_CATEGORIES,
  COMMAND_CATEGORY_ORDER,
  searchCommands,
  type CommandCategory,
  type SnowyCommand,
} from "@/lib/commands";
import { cn } from "@/lib/utils";

const categoryValues = new Set(COMMAND_CATEGORY_ORDER.map((category) => category.toLowerCase()));

function safeCategory(value: string | null): string {
  if (!value) return "all";
  const normalized = value.toLowerCase();
  return categoryValues.has(normalized) ? normalized : "all";
}

export function CommandsExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(searchParams.get("search") ?? "");
  const [category, setCategory] = React.useState(() => safeCategory(searchParams.get("category")));

  const filtered = React.useMemo(
    () => searchCommands(query, category),
    [query, category]
  );

  const grouped = React.useMemo(() => {
    const groups = new Map<CommandCategory, SnowyCommand[]>();
    for (const command of filtered) {
      const list = groups.get(command.category) ?? [];
      list.push(command);
      groups.set(command.category, list);
    }
    return COMMAND_CATEGORY_ORDER
      .map((name) => ({ name, commands: groups.get(name) ?? [] }))
      .filter((group) => group.commands.length > 0);
  }, [filtered]);

  const updateUrl = React.useCallback(
    (nextQuery: string, nextCategory: string) => {
      const params = new URLSearchParams();
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextQuery.trim()) params.set("search", nextQuery.trim());
      const suffix = params.toString();
      router.replace(suffix ? `/commands?${suffix}` : "/commands", { scroll: false });
    },
    [router]
  );

  const changeQuery = (value: string) => {
    setQuery(value);
    updateUrl(value, category);
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    updateUrl(query, value);
  };

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        changeQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `changeQuery` intentionally reads the current category.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const controls = [
    { name: "All Commands", value: "all", count: COMMANDS.length, icon: "ListMusic" },
    ...COMMAND_CATEGORIES.map((item) => ({
      name: item.name,
      value: item.name.toLowerCase(),
      count: item.count,
      icon: item.icon,
    })),
  ];

  return (
    <div className="container relative z-10 pb-20 pt-6 sm:pt-10">
      {/* Mobile category rail */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 lg:hidden no-scrollbar">
        <div className="flex min-w-max gap-2">
          {controls.map((item) => {
            const active = category === item.value;
            return (
              <button
                key={item.value}
                onClick={() => changeCategory(item.value)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-all",
                  active
                    ? "border-arctic/35 bg-arctic/12 text-snow shadow-glow-sm"
                    : "border-white/[0.08] bg-white/[0.035] text-frost hover:bg-white/[0.07]"
                )}
              >
                <CommandIcon name={item.icon} className={cn("size-4", active && "text-arctic")} />
                {item.name}
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        {/* Desktop category sidebar */}
        <aside className="hidden lg:block">
          <div className="glass sticky top-24 rounded-2xl p-2">
            <nav className="space-y-1" aria-label="Command categories">
              {controls.map((item) => {
                const active = category === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => changeCategory(item.value)}
                    aria-pressed={active}
                    className={cn(
                      "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                      active
                        ? "border border-arctic/25 bg-arctic/10 text-snow shadow-glow-sm"
                        : "border border-transparent text-frost hover:bg-white/[0.05] hover:text-snow"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="command-category-active"
                        className="absolute left-0 h-5 w-0.5 rounded-r-full bg-arctic"
                      />
                    )}
                    <CommandIcon name={item.icon} className={cn("size-4 shrink-0", active && "text-arctic")} />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          {/* Heading + search */}
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-arctic">
                Commands
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-snow sm:text-4xl">
                {category === "all"
                  ? "All Commands"
                  : COMMAND_CATEGORIES.find((item) => item.name.toLowerCase() === category)?.name}
              </h1>
              <p className="mt-3 text-sm leading-6 text-frost sm:text-base">
                Explore every command Soward actually supports. Search by name, description,
                category, aliases, or keywords.
              </p>
            </motion.div>

            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Search commands..."
                aria-label="Search commands"
                className="h-12 bg-white/[0.045] pl-10 pr-20"
              />
              {query ? (
                <button
                  onClick={() => changeQuery("")}
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-snow"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 font-sans text-[10px] text-muted-foreground">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-10 text-center sm:p-14">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-snow">No commands found</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Try a shorter search, a different alias, or reset the active category.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-5"
                    onClick={() => {
                      setQuery("");
                      setCategory("all");
                      updateUrl("", "all");
                    }}
                  >
                    Reset filters
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key={`${category}:${query}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                {grouped.map((group) => {
                  const categoryMeta = COMMAND_CATEGORIES.find((item) => item.name === group.name);
                  return (
                    <section key={group.name} id={group.name.toLowerCase()} className="scroll-mt-24">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-arctic/15 bg-arctic/[0.07] text-arctic">
                            <CommandIcon name={categoryMeta?.icon ?? "Sparkles"} className="size-4" />
                          </div>
                          <h2 className="truncate text-lg font-semibold text-snow">{group.name}</h2>
                          <Badge variant="secondary">{group.commands.length}</Badge>
                        </div>
                        {category === "all" && (
                          <button
                            onClick={() => changeCategory(group.name.toLowerCase())}
                            className="flex shrink-0 items-center gap-1 text-xs text-arctic transition-colors hover:text-ice"
                          >
                            View all <ArrowRight className="size-3" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.commands.map((command, index) => (
                          <CommandCard key={command.slug} command={command} index={index} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-12 text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {COMMANDS.length} supported commands
          </p>
        </main>
      </div>
    </div>
  );
}

function CommandCard({ command, index }: { command: SnowyCommand; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Link
        href={`/commands/${command.slug}`}
        className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arctic/70"
      >
        <Card className="h-full min-h-40 p-5 transition-all duration-300 group-hover:border-arctic/30 group-hover:bg-arctic/[0.055] group-hover:shadow-glow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-arctic transition-all group-hover:border-arctic/25 group-hover:bg-arctic/10">
              <CommandIcon name={command.icon} className="size-5" />
            </div>
            <h3 className="min-w-0 truncate font-mono text-base font-semibold text-snow">
              /{command.name}
            </h3>
          </div>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-frost">
            {command.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {command.category}
            </Badge>
            {command.aliases.slice(0, 2).map((alias) => (
              <span key={alias} className="font-mono text-[10px] text-muted-foreground">
                /{alias}
              </span>
            ))}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
