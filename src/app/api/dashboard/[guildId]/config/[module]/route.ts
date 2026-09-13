import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { getModuleConfig, setModuleConfig } from "@/lib/config-service";
import { getGuildTier } from "@/lib/subscription";
import { MODULE_MAP } from "@/lib/modules";
import { planMeets } from "@/lib/plans";
import { HAS_BOT_API } from "@/lib/env";

const bodySchema = z.object({
  enabled: z.boolean().optional(),
  data: z.record(z.unknown()).optional(),
});

function handleError(e: unknown) {
  const status = (e as any)?.status ?? 500;
  return NextResponse.json({ error: (e as Error).message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string; module: string } }
) {
  try {
    const mod = MODULE_MAP[params.module];
    await requirePermission(params.guildId, params.module, "view");
    const cfg = await getModuleConfig(params.guildId, params.module);
    return NextResponse.json({ ...cfg, minPlan: mod?.minPlan ?? "FREE" });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { guildId: string; module: string } }
) {
  try {
    const { user } = await requirePermission(params.guildId, params.module, "manage");

    // Plan gating — enforced server-side, not just in the UI.
    const mod = MODULE_MAP[params.module];
    if (mod) {
      const tier = await getGuildTier(params.guildId);
      if (!planMeets(tier, mod.minPlan)) {
        return NextResponse.json(
          { error: `Upgrade to ${mod.minPlan} to configure ${mod.name}` },
          { status: 402 }
        );
      }
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", detail: parsed.error.flatten() }, { status: 400 });
    }

    const result = await setModuleConfig(
      params.guildId,
      params.module,
      parsed.data,
      user.discordId
    );

    return NextResponse.json({ ...result, pending: !HAS_BOT_API });
  } catch (e) {
    return handleError(e);
  }
}
