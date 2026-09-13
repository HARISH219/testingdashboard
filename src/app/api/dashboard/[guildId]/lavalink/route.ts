import { NextRequest, NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/authz";
import { botApi } from "@/lib/bot-api";
import { DEMO_MODE } from "@/lib/env";
import { DEMO_LAVALINK } from "@/lib/demo";

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const result = await botApi.getLavalink();
  if (result.ok) return NextResponse.json({ ...result.data, live: true });

  return NextResponse.json({ ...DEMO_LAVALINK, live: false, pending: result.pending || DEMO_MODE });
}
