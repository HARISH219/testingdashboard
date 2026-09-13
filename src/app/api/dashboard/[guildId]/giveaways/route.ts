import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { botApi } from "@/lib/bot-api";

// In-memory demo store
const memGiveaways = new Map<string, any[]>();

const createSchema = z.object({
  prize: z.string().min(1).max(200),
  winners: z.number().int().min(1).max(50),
  durationHours: z.number().min(0.1).max(24 * 30),
  requiredRoleId: z.string().optional(),
  winnerRoleId: z.string().optional(),
  channelId: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, "giveaways", "view");
    if (!HAS_DATABASE) return NextResponse.json({ giveaways: memGiveaways.get(params.guildId) ?? [], demo: true });
    const giveaways = await prisma.giveaway.findMany({ where: { guildId: params.guildId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ giveaways });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    const { user } = await requirePermission(params.guildId, "giveaways", "manage");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid giveaway", detail: parsed.error.flatten() }, { status: 400 });
    const { durationHours, ...rest } = parsed.data;
    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000);

    let giveaway: any;
    if (HAS_DATABASE) {
      giveaway = await prisma.giveaway.create({ data: { guildId: params.guildId, endsAt, createdBy: user.discordId, ...rest } });
    } else {
      giveaway = { id: Math.random().toString(36).slice(2), guildId: params.guildId, endsAt, ended: false, wonBy: [], ...rest };
      const arr = memGiveaways.get(params.guildId) ?? [];
      arr.unshift(giveaway);
      memGiveaways.set(params.guildId, arr);
    }
    void botApi.syncConfig(params.guildId, "giveaway.create", giveaway);
    return NextResponse.json({ ok: true, giveaway });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
