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
    const row = await prisma.moduleConfig.findUnique({
      where: { guildId_module: { guildId, module } },
    });
    return {
      enabled: row?.enabled ?? false,
      data: { ...defaults, ...decodeJson(row?.data) },
      source: "db",
    };
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

  if (HAS_DATABASE) {
    const existing = await prisma.moduleConfig.findUnique({
      where: { guildId_module: { guildId, module } },
    });
    enabled = update.enabled ?? existing?.enabled ?? false;
    data = { ...decodeJson(existing?.data), ...(update.data ?? {}) };
    const jsonData = encodeJson(data);
    await prisma.moduleConfig.upsert({
      where: { guildId_module: { guildId, module } },
      create: { guildId, module, enabled, data: jsonData, updatedBy },
      update: { enabled, data: jsonData, updatedBy },
    });
  } else {
    const mem = memoryStore.get(key(guildId, module)) ?? { enabled: false, data: {} };
    enabled = update.enabled ?? mem.enabled;
    data = { ...mem.data, ...(update.data ?? {}) };
    memoryStore.set(key(guildId, module), { enabled, data });
  }

  // Best-effort push to bot (no-op / pending when bot API not configured).
  void botApi.syncConfig(guildId, module, { enabled, data });

  return { enabled, data, source: HAS_DATABASE ? "db" : "memory" };
}
