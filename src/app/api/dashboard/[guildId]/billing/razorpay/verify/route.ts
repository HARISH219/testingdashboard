import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild } from "@/lib/authz";
import { verifyPaymentSignature, HAS_RAZORPAY } from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { encodeJson } from "@/lib/json-fields";

/**
 * Verify a Razorpay Checkout success payload and activate the subscription.
 *
 * Security: the payment is only accepted if the HMAC-SHA256 signature over
 * "orderId|paymentId" matches (verified server-side with the Key Secret). The
 * frontend cannot forge this, so it cannot grant itself a subscription. Owner
 * gating is enforced independently.
 */

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
  tier: z.enum(["PREMIUM", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!authz.guild.owner && !authz.user.isAdmin) {
    return NextResponse.json({ error: "Only the server owner can manage billing." }, { status: 403 });
  }

  if (!HAS_RAZORPAY) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { orderId, paymentId, signature, tier, interval } = parsed.data;

  // AUTHORITATIVE CHECK — reject anything without a valid Razorpay signature.
  const valid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Signature is valid → activate the subscription.
  if (HAS_DATABASE) {
    try {
      await prisma.guild.upsert({
        where: { id: params.guildId },
        update: {},
        create: { id: params.guildId, name: authz.guild.name },
      });
      const user = await prisma.user.upsert({
        where: { discordId: authz.user.discordId },
        create: { discordId: authz.user.discordId, username: authz.user.username },
        update: {},
      });
      await prisma.subscription.upsert({
        where: { guildId: params.guildId },
        create: {
          guildId: params.guildId,
          userId: user.id,
          tier,
          status: "ACTIVE",
          stripeSubscriptionId: `rzp_${paymentId}`, // reuse column to store the Razorpay reference
        },
        update: { tier, status: "ACTIVE", stripeSubscriptionId: `rzp_${paymentId}` },
      });
      await prisma.auditLog.create({
        data: {
          guildId: params.guildId,
          action: "billing.razorpay.paid",
          detail: encodeJson({ tier, interval, paymentId, orderId, by: authz.user.username }),
        },
      }).catch(() => {});
    } catch (e) {
      return NextResponse.json(
        { error: "Payment verified but could not be recorded. Contact support.", detail: (e as Error).message.slice(0, 200) },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, tier });
}
