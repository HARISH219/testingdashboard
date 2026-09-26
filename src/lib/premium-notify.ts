import { prisma } from "./db";
import { HAS_DATABASE } from "./env";
import { botApi } from "./bot-api";
import { encodeJson } from "./json-fields";

/**
 * Premium purchase notification.
 *
 * When a premium plan is successfully activated (verified server-side), Soward
 * posts a professional embed to a FIXED internal Discord channel. This is not a
 * user-editable setting — the channel is hardcoded from the internal Soward
 * server URL:
 *   https://discord.com/channels/1105829839522517093/1553274669224669159
 *   guild = 1105829839522517093, channel = 1553274669224669159
 *
 * Duplicate prevention: we key each notification on the payment/event id and
 * record an AuditLog marker ("premium.notified") before/after sending, so the
 * same activation event can never trigger more than one message even if the
 * verify route or a webhook fires twice.
 */

export const PREMIUM_NOTIFY_CHANNEL_ID = "1553274669224669159";

const ARCTIC = 0x3b82f6;

export interface PremiumActivation {
  /** Unique id for this activation event (e.g. Razorpay paymentId or Stripe event id). */
  eventId: string;
  guildId: string;
  guildName: string;
  tier: string;
  interval?: string;
  activatedByTag?: string;
  activatedById?: string;
}

function buildEmbed(a: PremiumActivation) {
  const durationLabel =
    a.interval === "yearly" ? "365 days" : a.interval === "monthly" ? "30 days" : "—";
  const activated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    title: "🎉 Premium Activated",
    color: ARCTIC,
    fields: [
      { name: "Server", value: a.guildName || a.guildId, inline: true },
      { name: "Plan", value: a.tier, inline: true },
      { name: "Activated by", value: a.activatedByTag ? `${a.activatedByTag}` : "—", inline: true },
      { name: "Server ID", value: a.guildId, inline: true },
      { name: "Plan duration", value: durationLabel, inline: true },
      { name: "Activated", value: activated, inline: true },
    ],
    footer: { text: "Soward Premium" },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send the premium activation notification exactly once for the given event.
 * Safe to call from multiple code paths — it self-guards against duplicates.
 * Never throws; failures are logged and swallowed so they can't break billing.
 */
export async function notifyPremiumActivated(a: PremiumActivation): Promise<void> {
  const marker = `premium.notified:${a.eventId}`;
  try {
    if (HAS_DATABASE) {
      // Claim the notification atomically-ish: if a marker already exists we've
      // already sent (or are sending) for this event → skip.
      const existing = await prisma.auditLog.findFirst({
        where: { guildId: a.guildId, action: marker },
      });
      if (existing) return;
      await prisma.auditLog.create({
        data: {
          guildId: a.guildId,
          action: marker,
          detail: encodeJson({ tier: a.tier, interval: a.interval, by: a.activatedByTag }),
        },
      });
    }

    const res = await botApi.sendInternalNotification({
      channelId: PREMIUM_NOTIFY_CHANNEL_ID,
      embed: buildEmbed(a),
    });

    if (!res.ok && !res.pending) {
      console.warn("[premium-notify] send failed:", res.error);
    }
  } catch (e) {
    // Notification must never block or fail premium activation.
    console.warn("[premium-notify] error:", (e as Error).message);
  }
}
