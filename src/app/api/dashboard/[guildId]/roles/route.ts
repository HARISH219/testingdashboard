import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild, getGuildPermissions } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { PERMIT_ICONS } from "@/lib/permits";
import { decodeJson, decodeList, encodeList, encodeJson } from "@/lib/json-fields";

/**
 * Permits API — CRUD for the permission-management system.
 *
 * A "permit" is a DashboardRole: a set of Discord roles mapped to granular
 * `moduleKey:action` permissions. Every write is owner-gated and re-validated
 * server-side; the wildcard "*" can never be granted from the client, and only
 * ids that exist in the real permission catalog are accepted (prevents
 * privilege escalation). All mutations write an AuditLog row.
 */

// Demo store for when no database is configured.
const memRoles = new Map<string, any[]>();

const iconEnum = z.enum(PERMIT_ICONS as unknown as [string, ...string[]]);

const permitSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional().nullable(),
  icon: iconEnum.default("Shield"),
  enabled: z.boolean().default(true),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#9EDCFF"),
  permissions: z.array(z.string()).default([]),
  discordRoleIds: z.array(z.string()).default([]),
  priority: z.number().int().default(0),
});

const updateSchema = permitSchema.partial().extend({ id: z.string().min(1) });

/** Only owners / MANAGE_GUILD holders (wildcard) may manage permits. */
async function requireOwner(guildId: string) {
  const authz = await authorizeGuild(guildId);
  if (!authz) return null;
  const perms = await getGuildPermissions(authz.user, authz.guild);
  if (!perms.includes("*")) return null;
  return authz;
}

/** Keep only real, non-wildcard permission ids. */
function sanitizePerms(ids: string[]): string[] {
  return ids.filter((p) => p !== "*" && ALL_PERMISSIONS.includes(p));
}

function shape(row: any) {
  return {
    ...row,
    permissions: decodeList(row.permissions),
    discordRoleIds: decodeList(row.discordRoleIds),
  };
}

async function writeAudit(
  guildId: string,
  action: string,
  detail: Record<string, unknown>
) {
  if (!HAS_DATABASE) return;
  try {
    await prisma.auditLog.create({
      data: { guildId, action, detail: encodeJson(detail) },
    });
  } catch {
    // Audit is best-effort; never fail the mutation because logging failed.
  }
}

/**
 * Make sure the Guild row exists before inserting anything that references it.
 * Best-effort: if this fails the caller's try/catch surfaces a clear error.
 */
async function ensureGuild(guildId: string, name: string, icon: string | null) {
  await prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId, name, icon: icon ?? null },
  });
}

/**
 * Turn a thrown DB error into a JSON 500 with a helpful, actionable message.
 * Without this the route would return an empty body and the client would fail
 * with "Unexpected end of JSON input". The most common cause here is the Turso
 * table missing the newer permit columns — point the user at the migration.
 */
function dbError(e: unknown, op: string) {
  const message = e instanceof Error ? e.message : String(e);
  const missingColumn = /no such column|has no column|no such table/i.test(message);
  return NextResponse.json(
    {
      error: missingColumn
        ? "The database is missing the latest permit columns. Run `npm run db:init:turso` to apply them."
        : `Could not ${op} permit.`,
      detail: message.slice(0, 300),
    },
    { status: 500 }
  );
}

/* --------------------------------- GET ----------------------------------- */

export async function GET(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const wantActivity = searchParams.get("activity") === "1";

  if (!HAS_DATABASE) {
    return NextResponse.json({
      permits: memRoles.get(params.guildId) ?? [],
      allPermissions: ALL_PERMISSIONS,
      activity: [],
      demo: true,
    });
  }

  try {
    const rows = await prisma.dashboardRole.findMany({
      where: { guildId: params.guildId },
      orderBy: { priority: "desc" },
    });
    const permits = rows.map(shape);

    let activity: any[] = [];
    if (wantActivity) {
      try {
        const logs = await prisma.auditLog.findMany({
          where: { guildId: params.guildId, action: { startsWith: "permit." } },
          orderBy: { createdAt: "desc" },
          take: 25,
        });
        activity = logs.map((l) => ({
          id: l.id,
          action: l.action,
          detail: decodeJson(l.detail),
          createdAt: l.createdAt,
        }));
      } catch {
        activity = [];
      }
    }

    return NextResponse.json({ permits, allPermissions: ALL_PERMISSIONS, activity });
  } catch (e) {
    return dbError(e, "load");
  }
}

