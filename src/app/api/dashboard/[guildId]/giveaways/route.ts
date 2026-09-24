import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { botApi } from "@/lib/bot-api";
import { decodeList, encodeList, encodeJson } from "@/lib/json-fields";

// In-memory fallback store (used in demo mode AND when the DB is unavailable /
// not yet migrated, so creating a giveaway never hard-fails with a 401/500).
const memGiveaways = new Map<string, any[]>();

const createSchema = z.object({
  prize: z.string().min(1).max(200),
  winners: z.number().int().min(1).max(50),
  durationHours: z.number().min(0.1).max(24 * 30),
  requiredRoleId: z.string().optional(),
  winnerRoleId: z.string().optional(),
  channelId: z.string().optional(),
  // Embed customization
  description: z.string().max(1000).optional(),
  embedTemplate: z.string().max(40).default("classic"),
  embedColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#3B82F6"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  mentionRoleIds: z.array(z.string()).default([]),
});

function shape(g: any) {
  return {
    ...g,
    wonBy: typeof g.wonBy === "string" ? decodeList(g.wonBy) : g.wonBy ?? [],
    mentionRoleIds: typeof g.mentionRoleIds === "string" ? decodeList(g.mentionRoleIds) : g.mentionRoleIds ?? [],
  };
}

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, "giveaways", "view");
    if (HAS_DATABASE) {
      try {
        const rows = await prisma.giveaway.findMany({
          where: { guildId: params.guildId },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ giveaways: rows.map(shape) });
      } catch {
        // Tables not created / DB down — fall back to memory instead of erroring.
      }
    }
    return NextResponse.json({ giveaways: (memGiveaways.get(params.guildId) ?? []).map(shape), demo: !HAS_DATABASE });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    const { user } = await requirePermission(params.guildId, "giveaways", "manage");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid giveaway", detail: parsed.error.flatten() }, { status: 400 });
    }
    const { durationHours, mentionRoleIds, imageUrl, ...rest } = parsed.data;
    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000);

    let giveaway: any;
    let persisted = false;

    if (HAS_DATABASE) {
      try {
        // Ensure the guild row exists so the FK can't fail.
        await prisma.guild.upsert({
          where: { id: params.guildId },
          update: {},
          create: { id: params.guildId, name: params.guildId },
        });
        const created = await prisma.giveaway.create({
          data: {
            guildId: params.guildId,
            endsAt,
            createdBy: user.discordId,
            imageUrl: imageUrl || null,
            mentionRoleIds: encodeList(mentionRoleIds),
            ...rest,
          },
        });
        await prisma.auditLog.create({
          data: {
            guildId: params.guildId,
            action: "giveaway.create",
            detail: encodeJson({ prize: rest.prize, winners: rest.winners, by: user.username }),
          },
        }).catch(() => {});
        giveaway = shape(created);
        persisted = true;
      } catch {
        // DB unreachable or not migrated — fall through to the memory store.
      }
    }

    if (!persisted) {
      giveaway = shape({
        id: Math.random().toString(36).slice(2),
        guildId: params.guildId,
        endsAt,
        ended: false,
        wonBy: [],
        createdBy: user.discordId,
        imageUrl: imageUrl || null,
        mentionRoleIds,
        ...rest,
      });
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
