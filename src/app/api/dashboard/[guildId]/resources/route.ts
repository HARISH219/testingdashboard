import { NextRequest, NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/authz";
import { DEMO_MODE } from "@/lib/env";
import { getGuildChannels, getGuildRoles } from "@/lib/discord";
import { demoChannels, demoRoles } from "@/lib/demo";

/** Returns channels and roles for selectors. Falls back to demo fixtures. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (DEMO_MODE) {
    return NextResponse.json({ channels: demoChannels(), roles: demoRoles(), demo: true });
  }

  try {
    const [channels, roles] = await Promise.all([
      getGuildChannels(params.guildId),
      getGuildRoles(params.guildId),
    ]);
    return NextResponse.json({
      channels: channels
        .filter((c: any) => c.type === 0 || c.type === 2 || c.type === 5)
        .map((c: any) => ({ id: c.id, name: c.name, type: c.type })),
      roles: roles
        .filter((r: any) => r.name !== "@everyone")
        .map((r: any) => ({ id: r.id, name: r.name, color: r.color, position: r.position })),
      demo: false,
    });
  } catch (e) {
    // Bot likely not in guild — return empty with a hint.
    return NextResponse.json({ channels: [], roles: [], error: (e as Error).message });
  }
}
