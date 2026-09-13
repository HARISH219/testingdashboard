import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { botApi } from "@/lib/bot-api";
import { prisma } from "@/lib/db";
import { HAS_DATABASE, HAS_BOT_API } from "@/lib/env";

const actionSchema = z.object({
  type: z.enum([
    "warn", "ban", "kick", "mute", "unmute", "unban", "tempban", "hardban",
    "slowmode", "lock", "unlock", "purge",
  ]),
  targetId: z.string().min(1),
  targetTag: z.string().optional(),
  reason: z.string().max(512).optional(),
  duration: z.number().int().positive().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    await requirePermission(params.guildId, "moderation", "view");
    if (!HAS_DATABASE) return NextResponse.json({ actions: [], demo: true });
    const actions = await prisma.modAction.findMany({
      where: { guildId: params.guildId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ actions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { user } = await requirePermission(params.guildId, "moderation", "manage");
    const parsed = actionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action", detail: parsed.error.flatten() }, { status: 400 });
    }
    const action = parsed.data;

    // Record the action (audit trail).
    if (HAS_DATABASE) {
      await prisma.modAction.create({
        data: {
          guildId: params.guildId,
          type: action.type,
          targetId: action.targetId,
          targetTag: action.targetTag,
          moderatorId: user.discordId,
          reason: action.reason,
          duration: action.duration,
        },
      });
    }

    // Ask the bot to actually perform the action.
    const result = await botApi.runModAction(params.guildId, action);

    return NextResponse.json({
      ok: true,
      executed: result.ok,
      pending: result.pending || !HAS_BOT_API,
      message: result.pending
        ? "Action recorded. Bot execution pending integration."
        : result.ok
          ? "Action executed."
          : `Recorded, but bot reported: ${result.error}`,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
