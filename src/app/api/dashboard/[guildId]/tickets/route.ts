import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authz";
import { botApi } from "@/lib/bot-api";
import { getModuleConfig, setModuleConfig } from "@/lib/config-service";
import { HAS_BOT_API } from "@/lib/env";

/**
 * Tickets — config + panel deployment.
 *
 * GET  → current ticket config (from ModuleConfig "tickets").
 * POST → { action: "sendPanel" } asks the BOT to post the ticket panel to the
 *        configured channel and returns the sent message id, which we persist
 *        (panelMessageId) so the dashboard knows a panel is deployed.
 *
 * NOTE: the dashboard cannot post Discord messages or create channels itself —
 * it has no gateway connection and must never hold the bot token client-side.
 * The actual "send panel / create ticket channel / write transcript" logic
 * lives in the bot service; the dashboard triggers it via botApi and stores the
 * resulting ids. When the bot API isn't configured, we report `pending` so the
 * UI can explain instead of faking a send.
 */

const MODULE = "tickets";

const defaults = {
  categoryChannelId: "",
  supportRoles: [] as string[],
  panelTitle: "Need help?",
  panelDescription: "Click the button below to open a support ticket.",
  panelChannelId: "",
  panelMessageId: "",
  panelImageUrl: "",
  transcripts: true,
  transcriptChannelId: "",
  allowMultiple: false,
};

export async function GET(_req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    await requirePermission(params.guildId, MODULE, "view");
    const cfg = await getModuleConfig(params.guildId, MODULE, defaults);
    return NextResponse.json(cfg);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}

const actionSchema = z.object({
  action: z.literal("sendPanel"),
  // Optional destination override; falls back to the saved panelChannelId.
  channelId: z.string().optional(),
  redeploy: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  try {
    const { user } = await requirePermission(params.guildId, MODULE, "manage");
    const parsed = actionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { enabled, data } = await getModuleConfig(params.guildId, MODULE, defaults);
    const cfg = data as typeof defaults;

    // Server-side validation before asking the bot to send anything.
    if (!enabled) {
      return NextResponse.json({ error: "Enable the ticket system before sending a panel." }, { status: 400 });
    }
    if (!cfg.categoryChannelId) {
      return NextResponse.json({ error: "Select a ticket category first." }, { status: 400 });
    }
    if (!cfg.panelTitle?.trim() || !cfg.panelDescription?.trim()) {
      return NextResponse.json({ error: "Set a panel title and description first." }, { status: 400 });
    }
    const channelId = parsed.data.channelId || cfg.panelChannelId;
    if (!channelId) {
      return NextResponse.json({ error: "Select a destination channel for the panel." }, { status: 400 });
    }

    if (!HAS_BOT_API) {
      // No bot service wired up — save the chosen channel but be honest that the
      // actual Discord message can't be sent yet.
      await setModuleConfig(params.guildId, MODULE, { data: { ...cfg, panelChannelId: channelId } }, user.discordId);
      return NextResponse.json({
        ok: false,
        pending: true,
        message: "Saved. Connect the Soward bot API to actually post the panel to Discord.",
      });
    }

    // Ask the bot to post the panel. It returns the created message id.
    const result = await botApi.syncConfig(params.guildId, "tickets.sendPanel", {
      channelId,
      categoryChannelId: cfg.categoryChannelId,
      supportRoles: cfg.supportRoles,
      title: cfg.panelTitle,
      description: cfg.panelDescription,
      imageUrl: cfg.panelImageUrl,
      transcripts: cfg.transcripts,
      transcriptChannelId: cfg.transcriptChannelId,
      allowMultiple: cfg.allowMultiple,
      redeploy: parsed.data.redeploy ?? false,
    });

    const messageId = (result.data as any)?.messageId ?? "";
    // Persist the deployed panel's channel + message id.
    await setModuleConfig(
      params.guildId,
      MODULE,
      { data: { ...cfg, panelChannelId: channelId, panelMessageId: messageId } },
      user.discordId
    );

    return NextResponse.json({
      ok: result.ok,
      pending: result.pending,
      channelId,
      messageId,
      message: result.ok ? "Ticket panel sent." : result.pending ? "Panel queued — bot integration pending." : `Bot reported: ${result.error}`,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