/* --------------------------------- POST ---------------------------------- */

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  const parsed = permitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid permit", detail: parsed.error.flatten() }, { status: 400 });
  }
  const permissions = sanitizePerms(parsed.data.permissions);

  if (!HAS_DATABASE) {
    const permit = {
      id: Math.random().toString(36).slice(2),
      guildId: params.guildId,
      ...parsed.data,
      permissions,
      createdBy: authz.user.discordId,
    };
    const arr = memRoles.get(params.guildId) ?? [];
    arr.push(permit);
    memRoles.set(params.guildId, arr);
    return NextResponse.json({ ok: true, permit });
  }

  try {
    // Ensure the Guild row exists so the DashboardRole foreign key can't fail
    // on a guild the dashboard has never persisted before.
    await ensureGuild(params.guildId, authz.guild.name, authz.guild.icon);

    const created = await prisma.dashboardRole.create({
      data: {
        guildId: params.guildId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        icon: parsed.data.icon,
        enabled: parsed.data.enabled,
        color: parsed.data.color,
        priority: parsed.data.priority,
        permissions: encodeList(permissions),
        discordRoleIds: encodeList(parsed.data.discordRoleIds),
        createdBy: authz.user.discordId,
      },
    });
    await writeAudit(params.guildId, "permit.create", {
      by: authz.user.username,
      permit: created.name,
      permissions: permissions.length,
    });
    return NextResponse.json({ ok: true, permit: shape(created) });
  } catch (e) {
    return dbError(e, "create");
  }
}

/* ---------------------------------- PUT ---------------------------------- */

export async function PUT(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", detail: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...changes } = parsed.data;

  if (!HAS_DATABASE) {
    const arr = memRoles.get(params.guildId) ?? [];
    const idx = arr.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    if (changes.permissions) changes.permissions = sanitizePerms(changes.permissions);
    arr[idx] = { ...arr[idx], ...changes };
    memRoles.set(params.guildId, arr);
    return NextResponse.json({ ok: true, permit: arr[idx] });
  }

  try {
    const existing = await prisma.dashboardRole.findFirst({
      where: { id, guildId: params.guildId },
    });
    if (!existing) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (changes.name !== undefined) data.name = changes.name;
    if (changes.description !== undefined) data.description = changes.description ?? null;
    if (changes.icon !== undefined) data.icon = changes.icon;
    if (changes.enabled !== undefined) data.enabled = changes.enabled;
    if (changes.color !== undefined) data.color = changes.color;
    if (changes.priority !== undefined) data.priority = changes.priority;
    if (changes.permissions !== undefined) data.permissions = encodeList(sanitizePerms(changes.permissions));
    if (changes.discordRoleIds !== undefined) data.discordRoleIds = encodeList(changes.discordRoleIds);

    const updated = await prisma.dashboardRole.update({ where: { id }, data });
    await writeAudit(params.guildId, "permit.update", {
      by: authz.user.username,
      permit: updated.name,
      fields: Object.keys(changes),
    });
    return NextResponse.json({ ok: true, permit: shape(updated) });
  } catch (e) {
    return dbError(e, "update");
  }
}

/* -------------------------------- DELETE --------------------------------- */

export async function DELETE(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (!HAS_DATABASE) {
    memRoles.set(
      params.guildId,
      (memRoles.get(params.guildId) ?? []).filter((r) => r.id !== id)
    );
    return NextResponse.json({ ok: true });
  }

  try {
    const existing = await prisma.dashboardRole.findFirst({
      where: { id, guildId: params.guildId },
    });
    await prisma.dashboardRole.deleteMany({ where: { id, guildId: params.guildId } });
    if (existing) {
      await writeAudit(params.guildId, "permit.delete", {
        by: authz.user.username,
        permit: existing.name,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e, "delete");
  }
}
