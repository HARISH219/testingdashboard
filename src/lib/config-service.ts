import { HAS_DATABASE } from "./env";
import { prisma } from "./db";
import { botApi } from "./bot-api";
import { decodeJson, encodeJson } from "./json-fields";

/**
 * Module configuration service.
 * Persists per-guild module settings to the database and pushes them to the
 * bot API when available. In demo mode (no DB) it uses a process-memory store
 * so the UI is fully interactive during local review.
 */

const memoryStore = new Map<string, { enabled: boolean; data: Record<string, unknown> }>();

function key(guildId: string, module: string) {
  return `${guildId}:${module}`;
}

export interface ModuleConfigResult {
  enabled: boolean;
  data: Record<string, unknown>;
  source: "db" | "memory";
}

export async function getModuleConfig(
  guildId: string,
  module: string,
  defaults: Record<string, unknown> = {}
): Promise<ModuleConfigResult> {
  if (HAS_DATABASE) {
    try {
      const row = await prisma.moduleConfig.findUnique({
        where: { guildId_module: { guildId, module } },
      });
      return {
        enabled: row?.enabled ?? false,
        data: { ...defaults, ...decodeJson(row?.data) },
        source: "db",
      };
    } catch {
      // DB unreachable or tables not created yet (e.g. db:init:turso not run).
      // Fall back to the in-memory store so the page loads instead of erroring
      // with "Failed to load". Saves will persist to memory until the DB works.
    }
  }
  const mem = memoryStore.get(key(guildId, module));
  return {
    enabled: mem?.enabled ?? false,
    data: { ...defaults, ...(mem?.data ?? {}) },
    source: "memory",
  };
}

export async function setModuleConfig(
  guildId: string,
  module: string,
  update: { enabled?: boolean; data?: Record<string, unknown> },
  updatedBy?: string
): Promise<ModuleConfigResult> {
  let enabled: boolean;
  let data: Record<string, unknown>;
  let source: "db" | "memory" = "memory";

  let dbOk = false;
  if (HAS_DATABASE) {
    try {
      const existing = await prisma.moduleConfig.findUnique({
        where: { guildId_module: { guildId, module } },
      });
      enabled = update.enabled ?? existing?.enabled ?? false;
      data = { ...decodeJson(existing?.data), ...(update.data ?? {}) };
      const jsonData = encodeJson(data);
      // Ensure the guild row exists for the FK before upserting config.
      await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId, name: guildId },
      });
      await prisma.moduleConfig.upsert({
        where: { guildId_module: { guildId, module } },
        create: { guildId, module, enabled, data: jsonData, updatedBy },
        update: { enabled, data: jsonData, updatedBy },
      });
      // Record who changed this module, for the dashboard logs / audit trail.
      await prisma.auditLog.create({
        data: {
          guildId,
          action: "config.update",
          detail: encodeJson({ module, enabled, by: updatedBy ?? "unknown" }),
        },
      }).catch(() => {});
      source = "db";
      dbOk = true;
    } catch {
      // DB unreachable or not migrated — fall through to the memory store so
      // saving never hard-fails the UI.
    }
  }

  if (!dbOk) {
    const mem = memoryStore.get(key(guildId, module)) ?? { enabled: false, data: {} };
    enabled = update.enabled ?? mem.enabled;
    data = { ...mem.data, ...(update.data ?? {}) };
    memoryStore.set(key(guildId, module), { enabled, data });
    source = "memory";
  }

  // Best-effort push to bot (no-op / pending when bot API not configured).
  void botApi.syncConfig(guildId, module, { enabled: enabled!, data: data! });

  return { enabled: enabled!, data: data!, source };
}
