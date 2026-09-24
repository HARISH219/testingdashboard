import { NextRequest, NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { decodeJson } from "@/lib/json-fields";

/**
 * Dashboard activity log — who changed what in the dashboard. Reads AuditLog
 * entries for this guild (config updates, permit changes, billing, etc.).
 * Any manager can view. Degrades to an empty list if the DB is unavailable.
 */
export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!HAS_DATABASE) return NextResponse.json({ logs: [], demo: true });

  try {
    const rows = await prisma.auditLog.findMany({
      where: { guildId: params.guildId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const logs = rows.map((r) => ({
      id: r.id,
      action: r.action,
      detail: decodeJson(r.detail),
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ logs });
  } catch {
    // Tables not created yet / DB down — never fail the page.
    return NextResponse.json({ logs: [] });
  }
}
