import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild } from "@/lib/authz";
import { verifyPaymentSignature, HAS_RAZORPAY } from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { HAS_DATABASE } from "@/lib/env";
import { encodeJson } from "@/lib/json-fields";
import { PLANS, type PlanTier } from "@/lib/plans";

/**
 * Verify a Razorpay Checkout success payload and activate the subscription.
 *
 * Flow (all server-side, never trusting the frontend):
 *   1. Auth + owner gating.
 *   2. Verify the HMAC-SHA256 signature over "orderId|paymentId" with the Key
 *      Secret. Reject if it doesn't match.               (stage: "signature")
 *   3. Idempotency: if this paymentId was already recorded, return success
 *      without granting premium again.
 *   4. Record the Payment + activate the Subscription in ONE transaction, with
 *      the amount derived from trusted server-side plan data — not the client.
 *                                                          (stage: "database")
 *
 * Responses use { success, stage, message } so the frontend only shows
 * "Payment Successful" once recording actually succeeded.
 */

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
  tier: z.enum(["PREMIUM", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

// Must match the order route's conversion so the recorded amount equals the
// amount actually charged.
const USD_TO_INR = 84;
const CURRENCY = "INR";

function serverAmount(tier: PlanTier, interval: "monthly" | "yearly"): number {
  const plan = PLANS[tier];
  const usd = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const inCurrency = CURRENCY === "INR" ? usd * USD_TO_INR : usd;
  return Math.round(inCurrency * 100); // smallest unit
}

/** Structured, non-sensitive server log for payment debugging. */
function logPayment(fields: Record<string, unknown>) {
  // Never logs secrets — only ids, result, stage.
  console.log("[razorpay.verify]", JSON.stringify(fields));
}

/** Map a raw DB error to a safe, actionable message. Never leaks internals. */
function dbHint(message: string): string {
  if (/no such table/i.test(message)) {
    return "Database tables are not initialized. Run `npm run db:init:turso`.";
  }
  if (/no such column|has no column/i.test(message)) {
    return "Database schema is out of date. Run `npm run db:init:turso`.";
  }
  if (/unique/i.test(message)) {
    return "This payment was already processed.";
  }
  return "Payment verified but could not be recorded.";
}

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) {
    return NextResponse.json({ success: false, stage: "auth", message: "Unauthorized" }, { status: 403 });
  }
  if (!authz.guild.owner && !authz.user.isAdmin) {
    return NextResponse.json(
      { success: false, stage: "auth", message: "Only the server owner can manage billing." },
      { status: 403 }
    );
  }

  if (!HAS_RAZORPAY) {
    return NextResponse.json(
      { success: false, stage: "config", message: "Razorpay is not configured." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, stage: "request", message: "Missing or invalid fields." },
      { status: 400 }
    );
  }
  const { orderId, paymentId, signature, tier, interval } = parsed.data;

  // 2. AUTHORITATIVE signature check.
  const valid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!valid) {
    logPayment({ userId: authz.user.discordId, orderId, paymentId, result: "signature_mismatch", stage: "signature" });
    return NextResponse.json(
      { success: false, stage: "signature", message: "Payment signature verification failed." },
      { status: 400 }
    );
  }

  // Amount is derived from trusted plan data, never from the client.
  const amount = serverAmount(tier as PlanTier, interval);

  // With no database we can still confirm the payment is authentic, but we
  // cannot persist it. Be honest about that rather than faking activation.
  if (!HAS_DATABASE) {
    logPayment({ userId: authz.user.discordId, orderId, paymentId, result: "verified_no_db", stage: "database" });
    return NextResponse.json(
      { success: false, stage: "database", message: "Payment received, but we couldn't activate your Premium plan yet. Please contact support." },
      { status: 500 }
    );
  }

  try {
    // 3. Idempotency — if we've already recorded this payment, succeed without
    // re-granting anything.
    const existing = await prisma.payment.findUnique({ where: { razorpayPaymentId: paymentId } });
    if (existing) {
      logPayment({ userId: authz.user.discordId, orderId, paymentId, result: "already_recorded", stage: "database" });
      return NextResponse.json({ success: true, tier: existing.tier, alreadyProcessed: true });
    }

    // Ensure guild + user rows exist (needed for the subscription relation).
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

    // 4. Record payment + activate subscription atomically.
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          guildId: params.guildId,
          userId: user.id,
          discordId: authz.user.discordId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          amount,
          currency: CURRENCY,
          tier,
          interval,
          status: "captured",
        },
      }),
      prisma.subscription.upsert({
        where: { guildId: params.guildId },
        create: { guildId: params.guildId, userId: user.id, tier, status: "ACTIVE" },
        update: { tier, status: "ACTIVE" },
      }),
      prisma.auditLog.create({
        data: {
          guildId: params.guildId,
          action: "billing.razorpay.paid",
          detail: encodeJson({ tier, interval, paymentId, orderId, amount, currency: CURRENCY, by: authz.user.username }),
        },
      }),
    ]);

    logPayment({ userId: authz.user.discordId, orderId, paymentId, amount, tier, result: "recorded", stage: "database" });
    return NextResponse.json({ success: true, tier });
  } catch (e) {
    const raw = (e as Error).message ?? "";
    // A unique-constraint race means another request already recorded it →
    // treat as success (idempotent), not an error.
    if (/unique/i.test(raw)) {
      logPayment({ userId: authz.user.discordId, orderId, paymentId, result: "duplicate_race", stage: "database" });
      return NextResponse.json({ success: true, tier, alreadyProcessed: true });
    }
    logPayment({ userId: authz.user.discordId, orderId, paymentId, result: "db_error", stage: "database", error: raw.slice(0, 120) });
    return NextResponse.json(
      {
        success: false,
        stage: "database",
        message: "Payment received, but we couldn't activate your Premium plan yet. Please contact support.",
        hint: dbHint(raw),
      },
      { status: 500 }
    );
  }
}
