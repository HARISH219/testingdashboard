import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { botApi } from "@/lib/bot-api";
import { DEMO_MODE } from "@/lib/env";
import { DEMO_NOW_PLAYING, DEMO_QUEUE } from "@/lib/demo";

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, "music", "view");
    const result = await botApi.getMusicState(params.guildId);
    if (result.ok) return NextResponse.json({ ...result.data, live: true });
    return NextResponse.json({
      nowPlaying: DEMO_NOW_PLAYING, queue: DEMO_QUEUE, connected: DEMO_MODE, live: false, pending: result.pending,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

const controlSchema = z.object({
  action: z.enum(["play", "pause", "resume", "skip", "stop", "shuffle", "loop", "volume", "seek", "247"]),
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, "music", "manage");
    const parsed = controlSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid control" }, { status: 400 });
    const result = await botApi.musicControl(params.guildId, parsed.data.action, { value: parsed.data.value });
    return NextResponse.json({ ok: true, executed: result.ok, pending: result.pending, message: result.pending ? "Control accepted. Bot playback pending integration." : "Done." });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
