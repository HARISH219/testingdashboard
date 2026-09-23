import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { botApi } from "@/lib/bot-api";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { decodeJson, encodeJson } from "@/lib/json-fields";
import {
  normalizeConfig, defaultAntinukeConfig, decide, isExpired,
  WATCHED_ACTION_MAP, punishmentLabel,
  type AntinukeActionKey, type AntinukeConfig,
} from "@/lib/antinuke";

/**
 * Antinuke config + violation tracking + server-side decisioning.
 *
 * - GET   → current config (normalized), recent security logs, summary stats.
 * - PUT   → persist config (owner/manage only), synced to the bot.
 * - POST  → record a violation and return the ACTION→LIMIT→WARNING→PUNISHMENT
 *           decision. This is the authoritative security decision; the bot
 *           calls it at runtime. The frontend NEVER decides punishment.
 *
 * Config lives in ModuleConfig(guildId,"antinuke").data (JSON). Violation
 * counters and security-log entries live in AuditLog with action prefixes
 * "antinuke.counter" / "antinuke.log" so no schema migration is required.
 */

const MODULE = "antinuke";

/* ------------------------------ config I/O ------------------------------- */

async function readConfig(guildId: string): Promise<{ enabled: boolean; config: AntinukeConfig }> {
  if (!HAS_DATABASE) return { enabled: false, config: defaultAntinukeConfig() };
  const row = await prisma.moduleConfig.findUnique({
    where: { guildId_module: { guildId, module: MODULE } },
  });
  return {
    enabled: row?.enabled ?? false,
    config: normalizeConfig(row ? (decodeJson(row.data) as Partial<AntinukeConfig>) : undefined),
  };
}

/* --------------------------------- GET ----------------------------------- */

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, MODULE, "view");

    const { enabled, config } = await readConfig(params.guildId);

    // Recent security logs + today's summary counts (real data only).
    let logs: any[] = [];
    let warningsToday = 0;
    let punishmentsToday = 0;
    if (HAS_DATABASE) {
      try {
        const rows = await prisma.auditLog.findMany({
          where: { guildId: params.guildId, action: "antinuke.log" },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        logs = rows.map((r) => ({ id: r.id, ...decodeJson(r.detail), createdAt: r.createdAt }));
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        for (const l of logs) {
          if (new Date(l.createdAt) < startOfDay) continue;
          if (l.result === "warn") warningsToday++;
          if (l.result === "punish") punishmentsToday++;
        }
      } catch {
        logs = [];
      }
    }

    const enabledActions = Object.values(config.actions).filter((a) => a.enabled).length;

    return NextResponse.json({
      enabled,
      config,
      logs,
      stats: {
        protectedActions: Object.keys(config.actions).length,
        enabledActions,
        warningsToday,
        punishmentsToday,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

/* --------------------------------- PUT ----------------------------------- */

const configSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    const { user } = await requirePermission(params.guildId, MODULE, "manage");
    const parsed = configSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid config", detail: parsed.error.flatten() }, { status: 400 });
    }
    // Always normalize so we persist a complete, well-formed config.
    const normalized = normalizeConfig(parsed.data.config as Partial<AntinukeConfig>);
    const enabled = parsed.data.enabled ?? false;

    if (HAS_DATABASE) {
      // Ensure guild exists for the FK, then upsert the module config.
      await prisma.guild.upsert({
        where: { id: params.guildId },
        update: {},
        create: { id: params.guildId, name: params.guildId },
      });
      await prisma.moduleConfig.upsert({
        where: { guildId_module: { guildId: params.guildId, module: MODULE } },
        update: { enabled, data: encodeJson(normalized), updatedBy: user.discordId },
        create: { guildId: params.guildId, module: MODULE, enabled, data: encodeJson(normalized), updatedBy: user.discordId },
      });
    }

    // Best-effort push to the bot so runtime enforcement uses the new config.
    await botApi.syncConfig(params.guildId, MODULE, { enabled, config: normalized });

    return NextResponse.json({ ok: true, enabled, config: normalized });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

/* --------------------------------- POST ---------------------------------- */
/* Record a violation and return the authoritative decision. Intended for the
 * bot service to call at runtime (guarded by manage permission / bot secret).
 */

const violationSchema = z.object({
  userId: z.string().min(1),
  username: z.string().optional(),
  action: z.string().min(1),
  roleIds: z.array(z.string()).optional(), // actor's roles, for bypass checks
});

const counterKey = (userId: string, action: string) => `antinuke.counter:${userId}:${action}`;

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, MODULE, "manage");
    const parsed = violationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid violation", detail: parsed.error.flatten() }, { status: 400 });
    }
    const { userId, username, action, roleIds = [] } = parsed.data;

    const actionKey = action as AntinukeActionKey;
    const meta = WATCHED_ACTION_MAP[actionKey];
    if (!meta) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    const { enabled, config } = await readConfig(params.guildId);
    const ac = config.actions[actionKey];

    // Global disable or per-action disable → allow.
    if (!enabled || !ac?.enabled) {
      return NextResponse.json({ decision: "allow", reason: "disabled" });
    }

    // Trusted / ignored bypass — computed server-side.
    const trusted =
      config.trustedUsers.includes(userId) ||
      roleIds.some((r) => config.trustedRoles.includes(r)) ||
      ac.ignoredUsers.includes(userId) ||
      roleIds.some((r) => ac.ignoredRoles.includes(r));
    if (trusted) {
      return NextResponse.json({ decision: "allow", reason: "trusted" });
    }

    if (!HAS_DATABASE) {
      // Without persistence we can't count; fail safe by only monitoring.
      return NextResponse.json({ decision: "allow", reason: "no-store" });
    }

    // Load & apply counter window.
    const key = counterKey(userId, actionKey);
    const existing = await prisma.auditLog.findFirst({
      where: { guildId: params.guildId, action: key },
      orderBy: { createdAt: "desc" },
    });
    const now = Date.now();
    let count = 0;
    if (existing) {
      const detail = decodeJson(existing.detail) as { count?: number; last?: number };
      const last = detail.last ?? new Date(existing.createdAt).getTime();
      if (!isExpired(last, ac.counterWindow, now)) count = detail.count ?? 0;
    }
    count += 1; // include the current violation

    const decision = decide(count, ac);

    // Persist the updated counter (new row = latest state).
    await prisma.auditLog.create({
      data: {
        guildId: params.guildId,
        action: key,
        detail: encodeJson({ count, last: now }),
      },
    });

    // Log warnings/punishments to the security log.
    if (decision !== "allow") {
      await prisma.auditLog.create({
        data: {
          guildId: params.guildId,
          action: "antinuke.log",
          detail: encodeJson({
            userId,
            username: username ?? userId,
            action: meta.label,
            actionKey,
            count,
            limit: ac.limit,
            result: decision,
            punishment: decision === "punish" ? punishmentLabel(ac.punishment) : null,
          }),
        },
      });
    }

    return NextResponse.json({
      decision,
      count,
      limit: ac.limit,
      punishment: ac.punishment,
      punishmentDuration: ac.punishmentDuration,
      warningEnabled: ac.warningEnabled,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
