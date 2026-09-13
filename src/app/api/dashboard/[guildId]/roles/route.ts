import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild, getGuildPermissions } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { ALL_PERMISSIONS } from "@/lib/permissions";

// Demo store for dashboard roles
const memRoles = new Map<string, any[]>();

const roleSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#9EDCFF"),
  permissions: z.array(z.string()).default([]),
  discordRoleIds: z.array(z.string()).default([]),
  priority: z.number().int().default(0),
});

/** Only owners / MANAGE_GUILD holders may manage the permission system. */
async function requireOwner(guildId: string) {
  const authz = await authorizeGuild(guildId);
  if (!authz) return null;
  const perms = await getGuildPermissions(authz.user, authz.guild);
  // Only wildcard holders (owner / admin) can manage permissions — prevents
  // privilege escalation by non-owners.
  if (!perms.includes("*")) return null;
  return authz;
}

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  if (!HAS_DATABASE) {
    return NextResponse.json({ roles: memRoles.get(params.guildId) ?? [], allPermissions: ALL_PERMISSIONS, demo: true });
  }
  const roles = await prisma.dashboardRole.findMany({ where: { guildId: params.guildId }, orderBy: { priority: "desc" } });
  return NextResponse.json({ roles, allPermissions: ALL_PERMISSIONS });
}

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });

  const parsed = roleSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role", detail: parsed.error.flatten() }, { status: 400 });

  // Never allow granting the wildcard from the frontend.
  const permissions = parsed.data.permissions.filter((p) => p !== "*" && ALL_PERMISSIONS.includes(p));

  if (!HAS_DATABASE) {
    const role = { id: Math.random().toString(36).slice(2), guildId: params.guildId, ...parsed.data, permissions };
    const arr = memRoles.get(params.guildId) ?? [];
    arr.push(role);
    memRoles.set(params.guildId, arr);
    return NextResponse.json({ ok: true, role });
  }

  const role = await prisma.dashboardRole.create({
    data: { guildId: params.guildId, ...parsed.data, permissions },
  });
  await prisma.auditLog.create({ data: { guildId: params.guildId, action: "role.create", detail: { name: role.name } } });
  return NextResponse.json({ ok: true, role });
}

export async function DELETE(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await requireOwner(params.guildId);
  if (!authz) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (!HAS_DATABASE) {
    memRoles.set(params.guildId, (memRoles.get(params.guildId) ?? []).filter((r) => r.id !== id));
    return NextResponse.json({ ok: true });
  }
  await prisma.dashboardRole.deleteMany({ where: { id, guildId: params.guildId } });
  return NextResponse.json({ ok: true });
}
